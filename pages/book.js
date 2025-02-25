"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Navbar from "../components/Navbar";
import AuthGuard from "../components/AuthGuard";
import Head from "next/head";

export default function BookingPage() {
  const [isCanceled, setIsCanceled] = useState(false);
  const router = useRouter();
  const { ref } = router.query;
  const [booking, setBooking] = useState(null);
  const [gcashReceipt, setGcashReceipt] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [gcashDetails] = useState({
    qrCode: "/images/gcash_qr.jpg",
    gcashNumber: "0912-345-6789",
    contactEmail: "admin@gownrental.com",
    contactPhone: "+63 917 123 4567",
  });

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
            router.push("/bookhistory"); // ✅ Redirect to booking history
        } else {
            alert(response.data.message || "❌ Failed to upload receipt.");
        }
    } catch (error) {
        console.error("Error uploading receipt:", error);

        if (error.response?.status === 422) {
            // ✅ Show a prompt instead of a runtime error
            window.alert("⚠ Upload failed! Ensure your receipt is an image (jpg, png) and is within 2MB.");
            console.error("Validation Errors:", error.response.data.errors); // ✅ Log errors
        } else {
            alert(error.response?.data?.message || "❌ An error occurred while uploading.");
        }
    } finally {
        setUploading(false);
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

      <div className="min-h-screen bg-gray-100 text-gray-800 font-poppins">
        <Navbar />
        <div className="container mx-auto px-6 mt-10 flex flex-col items-center">

          {/* Booking Confirmation */}
          <section className="bg-white shadow-lg rounded-lg p-6 text-center w-full max-w-lg">
            <h1 className="text-3xl font-bold text-gray-800">Booking Confirmation</h1>
            <p className="mt-4 text-gray-600">
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
          </section>

          {/* Booking Details (Centered) */}
          <section className="bg-white shadow-lg rounded-lg p-6 text-center mt-6 w-full max-w-lg">
            <h2 className="text-2xl font-semibold text-gray-800">Booking Details</h2>
            <div className="mt-4 text-lg">
              <p><strong>Reference Number:</strong> {booking.reference_number}</p>
              <p><strong>Product:</strong> {booking.product.name}</p>
              <p><strong>Start Date:</strong> {booking.start_date}</p>
              <p><strong>End Date:</strong> {booking.end_date}</p>
              <p><strong>Added Rental Price:</strong> ₱{Number(booking.added_price).toFixed(2)}</p>
              <p><strong>Total Price:</strong> ₱{Number(booking.total_price).toFixed(2)}</p>
            </div>
          </section>

          {/* GCash Payment + Upload Receipt + Cancel Booking */}
          <section className="bg-white shadow-lg rounded-lg p-6 text-center mt-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold text-gray-800">GCash Payment</h2>
            <p className="text-gray-600">Please send your payment to the details below:</p>

            {/* GCash QR Code & Details */}
            <div className="flex flex-col items-center mt-4">
              <div className="w-48 h-48 flex items-center justify-center bg-white rounded-lg shadow-md p-2 border border-gray-300">
                <img src={gcashDetails.qrCode} alt="GCash QR Code" className="w-full h-full object-contain rounded-md" />
              </div>

              <div className="mt-4 text-lg text-gray-800 text-center">
                <p><strong>GCash Number:</strong> <span className="text-pink-600">{gcashDetails.gcashNumber}</span></p>
                <p><strong>Email:</strong> <span className="text-pink-600">{gcashDetails.contactEmail}</span></p>
                <p><strong>Contact:</strong> <span className="text-pink-600">{gcashDetails.contactPhone}</span></p>
              </div>
            </div>

            {/* Upload Receipt & Cancel Booking */}
            <div className="mt-6 flex flex-col items-center gap-4">
              <input type="file" accept="image/*" onChange={handleFileChange} className="border-2 border-gray-300 rounded-md p-2 w-full md:w-1/2"/>
              <button onClick={handleUpload} className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Receipt"}
              </button>
              <button onClick={handleCancelBooking} className={`px-6 py-2 rounded-full transition ${isCanceled || booking?.status === "canceled" ? "bg-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`} disabled={isCanceled || booking?.status === "canceled"}>
                {isCanceled || booking?.status === "canceled" ? "Canceled" : "Cancel Booking"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </AuthGuard>
  );
}
