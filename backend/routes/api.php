<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CallStatusController;
use App\Http\Controllers\Api\CityController;
use App\Http\Controllers\Api\CountryController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\LeadImportController;
use App\Http\Controllers\Api\LeadReminderController;
use App\Http\Controllers\Api\LeadSourceController;
use App\Http\Controllers\Api\LeadStageController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\StateController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/login', [AuthController::class, 'login']);
Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'message' => 'Lead Management API is running',
    'timestamp' => now()->toIso8601String(),
]));

// Protected
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::post('leads/import', [LeadImportController::class, 'store']);
    Route::get('leads/locations', fn () => response()->json(
        \Illuminate\Support\Facades\Cache::remember('leads.locations', 300, fn () =>
            \App\Models\City::whereHas('leads')
                ->with('state:id,name')
                ->get(['id', 'name', 'state_id'])
                ->map(fn ($c) => ['id' => $c->id, 'location' => $c->name . ($c->state ? ', ' . $c->state->name : '')])
        )
    ));
    Route::apiResource('leads', LeadController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::post('leads/{lead}/conversations', [LeadController::class, 'storeConversation']);
    Route::post('leads/{lead}/reminders', [LeadReminderController::class, 'store']);
    Route::post('leads/{lead}/tasks', [TaskController::class, 'storeForLead']);

    Route::get('reminders', [LeadReminderController::class, 'index']);
    Route::put('reminders/{reminder}', [LeadReminderController::class, 'update']);
    Route::delete('reminders/{reminder}', [LeadReminderController::class, 'destroy']);

    Route::apiResource('tasks', TaskController::class)->only(['index', 'store', 'update', 'destroy']);

    // User Management (Admin only - add middleware if needed)
    Route::apiResource('users', UserController::class);
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('permissions', PermissionController::class);
    Route::get('roles-list', fn () => response()->json(\App\Models\Role::orderBy('name')->get(['id', 'name', 'slug'])));
    Route::get('permissions-list', fn () => response()->json(\App\Models\Permission::orderBy('module')->orderBy('name')->get(['id', 'name', 'slug', 'module'])));

    // Country, State, City masters
    Route::apiResource('countries', CountryController::class);
    Route::apiResource('states', StateController::class);
    Route::apiResource('cities', CityController::class);
    Route::get('countries-list', fn () => response()->json(\App\Models\Country::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code'])));
    Route::get('states-list', fn (\Illuminate\Http\Request $r) => response()->json(
        \App\Models\State::where('is_active', true)
            ->when($r->country_id, fn ($q) => $q->where('country_id', $r->country_id))
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'country_id'])
    ));
    Route::get('cities-list', fn (\Illuminate\Http\Request $r) => response()->json(
        \App\Models\City::where('is_active', true)
            ->when($r->state_id, fn ($q) => $q->where('state_id', $r->state_id))
            ->orderBy('name')
            ->get(['id', 'name', 'state_id'])
    ));
    Route::apiResource('lead-stages', LeadStageController::class);
    Route::apiResource('lead-sources', LeadSourceController::class);
    Route::apiResource('call-status', CallStatusController::class);
    Route::apiResource('tags', TagController::class);
    Route::get('lead-stages-list', fn () => response()->json(\App\Models\LeadStage::orderBy('stage_order')->get(['id', 'name', 'slug', 'color'])));
    Route::get('call-status-list', fn () => response()->json(\App\Models\CallStatus::orderBy('name')->get(['id', 'name', 'slug'])));
    Route::get('lead-sources-list', fn () => response()->json(\App\Models\LeadSource::where('status', 'active')->orderBy('name')->get(['id', 'name', 'slug'])));
    Route::get('users-list', fn () => response()->json(\App\Models\User::where('status', 'active')->orderBy('name')->get(['id', 'name', 'email'])));
    Route::get('tags-list', fn () => response()->json(\App\Models\Tag::orderBy('name')->get(['id', 'name'])));
});
