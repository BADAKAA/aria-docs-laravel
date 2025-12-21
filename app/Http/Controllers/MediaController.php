<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Str;
use App\Services\ImageService;
use App\Enums\Role;
use App\Models\Media;

class MediaController extends Controller
{
    const MAX_USER_STORAGE_MB = 100;
    public function index(Request $request) {
        $user = $request->user();
        $uid = (string) $user->id;
        $q = trim((string) $request->query('q', ''));

        // Ensure user folder exists
        $disk = Storage::disk('public');
        if (!$disk->exists($uid)) {
            $disk->makeDirectory($uid);
        }

        // Query media records for this user
        $records = Media::query()
            ->where('user_id', (int) $uid)
            ->when($q !== '', function ($qb) use ($q) {
                $qb->where(function ($sub) use ($q) {
                    $sub->where('original_name', 'like', "%{$q}%")
                        ->orWhere('id', 'like', "%{$q}%");
                });
            })
            ->orderByDesc('created_at')
            ->get();

        $items = $records->map(function (Media $m) {
            return [
                'id' => $m->id,
                'url' => asset('storage/'.$m->path),
                'name' => $m->original_name,
                'size' => (int) $m->size,
                'mime' => $m->mime,
                'ext' => $m->ext,
                'uploaded_at' => optional($m->created_at)->toIso8601String(),
            ];
        })->all();

        // Compute usage in MB (images only)
        $usageBytes = (int) Media::where('user_id', (int) $uid)->sum('size');
        $usageMb = round($usageBytes / (1024 * 1024), 2);
        $limitMb = self::MAX_USER_STORAGE_MB;
        $isAdmin = method_exists($user, 'role')
            ? ((int) $user->role === Role::ADMIN->value)
            : false;

        return Inertia::render('media-library', [
            'items' => $items,
            'usageMb' => $usageMb,
            'limitMb' => $limitMb,
            'filters' => [ 'q' => $q ],
            'isAdmin' => $isAdmin,
        ]);
    }

    public function store(Request $request) {
        $user = $request->user();
        $uid = (string) $user->id;
        $disk = Storage::disk('public');
        if (!$disk->exists($uid)) {
            $disk->makeDirectory($uid);
        }

        $request->validate([
            'file' => 'required|file|mimes:jpeg,jpg,png,webp,gif,avif|max:10240', // 10MB max upload size per file
        ]);

        $isAdmin = method_exists($user, 'role')
            ? ((int) $user->role === Role::ADMIN->value)
            : false;

        // Enforce storage limit unless admin
        if (!$isAdmin) {
            $currentUsageBytes = $this->computeUserUsageBytes($disk, $uid);
            $limitBytes = self::MAX_USER_STORAGE_MB * 1024 * 1024;
            if ($currentUsageBytes >= $limitBytes) {
                return back()->withErrors(['file' => 'Storage limit exceeded.']);
            }
        }

        $uploaded = $request->file('file');
        $originalName = $uploaded->getClientOriginalName();
        $tmpPath = $uploaded->getRealPath();
        $id = Str::ulid()->toString();

        // Target: public/{uid}/{id}.webp (default compression target)
        $relative = $uid.'/'.$id.'.webp';
        $absoluteTarget = storage_path('app/public/'.$relative);
        // Ensure directory exists
        @mkdir(dirname($absoluteTarget), 0775, true);

        try {
            ImageService::compress($tmpPath, null, 80, 'webp', $absoluteTarget);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Failed to process image: '.$e->getMessage()]);
        }

        // Enforce storage limit on resulting compressed size unless admin
        $newSize = is_file($absoluteTarget) ? (int) filesize($absoluteTarget) : 0;
        if (!$isAdmin) {
            $currentUsageBytes = (int) Media::where('user_id', (int) $uid)->sum('size');
            $limitBytes = self::MAX_USER_STORAGE_MB * 1024 * 1024;
            if ($currentUsageBytes + $newSize > $limitBytes) {
                if (is_file($absoluteTarget)) @unlink($absoluteTarget);
                return back()->withErrors(['file' => 'Storage limit exceeded.']);
            }
        }

        // Persist media record
        Media::create([
            'id' => $id,
            'user_id' => (int) $uid,
            'original_name' => $originalName,
            'ext' => 'webp',
            'mime' => 'image/webp',
            'size' => $newSize,
            'path' => $relative,
        ]);

        $payload = [
            'id' => $id,
            'url' => asset('storage/'.$relative),
        ];

        // If the client expects JSON (e.g. editor uploads), return it directly
        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json($payload, 201);
        }

        // Otherwise, fall back to the Inertia redirect flow used by the UI
        return redirect()->route('media.library')
            ->with('success', 'Image uploaded')
            ->with('uploaded', $payload);
    }

    public function rename(Request $request, string $id) {
        $user = $request->user();
        $uid = (int) $user->id;

        $request->validate([
            'name' => 'required|string|min:1|max:255',
        ]);

        $media = Media::where('id', $id)->where('user_id', $uid)->first();
        if (!$media) {
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json(['message' => 'Image not found.'], 404);
            }
            return back()->withErrors(['id' => 'Image not found.']);
        }

        // Update display name only; keep id/path (slug) unchanged
        $media->original_name = trim((string) $request->input('name'));
        $media->save();

        $payload = [
            'id' => $media->id,
            'url' => asset('storage/'.$media->path),
            'name' => $media->original_name,
        ];

        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json($payload, 200);
        }

        return redirect()->route('media.library')->with('success', 'Image renamed')->with('updated', $payload);
    }

    public function destroy(Request $request, string $id) {
        $user = $request->user();
        $uid = (int) $user->id;
        $media = Media::where('id', $id)->where('user_id', $uid)->first();
        if (!$media) {
            return back()->withErrors(['id' => 'Image not found.']);
        }
        // Delete file and record
        $absolute = storage_path('app/public/'.$media->path);
        if (is_file($absolute)) @unlink($absolute);
        $media->delete();
        return redirect()->route('media.library')->with('success', 'Image deleted');
    }

    private function computeUserUsageBytes($disk, string $uid): int {
        $files = $disk->files($uid);
        $total = 0;
        foreach ($files as $file) {
            if (str_ends_with($file, '.json')) continue;
            $total += (int) $disk->size($file);
        }
        return $total;
    }

    private function mimeFromExt(string $ext): string {
        return match($ext) {
            'webp' => 'image/webp',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'jpg', 'jpeg' => 'image/jpeg',
            'avif' => 'image/avif',
            default => 'application/octet-stream',
        };
    }
}
