<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'library_name',
        'owner_name',
        'contact_number',
        'alternate_contact',
        'email',
        'total_seats',
        'no_of_branches',
        'working_since_year',
        'interested_for',
        'subscription_type',
        'demo_type',
        'demo_datetime',
        'lead_stage_id',
        'lead_source_id',
        'lead_type_id',
        'city_id',
        'assigned_to',
        'created_by',
        'is_duplicate',
        'is_invalid',
    ];

    protected $appends = ['assigned_user_name'];

    protected function casts(): array
    {
        return [
            'demo_datetime' => 'datetime',
            'is_duplicate' => 'boolean',
            'is_invalid' => 'boolean',
        ];
    }

    public function getAssignedUserNameAttribute(): ?string
    {
        return $this->assignedTo?->name;
    }

    public function leadStage(): BelongsTo
    {
        return $this->belongsTo(LeadStage::class, 'lead_stage_id');
    }

    public function leadSource(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class, 'lead_source_id');
    }

    public function leadType(): BelongsTo
    {
        return $this->belongsTo(LeadType::class, 'lead_type_id');
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(LeadConversation::class);
    }

    public function latestConversation(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(LeadConversation::class)->latestOfMany('created_at')->with('callStatus');
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(LeadReminder::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'lead_tag_map');
    }
}
