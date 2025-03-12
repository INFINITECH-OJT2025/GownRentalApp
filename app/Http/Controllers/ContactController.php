<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactMail;
use App\Models\User;

class ContactController extends Controller
{
    public function sendMessage(Request $request)
    {
        // ✅ Validate request
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'message' => 'required|string|min:5',
        ]);

        // ✅ Fetch admin email(s)
        $admins = User::where('role', 'admin')->pluck('email');

        if ($admins->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No admin emails found.'], 404);
        }

        // ✅ Send email to all admins
        foreach ($admins as $adminEmail) {
            Mail::to($adminEmail)->send(new ContactMail($request->all()));
        }

        return response()->json([
            'success' => true,
            'message' => 'Your message has been sent successfully!',
        ]);
    }
}
