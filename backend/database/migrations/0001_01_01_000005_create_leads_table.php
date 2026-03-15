<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('library_name');
            $table->string('owner_name')->nullable();
            $table->string('contact_number')->index();
            $table->string('alternate_contact')->nullable();
            $table->string('email')->nullable();
            $table->integer('total_seats')->nullable();
            $table->integer('no_of_branches')->nullable();
            $table->integer('working_since_year')->nullable();
            $table->string('interested_for')->nullable();
            $table->string('subscription_type')->nullable();
            $table->string('demo_type')->nullable();
            $table->dateTime('demo_datetime')->nullable();
            $table->foreignId('lead_stage_id')->nullable()->constrained('lead_stages')->nullOnDelete();
            $table->foreignId('lead_source_id')->nullable()->constrained('lead_sources')->nullOnDelete();
            $table->foreignId('lead_type_id')->nullable()->constrained('lead_types')->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_duplicate')->default(false);
            $table->boolean('is_invalid')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('lead_stage_id');
            $table->index('assigned_to');
            $table->index('lead_source_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
