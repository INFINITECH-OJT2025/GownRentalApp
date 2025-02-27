"use client";

import "../../../resources/css/styles/global.css";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Calendar from "react-calendar";
import { FaHeart, FaStar, FaCamera, FaTrash } from "react-icons/fa";
import "react-calendar/dist/Calendar.css";
import Head from "next/head";
import Link from "next/link";
import { useWishlist } from "../../context/WishlistContext";
import { useFavorites } from "../../context/FavoritesContext";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";

export default function ProductDetailPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [rentalDetails, setRentalDetails] = useState({});
  const [wishlistAdded, setWishlistAdded] = useState(false);
  const { wishlist, toggleWishlist, setWishlist } = useWishlist(); // ✅ Use Wishlist Context
  const { favorites, toggleFavorite, setFavorites } = useFavorites(); // ✅ Use Favorites Context
  const [bookingCount, updateBookingCount] = useState(0);
  const [isBooking, setIsBooking] = useState(false);
  const [detector, setDetector] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const setupCamera = async () => {
      if (!videoRef.current) return;
  
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.onloadedmetadata = () => {
                  videoRef.current.play();
                  setVideoLoaded(true); // ✅ Ensure video is loaded
              };
          }
      } catch (err) {
          console.error("🚨 Camera access denied:", err);
      }
  };
  

    const loadPoseDetection = async () => {
      await tf.ready();
      await tf.setBackend("webgl");
  
      const model = poseDetection.SupportedModels.MoveNet;
      const newDetector = await poseDetection.createDetector(model, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      });
  
      console.log("✅ Pose Detector Loaded");
      setDetector(newDetector);
  };  

    setupCamera();
    loadPoseDetection();
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    const handleLoadedData = () => {
      setVideoLoaded(true);
    };

    videoRef.current.addEventListener("loadeddata", handleLoadedData);
    return () => videoRef.current?.removeEventListener("loadeddata", handleLoadedData);
  }, []);


  useEffect(() => {
  if (!canvasRef.current || !videoRef.current || !detector || !videoLoaded) return;

  const ctx = canvasRef.current.getContext("2d");
  const gownImage = new Image();

  if (product?.image_url) {
    gownImage.src = product.image_url;
  }

  const adjustDressSize = async () => {
    if (!videoRef.current || !canvasRef.current || !detector || !videoLoaded) return;
  
    const ctx = canvasRef.current.getContext("2d");
    const gownImage = new Image();
  
    if (product?.image_url) {
      gownImage.src = product.image_url;
    }
  
    const video = videoRef.current;
    const { videoWidth, videoHeight } = video;
  
    if (videoWidth === 0 || videoHeight === 0) return; // Prevent zero-size textures
  
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  
    const poses = await detector.estimatePoses(video);
    if (poses.length === 0) return;
  
    const keypoints = poses[0].keypoints;
  
    // ✅ Extract key points
    const leftShoulder = keypoints.find(k => k.name === "left_shoulder");
    const rightShoulder = keypoints.find(k => k.name === "right_shoulder");
    const leftHip = keypoints.find(k => k.name === "left_hip");
    const rightHip = keypoints.find(k => k.name === "right_hip");
    const leftWaist = keypoints.find(k => k.name === "left_hip");  // Approximate waist
    const rightWaist = keypoints.find(k => k.name === "right_hip"); // Approximate waist
  
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftWaist || !rightWaist) return;
  
    // ✅ Calculate dynamic widths and height
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const waistWidth = Math.abs(rightWaist.x - leftWaist.x);
    const bodyHeight = Math.abs(rightHip.y - leftShoulder.y);
  
    // ✅ Adjust dress size using both shoulder & waist width
    const dressWidth = Math.max(shoulderWidth * 2.5, waistWidth * 3.0, videoWidth * 0.9);
    const dressHeight = bodyHeight * 1.8; // Extend dress height
  
    // ✅ Leave Space at the Top
    const centerX = videoWidth / 2; // Center horizontally
    const topSpace = videoHeight * 0.15; // 15% space from the top
    const yPos = topSpace; // Move dress down to fit properly
  
    // ✅ Draw the dynamically resized dress
    if (gownImage.complete) {
      ctx.drawImage(
        gownImage,
        centerX - dressWidth / 2, // Center horizontally
        yPos,
        dressWidth,
        dressHeight
      );
    }
  
    requestAnimationFrame(adjustDressSize); // ✅ Keep updating in real-time
  };
    
  

  adjustDressSize();
}, [product, detector, videoLoaded]);

const [isCameraOn, setIsCameraOn] = useState(false);

const startCamera = async () => {
  if (!videoRef.current) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        setIsCameraOn(true); // ✅ Mark camera as ON
        setVideoLoaded(true);
      };
    }
  } catch (err) {
    console.error("🚨 Camera access denied:", err);
    alert("⚠ Please allow camera access in your browser settings.");
  }
};

useEffect(() => {
  if (isCameraOn) {
    startCamera();
  }
}, [isCameraOn]);

  // ✅ Fetch product details by ID
  useEffect(() => {
    if (id) {
      axios
        .get(`http://127.0.0.1:8000/api/products/${id}`)
        .then((response) => {
          setProduct(response.data);
        })
        .catch((error) => {
          console.error("Error fetching product:", error);
        });
    }
  }, [id]);

 // ✅ Fetch user's favorite items
useEffect(() => {
  const fetchFavorites = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // ✅ Skip if user isn't logged in

      try {
          const response = await axios.get("http://127.0.0.1:8000/api/favorites", {
              headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.success) {
              setFavorites(response.data.data.map((item) => item.product_id)); // ✅ Now setFavorites is defined
          }
      } catch (error) {
          console.error("Error fetching favorites:", error);
      }
  };

  fetchFavorites();
}, [setFavorites]); // ✅ Include setFavorites as a dependency

// ✅ Fetch wishlist items
useEffect(() => {
  const fetchWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // ✅ Skip if not logged in

      try {
          const response = await axios.get("http://127.0.0.1:8000/api/wishlist", {
              headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.success) {
              setWishlist(response.data.data.map((item) => item.product_id)); // ✅ Now setWishlist is defined
          }
      } catch (error) {
          console.error("Error fetching wishlist:", error);
      }
  };

  fetchWishlist();
}, [setWishlist]); // ✅ Include setWishlist as a dependency


  // ✅ Add product to wishlist
  const addToWishlist = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠ You must be logged in to add items to your wishlist.");
      return;
    }

    if (wishlistAdded) {
      alert("✅ This item is already in your wishlist!");
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/wishlist",
        { product_id: productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setWishlistAdded(true);
        alert("✅ Product added to wishlist successfully!");
      } else {
        alert(response.data.message || "❌ Failed to add to wishlist.");
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setWishlistAdded(true);
        alert("✅ This item is already in your wishlist!");
      } else {
        console.error("Error adding to wishlist:", error);
        alert(error.response?.data?.message || "❌ An error occurred.");
      }
    }
  };

  

  // ✅ Add product to favorites
  const addToFavorites = async (productId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("⚠ You must be logged in to add favorites.");
      return;
    }

    // ✅ Check if already in favorites
    if (favorites.includes(productId)) {
      alert("✅ This item is already in your favorites.");
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/favorites",
        { product_id: productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setFavorites([...favorites, productId]); // ✅ Update UI dynamically
        alert("✅ Added to favorites successfully!");
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);

      if (error.response?.status === 409) {
        alert("⚠ This item is already in your favorites.");
        setFavorites([...favorites, productId]); // ✅ Ensure UI updates
      } else {
        alert(error.response?.data?.message || "❌ An error occurred.");
      }
    }
  };

  const calculatePrice = (productPrice, startDate, endDate) => {
    if (!startDate || !endDate) return { totalPrice: productPrice, addedPrice: 0 };
  
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
    let addedPrice = 0;
    if (diffDays >= 4 && diffDays <= 6) {
      addedPrice = 980.0;
    } else if (diffDays === 7) {
      addedPrice = 1000.0;
    } else if (diffDays > 7) {
      addedPrice = 1000.0 + (diffDays - 7) * 50;
    }
  
    return {
      totalPrice: productPrice + addedPrice,
      addedPrice: addedPrice,
    };
  };

  const handleDateChange = (type, value) => {
    setRentalDetails((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  
  useEffect(() => {
    if (rentalDetails.startDate && rentalDetails.endDate) {
      const { totalPrice, addedPrice } = calculatePrice(
        Number(product?.price),
        rentalDetails.startDate,
        rentalDetails.endDate
      );
      setRentalDetails((prev) => ({
        ...prev,
        totalPrice: totalPrice,
        addedPrice: addedPrice,
      }));
    }
  }, [rentalDetails.startDate, rentalDetails.endDate, product?.price]);
  
  const handleBooking = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("⚠ You must be logged in to book.");
        return;
    }

    if (!rentalDetails.startDate || !rentalDetails.endDate) {
        alert("⚠ Please select both a Start Date and an End Date before booking.");
        return;
    }

    const confirmBooking = window.confirm("✅ Booking Saved! Proceed to booking confirmation?");
    if (!confirmBooking) return;

    try {
        setIsBooking(true); // ✅ Start animation

        const response = await axios.post(
          "http://127.0.0.1:8000/api/bookings",
          {
              product_id: product.id,
              start_date: rentalDetails.startDate,
              end_date: rentalDetails.endDate,
              added_price: rentalDetails.addedPrice,
              total_price: rentalDetails.totalPrice,
          },
          {
              headers: { Authorization: `Bearer ${token}` },
          }
        );
        

        if (response.data.success) {
            const refNumber = response.data.booking.reference_number;

            // ✅ Update booking count in global state & localStorage
            updateBookingCount(bookingCount + 1);

            setTimeout(() => {
                setIsBooking(false); // ✅ Stop animation
                router.push(`/book?ref=${refNumber}`);
            }, 1500);
        } else {
            alert("❌ Failed to book. Please try again.");
            setIsBooking(false);
        }
    } catch (error) {
        console.error("Error booking:", error);
        alert(error.response?.data?.message || "❌ An error occurred.");
        setIsBooking(false);
    }
};

  
  useEffect(() => {
    if (id) {
        axios.get(`http://127.0.0.1:8000/api/products/${id}`)
            .then((response) => {
                if (response.data.success) {
                    setProduct(response.data.product);
                    setRentalDetails((prev) => ({
                        ...prev,
                        startDate: response.data.product.start_date,
                        endDate: response.data.product.end_date,
                    }));
                }
            })
            .catch((error) => {
                console.error("Error fetching product:", error);
            });
    }
}, [id]);

const isDateAvailable = (date) => {
  if (!product?.start_date || !product?.end_date) return false;

  const start = new Date(product.start_date);
  const end = new Date(product.end_date);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  return dateOnly >= startOnly && dateOnly <= endOnly; // ✅ Ensure correct date comparison
};


  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <AuthGuard>
      <Head>
        <title>{product.name} | Gown Rental</title>
      </Head>
  
      <div className="min-h-screen bg-gray-100 text-gray-800 font-poppins">
        <Navbar />
  
        {/* Product Details - Two Column Layout */}
        <div className="container mx-auto px-6 mt-20"> {/* Added more top margin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start"> {/* Increased gap */}
         {/* ✅ Try-On Feature - Centered */}
          {/* ✅ Try-On Feature - Centered */}
<div className="flex flex-col items-center justify-center w-full max-w-lg bg-white shadow-lg rounded-lg p-6 text-center mt-6">
  
  {/* ✅ Product Image - Centered */}
  <div className="flex justify-center mt-10"> {/* Adjusted spacing */}
    <img src={product.image_url} alt={product.name} className="w-full max-w-lg rounded-lg shadow-md" />
  </div>

  <h3 className="text-lg font-semibold mt-6">Try-On Feature</h3>

  {/* ✅ Camera & Overlay - Centered */}
  <div className="relative w-64 h-96 mx-auto mt-4 border border-gray-300 rounded-lg overflow-hidden">
    <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0" />
    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none" />
  </div>

  {/* ✅ Start Camera Button */}
  {!isCameraOn && (
    <button onClick={startCamera} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg">
      Start Camera
    </button>
  )}

  <p className="text-sm text-gray-500 mt-4">
    Stand in front of the camera to see the gown adjust to your body!
  </p>
</div>


            {/* Product Info & Calendar */}
            <div className="w-full flex flex-col gap-6">
              {/* Product Name, Price & Description */}
              <div className="space-y-4">
                <h1 className="text-4xl font-bold">{product.name}</h1>
                <p className="text-2xl font-semibold text-pink-600">₱{Number(product.price).toLocaleString()}</p>
                <p className="text-lg text-gray-600">{product.category}</p>
                <p className="text-lg text-gray-600">{product.description}</p>
              </div>
  
              <div className="flex space-x-4">
                  {/* Wishlist Button */}
                  <button onClick={() => toggleWishlist(product.id)}>
                    <FaHeart
                      className={`text-2xl transition ${
                        wishlist.includes(product.id) ? "text-red-600" : "text-gray-500 hover:text-red-500"
                      }`}
                    />
                  </button>

                  <button onClick={() => toggleFavorite(product.id)}>
                    <FaStar
                      className={`text-2xl transition ${
                        favorites.includes(product.id) ? "text-yellow-500" : "text-gray-500 hover:text-yellow-400"
                      }`}
                    />
                  </button>

                </div>

  
              {/* Rental Date Selection & Pricing */}
              <div className="bg-white shadow-lg rounded-lg p-6">
                 {/* Instructional Text */}
                  <p className="text-sm text-gray-600 text-center mb-4">
                  <strong>Rental Pricing:</strong> Base price applies for up to 3 days.
                    <br />
                    Additional ₱980 for rentals between 4-6 days.
                    <br />
                    7 days rental costs an extra ₱1,000.
                    <br />
                    For rentals longer than 7 days, an extra ₱50 is charged per additional day.
                  </p>
                <h3 className="text-lg font-semibold text-gray-800 text-center">Select Rental Dates</h3>
  
                {/* Start Date Selection */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Start Date (Pick-Up)</label>
                  <div className="flex justify-center">
                  <Calendar
                    value={rentalDetails.startDate ? new Date(rentalDetails.startDate) : null}
                    onChange={(date) => handleDateChange("startDate", date)}
                    className="w-full max-w-xs rounded-lg shadow-sm border-2 border-gray-300 p-2 mt-2"
                    tileDisabled={({ date }) => !isDateAvailable(date)}
                    tileClassName={({ date }) =>
                      isDateAvailable(date)
                        ? rentalDetails.startDate && new Date(rentalDetails.startDate).toDateString() === date.toDateString()
                          ? "react-calendar__tile--active" // ✅ Selected date styling
                          : "available-date" // ✅ Available date styling
                        : ""
                    }
                  />
                  </div>
                </div>
  
                {/* End Date Selection */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">End Date (Return Due)</label>
                  <div className="flex justify-center">
                  <Calendar
                      value={rentalDetails.endDate ? new Date(rentalDetails.endDate) : null}
                      onChange={(date) => handleDateChange("endDate", date)}
                      className="w-full max-w-xs rounded-lg shadow-sm border-2 border-gray-300 p-2 mt-2"
                      tileDisabled={({ date }) => !isDateAvailable(date)}
                      tileClassName={({ date }) =>
                        isDateAvailable(date)
                          ? rentalDetails.endDate && new Date(rentalDetails.endDate).toDateString() === date.toDateString()
                            ? "react-calendar__tile--active" // ✅ Selected date styling
                            : "available-date" // ✅ Available date styling
                          : ""
                      }
                    />
                  </div>
                </div>
  
                {/* Price Calculation */}
                <div className="mt-6 text-center">
                  <p className="text-sm font-semibold text-gray-700">
                    Added Rental Price: <span className="text-pink-600">₱{(Number(rentalDetails.addedPrice || 0).toFixed(2))}</span>
                  </p>
                  <p className="mt-2 text-xl font-semibold text-gray-800">
                    Final Total Price: <span className="text-pink-600">₱{(Number(rentalDetails.totalPrice || product?.price || 0).toFixed(2))}</span>
                  </p>
                </div>
  
                {/* Booking Button */}
                <button 
                  onClick={handleBooking}
                  className={`mt-6 w-full px-6 py-3 rounded-full transition ${
                      isBooking ? "bg-gray-400 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700"
                  } text-white`}
                  disabled={isBooking}
              >
                  {isBooking ? "Booking..." : "Book Now"}
              </button>
                
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-pink-600 text-white text-center py-6 mt-10">
                    <p>&copy; {new Date().getFullYear()} Gown Rental System. All Rights Reserved.</p>
                </footer>
      </div>
    </AuthGuard>
  );
  
}  