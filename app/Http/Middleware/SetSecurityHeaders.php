<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetSecurityHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // // Basic security headers
        // $response->headers->set('X-Content-Type-Options', 'nosniff');
        // $response->headers->set('X-Frame-Options', 'DENY');
        // $response->headers->set('Referrer-Policy', 'no-referrer');
        // $response->headers->set('Permissions-Policy', "geolocation=(), microphone=(), camera=(), interest-cohort=()");

        // // Content Security Policy with Trusted Types
        // // Note: 'require-trusted-types-for' can impact React's dangerouslySetInnerHTML.
        // // We keep it enabled assuming sanitized assignment uses DOMPurify + direct innerHTML.
        // $csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-src *; connect-src *;";
        // $trusted = "trusted-types dompurify; require-trusted-types-for 'script'";
        // $response->headers->set('Content-Security-Policy', $csp . ' ' . $trusted);

        return $response;
    }
}
