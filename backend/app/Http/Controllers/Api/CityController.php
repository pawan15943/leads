<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = City::with(['state.country'])
            ->when($request->search, fn ($q) => $q->where('cities.name', 'like', "%{$request->search}%"))
            ->when($request->state_id, fn ($q) => $q->where('state_id', $request->state_id))
            ->when($request->country_id, fn ($q) => $q->whereHas('state', fn ($sq) => $sq->where('country_id', $request->country_id)))
            ->when($request->has('is_active'), fn ($q) => $q->where('cities.is_active', $request->boolean('is_active')));

        $cities = $query->orderBy('cities.name')->paginate($request->per_page ?? 50);

        return response()->json($cities);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'state_id' => ['required', 'exists:states,id'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;

        $city = City::create($validated);
        $city->load(['state.country']);

        return response()->json($city, 201);
    }

    public function show(City $city): JsonResponse
    {
        $city->load(['state.country']);
        return response()->json($city);
    }

    public function update(Request $request, City $city): JsonResponse
    {
        $validated = $request->validate([
            'state_id' => ['sometimes', 'exists:states,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $city->update($validated);
        $city->load(['state.country']);

        return response()->json($city);
    }

    public function destroy(City $city): JsonResponse
    {
        $city->delete();
        return response()->json(null, 204);
    }
}
