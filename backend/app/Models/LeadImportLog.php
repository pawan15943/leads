<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadImportLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'file_name',
        'file_path',
        'total_records',
        'success_records',
        'failed_records',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'total_records' => 'integer',
            'success_records' => 'integer',
            'failed_records' => 'integer',
        ];
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function failures(): HasMany
    {
        return $this->hasMany(LeadImportFailure::class, 'import_id');
    }
}
