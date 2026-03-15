<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CallStatus;
use App\Models\City;
use App\Models\Lead;
use App\Models\LeadConversation;
use App\Models\LeadSource;
use App\Models\LeadStage;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $leads = $this->buildLeadsQuery($request)->paginate($request->per_page ?? 20);
            return response()->json($leads);
        } catch (\Throwable $e) {
            \Log::error('Leads index error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Failed to load leads. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function buildLeadsQuery(Request $request)
    {
        $user = Auth::user();
        $isBd = $user?->loadMissing('role')->role?->slug === 'bd-user';

        return Lead::select([
            'id', 'library_name', 'owner_name', 'contact_number', 'email',
            'lead_stage_id', 'lead_source_id', 'lead_type_id', 'city_id', 'assigned_to', 'created_at',
        ])
            ->with([
                'leadStage:id,name,slug,color',
                'leadSource:id,name,slug',
                'leadType:id,name',
                'city:id,name,state_id',
                'city.state:id,name',
                'assignedTo:id,name',
                'tags:id,name',
            ])
            ->when($isBd, fn ($q) => $q->where('assigned_to', $user->id))
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('library_name', 'like', "%{$request->search}%")
                    ->orWhere('owner_name', 'like', "%{$request->search}%")
                    ->orWhere('contact_number', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->when($request->stage_id, fn ($q) => $q->where('lead_stage_id', $request->stage_id))
            ->when(!$isBd && $request->source_id, fn ($q) => $q->where('lead_source_id', $request->source_id))
            ->when($request->city_id, fn ($q) => $q->where('city_id', $request->city_id))
            ->when(!$isBd && $request->assigned_to, fn ($q) => $q->where('assigned_to', $request->assigned_to))
            ->when($request->view === 'unassigned', fn ($q) => $q->whereNull('assigned_to'))
            ->when($request->view === 'follow-ups', fn ($q) => $q->whereIn('id', DB::table('lead_conversations')
                ->select('lead_id')
                ->whereDate('next_followup_date', now()->toDateString())
                ->distinct()))
            ->when($request->view === 'interested', function ($q) {
                $id = LeadStage::where('slug', 'interested')->value('id');
                $id ? $q->where('lead_stage_id', $id) : $q->whereRaw('1=0');
            })
            ->when($request->view === 'demo-scheduled', function ($q) {
                $id = LeadStage::where('slug', 'demo-scheduled')->value('id');
                $id ? $q->where('lead_stage_id', $id) : $q->whereRaw('1=0');
            })
            ->orderByDesc('leads.created_at');
    }

    public function show(Lead $lead): JsonResponse
    {
        $lead->load([
            'leadStage', 'leadSource', 'leadType', 'city.state.country', 'assignedTo',
            'conversations' => fn ($q) => $q->orderByDesc('created_at')->with(['callStatus', 'newStage', 'previousStage']),
            'reminders', 'tags'
        ]);
        return response()->json($lead);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->all();
        $validated = array_merge($data, [
            'library_name' => $data['library_name'] ?? $data['library'] ?? null,
            'owner_name' => $data['owner_name'] ?? $data['owner'] ?? null,
            'contact_number' => $data['contact_number'] ?? $data['contact'] ?? null,
        ]);
        $request->merge($validated);
        $validated = $request->validate([
            'library_name' => 'required|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'contact_number' => 'required|string|max:50',
            'stage' => 'nullable|string|max:100',
            'stage_id' => 'nullable|integer|exists:lead_stages,id',
            'source' => 'nullable|string|max:100',
            'source_id' => 'nullable|integer|exists:lead_sources,id',
            'assigned_to' => 'nullable',
            'city_id' => 'nullable|integer|exists:cities,id',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        $leadStageId = $validated['stage_id'] ?? $this->resolveLeadStageId($validated['stage'] ?? 'New');
        $leadSourceId = $validated['source_id'] ?? $this->resolveLeadSourceId($validated['source'] ?? 'Website');
        $assignedTo = $this->resolveAssignedTo($validated['assigned_to'] ?? null);
        $cityId = $validated['city_id'] ?? $this->resolveCityId($validated['state'] ?? null, $validated['city'] ?? null);

        $lead = Lead::create([
            'library_name' => $validated['library_name'],
            'owner_name' => $validated['owner_name'] ?? null,
            'contact_number' => $validated['contact_number'],
            'lead_stage_id' => $leadStageId,
            'lead_source_id' => $leadSourceId,
            'assigned_to' => $assignedTo,
            'city_id' => $cityId,
            'created_by' => Auth::id(),
        ]);

        $this->syncTags($lead, $validated['tags'] ?? []);

        $lead->load(['leadStage', 'leadSource', 'city.state.country', 'assignedTo', 'tags']);
        return response()->json($lead, 201);
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
        $data = $request->all();
        $validated = array_merge($data, [
            'library_name' => $data['library_name'] ?? $data['library'] ?? null,
            'owner_name' => $data['owner_name'] ?? $data['owner'] ?? null,
            'contact_number' => $data['contact_number'] ?? $data['contact'] ?? null,
        ]);
        $request->merge($validated);
        $validated = $request->validate([
            'library_name' => 'sometimes|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'contact_number' => 'sometimes|string|max:50',
            'stage' => 'nullable|string|max:100',
            'stage_id' => 'nullable|integer|exists:lead_stages,id',
            'source' => 'nullable|string|max:100',
            'source_id' => 'nullable|integer|exists:lead_sources,id',
            'assigned_to' => 'nullable',
            'city_id' => 'nullable|integer|exists:cities,id',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        if (isset($validated['stage_id'])) {
            $lead->lead_stage_id = $validated['stage_id'];
        } elseif (isset($validated['stage'])) {
            $lead->lead_stage_id = $this->resolveLeadStageId($validated['stage']);
        }
        if (isset($validated['source_id'])) {
            $lead->lead_source_id = $validated['source_id'];
        } elseif (isset($validated['source'])) {
            $lead->lead_source_id = $this->resolveLeadSourceId($validated['source']);
        }
        if (array_key_exists('assigned_to', $validated)) {
            $lead->assigned_to = $this->resolveAssignedTo($validated['assigned_to']);
        }
        if (isset($validated['city_id'])) {
            $lead->city_id = $validated['city_id'];
        } elseif (isset($validated['state']) || isset($validated['city'])) {
            $lead->city_id = $this->resolveCityId($validated['state'] ?? null, $validated['city'] ?? null);
        }

        $lead->library_name = $validated['library_name'] ?? $lead->library_name;
        $lead->owner_name = $validated['owner_name'] ?? $lead->owner_name;
        $lead->contact_number = $validated['contact_number'] ?? $lead->contact_number;
        $lead->save();

        $this->syncTags($lead, $validated['tags'] ?? []);

        $lead->load(['leadStage', 'leadSource', 'city.state.country', 'assignedTo', 'tags']);
        return response()->json($lead);
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();
        return response()->json(null, 204);
    }

    public function storeConversation(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'call_status' => 'nullable|string|max:100',
            'call_status_id' => 'nullable|integer|exists:call_status,id',
            'remark' => 'nullable|string|max:2000',
            'new_stage' => 'nullable|string|max:100',
            'new_stage_id' => 'nullable|integer|exists:lead_stages,id',
            'next_followup_date' => 'nullable|date',
            'next_followup_time' => 'nullable|string|max:20',
            'tags' => 'nullable|string|max:500',
        ]);

        $callStatusId = $validated['call_status_id'] ?? null;
        if (!$callStatusId && !empty($validated['call_status'])) {
            $name = trim($validated['call_status']);
            $slug = strtolower(preg_replace('/\s+/', '-', $name));
            $cs = CallStatus::where('name', $name)
                ->orWhere('slug', $slug)
                ->first();
            if (!$cs) {
                $cs = CallStatus::firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $name, 'is_connected' => false]
                );
            }
            $callStatusId = $cs->id;
        }

        $previousStageId = $lead->lead_stage_id;
        $newStageId = $validated['new_stage_id'] ?? null;
        if (!$newStageId && !empty($validated['new_stage'])) {
            $newStageId = $this->resolveLeadStageId($validated['new_stage']);
        }

        LeadConversation::create([
            'lead_id' => $lead->id,
            'user_id' => Auth::id(),
            'call_status_id' => $callStatusId,
            'previous_stage_id' => $previousStageId,
            'new_stage_id' => $newStageId,
            'remark' => $validated['remark'] ?? null,
            'next_followup_date' => $validated['next_followup_date'] ?? null,
            'next_followup_time' => $validated['next_followup_time'] ?? null,
            'created_at' => now(),
        ]);

        if ($newStageId) {
            $lead->lead_stage_id = $newStageId;
            $lead->save();
        }

        $tagNames = array_filter(array_map('trim', explode(',', $validated['tags'] ?? '')));
        if (!empty($tagNames)) {
            $this->syncTags($lead, $tagNames);
        }

        $lead->load(['leadStage', 'leadSource', 'city.state.country', 'assignedTo', 'tags']);
        return response()->json($lead);
    }

    private function resolveLeadStageId(?string $name): ?int
    {
        if (!$name) return null;
        $slug = strtolower(preg_replace('/\s+/', '-', trim($name)));
        $stage = LeadStage::where('slug', $slug)->orWhere('name', $name)->first();
        if (!$stage) {
            $stage = LeadStage::firstOrCreate(
                ['slug' => $slug],
                ['name' => trim($name), 'stage_order' => 999, 'is_closed' => false]
            );
        }
        return $stage->id;
    }

    private function resolveLeadSourceId(?string $name): ?int
    {
        if (!$name) return null;
        $slug = strtolower(preg_replace('/\s+/', '-', trim($name)));
        $source = LeadSource::where('slug', $slug)->orWhere('name', 'like', "%{$name}%")->first();
        if (!$source) {
            $source = LeadSource::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'status' => 'active']
            );
        }
        return $source->id;
    }

    private function resolveAssignedTo($value): ?int
    {
        if ($value === null || $value === '' || $value === '-' || $value === false) return null;
        if (is_numeric($value)) return (int) $value;
        $user = User::where('name', 'like', "%{$value}%")->first();
        return $user?->id;
    }

    private function resolveCityId(?string $stateName, ?string $cityName): ?int
    {
        if (!$cityName && !$stateName) return null;
        $city = City::when($stateName, fn ($q) => $q->whereHas('state', fn ($sq) => $sq->where('name', $stateName)))
            ->when($cityName, fn ($q) => $q->where('name', $cityName))
            ->first();
        return $city?->id;
    }

    private function syncTags(Lead $lead, array $tagNames): void
    {
        $tagIds = [];
        foreach ($tagNames as $name) {
            $name = trim((string) $name);
            if (!$name) continue;
            $tag = Tag::firstOrCreate(['name' => $name], ['name' => $name]);
            $tagIds[] = $tag->id;
        }
        $lead->tags()->sync($tagIds);
    }
}
