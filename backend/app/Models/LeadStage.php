<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadStage extends Model
{
    protected $fillable = ['name', 'slug', 'stage_order', 'color', 'is_closed'];
}
