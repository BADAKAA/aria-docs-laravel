<?php

namespace App\Traits;

use App\Actions\CompressImage;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Http\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

trait HasCover {
    private function disk(): \Illuminate\Contracts\Filesystem\Filesystem {
        return Storage::disk('public');
    }
    protected abstract function storagePath(): string;
    protected abstract function fallbackCoverUrl(): ?string;

    public function updateCover(UploadedFile $photo) {
        $storagePath = $this->storagePath();
        tap($this->cover_path, function ($previous) use ($photo, $storagePath) {
            $initialPath = $this->disk()->putFile($storagePath, $photo);
            $initialPath =  $this->disk()->path($initialPath);
            $compressed = CompressImage::at($initialPath);
            $path = $this->disk()->putFile($storagePath, new File($compressed));
            $this->forceFill([
                'cover_path' => $path,
            ])->save();

            if ($previous) $this->disk()->delete($previous);
        });
    }

    public function deleteCover() {
        if (is_null($this->cover_path)) return;

        $this->disk()->delete($this->cover_path);

        $this->forceFill([
            'cover_path' => null,
        ])->save();
    }
    public function coverUrl(): Attribute {
        return Attribute::get(function (): string {
            /** @var \Illuminate\Facades\Storage */
            $disk = $this->disk();
            return $this->cover_path
                ? $disk->url($this->cover_path)
                : $this->fallbackCoverUrl();
        });
    }
}
