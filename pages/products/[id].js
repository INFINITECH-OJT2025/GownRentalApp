"use client";

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
import ReviewSection from "../../components/ReviewSection";
import ChatWidget from "../../components/ChatWidget"; 
import { toast, Toaster } from "react-hot-toast";

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
  const [receiptImage, setReceiptImage] = useState(null);
  const chestWidthHistoryRef = useRef([]); // ✅ Store history in ref
  const maxHistorySize = 10; // 🔥 Adjust the smoothing window size


  useEffect(() => {
    const setupCamera = async () => {
      if (!videoRef.current) return;
  
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setVideoLoaded(true); // ✅ Now video is fully loaded before detection starts
          };
        }
      } catch (err) {
        console.error("🚨 Camera access denied:", err);
      }
    };


 const loadPoseDetection = async () => {
    try {
        await tf.ready();
        await tf.setBackend("webgl");

        const model = poseDetection.SupportedModels.MoveNet;
        const newDetector = await poseDetection.createDetector(model, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        });

        console.log("✅ Pose Detector Loaded");
        setDetector(newDetector);
    } catch (error) {
        console.error("❌ Pose Detection Model Failed to Load:", error);
        alert("⚠ Unable to load pose detection. Please check your internet connection or try again later.");
    }
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

  const handleCapture = () => {
    if (!videoRef.current) return;
  
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  
    // ✅ Draw only the camera feed (No external image to avoid CORS issues)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
    try {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/jpeg"); // ✅ No CORS error because it's only the video feed
      link.download = "camera-screenshot.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      alert("✅ Screenshot saved successfully!");
    } catch (error) {
      console.error("❌ Screenshot failed:", error);
      alert("⚠ Unable to capture screenshot. Try again.");
    }
  };
        
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };
  
  useEffect(() => {
  if (!canvasRef.current || !videoRef.current || !detector || !videoLoaded) return;

  const ctx = canvasRef.current.getContext("2d");
  const gownImage = new Image();

  if (product?.image_url) {
    gownImage.src = product.image_url;
  }

  const adjustDressSize = async () => {
    if (!videoRef.current || !canvasRef.current || !detector) return;
  
    const ctx = canvasRef.current.getContext("2d");
    const video = videoRef.current;
  
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("🚨 Skipping pose detection: Video not fully loaded.");
      requestAnimationFrame(adjustDressSize);
      return;
    }
  
    const { videoWidth, videoHeight } = video;
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  
    const gownImage = new Image();
    gownImage.src = product?.image_url;
  
    // **🔥 Default Dress Size Before Detection**
    let dressWidth = videoWidth * 0.6;
    const dressHeight = videoHeight * 1.2;
    let xOffset = (videoWidth - dressWidth) / 2;
    let yOffset = (videoHeight - dressHeight) * 0.6; // 🔥 Keep at shoulder level
  
    gownImage.onload = () => {
      ctx.drawImage(gownImage, xOffset, yOffset, dressWidth, dressHeight);
    };
  
    try {
      const poses = await detector.estimatePoses(video, { flipHorizontal: false });
  
      if (poses.length === 0) {
        console.warn("⚠ No person detected. Dress stays centered.");
        requestAnimationFrame(adjustDressSize);
        return;
      }
  
      const keypoints = poses[0].keypoints;
      const leftShoulder = keypoints.find(k => k.name === "left_shoulder");
      const rightShoulder = keypoints.find(k => k.name === "right_shoulder");
      const leftHip = keypoints.find(k => k.name === "left_hip");
  
      if (!leftShoulder || !rightShoulder || !leftHip) {
        console.warn("⚠ Missing key points! Keeping dress at default.");
        requestAnimationFrame(adjustDressSize);
        return;
      }
  
      // ✅ **Get Chest Width (Shoulder Distance)**
      const chestWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  
      // 🔥 **Increase Shoulder Width Scaling Factor**
      const shoulderWidthScale = 12
      dressWidth = chestWidth * shoulderWidthScale;
  
      // ✅ **Position Dress at Shoulder Level**
     // ✅ Move the dress slightly to the right
    xOffset = (leftShoulder.x + rightShoulder.x) / 2 - dressWidth / 2 + 10; // 🔥 Increase `+10` for right shift

      yOffset = leftShoulder.y - (dressHeight * 0.01);
  
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(gownImage, xOffset, yOffset, dressWidth, dressHeight);
  
      requestAnimationFrame(adjustDressSize);
    } catch (error) {
      console.error("❌ Pose detection error:", error);
      requestAnimationFrame(adjustDressSize);
    }
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

useEffect(() => {
  const fetchProduct = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error("❌ Error fetching product:", error);

      // ✅ Handle network errors and 404 gracefully
      if (!error.response) {
        alert("⚠ Network Error! Please check your internet connection and refresh the page.");
      } else if (error.response.status === 404) {
        alert("⚠ Product is loading");
      } else {
        alert("⚠ Unable to fetch product details. Please try again later.");
      }

      setProduct(null); // ✅ Prevent UI from breaking
    }
  };

  if (id) {
    fetchProduct();
  }
}, [id]);



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

      // ✅ Handle Network Errors
      if (!error.response) {
        alert("⚠ Network error! Unable to fetch favorites. Please check your connection.");
      } else {
        alert(`⚠ Error: ${error.response?.data?.message || "Something went wrong."}`);
      }
    }
  };

  fetchFavorites();
}, [setFavorites]);


useEffect(() => {
  const fetchWishlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // ✅ Skip if not logged in

    try {
      const response = await axios.get("http://127.0.0.1:8000/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setWishlist(response.data.data.map((item) => item.product_id)); // ✅ Now setWishlist is defined
      }
    } catch (error) {
      console.error("❌ Error fetching wishlist:", error);

      // ✅ Show alert instead of causing a runtime error
      alert("⚠ Unable to load wishlist. Please check your internet connection and try again.");

      // ✅ Set a default safe value
      setWishlist([]);
    }
  };

  fetchWishlist().catch(err => console.error("❌ Unhandled fetchWishlist error:", err)); // ✅ Ensure no unhandled rejections
}, [setWishlist]);


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

  const calculatePrice = (productPrice, discountedPrice, startDate, endDate) => {
    if (!startDate || !endDate) return { totalPrice: discountedPrice || productPrice, addedPrice: 0 };

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

    // ✅ Use discounted price if available, otherwise use regular price
    const basePrice = discountedPrice || productPrice;

    return {
        totalPrice: basePrice + addedPrice, // ✅ Ensure addedPrice is included
        addedPrice: addedPrice,
    };
};


  const handleDateChange = (type, value) => {
    setRentalDetails((prev) => {
      if (type === "startDate") {
        // ✅ Reset endDate if it's before new startDate
        return {
          ...prev,
          startDate: value,
          endDate: prev.endDate && new Date(prev.endDate) < new Date(value) ? null : prev.endDate,
        };
      }
      
      if (type === "endDate") {
        // ✅ Ensure endDate is after startDate
        if (!prev.startDate || new Date(value) < new Date(prev.startDate)) {
          alert("⚠ End Date must be after Start Date!");
          return prev;
        }
        return { ...prev, endDate: value };
      }
  
      return prev;
    });
  };
  
  
  useEffect(() => {
    if (rentalDetails.startDate && rentalDetails.endDate && product) {
        const { totalPrice, addedPrice } = calculatePrice(
            Number(product?.price),
            Number(product?.discounted_price), // ✅ Use discounted price if available
            rentalDetails.startDate,
            rentalDetails.endDate
        );

        setRentalDetails((prev) => ({
            ...prev,
            totalPrice: totalPrice + addedPrice, // ✅ Ensure addedPrice is added to total price
            addedPrice: addedPrice, // ✅ Ensure addedPrice updates properly
        }));
    }
}, [rentalDetails.startDate, rentalDetails.endDate, product]);

const handleBooking = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    toast.error("⚠ You must be logged in to book.");
    return;
  }

  if (!rentalDetails.startDate || !rentalDetails.endDate) {
    toast.error("⚠ Please select both a Start Date and an End Date before booking.");
    return;
  }

  const confirmBooking = window.confirm("✅ Booking saved! Waiting for approval.");
  if (!confirmBooking) return;

  try {
    setIsBooking(true);

    const formattedStartDate = new Date(rentalDetails.startDate).toISOString().split("T")[0];
    const formattedEndDate = new Date(rentalDetails.endDate).toISOString().split("T")[0];

    const response = await axios.post(
      "http://127.0.0.1:8000/api/bookings",
      {
        product_id: product.id,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        added_price: rentalDetails.addedPrice,
        total_price: rentalDetails.totalPrice,
        discounted_price: product.discounted_price, // ✅ Send discounted price
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );


    if (response.data.success) {
      const refNumber = response.data.booking.reference_number;

      // ✅ Emit Storage Event for Real-Time Navbar Update
      localStorage.setItem("bookingUpdated", Date.now());
      window.dispatchEvent(new Event("storage"));

      toast.success("Booking successful! Redirecting...");

      setTimeout(() => {
        setIsBooking(false);
        router.push(`/book?ref=${refNumber}`);
      }, 1500);
    } else {
      toast.error("❌ Failed to book. Please try again.");
      setIsBooking(false);
    }
  } catch (error) {
    console.error("Error booking:", error);
    toast.dismiss();
    toast.error(error.response?.data?.message || "❌ An error occurred.");
    setIsBooking(false);
  }
};

useEffect(() => {
  if (id) {
      axios.get(`http://127.0.0.1:8000/api/products/${id}`)
          .then((response) => {
              console.log("📡 API Response:", response.data); // ✅ Debug API Response
              
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
              console.error("❌ Error fetching product:", error);
          });
  }
}, [id]);


const isDateAvailable = (date, isStartDate = true) => {
  if (!product?.start_date || !product?.end_date) return false;

  const start = new Date(product.start_date);
  const end = new Date(product.end_date);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (isStartDate) {
    return dateOnly >= startOnly && dateOnly <= endOnly; // ✅ Ensure valid start dates
  }

  return (
    rentalDetails.startDate &&
    dateOnly >= new Date(rentalDetails.startDate).setHours(0, 0, 0, 0) && 
    dateOnly <= endOnly
  ); // ✅ Ensure end date is after start date
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

  <div className="flex gap-3 mt-4">
  {!isCameraOn ? (
    <button onClick={startCamera} className="px-6 py-3 bg-pink-600 text-white rounded-lg flex items-center gap-2">
      <FaCamera /> Start Camera
    </button>
  ) : (
    <>
      <button onClick={handleCapture} className="px-6 py-3 bg-green-600 text-white rounded-lg flex items-center gap-2">
        <FaCamera /> Capture
      </button>
      <button onClick={stopCamera} className="px-6 py-3 bg-red-600 text-white rounded-lg flex items-center gap-2">
        <FaTrash /> Stop Camera
      </button>
    </>
  )}
</div>


  <p className="text-sm text-gray-500 mt-4">
    Stand in front of the camera to see the gown adjust to your body!
  </p>
</div>


            {/* Product Info & Calendar */}
            <div className="w-full flex flex-col gap-6">
             {/* Product Name, Price & Description */}
              <div className="space-y-4">
                  <h1 className="text-4xl font-bold">{product.name}</h1>

                  {/* ✅ Check if there's a discount */}
                  {product.discounted_price && product.discounted_price !== null && product.discounted_price !== "null" ? (
                      <div className="flex flex-col">
                          <p className="text-2xl font-semibold text-red-500 line-through">
                              ₱{Number(product.price).toLocaleString()} {/* Original Price with strikethrough */}
                          </p>

                          <p className="text-lg font-semibold text-green-600">
                              {/* 🔥 Show discount percentage */}
                              ({Math.round(((product.price - product.discounted_price) / product.price) * 100)}% OFF)
                          </p>

                          <p className="text-3xl font-bold text-pink-600">
                              ₱{Number(product.discounted_price).toLocaleString()} {/* ✅ New discounted price */}
                          </p>
                      </div>
                  ) : (
                      // ✅ Show regular price if no discount
                      <p className="text-2xl font-semibold text-pink-600">
                          ₱{Number(product.price).toLocaleString()}
                      </p>
                  )}

                  <p className="text-lg text-gray-600">{product.category}</p>
                  <p className="text-lg text-gray-600">Stock: {product.stock}</p>
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

  <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">
    Select Rental Dates
  </h3>

  {/* ✅ Start & End Date Calendars with Equal Heights */}
  <div className="flex flex-col md:flex-row gap-4 justify-center">
    {/* Start Date Selection */}
    <div className="flex flex-col items-center w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Start Date (Pick-Up)
      </label>
      <div className="h-[350px] flex items-center"> {/* Forces equal height */}
        <Calendar
          value={rentalDetails.startDate ? new Date(rentalDetails.startDate) : null}
          onChange={(date) => handleDateChange("startDate", date)}
          className="w-full max-w-xs rounded-lg shadow-sm border-2 border-gray-300 p-2 h-full"
          tileDisabled={({ date }) => !isDateAvailable(date, true)}
          tileClassName={({ date }) =>
            isDateAvailable(date, true)
              ? rentalDetails.startDate &&
                new Date(rentalDetails.startDate).toDateString() === date.toDateString()
                ? "react-calendar__tile--active"
                : "available-date"
              : "react-calendar__tile--disabled"
          }
        />
      </div>
    </div>

    {/* End Date Selection */}
    <div className="flex flex-col items-center w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        End Date (Return Due)
      </label>
      <div className="h-[350px] flex items-center"> {/* Forces equal height */}
        <Calendar
          value={rentalDetails.endDate ? new Date(rentalDetails.endDate) : null}
          onChange={(date) => handleDateChange("endDate", date)}
          className="w-full max-w-xs rounded-lg shadow-sm border-2 border-gray-300 p-2 h-full"
          tileDisabled={({ date }) => !isDateAvailable(date, false)}
          tileClassName={({ date }) =>
            isDateAvailable(date, false)
              ? rentalDetails.endDate &&
                new Date(rentalDetails.endDate).toDateString() === date.toDateString()
                ? "react-calendar__tile--active"
                : "available-date"
              : "react-calendar__tile--disabled"
          }
        />
      </div>
    </div>
  </div>

  {/* Price Calculation */}
  <div className="mt-6 text-center">
    <p className="text-sm font-semibold text-gray-700">
      Added Rental Price: <span className="text-pink-600">
        ₱{Number(rentalDetails.addedPrice || 0).toFixed(2)}
      </span>
    </p>
    <p className="mt-2 text-xl font-semibold text-gray-800">
    Final Total Price: 
    <span className="text-pink-600">
        ₱{Number(
            (product.discounted_price && product.discounted_price !== "null" 
                ? Number(product.discounted_price) // ✅ Ensure it's a number
                : Number(product.price)) 
            + (rentalDetails.addedPrice || 0) // ✅ Added Rental Price properly included
        ).toFixed(2)}
    </span>
</p>
  </div>
  
              {/* Booking Button */}
                {product.stock > 0 ? (
                  <button 
                  onClick={handleBooking}
                  className={`mt-6 w-full px-6 py-3 rounded-full transition flex items-center justify-center gap-2
                      ${isBooking ? "bg-gray-400 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700"}
                      text-white`}
                  disabled={isBooking}
              >
                  {isBooking ? (
                      <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          Booking...
                      </>
                  ) : (
                      "Book Now"
                  )}
              </button>

                ) : (
                  <p className="mt-6 text-red-600 font-semibold text-lg text-center">
                    ⚠ This gown is currently out of stock!
                  </p>
                )}

                
              </div>

              <ReviewSection productId={product.id} />

            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-pink-600 text-white text-center py-6 mt-10">
                    <p>&copy; {new Date().getFullYear()} Gown Rental System. All Rights Reserved.</p>
                <ChatWidget />
                </footer>
      </div>
    </AuthGuard>
  );
  
}  