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
}
