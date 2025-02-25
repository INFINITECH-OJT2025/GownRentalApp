<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Favorite;
use App\Models\Product;

class FavoriteController extends Controller
{
    // ✅ Fetch the logged-in user's favorite products
    public function index() {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $favorites = Favorite::with('product')->where('user_id', $user->id)->get();

            return response()->json([
                'success' => true,
                'data' => $favorites
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server Error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function clearFavorites() {
        $user = Auth::user();
    
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }
    
        // ✅ Delete all favorites for the authenticated user
        Favorite::where('user_id', $user->id)->delete();
    
        return response()->json([
            'success' => true,
            'message' => 'All favorites cleared'
        ]);
    }
    

    // ✅ Add a product to favorites
    public function store(Request $request) {
        try {
            $request->validate([
                'product_id' => 'required|exists:products,id',
            ]);

            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            // ✅ Check if already in favorites
            $existingFavorite = Favorite::where('user_id', $user->id)
                ->where('product_id', $request->product_id)
                ->first();

            if ($existingFavorite) {
                return response()->json(['success' => false, 'message' => 'Product already in favorites'], 409);
            }

            // ✅ Add to favorites
            $favorite = Favorite::create([
                'user_id' => $user->id,
                'product_id' => $request->product_id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Product added to favorites',
                'favorite' => $favorite
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server Error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ✅ Remove a product from favorites
    public function destroy($product_id) {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $favorite = Favorite::where('user_id', $user->id)
                ->where('product_id', $product_id)
                ->first();

            if ($favorite) {
                $favorite->delete();
                return response()->json(['success' => true, 'message' => 'Product removed from favorites']);
            }

            return response()->json(['success' => false, 'message' => 'Product not found in favorites'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server Error',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
