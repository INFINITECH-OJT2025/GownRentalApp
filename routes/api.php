<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardController;
use App\Models\Booking;
use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ContactController;

Route::get('/product/{id}/approved-bookings', function ($id) {
    $approvedBookings = Booking::where('product_id', $id)
        ->where('status', 'Approved') // ✅ Ensure status matches exactly
        ->count(); // ✅ Count total approved bookings

    return response()->json([
        'product_id' => $id,
        'approved_bookings' => $approvedBookings
    ]);
});

Route::middleware('auth:api')->get('/user/loyalty-history', [UserController::class, 'getLoyaltyHistory']);


Route::post('/contact', [ContactController::class, 'sendMessage']);


Route::get('/admins', [UserController::class, 'getAdmins']);

Route::middleware('auth:api')->group(function () {
    Route::get('/messages/customer/{customerId}', [ChatController::class, 'getCustomerMessage']);
    Route::post('/chat/send', [ChatController::class, 'sendMessage']); 
});

Route::get('/admins-with-unread', [ChatController::class, 'getAdminsWithUnreadMessages']);

Route::middleware('auth:api')->get('/customers-with-unread', [ChatController::class, 'getCustomersWithUnreadMessages']);


Route::get('/messages/{customerId}', [ChatController::class, 'getMessages']);

Route::get('/messages/customer/{customerId}/{adminId}', [ChatController::class, 'getCustomerMessages']);

Route::middleware('auth:api')->group(function () {
    Route::get('/chats/{receiverId}', [ChatController::class, 'index']); // Get chat messages
    Route::post('/chats', [ChatController::class, 'store']); // Send message
});



Route::middleware('auth:api')->group(function () {
    Route::get('/customers', [UserController::class, 'getCustomers']); // ✅ Fetch all customer users
});

Route::middleware(['auth:api'])->group(function () {
    Route::post('/reviews', [ReviewController::class, 'createReview']); // Create a review
});

Route::get('/reviews/{productId}', [ReviewController::class, 'getReviews']); // Get reviews for a product

Route::middleware(['auth:api'])->get('/bookings/check-review-eligibility/{productId}', function ($productId) {
    try {
        $userId = Auth::id();

        if (!$userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // ✅ Ensure the product exists
        if (!\App\Models\Product::find($productId)) {
            return response()->json(['success' => false, 'message' => 'Product not found'], 404);
        }

        // ✅ Find all returned bookings of this user for this product
        $returnedBookings = \App\Models\Booking::where('user_id', $userId)
            ->where('product_id', $productId)
            ->where('status', 'returned')
            ->pluck('reference_number'); // ✅ Get all returned booking references

        if ($returnedBookings->isEmpty()) {
            return response()->json(['success' => true, 'can_review' => false, 'message' => 'No returned bookings found.']);
        }

        // ✅ Find all bookings that have already been reviewed
        $reviewedBookings = \App\Models\Review::where('user_id', $userId)
            ->whereIn('booking_id', function ($query) use ($returnedBookings) {
                $query->select('id')
                    ->from('bookings')
                    ->whereIn('reference_number', $returnedBookings);
            })
            ->pluck('booking_id'); // ✅ Get all reviewed booking IDs

        // ✅ Find bookings that can still be reviewed
        $unreviewedBookings = $returnedBookings->diff($reviewedBookings);

        return response()->json([
            'success' => true,
            'can_review' => !$unreviewedBookings->isEmpty(), // ✅ Can review if there's an unreviewed booking
            'has_reviewed' => $reviewedBookings->isNotEmpty(), // ✅ User has reviewed at least once
            'unreviewed_bookings' => $unreviewedBookings->values(), // ✅ Send list of bookings user can review
        ]);

    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
    }
});



Route::get('/admin/qrcode', [UserController::class, 'getAdminQRCode']);

Route::middleware('auth:api')->group(function () {
    // ✅ Booking Routes
    Route::post('/bookings/apply-discount', [BookingController::class, 'applyDiscount'])->middleware('auth:api');
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{referenceNumber}', [BookingController::class, 'show']);
    Route::post('/bookings/upload-receipt', [BookingController::class, 'uploadReceipt']);
    Route::get('/user/bookings', [BookingController::class, 'userBookings']);
    Route::patch('/bookings/{id}/cancel', [BookingController::class, 'cancelBooking']);
    Route::get('/bookings', [BookingController::class, 'index']);
    
});


Route::middleware('auth:api')->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']); // Fetch dashboard stats
    Route::get('/products', [DashboardController::class, 'getProducts']); // Fetch products
    Route::get('/inventory', [DashboardController::class, 'getInventory']); // Fetch inventory list
    Route::get('/inventory/{id}', [DashboardController::class, 'getInventoryItem']); // Fetch single item
    Route::post('/inventory', [DashboardController::class, 'addInventory']); // Add new item
    Route::put('/inventory/{id}', [DashboardController::class, 'updateInventory']); // Update item
    Route::delete('/inventory/{id}', [DashboardController::class, 'deleteInventory']); // Delete item
    Route::get('/orders', [DashboardController::class, 'index']); // Fetch all orders
    Route::put('/orders/{id}/update-status', [DashboardController::class, 'updateStatus']); // Ensure status updates
    Route::post('/products/{id}/update', [DashboardController::class, 'updateProduct']);
    Route::post('/products', [DashboardController::class, 'storeProduct']);
    Route::put('/inventory/{id}/add-stock', [DashboardController::class, 'addStock']); 
    Route::get('/stock-logs', [DashboardController::class, 'getStockLogs']);
    Route::post('/products/{id}/toggle-visibility', [DashboardController::class, 'toggleProductVisibility']);
        Route::get('/admin/reviews', [ReviewController::class, 'getAllReviews']); // ✅ Fetch all reviews
        Route::post('/admin/reviews/{id}/reply', [ReviewController::class, 'replyToReview']);
        
});

// In routes/api.php (if you’re using an API)
// Route::middleware('auth:api')->get('/booking-dates', [DashboardController::class, 'getBookingDates']);


Route::middleware('auth:api')->get('/users/{id}', function ($id) {
    $user = \App\Models\User::find($id);
    if (!$user) {
        return response()->json(['success' => false, 'message' => 'User not found'], 404);
    }
    return response()->json(['success' => true, 'user' => $user]);
});


Route::post('/process-image', function (Request $request) {
    try {
        $imageBase64 = $request->input('image');

        if (!$imageBase64) {
            return response()->json(['success' => false, 'message' => 'No image provided'], 400);
        }

        // Decode base64 image
        $imageData = base64_decode($imageBase64);
        $fileName = 'products/' . uniqid() . '.png';

        // ✅ Fix: Store image without `/storage/`
        Storage::disk('public')->put($fileName, $imageData);

        // ✅ Fix: Return correct path without `/storage/`
        return response()->json([
            'success' => true,
            'processed_image' => $fileName // No `/storage/` prefix
        ]);

    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
    }
});

Route::middleware('auth:api')->get('/bookings/count', function (Request $request) {
    return response()->json([
        'count' => \App\Models\Booking::where('user_id', $request->user()->id)->count()
    ]);
});

// ✅ Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ✅ Public Routes
Route::middleware(['auth:api'])->group(function () {
    Route::put('/admin/product/{id}/discount', [ProductController::class, 'updateDiscount']);
});


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



