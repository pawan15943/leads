<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadReminder;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $userId = Auth::id();
        $isAdmin = Auth::user()?->role?->slug === 'super-admin';

        $baseLeadQuery = Lead::query();
        if (!$isAdmin) {
            $baseLeadQuery->where('assigned_to', $userId);
        }

        $totalLeads = (clone $baseLeadQuery)->count();
        $newToday = (clone $baseLeadQuery)->whereDate('created_at', today())->count();
        $unassignedCount = $isAdmin ? Lead::whereNull('assigned_to')->count() : 0;

        $todayFollowUpLeadIds = DB::table('lead_conversations')
            ->whereDate('next_followup_date', today())
            ->distinct()
            ->pluck('lead_id');
        $todayFollowUpsQuery = Lead::whereIn('id', $todayFollowUpLeadIds);
        if (!$isAdmin) {
            $todayFollowUpsQuery->where('assigned_to', $userId);
        }
        $todayFollowUpsCount = $todayFollowUpLeadIds->isEmpty() ? 0 : $todayFollowUpsQuery->count();

        $interestedStageId = \App\Models\LeadStage::where('name', 'Interested')->value('id');
        $demoStageId = \App\Models\LeadStage::where('name', 'Demo Scheduled')->value('id');

        $interestedCount = (clone $baseLeadQuery)->when($interestedStageId, fn ($q) => $q->where('lead_stage_id', $interestedStageId))->count();
        $demoScheduledCount = (clone $baseLeadQuery)->when($demoStageId, fn ($q) => $q->where('lead_stage_id', $demoStageId))->count();

        $todayTasks = Task::where('assigned_to', $userId)
            ->where('status', '!=', 'completed')
            ->whereDate('due_date', today())
            ->count();

        $overdueTasks = Task::where('assigned_to', $userId)
            ->where('status', '!=', 'completed')
            ->whereDate('due_date', '<', today())
            ->count();

        $todayReminders = LeadReminder::where('user_id', $userId)
            ->whereDate('reminder_date', today())
            ->whereIn('status', ['pending', 'overdue'])
            ->count();

        $overdueReminders = LeadReminder::where('user_id', $userId)
            ->whereIn('status', ['pending', 'overdue'])
            ->where(function ($q) {
                $q->whereDate('reminder_date', '<', today())
                    ->orWhere(function ($sq) {
                        $sq->whereDate('reminder_date', today())
                            ->whereTime('reminder_time', '<', now()->format('H:i:s'));
                    });
            })
            ->count();

        $stages = \App\Models\LeadStage::orderBy('stage_order')->get(['id', 'name', 'slug', 'color']);
        $stageCounts = [];
        foreach ($stages as $stage) {
            $q = (clone $baseLeadQuery)->where('lead_stage_id', $stage->id);
            $stageCounts[] = [
                'id' => $stage->id,
                'name' => $stage->name,
                'slug' => $stage->slug,
                'color' => $stage->color,
                'count' => $q->count(),
            ];
        }

        $sources = \App\Models\LeadSource::where('status', 'active')->orderBy('name')->get(['id', 'name', 'slug']);
        $sourceCounts = [];
        $sourceTotal = 0;
        foreach ($sources as $source) {
            $count = (clone $baseLeadQuery)->where('lead_source_id', $source->id)->count();
            $sourceCounts[] = [
                'id' => $source->id,
                'name' => $source->name,
                'slug' => $source->slug,
                'count' => $count,
            ];
            $sourceTotal += $count;
        }
        foreach ($sourceCounts as &$s) {
            $s['pct'] = $sourceTotal > 0 ? round(($s['count'] / $sourceTotal) * 100) : 0;
        }

        $conversionRate = 0;
        if ($totalLeads > 0 && $demoStageId) {
            $demoCount = (clone $baseLeadQuery)->where('lead_stage_id', $demoStageId)->count();
            $conversionRate = round(($demoCount / $totalLeads) * 100);
        }

        return response()->json([
            'is_admin' => $isAdmin,
            'widgets' => [
                'total_leads' => $totalLeads,
                'new_today' => $newToday,
                'today_follow_ups' => $todayFollowUpsCount,
                'unassigned' => $unassignedCount,
                'my_leads' => $totalLeads,
                'today_tasks' => $todayTasks,
                'overdue_tasks' => $overdueTasks,
                'today_reminders' => $todayReminders,
                'overdue_reminders' => $overdueReminders,
                'interested' => $interestedCount,
                'demo_scheduled' => $demoScheduledCount,
                'conversion_rate' => $conversionRate,
            ],
            'pipeline' => $stageCounts,
            'sources' => $sourceCounts,
        ]);
    }
}
