"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/router";



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
  const [submitting, setSubmitting] = useState(false);
  const [editReviewId, setEditReviewId] = useState(null);
const [editRating, setEditRating] = useState(5);
const [editComment, setEditComment] = useState("");

const toggleEditMode = (id) => {
  const review = reviews.find((r) => r.id === id);
  if (review) {
    setEditReviewId(id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  }
};


  const [user, setUser] = useState(null);

useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(res.data.user); // ✅ Safe and correct
      
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  fetchUser();
}, []);


  // 👇 At the top, inside the component
const [expandedReviews, setExpandedReviews] = useState({});
const [expandedReplies, setExpandedReplies] = useState({});

const toggleReviewExpand = (id) => {
  setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
};

const toggleReplyExpand = (id) => {
  setExpandedReplies((prev) => ({ ...prev, [id]: !prev[id] }));
};

const getTruncatedText = (text, limit = 10) => {
  if (!text) return ""; // ✅ Prevent error when null or undefined
  const words = text.split(" ");
  return words.length > limit ? words.slice(0, limit).join(" ") + "..." : text;
};

  const nextPage = () => {
      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
      if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const router = useRouter();

useEffect(() => {
  const bookingRefFromQuery = router.query.booking_ref;
  if (bookingRefFromQuery) {
    setSelectedBooking(bookingRefFromQuery);
  }
}, [router.query.booking_ref]);


  // ✅ Fetch Reviews
  
 // 👇 Place this ABOVE your `useEffect(() => { fetchReviews() }, [productId])`
const fetchReviews = async () => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${productId}`, {
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

const checkReviewEligibility = async () => {
  try {
      const token = localStorage.getItem("token");
      if (!token) {
          console.warn("⚠ No authentication token found. Skipping review eligibility check.");
          return;
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/bookings/check-review-eligibility/${productId}`;
      console.log("Checking review eligibility with API:", apiUrl);

      const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (response.status === 200 && response.data.success) {
        const unreviewed = response.data.unreviewed_bookings || [];
        setUnreviewedBookings(unreviewed);
      }
       else {
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

useEffect(() => {
  if (!productId) return;
  fetchReviews();
}, [productId]);

  useEffect(() => {
    if (!productId) {
        console.warn("⚠ Product ID is missing. Skipping review eligibility check.");
        return;
    }



    checkReviewEligibility();
}, [productId]);


  
const submitReview = async () => {
  if (!selectedBooking) {
    toast.error("Please select a booking to review.", {
      duration: 3000,
      position: "top-right",
    });
    return;
  }

  setSubmitting(true); // ⏳ Start loading

  try {
    const token = localStorage.getItem("token");

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/reviews`,
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
        toast.error(response.data.message, {
          duration: 3000,
          position: "top-right",
        });
      } else {
        await fetchReviews(); // ⬅ Refresh updated reviews from server
        await checkReviewEligibility(); // ⬅ Refresh unreviewed bookings list
        
        toast.success("Review submitted successfully!", {
          duration: 3000,
          position: "top-right",
        });
      }

      setUnreviewedBookings(unreviewedBookings.filter((ref) => ref !== selectedBooking));
      setSelectedBooking("");
      setComment("");
      setRating(5); // Reset rating
    }
  } catch (error) {
    console.error("Error posting review:", error);
    toast.error(error.response?.data?.message || "❌ An error occurred.", {
      duration: 3000,
      position: "top-right",
    });
  } finally {
    setSubmitting(false); // ✅ Stop loading
  }
};

const handleReviewUpdate = async (reviewId) => {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}`,
      {
        rating: editRating,
        comment: editComment,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.data.success) {
      toast.success("Review updated!");
      const updated = res.data.review;

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...updated, product: r.product, user: r.user }
            : r
        )
      );

      // ✅ Exit edit mode
      setEditReviewId(null);
    }
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to update review");
  }
};

  
  return (
    <div className="w-full flex justify-center">
      <div className="p-6 bg-white shadow-md rounded-lg w-full max-w-2xl">
    
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

      {unreviewedBookings.length === 0 ? (
        <div className="text-center text-gray-600">
        <p className="text-pink-500 font-semibold mb-2">
          ✨ No reviews to submit for this product. ✨
        </p>

          <p>Check out what others have said below.</p>
        </div>
      ) : (
        <>
         {router.query.booking_ref ? (
        <>
          <input
            type="text"
            value={`Booking Reference Number: ${router.query.booking_ref}`}
            disabled
            className="border p-2 rounded w-full bg-white text-pink-800"
          />
        </>
      ) : (
        <select
          className="border p-2 rounded w-full bg-white"
          value={selectedBooking}
          onChange={(e) => setSelectedBooking(e.target.value)}
        >
          <option value="">Select a Booking Reference</option>
          {unreviewedBookings.map((ref) => (
            <option key={ref} value={ref}>
              Booking {ref}
            </option>
          ))}
        </select>
      )}

            {/* ⭐ Star Rating Selector (Added Here) */}
            <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Rate Our Product:</h4>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((num) => (
                <Star
                  key={num}
                  size={30}
                  className={`cursor-pointer ${num <= rating ? "text-yellow-400" : "text-gray-300"}`}
                  onClick={() => setRating(num)}
                />
              ))}
            </div>
          </div>


          <textarea
            className="border rounded p-2 w-full mt-2"
            placeholder="Write your review..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>

          <button
            className={`bg-pink-500 text-white px-4 py-2 rounded mt-2 flex items-center justify-center gap-2 transition ${
              submitting ? "bg-gray-400 cursor-not-allowed" : "hover:bg-pink-600"
            }`}
            onClick={submitReview}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Submit Review"
            )}
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
          <p className="text-sm text-gray-500 mb-1">
            Product Size: {review.product?.sizes || "Unknown"}
          </p>
              {/* ⭐ Display Saved Rating */}
              <div className="flex text-yellow-500">
                {[...Array(Number(review.rating))].map((_, i) => (
                  <Star key={i} size={18} className="text-yellow-400" />
                ))}
              </div>
          
              <p className="text-gray-600">
            {expandedReviews[review.id]
              ? review.comment
              : getTruncatedText(review.comment)}
          </p>
          {review.comment && review.comment.split(" ").length > 10 && (
            <button
              onClick={() => toggleReviewExpand(review.id)}
              className="text-sm text-pink-500 hover:underline"
            >
              {expandedReviews[review.id] ? "See less" : "See more"}
            </button>
          )}

        {user && review.user_id === user.id && review.edit_count < 2 && (
        <div className="mt-1">
        <button
          onClick={() => toggleEditMode(review.id)}
          className="text-blue-500 text-sm hover:underline"
        >
          Edit Review ({2 - review.edit_count} left)
        </button>
      </div>
   
            
          )}

          {editReviewId === review.id && (
            <div className="mt-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Edit your review</h4>
              <div className="flex mb-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <Star
                    key={num}
                    size={24}
                    className={`cursor-pointer ${num <= editRating ? "text-yellow-400" : "text-gray-300"}`}
                    onClick={() => setEditRating(num)}
                  />
                ))}
              </div>
              <textarea
                className="border p-2 w-full rounded"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleReviewUpdate(review.id)}
                  className="bg-yellow-500 text-white px-4 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditReviewId(null)}
                  className="text-gray-500 text-sm underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}


          {review.admin_reply && (
            <div className="mt-2 p-3 bg-gray-100 rounded">
              <p className="text-sm text-gray-800">
                <strong className="text-blue-500">Admin Reply:</strong>{" "}
                {expandedReplies[review.id]
                  ? review.admin_reply
                  : getTruncatedText(review.admin_reply)}
              </p>
              {review.admin_reply && review.admin_reply.split(" ").length > 10 && (
                <button
                  onClick={() => toggleReplyExpand(review.id)}
                  className="text-sm text-blue-500 hover:underline mt-1"
                >
                  {expandedReplies[review.id] ? "See less" : "See more"}
                </button>
              )}
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
    </div>
  );
}
