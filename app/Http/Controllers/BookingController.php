<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\User;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use App\Mail\BookingConfirmationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use App\Mail\BookingCanceledMail;
use App\Models\StockAdjustment;

class BookingController extends Controller
{
    public function show($referenceNumber)
    {
        $booking = Booking::with('product')->where('reference_number', $referenceNumber)->first();
    
        if (!$booking) {
            return response()->json(['success' => false, 'message' => 'Booking not found'], 404);
        }
    
        return response()->json([
            'success' => true,
            'booking' => [
                'id' => $booking->id,
                'reference_number' => $booking->reference_number,
               'product' => $booking->product ? [
                    'id' => $booking->product->id,
                    'name' => $booking->product->name,
                    'image_url' => asset('storage/' . $booking->product->image),
                    'price' => (float) ($booking->product->price ?? 0), // ✅ Default to 0 if missing
                    'discounted_price' => (float) ($booking->product->discounted_price ?? 0), // ✅ Default to 0 if missing
                ] : [
                    'id' => null,
                    'name' => 'Unknown Product',
                    'image_url' => null,
                    'price' => 0, // ✅ Prevent NaN error
                    'discounted_price' => 0, // ✅ Prevent NaN error
                ],
                'sizes' => $booking->sizes,
                'start_date' => $booking->start_date, 
                'end_date' => $booking->end_date, 
                'discounted_price' => (float) ($booking->discounted_price ?? $booking->total_price),
                'total_price' => (float) $booking->total_price,
                'added_price' => (float) $booking->added_price,
                'voucher_fee' => (float) ($booking->voucher_fee ?? 0),
                'gcash_receipt' => $booking->gcash_receipt,
                'status' => $booking->status,
                'created_at' => $booking->created_at,
                'updated_at' => $booking->updated_at
            ]
        ]);
    }    

public function applyDiscount(Request $request)
{
    $validated = $request->validate([
        'booking_id' => 'required|exists:bookings,id',
        'points_to_use' => 'required|integer|min:1',
    ]);

    $booking = Booking::findOrFail($validated['booking_id']);
    $user = Auth::user();

    // ✅ Ensure user has enough points
    if ($validated['points_to_use'] > $user->loyalty_points) {
        return response()->json([
            'success' => false,
            'message' => 'Not enough loyalty points!'
        ], 400);
    }

    // ✅ Deduct points from user correctly
    $user->used_points += $validated['points_to_use'];
    $user->loyalty_points = max(0, $user->earned_points - $user->used_points);
    $user->save();    

    // ✅ Deduct points from final price
    $originalTotal = ($booking->discounted_price ?? $booking->total_price) + $booking->added_price;
    $newTotalPrice = max(0, $originalTotal - $validated['points_to_use']); // Ensure no negative values

    // ✅ Save used points as `voucher_fee`
    $booking->voucher_fee = $validated['points_to_use']; 
    $booking->total_price = $newTotalPrice;
    $booking->save();

    return response()->json([
        'success' => true,
        'message' => 'Discount applied successfully!',
        'new_total_price' => $booking->total_price,
        'remaining_points' => $user->loyalty_points, // ✅ Return updated points
    ]);
}

public function userBookings(Request $request)
{
    $user = Auth::user(); // Get the authenticated user

    $bookings = Booking::with('product') // Eager load the product details
        ->where('user_id', $user->id)
        ->orderBy('created_at', 'desc')
        ->get(); // Fetch all the user's bookings

    return response()->json([
        'success' => true,
        'bookings' => $bookings->map(function($booking) {

            $totalPrice = $booking->total_price ?? 0;
            $addedPrice = $booking->added_price ?? 0;

            return [
                'id' => $booking->id,
                'reference_number' => $booking->reference_number,
                'has_review' => \App\Models\Review::where('booking_id', $booking->id)->exists(),
                'product' => $booking->product ? [
                    'id' => $booking->product->id,
                    'name' => $booking->product->name,
                    'description' => $booking->product->description,
                    'image_url' => asset('storage/' . $booking->product->image),
                    'price' => (float) ($booking->product->price ?? 0),
                    'discounted_price' => (float) ($booking->product->discounted_price ?? 0),
                    'stock' => (int) ($booking->product->stock ?? 0), // ✅ Add this line
                ] : null,
                'sizes' => $booking->sizes,
                'start_date' => $booking->start_date,
                'end_date' => $booking->end_date,
                'gcash_receipt' => $booking->gcash_receipt,
                'status' => $booking->status,
                'total_price' => (float) $totalPrice, // Make sure to include total_price
                'added_price' => (float) $addedPrice,
                'voucher_fee' => (float) ($booking->voucher_fee ?? 0),
                'created_at' => $booking->created_at,
                'updated_at' => $booking->updated_at,
            ];
        }),
    ]);
}


public function cancelBooking($referenceNumber)
{
    $booking = Booking::where('reference_number', $referenceNumber)->first();

    if (!$booking) {
        return response()->json(['success' => false, 'message' => 'Booking not found'], 404);
    }

    if ($booking->status === 'canceled') {
        return response()->json(['success' => false, 'message' => 'Booking already canceled'], 400);
    }

    // ✅ Mark canceled by customer
    $booking->status = 'canceled';
    $booking->canceled_by = 'customer';
    $booking->save();

    // ✅ Send Cancellation Email
    try {
        Mail::to($booking->user->email)->send(new BookingCanceledMail($booking));
    } catch (\Exception $e) {
        \Log::error('Error sending cancellation email: ' . $e->getMessage());
    }

    return response()->json(['success' => true, 'message' => 'Booking canceled successfully. A confirmation email has been sent.']);
}


public function uploadReceipt(Request $request)
{
    // ✅ Validate request
    $validator = Validator::make($request->all(), [
        'booking_id' => 'required|exists:bookings,id',
        'receipt' => 'required|image|mimes:jpg,png,jpeg|max:2048', // 2MB limit
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation failed. Please check your inputs.',
            'errors' => $validator->errors(),
        ], 422);
    }

    // ✅ Ensure booking exists
    $booking = Booking::find($request->booking_id);
    if (!$booking) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid booking. Please try again.',
        ], 400);
    }

    // ✅ Ensure product exists
    $product = Product::find($booking->product_id);
    if (!$product) {
        return response()->json([
            'success' => false,
            'message' => 'Product not found.',
        ], 404);
    }

    // ✅ Prevent stock deduction if already reserved
    if ($booking->gcash_receipt) {
        return response()->json([
            'success' => false,
            'message' => 'Receipt already uploaded! Product has been reserved.',
        ], 400);
    }

    $selectedSize = $booking->sizes;

    // 🔄 Updated this part to use name + size logic (no ProductSize model needed)
    $sizeStock = Product::where('name', $product->name)
        ->where('sizes', $selectedSize)
        ->first();

    if (!$sizeStock || $sizeStock->stock <= 0) {
        return response()->json([
            'success' => false,
            'message' => 'Sorry, this item is out of stock! You might be interested in similar products.',
        ], 400);
    }


    // ✅ Store receipt in "storage/app/public/receipts"
    $path = $request->file('receipt')->store('receipts', 'public');

    $sizeStock->decrement('stock', 1);
    $sizeStock->save(); // Save size-specific row
    
    \App\Models\StockAdjustment::create([
        'product_id' => $sizeStock->id,
        'stock_added' => -1,
        'remarks' => 'Stock auto-adjusted via customer (Ref: ' . $booking->reference_number . ')',
    ]);
    

    // ✅ Update booking with receipt path
    $booking->gcash_receipt = $path;
    $booking->save();

    return response()->json([
        'success' => true,
        'message' => 'Receipt uploaded successfully! Product has been reserved.',
        'receipt_path' => asset("storage/$path"),
    ]);
}


public function store(Request $request)
{
    $validated = $request->validate([
        'product_id' => 'required|exists:products,id',
        'start_date' => 'required|date',
        'end_date' => 'required|date|after:start_date',
        'added_price' => 'required|numeric',
        'total_price' => 'required|numeric',
        'discounted_price' => 'nullable|numeric|min:0',
        'voucher_fee' => 'nullable|numeric|min:0',
        'sizes' => 'required|string|max:255', // ✅ Validate size input
    ]);

    if (!auth()->check()) {
        return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
    }

    $user = auth()->user();
    $startDate = Carbon::parse($validated['start_date'])->format('Y-m-d');
    $endDate = Carbon::parse($validated['end_date'])->format('Y-m-d');
    $referenceNumber = strtoupper(substr(md5(uniqid()), 0, 10));

    $booking = Booking::create([
        'user_id' => auth()->id(),
        'product_id' => $validated['product_id'],
        'start_date' => $startDate,
        'end_date' => $endDate,
        'added_price' => $validated['added_price'],
        'total_price' => $validated['total_price'] - $validated['added_price'],
        'discounted_price' => $validated['discounted_price'] ?? $validated['total_price'],
        'voucher_fee' => $validated['voucher_fee'] ?? 0.00,
        'reference_number' => $referenceNumber,
        'sizes' => $validated['sizes'], // ✅ Store selected size in DB
        'status' => 'pending',
    ]);

    Mail::to($user->email)->send(new BookingConfirmationMail($booking));

    return response()->json([
        'success' => true,
        'message' => 'Booking created successfully!',
        'booking' => $booking,
    ]);
}


public function approveBooking($id)
{
    $booking = Booking::findOrFail($id);

    if ($booking->status !== "pending") {
        return response()->json(["message" => "Booking must be pending before approval."], 400);
    }

    // ✅ Approve the booking
    $booking->status = "approved";
    $booking->save();

    // ✅ Refresh the user to get updated values after trigger runs
    $user = $booking->user->fresh();

    return response()->json([
        "message" => "Booking approved successfully!",
        "total_bookings" => $user->total_bookings,
        "loyalty_points" => $user->loyalty_points
    ]);
}


public function index(Request $request)
{
    try {
        // ✅ Fetch all bookings with user, product names, and sizes
        $bookings = Booking::with(['user:id,name,contact_number', 'product:id,name'])
            ->orderBy('created_at', 'desc')
            ->get(); // Fetch all bookings with sizes

        return response()->json([
            'success' => true,
            'bookings' => $bookings
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Something went wrong.',
            'error' => $e->getMessage()
        ], 500);
    }
}



}
