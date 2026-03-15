<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallStatus extends Model
{
    protected $table = 'call_status';

    protected $fillable = ['name', 'slug', 'is_connected'];
}
