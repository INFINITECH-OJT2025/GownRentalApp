"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Navbar from "../components/Navbar";
import AuthGuard from "../components/AuthGuard";
import Head from "next/head";
import AdminPaymentDetails from "../components/AdminPaymentDetails";

export default function BookingPage() {
  const [isCanceled, setIsCanceled] = useState(false);
  const router = useRouter();
  const { ref } = router.query;
  const [booking, setBooking] = useState(null);
  const [gcashReceipt, setGcashReceipt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await axios.get("http://127.0.0.1:8000/api/user", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.user) {
                setUser(response.data.user);
            }
        } catch (error) {
            console.error("❌ Error fetching user details:", error);
        }
    };

    fetchUser();
}, []);


  useEffect(() => {
    if (!ref) {
      router.replace("/");
      return;
    }

    const fetchBooking = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("⚠ You must be logged in.");
        router.replace("/login");
        return;
      }
    
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/bookings/${ref}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
    
        if (response.data.success) {
          setBooking(response.data.booking);
          setFinalPrice(response.data.booking.total_price); // ✅ Update price with discount
          setPointsToUse(response.data.booking.voucher_fee || 0); // ✅ Fetch used voucher fee
        } else {
          alert("❌ Booking not found.");
          router.replace("/products");
        }
      } catch (error) {
        console.error("❌ Error fetching booking:", error);
        alert("❌ An error occurred while fetching the booking.");
        router.replace("/products");
      }
    };
    

    fetchBooking();
  }, [ref, router]);

  const handleFileChange = (event) => {
    setGcashReceipt(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!gcashReceipt) {
        alert("⚠ Please select a receipt image to upload.");
        return;
    }

    // ✅ Check file size before uploading (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (gcashReceipt.size > maxSize) {
        window.alert("⚠ File is too large! Please upload an image smaller than 2MB.");
        return;
    }

    if (!booking?.id) {
        alert("❌ Booking ID is missing!");
        return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("receipt", gcashReceipt);
    formData.append("booking_id", booking.id); // ✅ Ensure booking_id is included

    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            "http://127.0.0.1:8000/api/bookings/upload-receipt",
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        if (response.data.success) {
            alert("✅ Receipt uploaded successfully!");
      
            // ✅ Fetch user's loyalty points after receipt upload
            const userResponse = await axios.get("http://127.0.0.1:8000/api/user", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setLoyaltyPoints(userResponse.data.user.loyalty_points);
            setFinalPrice(booking.total_price);

            // ✅ Redirect to booking history after successful upload
            setTimeout(() => {
                router.push("/bookhistory");
            }, 1000);
        } else {
            alert(response.data.message || "❌ Failed to upload receipt.");
        }

    } catch (error) {
        console.error("Error uploading receipt:", error);

        if (error.response?.status === 422) {
            window.alert("⚠ Upload failed! Ensure your receipt is an image (jpg, png) and is within 2MB.");
            console.error("Validation Errors:", error.response.data.errors);
        } else {
            alert(error.response?.data?.message || "❌ An error occurred while uploading.");
        }
    } finally {
        setUploading(false);
    }
};


const handlePointsChange = (event) => {
  let value = parseInt(event.target.value, 10) || 0;

  if (value > user.loyalty_points) {
    alert("❌ You cannot use more points than you have!");
    value = user.loyalty_points;
  } else if (value < 0) {
    value = 0;
  }

  setPointsToUse(value);
  setFinalPrice(booking.total_price - value); // Deduct points from total price
};

const applyDiscount = async () => {
  if (pointsToUse <= 0) {
    alert("⚠ Please enter valid loyalty points to use.");
    return;
  }

  if (pointsToUse > user.loyalty_points) {
    alert("❌ You don’t have enough loyalty points!");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      "http://127.0.0.1:8000/api/bookings/apply-discount",
      {
        booking_id: booking.id,
        points_to_use: pointsToUse,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.success) {
      alert(`✅ Discount of ₱${pointsToUse} applied! New price: ₱${response.data.new_total_price}`);

      // ✅ Update UI (Deduct loyalty points properly)
      setFinalPrice(response.data.new_total_price);
      setUser((prevUser) => ({
        ...prevUser,
        loyalty_points: response.data.remaining_points, // ✅ Update user's points after deduction
      }));

      // ✅ Update `voucher_fee` in Booking
      setBooking((prevBooking) => ({
        ...prevBooking,
        voucher_fee: pointsToUse, // ✅ Save voucher fee in state
      }));

    } else {
      alert(response.data.message || "❌ Failed to apply discount.");
    }
  } catch (error) {
    console.error("❌ Error applying discount:", error);
    alert("❌ An error occurred while applying the discount.");
  }
};


  const handleCancelBooking = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `http://127.0.0.1:8000/api/bookings/${booking?.reference_number}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("✅ Booking canceled successfully!");
        setIsCanceled(true);
        router.push("/");
      } else {
        alert("❌ Failed to cancel booking. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error canceling booking:", error);
      alert("❌ An error occurred while canceling. Please try again.");
    }
  };

  if (!booking) return <div>Loading...</div>;

  return (
    <AuthGuard>
        <Head>
            <title>Booking Confirmation | Gown Rental</title>
        </Head>

        <div className="min-h-screen bg-pink-100 text-gray-800 font-poppins">
            <Navbar />
            <div className="container mx-auto px-6 mt-10 flex flex-col items-center">

           {/* Booking Confirmation */}
            <section className="bg-white shadow-xl rounded-2xl p-8 text-center w-full max-w-lg border-4 border-pink-400 shadow-pink-200 mt-16">
                <h1 className="text-4xl font-extrabold text-pink-700 tracking-wide">Booking Confirmation</h1>
                <p className="mt-5 text-lg text-gray-700 leading-relaxed">
                    {booking.status === "pending" ? (
                        "Your booking has been received and is pending payment verification."
                    ) : booking.status === "approved" ? (
                        "Your booking has been approved! You may now proceed with pickup."
                    ) : booking.status === "canceled" ? (
                        "Your booking has been canceled."
                    ) : (
                        "Your booking is being processed."
                    )}
                </p>
              {/* ✅ Message when user refreshes the page */}
              <p className="mt-3 text-gray-600">
                  NOTE: If you refreshed the page, your booking is already saved in your booking history. 
                  You can continue uploading the receipt there.
              </p>

              {/* ✅ Button to go to Booking History */}
              <button
                  onClick={() => router.push("/bookhistory")}
                  className="mt-4 px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition"
              >
                  📜 View Booking History
              </button>
            </section>

          {/* Booking Details */}
          <section className="bg-white shadow-lg rounded-lg p-6 text-center mt-6 w-full max-w-lg border-4 border-pink-300">
              <h2 className="text-2xl font-semibold text-pink-700">Booking Details</h2>
              <div className="mt-4 text-lg">
                  <p><strong>Reference Number:</strong> {booking.reference_number}</p>
                  <p><strong>Product:</strong> {booking.product.name}</p>
                  <p><strong>Start Date:</strong> {booking.start_date}</p>
                  <p><strong>End Date:</strong> {booking.end_date}</p>
                  <p><strong>Added Rental Price:</strong> <span className="text-pink-600">₱{Number(booking.added_price).toFixed(2)}</span></p>
                  <p><strong>Total Price:</strong> <span className="text-pink-600">₱{Number(booking.total_price).toFixed(2)}</span></p>
                  {booking.voucher_fee > 0 && (
                      <p><strong>Voucher Fee (Used Points):</strong> <span className="text-green-600">-₱{Number(booking.voucher_fee).toFixed(2)}</span></p>
                  )}
              </div>
          </section>

                {/* Loyalty Points Discount Section (Now Below Booking Details) */}
                  <div className="mt-6 p-4 border rounded-lg bg-pink-100">
                    <h3 className="text-xl font-semibold text-pink-900">Use Your Loyalty Points</h3>
                    <p className="text-gray-700">
                      You have <strong>{user.loyalty_points}</strong> loyalty points available.
                    </p>

                    {/* Input for Loyalty Points */}
                    <label className="block mt-4">Enter Points to Use:</label>
                    <input
                      type="number"
                      className="border p-2 rounded-md w-full mt-1"
                      value={pointsToUse}
                      onChange={handlePointsChange}
                    />

                    <p className="text-gray-700 mt-2">New Total Price: <strong>₱{finalPrice}</strong></p>

                    {/* Apply Discount Button */}
                    <button
                      onClick={applyDiscount}
                      className="mt-4 px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 w-full"
                    >
                      Apply Discount
                    </button>

                  </div>


                {/* GCash Payment + Upload Receipt + Cancel Booking */}
                <section className="bg-white shadow-lg rounded-lg p-6 text-center mt-6 w-full max-w-lg border-4 border-pink-300">
                    <AdminPaymentDetails />

                    

                    {/* Upload Receipt & Cancel Booking */}
                    <div className="mt-6 flex flex-col items-center gap-4">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="border-2 border-pink-400 rounded-md p-2 w-full md:w-1/2"/>
                        
                        <button onClick={handleUpload} className="px-6 py-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition" disabled={uploading}>
                            {uploading ? "Uploading..." : "Save Receipt"}
                        </button>
                        <button onClick={handleCancelBooking} className={`px-6 py-2 rounded-full transition ${isCanceled || booking?.status === "canceled" ? "bg-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`} disabled={isCanceled || booking?.status === "canceled"}>
                            {isCanceled || booking?.status === "canceled" ? "Canceled" : "Cancel Booking"}
                        </button>
                    </div>
                </section>

            </div>

            {/* Footer */}
            <footer className="bg-pink-600 text-white text-center py-6 mt-10">
                <p>&copy; {new Date().getFullYear()} Gown Rental System. All Rights Reserved.</p>
            </footer>
        </div>
    </AuthGuard>
);
}