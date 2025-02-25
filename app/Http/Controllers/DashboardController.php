<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Product;
use App\Models\VisitorLog;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        // Ensure the user is authenticated
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        try {
            $usersCount = User::count();
            $productsCount = Product::count();
            $visitorsCount = VisitorLog::count(); // Assuming you have a visitor logs table

            return response()->json([
                'success' => true,
                'stats' => [
                    'users' => $usersCount,
                    'products' => $productsCount,
                    'visitors' => $visitorsCount,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
}

