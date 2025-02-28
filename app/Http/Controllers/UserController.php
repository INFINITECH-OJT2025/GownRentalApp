<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\User;

class UserController extends Controller {

    public function getAdminQRCode()
    {
        $admin = User::where('role', 'admin')->first();
    
        if (!$admin || !$admin->payment_qrcode) {
            return response()->json([
                'success' => false,
                'message' => 'Admin QR Code not found'
            ], 404);
        }
    
        return response()->json([
            'success' => true,
            'payment_qrcode' => asset('storage/payment_qrcodes/' . $admin->payment_qrcode),
            'email' => $admin->email  // ✅ Added email
        ]);
    }
    
    

    public function show(Request $request) {
        $user = $request->user();
    
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'address' => $user->address,
                'bio' => $user->bio,
                'image' => $user->image ? asset('storage/profile_pictures/' . $user->image) : null,
                'payment_qrcode' => $user->payment_qrcode ? asset('storage/payment_qrcodes/' . $user->payment_qrcode) : null,
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
            'image' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
            'payment_qrcode' => 'nullable|image|mimes:jpg,png,jpeg|max:2048', // ✅ Validate QR Code image
        ]);
    
        // ✅ Handle Payment QR Code Upload
        if ($request->hasFile('payment_qrcode')) {
            if ($user->payment_qrcode && Storage::exists('public/payment_qrcodes/' . $user->payment_qrcode)) {
                Storage::delete('public/payment_qrcodes/' . $user->payment_qrcode);
            }
            $qrCodeName = time() . '_qr.' . $request->payment_qrcode->extension();
            $request->payment_qrcode->storeAs('public/payment_qrcodes', $qrCodeName);
            $validated['payment_qrcode'] = $qrCodeName;
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
                'image' => asset('storage/profile_pictures/' . $user->image),
                'payment_qrcode' => asset('storage/payment_qrcodes/' . $user->payment_qrcode), // ✅ Return new QR Code URL
            ]
        ], 200);
    }    
    
    
}
