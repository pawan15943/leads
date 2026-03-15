<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\State;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = State::with('country')
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('states.name', 'like', "%{$request->search}%")
                    ->orWhere('states.code', 'like', "%{$request->search}%");
            }))
            ->when($request->country_id, fn ($q) => $q->where('country_id', $request->country_id))
            ->when($request->has('is_active'), fn ($q) => $q->where('states.is_active', $request->boolean('is_active')));

        $states = $query->orderBy('states.name')->paginate($request->per_page ?? 50);

        return response()->json($states);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'country_id' => ['required', 'exists:countries,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:10'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;

        $state = State::create($validated);
        $state->load('country');

        return response()->json($state, 201);
    }

    public function show(State $state): JsonResponse
    {
        $state->load('country');
        return response()->json($state);
    }

    public function update(Request $request, State $state): JsonResponse
    {
        $validated = $request->validate([
            'country_id' => ['sometimes', 'exists:countries,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:10'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $state->update($validated);
        $state->load('country');

        return response()->json($state);
    }

    public function destroy(State $state): JsonResponse
    {
        $state->delete();
        return response()->json(null, 204);
    }
}
