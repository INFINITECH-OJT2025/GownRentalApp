"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";

export default function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreviewedBookings, setUnreviewedBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 2; // Set number of reviews per page

  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const nextPage = () => {
      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
      if (currentPage > 1) setCurrentPage(currentPage - 1);
  };


  // ✅ Fetch Reviews
  
  useEffect(() => {
    if (!productId) return;

    const fetchReviews = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/reviews/${productId}`, {
          headers: { Accept: "application/json" },
        });

        if (response.status === 200 && response.data.success) {
          setReviews(response.data.reviews);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setError(error.response?.data?.message || "Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  useEffect(() => {
    if (!productId) {
        console.warn("⚠ Product ID is missing. Skipping review eligibility check.");
        return;
    }

    const checkReviewEligibility = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.warn("⚠ No authentication token found. Skipping review eligibility check.");
                return;
            }

            const apiUrl = `http://127.0.0.1:8000/api/bookings/check-review-eligibility/${productId}`;
            console.log("Checking review eligibility with API:", apiUrl);

            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            });

            if (response.status === 200 && response.data.success) {
                setUnreviewedBookings(response.data.unreviewed_bookings || []);
            } else {
                console.warn("⚠ Review eligibility check failed:", response.data.message);
                setUnreviewedBookings([]);
            }
        } catch (error) {
            console.error("❌ Error checking review eligibility:", error);

            if (!error.response) {
                alert("⚠ Network error! Please check your internet connection.");
            } else if (error.response.status === 404) {
                alert("⚠ No eligible bookings found for review.");
            } else {
                alert("⚠ Unable to check review eligibility. Please try again later.");
            }

            setUnreviewedBookings([]); // Prevent UI crash
        }
    };

    checkReviewEligibility();
}, [productId]);


  
  const submitReview = async () => {
    if (!selectedBooking) {
      alert("⚠ Select a booking to review.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://127.0.0.1:8000/api/reviews",
        { product_id: productId, booking_reference: selectedBooking, rating, comment },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        if (response.data.already_reviewed) {
          alert(response.data.message);
        } else {
          setReviews([...reviews, response.data.review]);
          alert("✅ Review submitted successfully!");
        }

        setUnreviewedBookings(unreviewedBookings.filter((ref) => ref !== selectedBooking));
        setSelectedBooking("");
        setComment("");
        setRating(5); // Reset rating after submitting
      }
    } catch (error) {
      console.error("Error posting review:", error);
      alert(error.response?.data?.message || "❌ An error occurred.");
    }
  };
  
  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

      {unreviewedBookings.length === 0 ? (
        <p className="text-red-500">⚠ No bookings available for review.</p>
      ) : (
        <>
          <select
            className="border p-2 rounded w-full"
            value={selectedBooking}
            onChange={(e) => setSelectedBooking(e.target.value)}
          >
            <option value="">Select a Booking Reference</option>
            {unreviewedBookings.map((ref) => (
              <option key={ref} value={ref}>Booking {ref}</option>
            ))}
          </select>


            {/* ⭐ Star Rating Selector (Added Here) */}
          <div className="flex mt-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <Star
                key={num}
                size={30}
                className={`cursor-pointer ${num <= rating ? "text-yellow-400" : "text-gray-300"}`}
                onClick={() => setRating(num)}
              />
            ))}
          </div>

          <textarea
            className="border rounded p-2 w-full mt-2"
            placeholder="Write your review..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>

          <button
            className="bg-pink-500 text-white px-4 py-2 rounded mt-2"
            onClick={submitReview}
          >
            Submit Review
          </button>
        </>
      )}

      <h3 className="text-lg font-semibold mt-6">Customer Reviews</h3>

      {loading ? (
        <p>Loading reviews...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : reviews.length === 0 ? (
        <p>No reviews yet. Be the first to review!</p>
      ) : (
        <>
          {currentReviews.map((review) => (
            <div key={review.id} className="border-b py-4">
              <p className="font-semibold">{review.user ? review.user.name : "Anonymous"}</p>
          
              {/* ⭐ Display Saved Rating */}
              <div className="flex text-yellow-500">
                {[...Array(Number(review.rating))].map((_, i) => (
                  <Star key={i} size={18} className="text-yellow-400" />
                ))}
              </div>
          
              <p className="text-gray-600">{review.comment}</p>
          
              {review.admin_reply && (
                <div className="mt-2 p-3 bg-gray-100 rounded">
                  <p className="text-sm text-gray-800">
                    <strong className="text-blue-500">Admin Reply:</strong> {review.admin_reply}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* ✅ Pagination Controls */}
          <div className="flex justify-between mt-4">
            <button 
              onClick={prevPage} 
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded transition-colors duration-200 ${
                currentPage === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-pink-500 text-white hover:bg-gray-600"
              }`}
            >
              Previous
            </button>

            <span className="text-lg font-semibold">
              Page {currentPage} of {totalPages}
            </span>

            <button 
              onClick={nextPage} 
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded transition-colors duration-200 ${
                currentPage === totalPages ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-pink-500 text-white hover:bg-gray-600"
              }`}
            >
              Next
            </button>
          </div>

        </>
      )}

    </div>
  );
}
