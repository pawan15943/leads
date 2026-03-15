<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $colors = [
            'new' => '#c5dffe',
            'contacted' => '#e0dafe',
            'interested' => '#b0f4d5',
            'demo-scheduled' => '#fde996',
        ];

        foreach ($colors as $slug => $color) {
            DB::table('lead_stages')
                ->where('slug', $slug)
                ->whereNull('color')
                ->update(['color' => $color]);
        }
    }

    public function down(): void
    {
        // Optional: set colors back to null
    }
};
