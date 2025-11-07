<?php

use App\Http\Controllers\BlogController;
use App\Http\Controllers\DocsController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\PostController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::resource('blog', BlogController::class)->only(['index', 'show']);

Route::get('docs/{slug}', [DocsController::class, 'show'])->where('slug', '.+')->name('docs.show');
Route::get('docs', [DocsController::class, 'index'])->name('docs.index');

Route::get('/search', [PostController::class, 'search'])->name('search.index');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('admin/toggle-registration', [AdminController::class, 'toggleRegistration'])->name('admin.toggle.registration');
    Route::resource('posts', PostController::class);
    // Cover image endpoints
    Route::post('posts/{post}/cover', [PostController::class, 'updateCover'])->name('posts.cover.update');
    Route::delete('posts/{post}/cover', [PostController::class, 'deleteCover'])->name('posts.cover.delete');
    // Docs ordering
    Route::get('order-docs', [\App\Http\Controllers\DocsController::class, 'order'])->name('docs.order');
    Route::post('order-docs', [\App\Http\Controllers\DocsController::class, 'updateOrder'])->name('docs.order.update');
    Route::get('dashboard', function (\Illuminate\Http\Request $request) {
        $q = trim((string) $request->query('q', ''));
        $type = $request->query('type');
        $status = $request->query('status');

        $posts = \App\Models\Post::query()
            ->with(['author'])
            ->when($q !== '', function ($qb) use ($q) {
                $qb->where(function ($sub) use ($q) {
                    $sub->where('title', 'like', "%{$q}%")
                        ->orWhere('summary', 'like', "%{$q}%")
                        ->orWhere('slug', 'like', "%{$q}%");
                });
            })
            ->when($type !== null && $type !== '', function ($qb) use ($type) {
                $qb->where('type', (int) $type);
            })
            ->when($status !== null && $status !== '', function ($qb) use ($status) {
                $qb->where('status', (int) $status);
            })
            ->orderByDesc('updated_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('dashboard', [
            'posts' => $posts,
            'types' => \App\Enums\PostType::toArray(),
            'statuses' => \App\Enums\PostStatus::toArray(),
            'filters' => [
                'q' => $q,
                'type' => $type,
                'status' => $status,
            ],
            'registrationClosed' => file_exists(storage_path('framework/registration-closed')),
        ]);
    })->name('dashboard');
});

require __DIR__.'/settings.php';

