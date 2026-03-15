<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadReminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LeadReminderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LeadReminder::with(['lead:id,library_name,contact_number', 'user:id,name'])
            ->where('user_id', Auth::id())
            ->whereIn('status', ['pending', 'overdue']);

        if ($request->boolean('today')) {
            $query->whereDate('reminder_date', today());
        } elseif ($request->boolean('overdue')) {
            $query->where(function ($q) {
                $q->whereDate('reminder_date', '<', today())
                    ->orWhere(function ($sq) {
                        $sq->whereDate('reminder_date', today())
                            ->whereTime('reminder_time', '<', now()->format('H:i:s'));
                    });
            });
        }

        $reminders = $query->orderBy('reminder_date')->orderBy('reminder_time')
            ->limit($request->integer('limit', 50))
            ->get();

        return response()->json($reminders);
    }

    public function store(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'reminder_date' => 'required|date',
            'reminder_time' => 'nullable|string|max:20',
            'note' => 'nullable|string|max:2000',
        ]);

        $reminder = LeadReminder::create([
            'lead_id' => $lead->id,
            'user_id' => Auth::id(),
            'reminder_date' => $validated['reminder_date'],
            'reminder_time' => $validated['reminder_time'] ?? null,
            'note' => $validated['note'] ?? null,
            'status' => 'pending',
        ]);

        $reminder->load(['lead:id,library_name,contact_number']);
        return response()->json($reminder, 201);
    }

    public function update(Request $request, int $reminder): JsonResponse
    {
        $reminder = LeadReminder::findOrFail($reminder);
        if ($reminder->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'reminder_date' => 'sometimes|date',
            'reminder_time' => 'nullable|string|max:20',
            'note' => 'nullable|string|max:2000',
            'status' => 'sometimes|in:pending,completed,dismissed',
        ]);

        $reminder->update($validated);
        return response()->json($reminder);
    }

    public function destroy(int $reminder): JsonResponse
    {
        $reminder = LeadReminder::findOrFail($reminder);
        if ($reminder->user_id !== Auth::id()) {
            abort(403);
        }
        $reminder->delete();
        return response()->json(null, 204);
    }
}
