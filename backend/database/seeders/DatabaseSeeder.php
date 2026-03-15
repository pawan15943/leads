<?php

namespace Database\Seeders;

use App\Models\LeadStage;
use App\Models\LeadSource;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Default permissions
        $permissions = [
            ['name' => 'View Leads', 'slug' => 'leads.view', 'module' => 'Leads'],
            ['name' => 'Create Leads', 'slug' => 'leads.create', 'module' => 'Leads'],
            ['name' => 'Edit Leads', 'slug' => 'leads.edit', 'module' => 'Leads'],
            ['name' => 'Delete Leads', 'slug' => 'leads.delete', 'module' => 'Leads'],
            ['name' => 'View Users', 'slug' => 'users.view', 'module' => 'Users'],
            ['name' => 'Create Users', 'slug' => 'users.create', 'module' => 'Users'],
            ['name' => 'Edit Users', 'slug' => 'users.edit', 'module' => 'Users'],
            ['name' => 'Delete Users', 'slug' => 'users.delete', 'module' => 'Users'],
            ['name' => 'Manage Roles', 'slug' => 'roles.manage', 'module' => 'Users'],
            ['name' => 'Manage Permissions', 'slug' => 'permissions.manage', 'module' => 'Users'],
            ['name' => 'View Reports', 'slug' => 'reports.view', 'module' => 'Reports'],
            ['name' => 'Manage Master Data', 'slug' => 'master.manage', 'module' => 'Settings'],
        ];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['slug' => $p['slug']], $p);
        }

        $adminRole = Role::firstOrCreate(
            ['slug' => 'super-admin'],
            ['name' => 'Super Admin', 'description' => 'Full system access']
        );

        $bdRole = Role::firstOrCreate(
            ['slug' => 'bd-user'],
            ['name' => 'BD User', 'description' => 'Business Development user']
        );

        User::firstOrCreate(
            ['email' => 'superadmin@yopmail.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'bduser@yopmail.com'],
            [
                'name' => 'BD User',
                'password' => Hash::make('password'),
                'role_id' => $bdRole->id,
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'bduser1@yopmail.com'],
            [
                'name' => 'BD User 1',
                'password' => Hash::make('password'),
                'role_id' => $bdRole->id,
                'status' => 'active',
            ]
        );

        User::firstOrCreate(
            ['email' => 'bduser2@yopmail.com'],
            [
                'name' => 'BD User 2',
                'password' => Hash::make('password'),
                'role_id' => $bdRole->id,
                'status' => 'active',
            ]
        );

        LeadStage::updateOrCreate(['slug' => 'new'], ['name' => 'New', 'stage_order' => 1, 'color' => '#c5dffe', 'is_closed' => false]);
        LeadStage::updateOrCreate(['slug' => 'contacted'], ['name' => 'Contacted', 'stage_order' => 2, 'color' => '#e0dafe', 'is_closed' => false]);
        LeadStage::updateOrCreate(['slug' => 'interested'], ['name' => 'Interested', 'stage_order' => 3, 'color' => '#b0f4d5', 'is_closed' => false]);
        LeadStage::updateOrCreate(['slug' => 'demo-scheduled'], ['name' => 'Demo Scheduled', 'stage_order' => 4, 'color' => '#fde996', 'is_closed' => false]);

        LeadSource::firstOrCreate(['slug' => 'website'], ['name' => 'Registration Website', 'status' => 'active']);
        LeadSource::firstOrCreate(['slug' => 'referral'], ['name' => 'Referral', 'status' => 'active']);

        $this->call([CallStatusSeeder::class, CountryStateCitySeeder::class, LeadSeeder::class]);
    }
}
