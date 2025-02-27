<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\Booking;
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

        return response()->json(['success' => true, 'booking' => $booking]);
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

    // ✅ Cancel a booking
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

    // ✅ Store a new booking
    public function store(Request $request)
    {
        // ✅ Validate input
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'added_price' => 'required|numeric',
            'total_price' => 'required|numeric',
        ]);

        // ✅ Ensure authenticated user
        if (!auth()->check()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        // ✅ Generate unique reference number
        $referenceNumber = strtoupper(substr(md5(uniqid()), 0, 10));

        // ✅ Create booking
        $booking = Booking::create([
            'user_id' => auth()->id(),
            'product_id' => $validated['product_id'],
            'start_date' => Carbon::parse($validated['start_date'])->format('Y-m-d'),
            'end_date' => Carbon::parse($validated['end_date'])->format('Y-m-d'),
            'added_price' => $validated['added_price'],
            'total_price' => $validated['total_price'],
            'reference_number' => $referenceNumber,
        ]);

        // ✅ Send Booking Confirmation Email
        try {
            Mail::to(auth()->user()->email)->send(new BookingConfirmationMail($booking));
        } catch (\Exception $e) {
            \Log::error('📧 Email Sending Failed:', ['message' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking confirmed! Email sent.',
            'booking' => $booking
        ]);
    }

    // ✅ Get all bookings
    public function index(Request $request)
    {
        try {
            $bookings = Booking::all();

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
