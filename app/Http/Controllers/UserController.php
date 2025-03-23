<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\Booking;
use App\Models\Chat;

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
            'payment_qrcode' => $admin->payment_qrcode ? asset('storage/payment_qrcodes/' . $admin->payment_qrcode) : null,
            'email' => $admin->email
        ]);
    }    
    
   
    public function show(Request $request) {
        $user = $request->user();
    
        $loyaltyPoints = $user->loyalty_points;
    
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role, // ✅ Add this!
                'address' => $user->address,
                'bio' => $user->bio,
                'image' => $user->image ? asset('storage/profile_pictures/' . $user->image) : null,
                'total_bookings' => Booking::where('user_id', $user->id)
                                           ->where('status', 'approved')
                                           ->count(),
                'loyalty_points' => $loyaltyPoints,
            ]
        ]);
    }
    

    public function getLoyaltyHistory(Request $request)
{
    $user = auth()->user();
    $history = $user->loyaltyRewardsHistory()->with('product')->orderBy('created_at', 'desc')->get();

    return response()->json([
        'success' => true,
        'loyalty_history' => $history
    ]);
}

public function update(Request $request) {
    $user = Auth::user();

    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
        'address' => 'nullable|string|max:255',
        'bio' => 'nullable|string',
        'image' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
        'payment_qrcode' => 'nullable|image|mimes:jpg,png,jpeg|max:2048',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    // ✅ Handle Profile Picture Upload
    if ($request->hasFile('image')) {
        if ($user->image && Storage::exists('public/profile_pictures/' . $user->image)) {
            Storage::delete('public/profile_pictures/' . $user->image);
        }

        $imageName = time() . '_' . $user->id . '.' . $request->image->getClientOriginalExtension();
        $request->image->storeAs('profile_pictures', $imageName, 'public');
        $user->image = $imageName;
    }

    // ✅ Handle Payment QR Code Upload
    if ($request->hasFile('payment_qrcode')) {
        if ($user->payment_qrcode && Storage::exists('public/payment_qrcodes/' . $user->payment_qrcode)) {
            Storage::delete('public/payment_qrcodes/' . $user->payment_qrcode);
        }

        $qrCodeName = 'qr_' . $user->id . '_' . time() . '.' . $request->payment_qrcode->getClientOriginalExtension();
        $request->payment_qrcode->storeAs('payment_qrcodes', $qrCodeName, 'public');
        $user->payment_qrcode = $qrCodeName;
    }

    // ✅ Update User Information
    $user->update($request->except(['image', 'payment_qrcode']));

    return response()->json([
        'success' => true,
        'message' => 'Profile updated successfully',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'address' => $user->address,
            'bio' => $user->bio,
            'image' => $user->image ? asset('storage/profile_pictures/' . $user->image) : null,
            'payment_qrcode' => $user->payment_qrcode ? asset('storage/payment_qrcodes/' . $user->payment_qrcode) : null,
        ]
    ]);
}

    
public function getCustomers()
{
    $customers = User::where('role', 'customer')
        ->select('id', 'name', 'image as avatar')
        ->get()
        ->map(function ($customer) {
            $customer->avatar = $customer->avatar 
                ? (filter_var($customer->avatar, FILTER_VALIDATE_URL) ? $customer->avatar : url('/storage/' . $customer->avatar))
                : url('/images/default_avatar.png');
            return $customer;
        });

    return response()->json([
        'success' => true,
        'customers' => $customers
    ]);
}


public function getAdmins()
{
    $admins = User::where('role', 'admin')
        ->select('id', 'name', 'email')
        ->get(); // ✅ Fetch all admins

    if ($admins->isEmpty()) {
        return response()->json([]); // ✅ Return an empty array instead of an error
    }

    return response()->json($admins); // ✅ Always return an array
}

    
}
