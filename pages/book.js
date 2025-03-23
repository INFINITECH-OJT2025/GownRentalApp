"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Navbar from "../components/Navbar";
import AuthGuard from "../components/AuthGuard";
import Head from "next/head";
import AdminPaymentDetails from "../components/AdminPaymentDetails";
import { toast } from "react-hot-toast";

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
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  
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
            } else {
                setUser({ loyalty_points: 0 }); // ✅ Set default if user data is missing
            }
        } catch (error) {
            console.error("❌ Error fetching user details:", error);
            setUser({ loyalty_points: 0 }); // ✅ Prevent `null` errors
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
          const bookingData = response.data.booking;
          console.log("📡 Debug Booking Data:", bookingData); // ✅ Log API response
    
          setBooking({
            ...bookingData,
            start_date: bookingData.start_date ? bookingData.start_date : "N/A",
            end_date: bookingData.end_date ? bookingData.end_date : "N/A",
          });
    
          // ✅ Set `finalPrice` correctly on page load
          const totalAmount = (Number(bookingData.discounted_price) || Number(bookingData.total_price) || 0) +
                              (Number(bookingData.added_price) || 0) -
                              (Number(bookingData.voucher_fee) || 0); // ✅ Deduct already applied voucher
    
          setFinalPrice(Math.max(0, totalAmount)); // Ensure it doesn't go negative
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
    const file = event.target.files[0];
    if (!file) return;

    // ✅ Allowed file types (NO .webp)
    const allowedExtensions = ["jpg", "jpeg", "png"];
    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
        alert("⚠ Invalid file type! Please upload a JPG, JPEG, or PNG image.");
        return;
    }

    // ✅ Check file size (Max: 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
        alert("⚠ File is too large! Please upload an image smaller than 2MB.");
        return;
    }

    setGcashReceipt(file);
};


const handleUpload = async () => {
  if (!gcashReceipt) {
      alert("⚠ Please select a receipt image to upload.");
      return;
  }

  // ✅ Validate file type & size
  const allowedExtensions = ["jpg", "jpeg", "png"];
  const fileExtension = gcashReceipt.name.split(".").pop().toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
      alert("⚠ Invalid file type! Please upload a JPG, JPEG, or PNG image.");
      return;
  }
  if (gcashReceipt.size > 2 * 1024 * 1024) {
      alert("⚠ File is too large! Please upload an image smaller than 2MB.");
      return;
  }

  if (!booking?.id) {
      alert("❌ Booking ID is missing!");
      return;
  }

  setUploading(true);
  const formData = new FormData();
  formData.append("receipt", gcashReceipt);
  formData.append("booking_id", booking.id); 

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
        toast.success("Receipt uploaded successfully! Redirecting to booking history...", { position: "top-right" });
        setTimeout(() => {
            router.push("/bookhistory");
        }, 1500);
    } else {
        toast.error(response.data.message || "Failed to upload receipt.", { position: "top-right" });
    }
    
  } catch (error) {
      console.error("❌ Error uploading receipt:", error);

      if (error.response) {
          console.error("⚠ Backend Response:", error.response.data);

          if (error.response.status === 422) {
              alert("⚠ Upload failed! Ensure the receipt is a valid JPG, JPEG, or PNG image.");
              console.error("Validation Errors:", error.response.data.errors);
          } else {
              alert(`❌ Server Error: ${error.response.data.message || "Unexpected error occurred."}`);
          }
      } else {
          alert("❌ Network Error! Please check your internet connection.");
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

  // ✅ Ensure added rental price & discounts are included correctly
  const basePrice = (Number(booking?.discounted_price) || Number(booking?.total_price) || 0) +
                    (Number(booking?.added_price) || 0) -
                    (Number(booking?.voucher_fee) || 0); // ✅ Deduct already applied voucher

  const newPrice = Math.max(0, basePrice - value);

  setFinalPrice(Number(newPrice.toFixed(2))); // ✅ Ensure proper number format
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
      toast.success(`Discount of ₱${pointsToUse} applied! New price: ₱${response.data.new_total_price}`, { position: "top-right" });

      // ✅ Deduct points properly
      setUser((prevUser) => ({
        ...prevUser,
        loyalty_points: prevUser.loyalty_points - pointsToUse, // ✅ Deduct points correctly
      }));

      // ✅ Update `voucher_fee` in Booking
      setBooking((prevBooking) => ({
        ...prevBooking,
        voucher_fee: pointsToUse, // ✅ Save voucher fee in state
      }));

      // ✅ Update final price correctly
      setFinalPrice(response.data.new_total_price);
    } else {
      toast.error(response.data.message || "Failed to apply discount.", { position: "top-right" });

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
        toast.success("Booking canceled successfully!", { position: "top-right" });

        setIsCanceled(true);
        router.push("/");
      } else {
        toast.error("Failed to cancel booking. Please try again.", { position: "top-right" });

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
              <p className="text-red-600 font-semibold mt-3"> 
              ⚠ NOTE: If you refreshed the page, your booking is already saved in your booking history. 
                  You can continue uploading the payment receipt there.
              </p>

              {/* ✅ Button to go to Booking History */}
              <button
              onClick={() => {
                setLoadingHistory(true);
                toast.success("Redirecting to booking history...", { position: "top-right" });
                router.push("/bookhistory");
            }}            
                className={`mt-4 px-6 py-2 rounded-md transition ${loadingHistory ? "bg-gray-500 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700 text-white"}`}
                disabled={loadingHistory}
            >
                {loadingHistory ? "Loading..." : "📜 View Booking History"}
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
                  <p><strong>Selected Size:</strong> 
                  {booking.sizes 
                    ? <span className="text-pink-700"> {booking.sizes}</span>
                    : <span className="text-red-500"> No size selected</span>}
                </p>
                  {/* ✅ Show Discounted Price from Bookings Table */}
                  <p><strong>Original Price:</strong> 
                  <span className="text-red-500">
                      ₱{booking?.product?.price ? Number(booking.product.price).toFixed(2) : "0.00"}
                  </span>
              </p>
              <p><strong>Discounted Price:</strong> 
                  <span className="text-green-600">
                      ₱{booking?.product?.discounted_price ? Number(booking.product.discounted_price).toFixed(2) : "0.00"}
                  </span>
              </p>

                  <p><strong>Added Rental Price:</strong> <span className="text-pink-600">₱{Number(booking.added_price).toFixed(2)}</span></p>

                  <p><strong>Final Price:</strong> 
                    <span  className="ml-1 bg-pink-200 text-pink-700 px-2 py-1 rounded-md">
                        ₱{!finalPrice || isNaN(finalPrice) ? "0.00" : Number(finalPrice).toFixed(2)}
                    </span>
                  </p>
              </div>
          </section>



                {/* Loyalty Points Discount Section */}
          <div className="mt-6 p-4 border rounded-lg bg-pink-100">
              <h3 className="text-xl font-semibold text-pink-900">Use Your Loyalty Points</h3>
              
              {user ? ( // ✅ Check if user exists before accessing loyalty_points
                  <>
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

                        <p className="text-gray-700 mt-2">
                          New Total Price: <strong>₱{finalPrice.toFixed(2)}</strong>
                        </p>


                      {/* Apply Discount Button */}
                      <button
                        onClick={async () => {
                            setLoadingDiscount(true);
                            await applyDiscount();
                            setLoadingDiscount(false);
                        }}
                        className={`mt-4 px-6 py-2 rounded-md w-full transition ${loadingDiscount ? "bg-gray-500 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700 text-white"}`}
                        disabled={loadingDiscount}
                    >
                        {loadingDiscount ? "Applying..." : "Apply Discount"}
                    </button>


                  </>
              ) : (
                  <p className="text-gray-600">Loading your loyalty points...</p>
              )}
          </div>

                {/* GCash Payment + Upload Receipt + Cancel Booking */}
                <section className="bg-white shadow-lg rounded-lg p-6 text-center mt-6 w-full max-w-lg border-4 border-pink-300">
                    <AdminPaymentDetails />

                    {/* NOTE: Please upload your payment receipt here. If you do not upload a receipt, your booking will not be approved by the admin. */}
                    <p className="text-red-600 font-semibold mt-3">
                        ⚠ NOTE: Please upload your payment receipt here. If you do not upload a receipt, your booking will not be approved by the admin.
                    </p>

                    {/* Upload Receipt & Cancel Booking */}
                    <div className="mt-6 flex flex-col items-center gap-4">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="border-2 border-pink-400 rounded-md p-2 w-full md:w-1/2"/>
                        
                        <button
                        onClick={async () => {
                            setLoadingUpload(true);
                            await handleUpload();
                            setLoadingUpload(false);
                        }}
                        className={`px-6 py-2 rounded-full transition ${loadingUpload ? "bg-gray-500 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700 text-white"}`}
                        disabled={loadingUpload}
                    >
                        {loadingUpload ? "Uploading..." : "Save Receipt"}
                    </button>

                    <button
                        onClick={async () => {
                            setLoadingCancel(true);
                            await handleCancelBooking();
                            setLoadingCancel(false);
                        }}
                        className={`px-6 py-2 rounded-full transition ${loadingCancel || isCanceled || booking?.status === "canceled" ? "bg-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`}
                        disabled={loadingCancel || isCanceled || booking?.status === "canceled"}
                    >
                        {loadingCancel ? "Canceling..." : isCanceled || booking?.status === "canceled" ? "Canceled" : "Cancel Booking"}
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