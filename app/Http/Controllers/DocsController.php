<?php

namespace App\Http\Controllers;

use App\Enums\PostType;
use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocsController extends Controller {
    public function index() {
        $slug = Post::ofType(PostType::DOC)->public()->orderBy('created_at')->firstOrFail()->slug;
        return redirect()->route('docs.show', $slug);
    }

    public function show(string $slug) {
        $post = Post::where('slug', $slug)->ofType(PostType::DOC)->public()->with(['author'])->firstOrFail();
        $index = Post::ofType(PostType::DOC)
            ->public()
            ->where(fn($query) => $query->where('category', $post->category)->orWhereNull('parent_id'))
            ->orderBy('created_at')
            ->get(['id', 'title', 'slug', 'category', 'parent_id']);
        return Inertia::render('documentation', compact('post', 'index'));
    }
}
