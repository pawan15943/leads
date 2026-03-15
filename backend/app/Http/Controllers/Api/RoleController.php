<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Role::withCount('users')
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('slug', 'like', "%{$request->search}%"));

        $roles = $query->orderBy('name')->paginate($request->per_page ?? 25);

        return response()->json($roles);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:roles,slug'],
            'description' => ['nullable', 'string'],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['exists:permissions,id'],
        ]);

        $permissionIds = $validated['permission_ids'] ?? [];
        unset($validated['permission_ids']);

        $role = Role::create($validated);
        $role->permissions()->sync($permissionIds);
        $role->load('permissions');

        return response()->json($role, 201);
    }

    public function show(Role $role): JsonResponse
    {
        $role->load(['permissions', 'users']);
        return response()->json($role);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:roles,slug,' . $role->id],
            'description' => ['nullable', 'string'],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['exists:permissions,id'],
        ]);

        $permissionIds = $validated['permission_ids'] ?? null;
        unset($validated['permission_ids']);

        $role->update($validated);

        if ($permissionIds !== null) {
            $role->permissions()->sync($permissionIds);
        }

        $role->load('permissions');

        return response()->json($role);
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->users()->exists()) {
            return response()->json(['message' => 'Cannot delete role with assigned users'], 422);
        }
        $role->permissions()->detach();
        $role->delete();
        return response()->json(null, 204);
    }
}
