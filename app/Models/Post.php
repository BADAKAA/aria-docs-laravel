<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Enums\PostStatus;
use App\Enums\PostType;
use App\Traits\HasCover;
use App\Traits\Orderable;
use App\Traits\SelectExcept;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Post extends Model {

    use HasFactory, HasCover, Orderable, SelectExcept;
    
    protected $fillable = [
        'author_id',
        'parent_id',
        'title',
        'slug_title',
        'slug',
        'summary',
        'type',
        'status',
        'category',
        'position',
        'content',
        'cover_path',
        'published_at',
    ];

    protected $appends = ['cover_url'];

    protected $casts = [
        'published_at' => 'datetime',
        // When present in the schema, cast blocks JSON to array for Inertia serialization
        'blocks' => 'array',
    ];

    protected static function booted()
    {
        static::saving(function (Post $post) {
            // Compute the full slug path from either user-defined short slug or title.
            $post->slug = $post->computeUrl();
        });

        static::saved(function (Post $post) {
            $titleChangedAffectsUrl = $post->wasChanged('title') && empty($post->slug_title);
            if ($post->wasChanged(['slug_title', 'parent_id', 'slug']) || $titleChangedAffectsUrl) {
                $post->refreshChildSlugs();
            }
        });
    }

    public function author() {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function parent() {
        return $this->belongsTo(Post::class, 'parent_id');
    }

    public function children() {
        return $this->hasMany(Post::class, 'parent_id');
    }

    public function scopePublic($query) {
        return $query->where('status', PostStatus::PUBLIC->value)->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    public function scopeOfType($query, PostType $type) {
        return $query->where('type', $type->value);
    }

    public function scopeOfStatus($query, PostStatus $status) {
        return $query->where('status', $status->value);
    }

    public function storagePath(): string {
        return 'posts';
    }

    public function fallbackCoverUrl(): ?string {
        return asset('img/default-blog-cover.webp');
    }

    protected function orderWhere(): array {
        return [[['type','=',PostType::DOC->value], ['parent_id','=',$this->parent_id]]];
    }

    protected function orderingIsAllowed(): bool {
        return true;
    }
    
    protected function assignOrderOnCreation(): bool {
        return $this->type === PostType::DOC->value;
    }

    public static function makeSlugFromTitle(string $title): string
    {
        $slug = strtolower($title);
        $slug = preg_replace('/\s+/', '-', $slug);
        $slug = preg_replace('/[^a-z0-9\-]/', '', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        return trim((string) $slug, '-');
    }

    public function computeUrl(): ?string
    {
        // Use user-defined short slug when present, otherwise derive from title.
        $effectiveSlug = $this->slug_title ?: self::makeSlugFromTitle((string) $this->title);
        $slug = $effectiveSlug ? trim((string) $effectiveSlug, '/') : null;
        if (!$slug) return null;

        // For DOCS, include parent path; for BLOG, just use slug
        if ((int) $this->type === PostType::DOC->value && $this->parent_id) {
            $parent = $this->getParentForUrlComputation();
            $prefix = $parent?->slug ? trim($parent->slug, '/') : null;
            return $prefix ? $prefix . '/' . $slug : $slug;
        }

        return $slug;
    }

    protected function getParentForUrlComputation(): ?self
    {
        if ($this->relationLoaded('parent')) {
            return $this->getRelation('parent');
        }
        if (!$this->parent_id) return null;
        return self::query()->select(['id', 'slug', 'slug_title', 'parent_id', 'type'])->find($this->parent_id);
    }

    public function refreshChildSlugs(): void
    {
        $this->loadMissing('children');
        foreach ($this->children as $child) {
            $child->slug = $child->computeUrl();
            // Avoid infinite loop: directly update without touching timestamps if possible
            $child->saveQuietly();
            $child->refreshChildSlugs();
        }
    }
}
