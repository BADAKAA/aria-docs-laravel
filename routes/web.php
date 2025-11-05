<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::resource('blog', \App\Http\Controllers\BlogController::class)->only(['index', 'show']);
Route::get('docs/{slug}', [\App\Http\Controllers\DocsController::class, 'show'])->where('slug', '.+')->name('docs.show');
Route::get('docs', [\App\Http\Controllers\DocsController::class, 'index'])->name('docs.index');
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('blog', \App\Http\Controllers\BlogController::class)->except(['index', 'show']);
    Route::resource('docs', \App\Http\Controllers\DocsController::class)->except(['index', 'show']);
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
