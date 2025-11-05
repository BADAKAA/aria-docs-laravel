<?php

use App\Http\Controllers\BlogController;
use App\Http\Controllers\DocsController;
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
    Route::resource('post', PostController::class);
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';

