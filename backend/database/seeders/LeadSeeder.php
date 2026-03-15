<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\LeadStage;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LeadSeeder extends Seeder
{
    public function run(): void
    {
        $stages = LeadStage::pluck('id')->toArray();
        $sources = LeadSource::pluck('id')->toArray();
        $cities = City::pluck('id')->toArray();
        $users = User::pluck('id')->toArray();

        if (empty($stages) || empty($sources)) {
            $this->command->warn('Run DatabaseSeeder first to create lead stages and sources.');
            return;
        }

        $libraryPrefixes = [
            'Central', 'City', 'District', 'Public', 'State', 'National', 'Community',
            'Metro', 'Regional', 'Digital', 'Learning', 'Knowledge', 'Smart', 'Modern',
        ];

        $librarySuffixes = [
            'Library', 'Learning Center', 'Resource Center', 'Knowledge Hub', 'Study Center',
            'Reading Room', 'Book House', 'Info Center', 'Edu Center', 'Lib Hub',
        ];

        $interestedFor = ['School', 'College', 'Corporate', 'Personal', 'Research', 'Government', 'NGO'];
        $subscriptionTypes = ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'Lifetime'];
        $demoTypes = ['Online', 'In-person', 'Hybrid', 'Video Call'];

        $leads = [];
        $now = now();

        for ($i = 1; $i <= 200; $i++) {
            $prefix = $libraryPrefixes[array_rand($libraryPrefixes)];
            $suffix = $librarySuffixes[array_rand($librarySuffixes)];
            $libraryName = $prefix . ' ' . $suffix . ' ' . $i;

            $phone = '9' . str_pad((string) random_int(100000000, 999999999), 9, '0');
            if (random_int(0, 1)) {
                $phone = '91' . $phone;
            }

            $leads[] = [
                'library_name' => $libraryName,
                'owner_name' => $this->randomName(),
                'contact_number' => $phone,
                'alternate_contact' => random_int(0, 1) ? '9' . str_pad((string) random_int(100000000, 999999999), 9, '0') : null,
                'email' => random_int(0, 1) ? 'owner' . $i . '@example.com' : null,
                'total_seats' => random_int(0, 1) ? random_int(10, 500) : null,
                'no_of_branches' => random_int(0, 1) ? random_int(1, 20) : null,
                'working_since_year' => random_int(0, 1) ? random_int(1990, 2024) : null,
                'interested_for' => $interestedFor[array_rand($interestedFor)],
                'subscription_type' => random_int(0, 1) ? $subscriptionTypes[array_rand($subscriptionTypes)] : null,
                'demo_type' => random_int(0, 1) ? $demoTypes[array_rand($demoTypes)] : null,
                'demo_datetime' => random_int(0, 1) ? $now->copy()->addDays(random_int(1, 30))->format('Y-m-d H:i:s') : null,
                'lead_stage_id' => $stages[array_rand($stages)],
                'lead_source_id' => $sources[array_rand($sources)],
                'lead_type_id' => null,
                'city_id' => !empty($cities) && random_int(0, 1) ? $cities[array_rand($cities)] : null,
                'assigned_to' => !empty($users) && random_int(0, 1) ? $users[array_rand($users)] : null,
                'created_by' => !empty($users) ? $users[array_rand($users)] : null,
                'is_duplicate' => false,
                'is_invalid' => false,
                'created_at' => $now->copy()->subDays(random_int(0, 90)),
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($leads, 50) as $chunk) {
            Lead::insert($chunk);
        }

        $this->command->info('Created 200 leads.');
    }

    private function randomName(): string
    {
        $firstNames = ['Raj', 'Amit', 'Priya', 'Suresh', 'Kavita', 'Vikram', 'Anita', 'Rahul', 'Deepa', 'Sanjay', 'Meera', 'Arun', 'Pooja', 'Manoj', 'Neha', 'Kiran', 'Sunita', 'Ravi', 'Lakshmi', 'Venkat'];
        $lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Joshi', 'Mehta', 'Desai', 'Rao', 'Pillai', 'Menon', 'Nambiar', 'Pandey', 'Verma', 'Shah', 'Mishra', 'Dubey'];
        return $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)];
    }
}
