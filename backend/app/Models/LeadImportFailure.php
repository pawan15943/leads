<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadImportFailure extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'import_id',
        'row_data',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'row_data' => 'array',
        ];
    }

    public function importLog(): BelongsTo
    {
        return $this->belongsTo(LeadImportLog::class, 'import_id');
    }
}
