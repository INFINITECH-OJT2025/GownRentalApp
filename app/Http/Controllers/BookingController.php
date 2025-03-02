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

class BookingController extends Controller
{
    // ✅ Get single booking details
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
                'product' => $booking->product,
                'start_date' => $booking->start_date,
                'end_date' => $booking->end_date,
                'added_price' => $booking->added_price,
                'total_price' => $booking->total_price,
                'voucher_fee' => $booking->voucher_fee, // ✅ Include voucher_fee
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
    
        // ✅ Deduct points from user
        $user->loyalty_points -= $validated['points_to_use'];
        $user->save();
    
        // ✅ Apply discount to total price
        $newTotalPrice = max(0, $booking->total_price - $validated['points_to_use']); // Ensure no negative price
        $booking->total_price = $newTotalPrice;
    
        // ✅ Save used points as `voucher_fee`
        $booking->voucher_fee = $validated['points_to_use']; 
        $booking->save();
    
        return response()->json([
            'success' => true,
            'message' => 'Discount applied successfully!',
            'new_total_price' => $booking->total_price,
            'remaining_points' => $user->loyalty_points,
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
    
        // ✅ Remove booked dates from availability
        $startDate = new \DateTime($booking->start_date);
        $endDate = new \DateTime($booking->end_date);
        while ($startDate <= $endDate) {
            $dateStr = $startDate->format('Y-m-d');
            $startDate->modify('+1 day');
        }
        $product->save();
    
        // ✅ Update booking status
        $booking->status = 'canceled';
        $booking->save();
    
        return response()->json(['success' => true, 'message' => 'Booking canceled successfully']);
    }

    
    

    // ✅ Upload receipt for a booking
    public function uploadReceipt(Request $request)
    {
        // ✅ Validate incoming request
        $validator = Validator::make($request->all(), [
            'booking_id' => 'required|exists:bookings,id',
            'receipt' => 'required|image|mimes:jpg,png,jpeg|max:2048', // 2MB limit
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // ✅ Store Image
        $path = $request->file('receipt')->store('receipts', 'public');

        // ✅ Update Booking Record
        $booking = Booking::find($request->booking_id);
        $booking->gcash_receipt = $path;
        $booking->save();

        return response()->json([
            'success' => true,
            'message' => 'Receipt uploaded successfully',
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
        'voucher_fee' => 'nullable|numeric|min:0', // ✅ Validate voucher_fee
    ]);

    if (!auth()->check()) {
        return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
    }

    // ✅ Convert dates to MySQL-compatible format (YYYY-MM-DD)
    $startDate = Carbon::parse($validated['start_date'])->format('Y-m-d');
    $endDate = Carbon::parse($validated['end_date'])->format('Y-m-d');

    $referenceNumber = strtoupper(substr(md5(uniqid()), 0, 10));

    // ✅ Create booking with `voucher_fee`
    $booking = Booking::create([
        'user_id' => auth()->id(),
        'product_id' => $validated['product_id'],
        'start_date' => $startDate,
        'end_date' => $endDate,
        'added_price' => $validated['added_price'],
        'total_price' => $validated['total_price'],
        'voucher_fee' => $validated['voucher_fee'] ?? 0.00, // ✅ Default to 0.00 if not provided
        'reference_number' => $referenceNumber,
        'status' => 'pending',
    ]);

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
            $earnedPoints = floor($user->total_bookings / 25) * 100;
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
