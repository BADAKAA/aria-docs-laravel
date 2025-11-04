<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Public docs & blog
Route::get('/docs', function () {
    return Inertia::render('docs/index');
})->name('docs.index');

Route::get('/docs/{slug?}', function (string $slug = null) {
    $parts = $slug ? explode('/', $slug) : [];
    return Inertia::render('docs/show', [
        'slug' => $parts,
    ]);
})->where('slug', '.*')->name('docs.show');

Route::resource('blog', \App\Http\Controllers\BlogController::class)->only(['index', 'show']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('blog', \App\Http\Controllers\BlogController::class)->except(['index', 'show']);
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
