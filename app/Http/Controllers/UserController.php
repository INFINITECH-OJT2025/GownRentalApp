<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\User;

class UserController extends Controller {
    // ✅ Fetch user details
    public function show(Request $request) {
        $user = $request->user();
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'address' => $user->address,
                'bio' => $user->bio,
                'image' => $user->image ? asset('storage/profile_pictures/' . $user->image) : null, // ✅ Return full URL
            ]
        ], 200);
    }

    public function update(Request $request) {
        $user = Auth::user();
    
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'address' => 'nullable|string|max:255',
            'bio' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,png,jpeg|max:2048', // ✅ Validate image
        ]);
    
        // ✅ Handle Image Upload
        if ($request->hasFile('image')) {
            // ✅ DELETE OLD IMAGE IF IT EXISTS
            if ($user->image && Storage::exists('public/profile_pictures/' . $user->image)) {
                Storage::delete('public/profile_pictures/' . $user->image);
            }
    
            // ✅ Store New Image
            $imageName = time() . '.' . $request->image->extension();
            $request->image->storeAs('public/profile_pictures', $imageName);
            $validated['image'] = $imageName;
        }
    
        // ✅ Update User Information
        $user->update($validated);
    
        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'address' => $user->address,
                'bio' => $user->bio,
                'image' => asset('storage/profile_pictures/' . $user->image), // ✅ Return new image URL
            ]
        ], 200);
    }
    
    
}
