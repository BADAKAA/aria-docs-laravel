<?php

namespace App\Http\Controllers;

use App\Enums\PostType;
use App\Models\Post;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
            ->get(['id', 'title', 'slug', 'category', 'parent_id', 'position']);
        return Inertia::render('documentation', compact('post', 'index'));
    }

    public function order() {
        // Fetch all docs with current hierarchy and position, ordered for stable initial view
        $docs = Post::ofType(PostType::DOC)
            ->orderBy('parent_id')
            ->orderBy('position')
            ->orderBy('id')
            ->get(['id','title','slug','category','parent_id','position'])
            ->groupBy('category');
        return Inertia::render('docs/order', [
            'docs' => $docs,
        ]);
    }

    public function updateOrder(Request $request) {
        // Payload: array of { id: number, parent_id: number|null, position: number, category?: string|null }
        $data = $request->validate([
            'items' => ['required','array'],
            'items.*.id' => ['required','integer','exists:posts,id'],
            'items.*.parent_id' => ['nullable','integer','exists:posts,id'],
            'items.*.position' => ['required','integer','min:0'],
            'items.*.category' => ['nullable','string'],
        ]);

        $items = collect($data['items'])->keyBy('id');
        $ids = $items->keys()->all();

        // Current categories for all affected docs (roots will keep theirs)
        $currentCats = Post::whereIn('id', $ids)->pluck('category', 'id');
        // Current slugs and titles to derive basename for each node
        $currentSlugs = Post::whereIn('id', $ids)->pluck('slug', 'id');
        $titles = Post::whereIn('id', $ids)->pluck('title', 'id');

        // Compute inherited categories for all nodes based on new hierarchy
        $parentOf = $items->map(fn($x) => $x['parent_id'] ?? null); // id => parent_id
        $memo = [];
        $computing = [];
        $computeCat = function ($id) use (&$computeCat, &$memo, &$computing, $parentOf, $currentCats) {
            if (array_key_exists($id, $memo)) return $memo[$id];
            if (isset($computing[$id])) return $currentCats[$id] ?? null; // guard against cycles
            $computing[$id] = true;
            $pid = $parentOf[$id] ?? null;
            if ($pid === null) {
                $cat = $currentCats[$id] ?? null;
            } else {
                $cat = $computeCat($pid);
            }
            $memo[$id] = $cat;
            unset($computing[$id]);
            return $cat;
        };

        // Build basename map only (category will be applied from finalized updates)
        $basenameOf = [];
        foreach ($ids as $id) {
            $slug = (string) ($currentSlugs[$id] ?? '');
            $base = $slug !== '' ? preg_replace('#^.*/#', '', $slug) : null;
            if ($base === null || $base === '' || $base === false) {
                $base = Str::slug((string) ($titles[$id] ?? ('post-'.$id)));
            }
            $basenameOf[$id] = $base;
        }

        $updates = $items->map(function ($it, $id) use ($computeCat) {
            return [
                'id' => (int) $id,
                'parent_id' => $it['parent_id'] ?? null,
                'position' => (int) $it['position'],
                // If a category is explicitly provided (for roots), use it (normalize empty to null),
                // otherwise fall back to inherited computeCat
                'category' => array_key_exists('category', $it)
                    ? (isset($it['category']) && $it['category'] !== '' ? $it['category'] : null)
                    : $computeCat($id),
            ];
        })->values();

        // Resolve final categories by propagating from (possibly updated) root categories to all descendants
        $updatesById = $updates->keyBy('id');
        $resolvedCat = [];
        $resolving = [];
        $resolve = function ($id) use (&$resolve, &$resolvedCat, &$resolving, $parentOf, $updatesById, $currentCats) {
            if (array_key_exists($id, $resolvedCat)) return $resolvedCat[$id];
            if (isset($resolving[$id])) return $currentCats[$id] ?? null; // cycle guard
            $resolving[$id] = true;
            $u = $updatesById->get($id);
            if (!$u) { $resolvedCat[$id] = null; unset($resolving[$id]); return null; }
            $pid = $u['parent_id'] ?? null;
            if ($pid === null) {
                // Use updated root category if provided; otherwise fall back to current DB value
                $cat = $u['category'] ?? null;
                if ($cat === null) $cat = $currentCats[$id] ?? null;
                $resolvedCat[$id] = $cat;
            } else {
                $resolvedCat[$id] = $resolve($pid);
            }
            unset($resolving[$id]);
            return $resolvedCat[$id];
        };
        foreach ($ids as $id) {
            $resolve($id);
        }
        // Overwrite categories in $updates with resolved values
        $updates = $updates->map(function ($u) use ($resolvedCat) {
            $u['category'] = $resolvedCat[$u['id']] ?? null;
            return $u;
        });

        // Build category map from finalized updates for slug computation
        $categoryById = [];
        foreach ($updates as $u) {
            $categoryById[$u['id']] = $u['category'] ?? null;
        }

        // Compute new hierarchical slugs using updated parents and final categories
        $slugMemo = [];
        $slugComputing = [];
        $computeSlug = function ($id) use (&$computeSlug, &$slugMemo, &$slugComputing, $parentOf, $categoryById, $basenameOf) {
            if (array_key_exists($id, $slugMemo)) return $slugMemo[$id];
            if (isset($slugComputing[$id])) return $basenameOf[$id]; // cycle guard fallback
            $slugComputing[$id] = true;
            $pid = $parentOf[$id] ?? null;
            $base = $basenameOf[$id];
            if ($pid === null) {
                $cat = $categoryById[$id] ?? null;
                if ($cat !== null && $cat !== '') {
                    $catSlug = Str::slug($cat);
                    $full = ($catSlug !== '' ? $catSlug.'/' : '').$base;
                } else {
                    $full = $base;
                }
            } else {
                $parentSlug = $computeSlug($pid);
                $full = trim($parentSlug, '/').'/'.$base;
            }
            $slugMemo[$id] = trim($full, '/');
            unset($slugComputing[$id]);
            return $slugMemo[$id];
        };

        // Compute slug updates for all affected ids based on the above
        $slugUpdates = [];
        foreach ($ids as $id) {
            $slugUpdates[$id] = $computeSlug($id);
        }

        DB::transaction(function () use ($updates, $ids) {
            if (empty($ids)) return;
            $casePosition = 'CASE id ' . $updates->map(fn($u) => 'WHEN '.$u['id'].' THEN '.$u['position'])->implode(' ') . ' END';
            $caseParent = 'CASE id ' . $updates->map(fn($u) => 'WHEN '.$u['id'].' THEN '.($u['parent_id'] === null ? 'NULL' : (int)$u['parent_id']))->implode(' ') . ' END';
            $caseCategory = 'CASE id ' . $updates->map(function ($u) {
                $val = $u['category'];
                return 'WHEN '.$u['id'].' THEN '.(is_null($val) ? 'NULL' : DB::getPdo()->quote($val));
            })->implode(' ') . ' END';

            DB::update('UPDATE posts SET position = '.$casePosition.', parent_id = '.$caseParent.' WHERE id IN ('.implode(',', $ids).')');
            DB::update('UPDATE posts SET category = '.$caseCategory.' WHERE id IN ('.implode(',', $ids).')');
        });

        // Update slugs after computing outside transaction to avoid capturing closures; run in a separate transaction for consistency
        DB::transaction(function () use ($ids, $slugUpdates) {
            if (empty($ids)) return;
            $caseSlug = 'CASE id ' . collect($ids)->map(function ($id) use ($slugUpdates) {
                $val = $slugUpdates[$id] ?? '';
                return 'WHEN '.(int)$id.' THEN '.DB::getPdo()->quote($val);
            })->implode(' ') . ' END';
            DB::update('UPDATE posts SET slug = '.$caseSlug.' WHERE id IN ('.implode(',', $ids).')');
        });

        return back()->with('success', 'Order updated');
    }
}
