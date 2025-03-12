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
        'product' => [
            'id' => $booking->product->id,
            'name' => $booking->product->name,
        ],
        'discounted_price' => (float) ($booking->discounted_price ?? $booking->total_price), // ✅ Ensure it's a float
        'total_price' => (float) $booking->total_price, // ✅ Convert to float
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
    $user->loyalty_points -= $validated['points_to_use'];
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

    // ✅ Get authenticated user's bookings
    public function userBookings(Request $request)
    {
        $user = Auth::user(); // ✅ Get the authenticated user

        $bookings = Booking::with('product') // ✅ Eager load product details
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get(); // ✅ Fetch user-specific bookings

        return response()->json([
            'success' => true,
            'bookings' => $bookings,
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

    // ✅ Restore stock
    $product = Product::find($booking->product_id);
    $product->increment('stock', 1);
    $product->save();

    // ✅ Update booking status
    $booking->status = 'canceled';
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

    // ✅ Ensure stock is available
    if ($product->stock <= 0) {
        return response()->json([
            'success' => false,
            'message' => 'Product is out of stock! Please contact support.',
        ], 400);
    }

    // ✅ Store receipt in "storage/app/public/receipts"
    $path = $request->file('receipt')->store('receipts', 'public');

    // ✅ Deduct stock only on first receipt upload
    $product->decrement('stock', 1);
    $product->save();

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
        'total_price' => $validated['total_price'],
        'discounted_price' => $validated['discounted_price'] ?? $validated['total_price'],
        'voucher_fee' => $validated['voucher_fee'] ?? 0.00,
        'reference_number' => $referenceNumber,
        'status' => 'pending',
    ]);

    // ✅ Send Booking Confirmation Email
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
    $user = $booking->user;

    if ($booking->status !== "pending") {
        return response()->json(["message" => "Booking must be pending before approval."], 400);
    }

    // ✅ Approve booking
    $booking->status = "approved";
    $booking->save();

    // ✅ Correctly count approved bookings
    $user->total_bookings = Booking::where('user_id', $user->id)
                                   ->where('status', 'approved')
                                   ->count();

        // ✅ Ensure user has all milestone points
            $earnedPoints = floor($user->total_bookings / 3) * 100;
            $user->loyalty_points = $earnedPoints;
                    

    $user->save();

    return response()->json([
        "message" => "Booking approved successfully!",
        "total_bookings" => $user->total_bookings,
        "loyalty_points" => $user->loyalty_points
    ]);
}

public function index(Request $request)
{
    try {
        // ✅ Fetch all bookings with user and product names
        $bookings = Booking::with(['user:id,name', 'product:id,name'])->get();

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
