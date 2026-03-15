<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Lead;
use App\Models\LeadImportFailure;
use App\Models\LeadImportLog;
use App\Models\LeadSource;
use App\Models\LeadStage;
use App\Models\LeadType;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LeadImportController extends Controller
{
    /** @var array<string, string> Column header aliases for flexible CSV mapping */
    private const COLUMN_ALIASES = [
        'library_name' => ['library name', 'library', 'library_name', 'libraryname'],
        'owner_name' => ['owner name', 'owner', 'owner_name', 'ownername'],
        'contact_number' => ['contact number', 'contact', 'contact_number', 'contactnumber', 'phone', 'mobile'],
        'alternate_contact' => ['alternate contact', 'alternate_contact', 'alt_contact', 'alt contact'],
        'email' => ['email'],
        'total_seats' => ['total seats', 'total_seats', 'seats', 'no_of_seats'],
        'no_of_branches' => ['no of branches', 'no_of_branches', 'branches', 'number_of_branches'],
        'working_since_year' => ['working since year', 'working_since_year', 'working_since', 'year'],
        'interested_for' => ['interested for', 'interested_for', 'interestedfor'],
        'subscription_type' => ['subscription type', 'subscription_type', 'subscription'],
        'demo_type' => ['demo type', 'demo_type', 'demotype'],
        'stage' => ['lead stage', 'stage', 'lead_stage', 'leadstage'],
        'source' => ['lead source', 'source', 'lead_source', 'leadsource'],
        'lead_type' => ['lead type', 'lead_type', 'leadtype'],
        'state' => ['state'],
        'city' => ['city'],
        'assigned_to' => ['assigned to', 'assigned_to', 'assignedto', 'assigned', 'bd', 'user'],
        'tags' => ['tags', 'tag'],
    ];

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ], [
            'file.required' => 'Please select a CSV file to import.',
            'file.file' => 'The uploaded file is invalid.',
            'file.max' => 'The file must not exceed 10MB.',
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        if (!in_array($ext, ['csv', 'txt'], true)) {
            return response()->json(['message' => 'The file must be a CSV file.'], 422);
        }

        $fileName = $file->getClientOriginalName();
        $tempPath = $file->getRealPath();
        $rows = $tempPath && is_readable($tempPath)
            ? $this->parseCsv($tempPath)
            : $this->parseCsv(Storage::disk('local')->path($file->store('imports', 'local')));
        $headers = array_shift($rows);
        if (empty($headers) || !is_array($headers)) {
            return response()->json(['message' => 'The CSV file appears to be empty or invalid.'], 422);
        }
        $headers = $this->stripBomFromHeaders($headers);
        $columnMap = $this->buildColumnMap($headers);

        if (!array_key_exists('library_name', $columnMap) || !array_key_exists('contact_number', $columnMap)) {
            $columnMap = array_merge($columnMap, $this->buildFallbackColumnMap($headers));
            if (!array_key_exists('library_name', $columnMap) || !array_key_exists('contact_number', $columnMap)) {
                return response()->json([
                    'message' => 'CSV must have "Library Name" and "Contact Number" columns (or similar). Download the sample file for the correct format.',
                ], 422);
            }
        }

        $path = $file->store('imports', 'local');
        $log = LeadImportLog::create([
            'file_name' => $fileName,
            'file_path' => $path,
            'total_records' => 0,
            'success_records' => 0,
            'failed_records' => 0,
            'uploaded_by' => Auth::id(),
            'created_at' => now(),
        ]);

        $success = 0;
        $failed = 0;

        DB::transaction(function () use ($rows, $columnMap, $log, &$success, &$failed) {
            foreach ($rows as $rowIndex => $row) {
                $rowNum = $rowIndex + 2;
                $data = $this->mapRowToData($row, $columnMap);
                $lib = trim($data['library_name'] ?? '');
                $contact = trim($data['contact_number'] ?? '');
                if ($lib === '' && $contact === '') {
                    continue;
                }

                try {
                    $this->createLeadFromRow($data);
                    $success++;
                } catch (\Throwable $e) {
                    $failed++;
                    LeadImportFailure::create([
                        'import_id' => $log->id,
                        'row_data' => $data,
                        'error_message' => $e->getMessage() . " (Row {$rowNum})",
                        'created_at' => now(),
                    ]);
                }
            }
        });

        $log->update([
            'total_records' => $success + $failed,
            'success_records' => $success,
            'failed_records' => $failed,
        ]);

        Cache::forget('leads.locations');

        return response()->json([
            'message' => 'Import completed',
            'import_id' => $log->id,
            'total_records' => $success + $failed,
            'success_records' => $success,
            'failed_records' => $failed,
        ], 201);
    }

    private function parseCsv(string $path): array
    {
        $lines = [];
        $handle = fopen($path, 'r');
        if (!$handle) {
            throw new \RuntimeException('Could not open file');
        }
        while (($row = fgetcsv($handle)) !== false) {
            $lines[] = array_map(function ($v) {
                $s = is_string($v) ? $v : (string) $v;
                return trim($s, " \t\n\r\0\x0B");
            }, $row);
        }
        fclose($handle);
        return $lines;
    }

    /** @param array<int, string> $headers */
    private function stripBomFromHeaders(array $headers): array
    {
        $bom = "\xEF\xBB\xBF";
        return array_map(function ($h) use ($bom) {
            if (is_string($h) && str_starts_with($h, $bom)) {
                return substr($h, 3);
            }
            return $h;
        }, $headers);
    }

    /** @return array<string, int> */
    private function buildColumnMap(array $headers): array
    {
        $map = [];
        foreach ($headers as $i => $h) {
            $normalized = $this->normalizeHeader((string) $h);
            if ($normalized === '') continue;
            foreach (self::COLUMN_ALIASES as $field => $aliases) {
                if (in_array($normalized, $aliases, true)) {
                    $map[$field] = $i;
                    break;
                }
            }
        }
        return $map;
    }

    private function normalizeHeader(string $h): string
    {
        $h = trim($h, " \t\n\r\0\x0B");
        $h = preg_replace('/\s+/', ' ', $h);
        return strtolower($h);
    }

    /** @param array<int, string> $headers */
    private function buildFallbackColumnMap(array $headers): array
    {
        $map = [];
        foreach ($headers as $i => $h) {
            $normalized = $this->normalizeHeader((string) $h);
            if ($normalized === '') continue;
            if (str_contains($normalized, 'library')) {
                $map['library_name'] = $i;
            }
            if (str_contains($normalized, 'contact') || str_contains($normalized, 'phone') || str_contains($normalized, 'mobile')) {
                $map['contact_number'] = $i;
            }
        }
        if (!isset($map['library_name']) && count($headers) > 0) {
            $map['library_name'] = 0;
        }
        if (!isset($map['contact_number']) && count($headers) > 2) {
            $map['contact_number'] = 2;
        }
        return $map;
    }

    /** @param array<int, string> $row */
    private function mapRowToData(array $row, array $columnMap): array
    {
        $data = [];
        foreach ($columnMap as $field => $index) {
            $data[$field] = $row[$index] ?? '';
        }
        return $data;
    }

    /** @param array<string, string> $data */
    private function createLeadFromRow(array $data): void
    {
        $libraryName = trim($data['library_name'] ?? '');
        $contactNumber = trim($data['contact_number'] ?? '');

        if (!$libraryName || !$contactNumber) {
            throw new \InvalidArgumentException('Library name and contact number are required');
        }

        $stageId = $this->resolveLeadStageId($data['stage'] ?? 'New');
        $sourceId = $this->resolveLeadSourceId($data['source'] ?? 'Registration Website');
        $cityId = $this->resolveCityId($data['state'] ?? null, $data['city'] ?? null);
        $assignedTo = $this->resolveAssignedTo($data['assigned_to'] ?? null);
        $leadTypeId = $this->resolveLeadTypeId($data['lead_type'] ?? null);

        $lead = Lead::create([
            'library_name' => $libraryName,
            'owner_name' => trim($data['owner_name'] ?? '') ?: null,
            'contact_number' => $contactNumber,
            'alternate_contact' => trim($data['alternate_contact'] ?? '') ?: null,
            'email' => trim($data['email'] ?? '') ?: null,
            'total_seats' => $this->parseInt($data['total_seats'] ?? null),
            'no_of_branches' => $this->parseInt($data['no_of_branches'] ?? null),
            'working_since_year' => $this->parseInt($data['working_since_year'] ?? null),
            'interested_for' => trim($data['interested_for'] ?? '') ?: null,
            'subscription_type' => trim($data['subscription_type'] ?? '') ?: null,
            'demo_type' => trim($data['demo_type'] ?? '') ?: null,
            'lead_stage_id' => $stageId,
            'lead_source_id' => $sourceId,
            'lead_type_id' => $leadTypeId,
            'city_id' => $cityId,
            'assigned_to' => $assignedTo,
            'created_by' => Auth::id(),
        ]);

        $tagNames = array_filter(array_map('trim', explode(',', $data['tags'] ?? '')));
        if (!empty($tagNames)) {
            $this->syncTags($lead, $tagNames);
        }
    }

    private function parseInt(?string $v): ?int
    {
        if ($v === null || $v === '') return null;
        $n = (int) preg_replace('/[^0-9]/', '', $v);
        return $n > 0 ? $n : null;
    }

    private function resolveLeadStageId(?string $name): ?int
    {
        if (!$name) return null;
        $slug = strtolower(preg_replace('/\s+/', '-', trim($name)));
        $stage = LeadStage::where('slug', $slug)->orWhere('name', 'like', "%{$name}%")->first();
        if (!$stage) {
            $stage = LeadStage::firstOrCreate(
                ['slug' => $slug],
                ['name' => trim($name), 'stage_order' => 999, 'is_closed' => false]
            );
        }
        return $stage->id;
    }

    private function resolveLeadSourceId(?string $name): ?int
    {
        if (!$name) return null;
        $slug = strtolower(preg_replace('/\s+/', '-', trim($name)));
        $source = LeadSource::where('slug', $slug)->orWhere('name', 'like', "%{$name}%")->first();
        if (!$source) {
            $source = LeadSource::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'status' => 'active']
            );
        }
        return $source->id;
    }

    private function resolveLeadTypeId(?string $name): ?int
    {
        if (!$name) return null;
        $type = LeadType::where('name', 'like', "%{$name}%")->first();
        if (!$type) {
            $type = LeadType::firstOrCreate(['name' => trim($name)], ['description' => '']);
        }
        return $type->id;
    }

    private function resolveAssignedTo($value): ?int
    {
        if ($value === null || $value === '' || $value === '-' || $value === false) return null;
        if (is_numeric($value)) return (int) $value;
        $user = User::where('name', 'like', "%{$value}%")
            ->orWhere('email', 'like', "%{$value}%")
            ->first();
        return $user?->id;
    }

    private function resolveCityId(?string $stateName, ?string $cityName): ?int
    {
        if (!$cityName && !$stateName) return null;
        $city = City::when($stateName, fn ($q) => $q->whereHas('state', fn ($sq) => $sq->where('name', 'like', "%{$stateName}%")))
            ->when($cityName, fn ($q) => $q->where('name', 'like', "%{$cityName}%"))
            ->first();
        return $city?->id;
    }

    private function syncTags(Lead $lead, array $tagNames): void
    {
        $ids = [];
        foreach ($tagNames as $name) {
            $tag = Tag::firstOrCreate(['name' => $name]);
            $ids[] = $tag->id;
        }
        $lead->tags()->sync($ids);
    }
}
