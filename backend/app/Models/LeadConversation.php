<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadConversation extends Model
{
    public $timestamps = false;

    protected $fillable = ['lead_id', 'user_id', 'call_status_id', 'previous_stage_id', 'new_stage_id', 'remark', 'call_duration', 'next_followup_date', 'next_followup_time'];

    public function callStatus(): BelongsTo
    {
        return $this->belongsTo(CallStatus::class, 'call_status_id');
    }

    public function previousStage(): BelongsTo
    {
        return $this->belongsTo(LeadStage::class, 'previous_stage_id');
    }

    public function newStage(): BelongsTo
    {
        return $this->belongsTo(LeadStage::class, 'new_stage_id');
    }
}
