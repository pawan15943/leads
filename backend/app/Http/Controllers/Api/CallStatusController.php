<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CallStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CallStatusController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CallStatus::query()
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('slug', 'like', "%{$request->search}%");
            }));

        $statuses = $query->orderBy('name')->paginate($request->per_page ?? 100);

        return response()->json($statuses);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:call_status,slug'],
            'is_connected' => ['nullable', 'boolean'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = strtolower(preg_replace('/\s+/', '-', trim($validated['name'])));
        }
        $validated['is_connected'] = $validated['is_connected'] ?? false;

        $call_status = CallStatus::create($validated);

        return response()->json($call_status, 201);
    }

    public function show(CallStatus $call_status): JsonResponse
    {
        return response()->json($call_status);
    }

    public function update(Request $request, CallStatus $call_status): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:call_status,slug,' . $call_status->id],
            'is_connected' => ['nullable', 'boolean'],
        ]);

        $call_status->update($validated);

        return response()->json($call_status);
    }

    public function destroy(CallStatus $call_status): JsonResponse
    {
        $call_status->delete();
        return response()->json(null, 204);
    }
}
