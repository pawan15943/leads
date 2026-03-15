<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Task::with(['lead:id,library_name,contact_number', 'assignedTo:id,name', 'createdBy:id,name'])
            ->where('assigned_to', Auth::id());

        if ($request->status && $request->status !== 'all') {
            if ($request->status === 'overdue') {
                $query->where('status', '!=', 'completed')
                    ->whereDate('due_date', '<', today());
            } elseif ($request->status === 'today') {
                $query->whereDate('due_date', today());
            } elseif ($request->status === 'not_overdue') {
                $query->where('status', '!=', 'completed')
                    ->where(function ($q) {
                        $q->whereDate('due_date', '>=', today())
                            ->orWhereNull('due_date');
                    });
            } elseif ($request->status === 'completed') {
                $query->where('status', 'completed');
            } elseif ($request->status === 'open') {
                $query->where('status', '!=', 'completed');
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                    ->orWhere('description', 'like', "%{$request->search}%")
                    ->orWhereHas('lead', fn ($sq) => $sq->where('library_name', 'like', "%{$request->search}%"));
            });
        }

        if ($request->task_type && $request->task_type !== 'all') {
            $query->where('task_type', $request->task_type);
        }

        $tasks = $query->orderBy('due_date')->orderBy('id')
            ->paginate($request->integer('per_page', 20));

        return response()->json($tasks);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lead_id' => 'nullable|integer|exists:leads,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'task_type' => 'nullable|string|max:50',
            'due_date' => 'nullable|date',
            'assigned_to' => 'nullable|integer|exists:users,id',
        ]);

        $task = Task::create([
            'lead_id' => $validated['lead_id'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? Auth::id(),
            'created_by' => Auth::id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'task_type' => $validated['task_type'] ?? 'Call',
            'due_date' => $validated['due_date'] ?? null,
            'status' => 'pending',
        ]);

        $task->load(['lead:id,library_name,contact_number', 'assignedTo:id,name']);
        return response()->json($task, 201);
    }

    public function storeForLead(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'task_type' => 'nullable|string|max:50',
            'due_date' => 'nullable|date',
        ]);

        $task = Task::create([
            'lead_id' => $lead->id,
            'assigned_to' => Auth::id(),
            'created_by' => Auth::id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'task_type' => $validated['task_type'] ?? 'Call',
            'due_date' => $validated['due_date'] ?? null,
            'status' => 'pending',
        ]);

        $task->load(['lead:id,library_name,contact_number', 'assignedTo:id,name']);
        return response()->json($task, 201);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        if ($task->assigned_to !== Auth::id() && $task->created_by !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:5000',
            'task_type' => 'nullable|string|max:50',
            'due_date' => 'nullable|date',
            'status' => 'sometimes|in:pending,in_progress,completed,cancelled',
        ]);

        $task->update($validated);
        return response()->json($task);
    }

    public function destroy(Task $task): JsonResponse
    {
        if ($task->assigned_to !== Auth::id() && $task->created_by !== Auth::id()) {
            abort(403);
        }
        $task->delete();
        return response()->json(null, 204);
    }
}
