<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_tag_map', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->unique(['lead_id', 'tag_id']);
        });

        Schema::create('lead_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_to')->constrained('users')->cascadeOnDelete();
            $table->string('assignment_type')->nullable();
            $table->timestamp('assigned_at');
            $table->timestamps();
        });

        Schema::create('lead_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('call_status_id')->nullable()->constrained('call_status')->nullOnDelete();
            $table->foreignId('previous_stage_id')->nullable()->constrained('lead_stages')->nullOnDelete();
            $table->foreignId('new_stage_id')->nullable()->constrained('lead_stages')->nullOnDelete();
            $table->text('remark')->nullable();
            $table->integer('call_duration')->nullable()->comment('Duration in seconds');
            $table->date('next_followup_date')->nullable();
            $table->time('next_followup_time')->nullable();
            $table->timestamp('created_at');

            $table->index('lead_id');
            $table->index('user_id');
            $table->index('call_status_id');
            $table->index('next_followup_date');
        });

        Schema::create('lead_forwards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_user')->constrained('users')->cascadeOnDelete();
            $table->foreignId('to_user')->constrained('users')->cascadeOnDelete();
            $table->text('remark')->nullable();
            $table->timestamp('created_at');
        });

        Schema::create('lead_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('reminder_date');
            $table->time('reminder_time')->nullable();
            $table->text('note')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_to')->constrained('users')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('task_type')->nullable();
            $table->date('due_date')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('lead_reminders');
        Schema::dropIfExists('lead_forwards');
        Schema::dropIfExists('lead_conversations');
        Schema::dropIfExists('lead_assignments');
        Schema::dropIfExists('lead_tag_map');
    }
};
