<?php

namespace App\Http\Controllers;

use App\Enums\PostType;
use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BlogController extends Controller
{
    public function index() {
        $posts = Post::ofType(PostType::BLOG)->selectExcept(['content'])->public()->with(['author'])->paginate(12);
        return Inertia::render('blog/index', [
            'posts' => $posts,
        ]);
    }

    public function show(string $slug) {
        $post = Post::where('slug', $slug)->ofType(PostType::BLOG)->public()->with(['author'])->firstOrFail();
        return Inertia::render('blog/show', [
            'post' => $post,
        ]);
    }
}
