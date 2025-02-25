<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BookingController;

Route::middleware('auth:api')->group(function () {
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{referenceNumber}', [BookingController::class, 'show']);
    Route::post('/bookings/upload-receipt', [BookingController::class, 'uploadReceipt']);
    Route::get('/user/bookings', [BookingController::class, 'userBookings']); // ✅ Fetch user's bookings
    Route::patch('/bookings/{id}/cancel', [BookingController::class, 'cancelBooking']);
    
});

Route::middleware('auth:api')->get('/dashboard/stats', [DashboardController::class, 'getStats']);

Route::middleware('auth:api')->get('/bookings/count', function (Request $request) {
    return response()->json([
        'count' => \App\Models\Booking::where('user_id', $request->user()->id)->count()
    ]);
});

// ✅ Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ✅ Public Routes
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']); // ❌ Not RESTful

Route::get('/categories', [ProductController::class, 'getCategories']);

// ✅ Protected Routes (Requires Authentication)
Route::middleware('auth:api')->group(function () {
    // ✅ Wishlist API
    Route::delete('/wishlist/clear', [WishlistController::class, 'clearWishlist']);
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{id}', [WishlistController::class, 'destroy']);

    // ✅ Favorites API
    Route::delete('/favorites/clear', [FavoriteController::class, 'clearFavorites']);
    Route::get('/favorites', [FavoriteController::class, 'index']); // Fetch user's favorites
    Route::post('/favorites', [FavoriteController::class, 'store']); // Add favorite
    Route::delete('/favorites/{product_id}', [FavoriteController::class, 'destroy']); // Remove favorite

    // ✅ User Info
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });

    Route::middleware('auth:api')->group(function () {
        Route::get('/user', [UserController::class, 'show']); // ✅ Fetch user details
        Route::post('/user/update', [UserController::class, 'update']); // ✅ Update user profile
    });

    
    
    

    // ✅ Logout API
    Route::post('/logout', [AuthController::class, 'logout']);
    
});



