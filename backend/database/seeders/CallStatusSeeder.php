<?php

namespace Database\Seeders;

use App\Models\CallStatus;
use Illuminate\Database\Seeder;

class CallStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['name' => 'Call Not Received', 'slug' => 'call-not-received', 'is_connected' => false],
            ['name' => 'Not Connected', 'slug' => 'not-connected', 'is_connected' => false],
            ['name' => 'Not Available', 'slug' => 'not-available', 'is_connected' => false],
            ['name' => 'Switched Off', 'slug' => 'switched-off', 'is_connected' => false],
            ['name' => 'Incorrect No', 'slug' => 'incorrect-no', 'is_connected' => false],
            ['name' => 'Invalid Lead', 'slug' => 'invalid-lead', 'is_connected' => false],
            ['name' => 'Interested', 'slug' => 'interested', 'is_connected' => true],
            ['name' => 'Demo Scheduled', 'slug' => 'demo-scheduled', 'is_connected' => true],
        ];

        foreach ($statuses as $s) {
            CallStatus::firstOrCreate(['slug' => $s['slug']], $s);
        }
    }
}
