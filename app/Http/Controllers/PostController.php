<?php

namespace App\Http\Controllers;

use App\Enums\PostStatus;
use App\Enums\PostType;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

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

    public function edit(Post $post) {
        return Inertia::render('posts/edit', [
            'post' => $post->load('author'),
            'types' => PostType::toArray(),
            'statuses' => PostStatus::toArray(),
        ]);
    }

    public function update(Request $request, Post $post) {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            // allow slash in docs slugs while keeping sane chars
            'slug' => [
                'required', 'string', 'max:255',
                'regex:/^[A-Za-z0-9](?:[A-Za-z0-9\-\/]*[A-Za-z0-9])?$/',
                Rule::unique('posts', 'slug')->ignore($post->id),
            ],
            'summary' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'integer', Rule::in([PostType::DOC->value, PostType::BLOG->value])],
            'status' => ['required', 'integer', Rule::in([PostStatus::DRAFT->value, PostStatus::PUBLIC->value, PostStatus::PRIVATE->value])],
            'cover' => ['nullable', 'image', 'max:5120'], // 5MB
            'remove_cover' => ['nullable', 'boolean'],
        ]);

        $post->fill([
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'summary' => $validated['summary'] ?? null,
            'content' => $validated['content'] ?? null,
            'category' => $validated['category'] ?? null,
            'type' => $validated['type'],
            'status' => $validated['status'],
        ])->save();


        if ($request->hasFile('cover')) {
            $post->updateCover($request->file('cover'));
        }

        return redirect()->route('posts.edit', $post)->with('success', 'Post updated');
    }

    public function updateCover(Request $request, Post $post)
    {
        $request->validate([
            'cover' => ['required', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('cover')) $post->updateCover($request->file('cover'));

        return redirect()->route('posts.edit', $post)->with('success', 'Cover updated');
    }

    public function deleteCover(Request $request, Post $post)
    {
        $post->deleteCover();
        return redirect()->route('posts.edit', $post)->with('success', 'Cover removed');
    }

    public function destroy(Request $request, Post $post)
    {
        // Remove associated cover file if present, then delete the post
        $post->deleteCover();
        $post->delete();

        return redirect()->route('dashboard')->with('success', 'Post deleted');
    }
}
