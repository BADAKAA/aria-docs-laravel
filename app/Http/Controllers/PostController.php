<?php

namespace App\Http\Controllers;

use App\Enums\PostType;
use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller {
    public function search(Request $request) {
        $q = trim((string) $request->query('q', ''));
        if ($q === '') {
            return response()->json(['data' => []]);
        }
        $results = Post::public()
            ->whereAny(['title', 'summary', 'slug'], 'like', "%{$q}%")
            ->orderBy('published_at', 'desc')
            ->limit(10)
            ->get(['id', 'title', 'summary', 'slug', 'type']);

        $data = $results->map(function ($p) {
            $type = (int) $p->type === PostType::BLOG->value ? 'blog' : 'docs';
            $url = $type === 'blog' ? route('blog.show', $p->slug) : route('docs.show', $p->slug);
            return [
                'id' => $p->id,
                'title' => $p->title,
                'summary' => $p->summary,
                'slug' => $p->slug,
                'type' => $type,
                'url' => $url,
            ];
        });

        return response()->json(['data' => $data]);
    }
}
