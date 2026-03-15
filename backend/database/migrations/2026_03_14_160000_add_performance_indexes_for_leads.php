<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->index(['lead_stage_id', 'created_at']);
            $table->index(['assigned_to', 'created_at']);
        });

        Schema::table('lead_conversations', function (Blueprint $table) {
            $table->index(['next_followup_date', 'lead_id']);
            $table->index(['lead_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['lead_stage_id', 'created_at']);
            $table->dropIndex(['assigned_to', 'created_at']);
        });

        Schema::table('lead_conversations', function (Blueprint $table) {
            $table->dropIndex(['next_followup_date', 'lead_id']);
            $table->dropIndex(['lead_id', 'created_at']);
        });
    }
};
