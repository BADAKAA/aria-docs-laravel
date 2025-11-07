<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function toggleRegistration(Request $request)
    {
        $closed = file_exists(storage_path('framework/registration-closed'));
        if ($closed) {
            @unlink(storage_path('framework/registration-closed'));
            return back()->with('success', 'Registration opened');
        }
        // create flag file
        @touch(storage_path('framework/registration-closed'));
        return back()->with('success', 'Registration closed');
    }
}
