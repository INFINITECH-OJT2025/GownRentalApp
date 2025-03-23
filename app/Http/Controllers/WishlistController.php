<?php

namespace App\Http\Controllers;

use App\Models\Wishlist;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller {

    public function index() {
        try {
            $user = Auth::user(); // ✅ Use standard `Auth::user()`
    
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }
    
            $wishlist = Wishlist::where('user_id', $user->id)
                ->with('product:id,name,image,price')
                ->get();
    
            return response()->json([
                'success' => true,
                'data' => $wishlist
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching wishlist: ' . $e->getMessage());
    
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }
    
    
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);
    
        $user = Auth::user(); // Get authenticated user
    
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }
    
        try {
            // Prevent duplicate entries
            $existingWishlist = Wishlist::where('user_id', $user->id)
                                        ->where('product_id', $request->product_id)
                                        ->first();
    
            if ($existingWishlist) {
                return response()->json(['success' => false, 'message' => 'Product already in wishlist'], 409);
            }
    
            // Insert into wishlist
            $wishlist = Wishlist::create([
                'user_id' => $user->id,
                'product_id' => $request->product_id
            ]);
    
            return response()->json([
                'success' => true,
                'message' => 'Product added to wishlist',
                'wishlist' => $wishlist
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server Error',
                'error' => $e->getMessage() // Log the exact error
            ], 500);
        }
    }
    
    // ✅ Remove a product from wishlist (only if it belongs to the logged-in user)
    public function destroy($product_id) {
        $wishlist = Wishlist::where('user_id', Auth::id()) // Ensure it belongs to the user
                            ->where('product_id', $product_id)
                            ->first();

        if ($wishlist) {
            $wishlist->delete();
            return response()->json(['message' => 'Product removed from wishlist']);
        }

        return response()->json(['message' => 'Product not found in wishlist'], 404);
    }

    // ✅ Clear all wishlist items for the authenticated user
    public function clearWishlist() {
    $user = Auth::user();
    
    if (!$user) {
        return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
    }

    // ✅ Delete all wishlist items for the user
    Wishlist::where('user_id', $user->id)->delete();

    return response()->json(['success' => true, 'message' => 'Wishlist cleared']);
}

}
