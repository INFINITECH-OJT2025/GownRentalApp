<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Product;
use App\Models\User;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function getReviews($productId)
{
    if (!\App\Models\Product::find($productId)) {
        return response()->json(['success' => false, 'message' => 'Product not found'], 404);
    }

    $reviews = Review::where('product_id', $productId)
        ->with(['user:id,name'])
        ->select('id', 'product_id', 'user_id', 'rating', 'comment', 'admin_reply', 'created_at', 'edit_count')
        ->get();

    if ($reviews->isEmpty()) {
        return response()->json(['success' => false, 'message' => 'No reviews found'], 200);
    }

    return response()->json(['success' => true, 'reviews' => $reviews], 200);
}

public function createReview(Request $request)
{
    try {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'booking_reference' => 'required|exists:bookings,reference_number', // ✅ Ensure reference number is used
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:5000',
        ]);

        $userId = Auth::id();
        $productId = $request->product_id;
        $bookingReference = $request->booking_reference;

        // ✅ Find the actual booking
        $booking = Booking::where('reference_number', $bookingReference)
            ->where('user_id', $userId)
            ->where('product_id', $productId)
            ->where('status', 'returned')
            ->first();

        if (!$booking) {
            return response()->json(['success' => false, 'message' => 'Invalid booking reference or booking not returned.'], 403);
        }

        // ✅ Check if the booking has already been reviewed
        $existingReview = Review::where('booking_id', $booking->id)
            ->where('user_id', $userId)
            ->exists();

        if ($existingReview) {
            return response()->json([
                'success' => true, // ✅ Instead of error, return success
                'already_reviewed' => true,
                'message' => "You have already reviewed this booking ($bookingReference)."
            ], 200);
        }

        // ✅ Create the review for the specific booking
        $review = Review::create([
            'product_id' => $productId,
            'user_id' => $userId,
            'booking_id' => $booking->id,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        return response()->json([
            'success' => true,
            'already_reviewed' => false,
            'review' => $review
        ], 201);

    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
}

public function update(Request $request, $id)
{
    $review = Review::findOrFail($id);

    if (auth()->id() !== $review->user_id) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    if ($review->edit_count >= 2) {
        return response()->json(['message' => 'You can only edit a review 2 times.'], 403);
    }

    $review->update([
        'rating' => $request->rating,
        'comment' => $request->comment,
        'edit_count' => $review->edit_count + 1,
    ]);

    return response()->json(['success' => true, 'message' => 'Review updated successfully', 'review' => $review]);
}


public function getAllReviews()
{
    $reviews = Review::with([
        'user:id,name', 
        'product:id,name', 
        'booking' // no field restriction
    ])
    ->select('id', 'product_id', 'user_id', 'booking_id', 'rating', 'comment', 'admin_reply', 'created_at', 'edit_count')
    ->orderBy('created_at', 'desc')
    ->get();

    return response()->json(['success' => true, 'reviews' => $reviews]);
}



public function replyToReview(Request $request, $id)
{
    $request->validate([
        'reply' => 'required|string|max:5000',
    ]);

    $review = Review::find($id);

    if (!$review) {
        return response()->json(['success' => false, 'message' => 'Review not found'], 404);
    }

    $review->update(['admin_reply' => $request->reply]);

    return response()->json(['success' => true, 'message' => 'Reply added successfully']);
}

    

}
