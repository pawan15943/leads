<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeadStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadStageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LeadStage::query()
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('slug', 'like', "%{$request->search}%");
            }));

        $stages = $query->orderBy('stage_order')->orderBy('name')->paginate($request->per_page ?? 100);

        return response()->json($stages);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:lead_stages,slug'],
            'stage_order' => ['nullable', 'integer'],
            'color' => ['nullable', 'string', 'max:50'],
            'is_closed' => ['nullable', 'boolean'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = strtolower(preg_replace('/\s+/', '-', trim($validated['name'])));
        }
        $validated['stage_order'] = $validated['stage_order'] ?? 999;
        $validated['is_closed'] = $validated['is_closed'] ?? false;

        $stage = LeadStage::create($validated);

        return response()->json($stage, 201);
    }

    public function show(LeadStage $lead_stage): JsonResponse
    {
        return response()->json($lead_stage);
    }

    public function update(Request $request, LeadStage $lead_stage): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:lead_stages,slug,' . $lead_stage->id],
            'stage_order' => ['nullable', 'integer'],
            'color' => ['nullable', 'string', 'max:50'],
            'is_closed' => ['nullable', 'boolean'],
        ]);

        $lead_stage->update($validated);

        return response()->json($lead_stage);
    }

    public function destroy(LeadStage $lead_stage): JsonResponse
    {
        $lead_stage->delete();
        return response()->json(null, 204);
    }
}
