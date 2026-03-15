<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('lead_import_logs')) {
        Schema::create('lead_import_logs', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            $table->string('file_path')->nullable();
            $table->integer('total_records')->default(0);
            $table->integer('success_records')->default(0);
            $table->integer('failed_records')->default(0);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at');
        });
        }

        if (! Schema::hasTable('lead_import_failures')) {
        Schema::create('lead_import_failures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('import_id')->constrained('lead_import_logs')->cascadeOnDelete();
            $table->json('row_data')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at');
        });
        }

        if (! Schema::hasTable('activity_logs')) {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('module')->nullable();
            $table->string('action')->nullable();
            $table->string('record_id')->nullable();
            $table->json('old_data')->nullable();
            $table->json('new_data')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at');
        });
        }

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('message')->nullable();
            $table->string('type')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        if (Schema::hasTable('activity_logs')) {
            Schema::dropIfExists('activity_logs');
        }
        if (Schema::hasTable('lead_import_failures')) {
            Schema::dropIfExists('lead_import_failures');
        }
        if (Schema::hasTable('lead_import_logs')) {
            Schema::dropIfExists('lead_import_logs');
        }
    }
};
