<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Laravel\Passport\Token;

class AuthController extends Controller
{
    /**
     * ✅ Register a new user and return access token.
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('GownRentalApp')->accessToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully!',
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    /**
     * ✅ Login and return access token.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);
    
        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }
    
        $user = Auth::user();
        $token = $user->createToken('authToken')->accessToken;
    
        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role, // ✅ Include role in response
                'image' => $user->image ? asset('storage/profile_pictures/' . $user->image) : null
            ]
        ]);
    }
    
    /**
     * ✅ Logout and revoke user's token.
     */
    public function logout(Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: No user found',
            ], 401);
        }

        // ✅ Revoke all access tokens for the user
        Token::where('user_id', $user->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out',
        ], 200);
    }
}
