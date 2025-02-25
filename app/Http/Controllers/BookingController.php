<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\Booking;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{

    public function show($referenceNumber)
    {
        $booking = Booking::with('product')->where('reference_number', $referenceNumber)->first();
    
        if (!$booking) {
            return response()->json(['success' => false, 'message' => 'Booking not found'], 404);
        }
    
        return response()->json(['success' => true, 'booking' => $booking]);
    }

    public function userBookings(Request $request) {
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
    
        // ✅ Prevent re-canceling
        if ($booking->status === 'canceled') {
            return response()->json(['success' => false, 'message' => 'Booking is already canceled'], 400);
        }
    
        // ✅ Update status to "canceled"
        $booking->status = 'canceled';
        $booking->save();
    
        return response()->json([
            'success' => true, 
            'message' => 'Booking canceled successfully',
            'status' => 'canceled'
        ]);
    }
    
    public function uploadReceipt(Request $request)
    {
        // ✅ Debugging: Return request data
        if (!$request->hasFile('receipt')) {
            return response()->json(['success' => false, 'message' => 'No receipt uploaded'], 422);
        }
    
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'receipt' => 'required|image|mimes:jpg,png,jpeg|max:2048', // ✅ Validate image
        ]);
    
        // ✅ Store Image in `storage/app/public/receipts`
        $path = $request->file('receipt')->store('receipts', 'public');
    
        // ✅ Find the booking and update receipt path
        $booking = Booking::find($validated['booking_id']);
        if (!$booking) {
            return response()->json(['success' => false, 'message' => 'Booking not found'], 404);
        }
    
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
    $request->validate([
        'product_id' => 'required|exists:products,id',
        'start_date' => 'required|date',
        'end_date' => 'required|date|after:start_date',
        'added_price' => 'required|numeric',
        'total_price' => 'required|numeric',
    ]);

    $referenceNumber = strtoupper(substr(md5(uniqid()), 0, 10)); // ✅ Generate unique reference number

    $booking = Booking::create([
        'user_id' => auth()->id(),
        'product_id' => $request->product_id,
        'start_date' => Carbon::parse($request->start_date)->format('Y-m-d'),
        'end_date' => Carbon::parse($request->end_date)->format('Y-m-d'),
        'added_price' => $request->added_price,
        'total_price' => $request->total_price,
        'reference_number' => $referenceNumber, // ✅ Store reference number
    ]);

    return response()->json(['success' => true, 'booking' => $booking]);
}



}
