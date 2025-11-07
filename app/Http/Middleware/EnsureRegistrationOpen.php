<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRegistrationOpen {
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next) {

        if (!$request->is('register') || !file_exists(storage_path('framework/registration-closed'))) return $next($request);

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Registration is closed'], 403);
        }
        abort(403, 'Registration is closed');
    }
}
