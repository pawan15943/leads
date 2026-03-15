<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeadSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadSourceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LeadSource::query()
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('slug', 'like', "%{$request->search}%");
            }))
            ->when($request->has('status'), fn ($q) => $q->where('status', $request->status));

        $sources = $query->orderBy('name')->paginate($request->per_page ?? 100);

        return response()->json($sources);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:lead_sources,slug'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = strtolower(preg_replace('/\s+/', '-', trim($validated['name'])));
        }
        $validated['status'] = $validated['status'] ?? 'active';

        $source = LeadSource::create($validated);

        return response()->json($source, 201);
    }

    public function show(LeadSource $lead_source): JsonResponse
    {
        return response()->json($lead_source);
    }

    public function update(Request $request, LeadSource $lead_source): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:lead_sources,slug,' . $lead_source->id],
            'status' => ['nullable', 'string', 'in:active,inactive'],
        ]);

        $lead_source->update($validated);

        return response()->json($lead_source);
    }

    public function destroy(LeadSource $lead_source): JsonResponse
    {
        $lead_source->delete();
        return response()->json(null, 204);
    }
}
