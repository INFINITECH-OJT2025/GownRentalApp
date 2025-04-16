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
import { toast, Toaster } from "react-hot-toast";
import { format } from "date-fns";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { groupProductsByDetails } from "../../utils/groupProducts";
import Footer from "../../components/Footer";
import RentalCalendars from "../../components/RentalCalendars";

export default function ProductDetailPage() {
 
  
  const videoRef = useRef(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const canvasRef = useRef(null);
  const router = useRouter(); // ✅ first
  
  const { id } = router.query; // ✅ then safely destructure query
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
  const [selectedSize, setSelectedSize] = useState("");
  const [productSizes, setProductSizes] = useState([]); // ✅ Initialize as an empty array
  const [wishLoading, setWishLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const reviewRef = useRef(null);

  useEffect(() => {
    if (router.isReady && router.query.scroll === "review" && reviewRef.current) {
      setTimeout(() => {
        reviewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    }
  }, [router.isReady, router.query.scroll, product]);
  
  const [userRole, setUserRole] = useState(null);

useEffect(() => {
  if (typeof window !== "undefined") {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserRole(parsedUser?.role || null);
    }
  }
}, []);



const handleToggleFavorite = async () => {
  if (favLoading) return;
  setFavLoading(true);
  await toggleFavorite(product.id);
  setFavLoading(false);
};


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
        const tf = await import("@tensorflow/tfjs");
        const poseDetection = await import("@tensorflow-models/pose-detection");
    
        await tf.ready();
    
        try {
          await tf.setBackend("webgl");
        } catch {
          await tf.setBackend("cpu");
        }
    
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            modelUrl: "/models/movenet/model.json", // ✅ Local offline path
          }
        );
    
        console.log("✅ Pose detection model loaded");
        setDetector(detector);
      } catch (err) {
        console.error("❌ Failed to load pose detection model:", err);
        alert(" Failed to load AI model. Please check your internet or try again.");
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

  const handleToggleWishlist = async () => {
    if (wishLoading) return;
    setWishLoading(true);
    await toggleWishlist(product.id);
    setWishLoading(false);
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
        console.warn(" No person detected. Dress stays centered.");
        requestAnimationFrame(adjustDressSize);
        return;
      }
  
      const keypoints = poses[0].keypoints;
      const leftShoulder = keypoints.find(k => k.name === "left_shoulder");
      const rightShoulder = keypoints.find(k => k.name === "right_shoulder");
      const leftHip = keypoints.find(k => k.name === "left_hip");
  
      if (!leftShoulder || !rightShoulder || !leftHip) {
        console.warn(" Missing key points! Keeping dress at default.");
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
    alert(" Please allow camera access in your browser settings.");
  }
};

useEffect(() => {
  if (isCameraOn) {
    startCamera();
  }
}, [isCameraOn]);

useEffect(() => {
  const fetchProduct = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`);
    if (response.data.success) {
      const productData = response.data.product;

      const enrichedSizes = Array.isArray(productData.size_stock)
      ? productData.size_stock.map((entry) => ({
          size: entry.size,
          stock: entry.stock,
          product_id: entry.product_id,
        }))
      : [];


      console.log("✅ Enriched Sizes:", enrichedSizes);

      setProduct(productData);
      setProductSizes(enrichedSizes); // ✅ this is all you need
    }
  };

  if (id) fetchProduct();
}, [id]);



useEffect(() => {
  const fetchFavorites = async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // ✅ Skip if user isn't logged in

    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFavorites(response.data.data.map((item) => item.product_id)); // ✅ Now setFavorites is defined
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);

      // ✅ Handle Network Errors
      if (!error.response) {
        alert(" Network error! Unable to fetch favorites. Please check your connection.");
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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setWishlist(response.data.data.map((item) => item.product_id)); // ✅ Now setWishlist is defined
      }
    } catch (error) {
      console.error("❌ Error fetching wishlist:", error);

      // ✅ Show alert instead of causing a runtime error
      alert(" Unable to load wishlist. Please check your internet connection and try again.");

      // ✅ Set a default safe value
      setWishlist([]);
    }
  };

  fetchWishlist().catch(err => console.error("❌ Unhandled fetchWishlist error:", err)); // ✅ Ensure no unhandled rejections
}, [setWishlist]);


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
    toast.error(" You must be logged in to book.", { position: "top-right" });
    return;
  }

  if (!rentalDetails.startDate || !rentalDetails.endDate) {
    toast.error(" Please select both a Start Date and an End Date before booking.", { position: "top-right" });
    return;
  }

   // ✅ Prevent same start and end date
   const start = new Date(rentalDetails.startDate);
   const end = new Date(rentalDetails.endDate);
   if (start.toDateString() === end.toDateString()) {
     toast.error("End date must be a different day from start date.", {
       position: "top-right",
     });
     return;
   }

  if (!selectedSize) {
    toast.error(" Please select a size before booking.", { position: "top-right" });
    return;
  }

  const confirmBooking = window.confirm("✅ Booking saved! Waiting for approval.");
  if (!confirmBooking) return;

  try {
    setIsBooking(true);

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-CA"); // YYYY-MM-DD
    };
    
    const formattedStartDate = formatDate(rentalDetails.startDate);
    const formattedEndDate = formatDate(rentalDetails.endDate);
    

    // 🔍 Get the matching size variant's product ID
const matchedSize = productSizes.find((item) => item.size === selectedSize);
const finalProductId = matchedSize?.product_id || product.id; // Fallback in case something breaks

    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/bookings`,
      {
        // 🔍 Get the matching size variant's product ID
        product_id: finalProductId,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        added_price: rentalDetails.addedPrice,
        total_price: rentalDetails.totalPrice,
        discounted_price: product.discounted_price || product.price,
        sizes: selectedSize, // ✅ Include selected size
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.success) {
      const refNumber = response.data.booking.reference_number;
      toast.success("Booking successful! Redirecting...", { position: "top-right" });

      setTimeout(() => {
        setIsBooking(false);
        router.push(`/book?ref=${refNumber}`);
      }, 1500);
    } else {
      toast.error(response.data.message || "Failed to book. Please try again.", { position: "top-right" });
      setIsBooking(false);
    }
  } catch (error) {
    setIsBooking(false);
    console.error("Error:", error.response?.data || error);
    toast.error("❌ Booking failed. Please try again.", { position: "top-right" });
  }
};




  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <AuthGuard>
      <Head>
        <title>{product.name} | Gown Rental</title>
      </Head>
  
      <div className="min-h-screen bg-white-50 text-pink-800 font-[Comic_Sans_MS,sans-serif]">
        <Navbar />
  
        {/* Product Details - Two Column Layout */}
        <div className="container mx-auto px-6 mt-20"> {/* Added more top margin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start"> {/* Increased gap */}
         {/* ✅ Try-On Feature - Centered */}
          {/* ✅ Try-On Feature - Centered */}
          <div className="flex justify-end">
          <div className="flex flex-col items-center justify-center w-full max-w-2xl bg-white-100 shadow-2xl rounded-2xl p-6 text-center mt-6 border-2 border-pink-600">
          
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
              <FaCamera /> Start
            </button>
          ) : (
            <>
              <button onClick={stopCamera} className="px-6 py-3 bg-red-600 text-white rounded-lg flex items-center gap-2">
                <FaTrash /> Stop
              </button>
            </>
          )}
        </div>


          <p className="text-sm text-gray-500 mt-4">
            Stand in front of the camera to see the gown adjust to your body!
          </p>
        </div>
        </div>


            {/* Product Info & Calendar */}
            <div className="w-full flex flex-col gap-10">
             {/* Product Name, Price & Description */}
             <div className="mt-5 space-y-4 bg-white-100 shadow-xl p-6 rounded-xl border border-pink-200">
              <h1 className="text-4xl font-bold">{product.name}</h1>

              {product.discounted_price && product.discounted_price !== null ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:space-x-3 sm:flex-nowrap">
            <p className="text-2xl sm:text-3xl font-bold text-pink-600">
              ₱{Number(product.discounted_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-lg sm:text-xl font-semibold text-red-500 line-through">
              ₱{Number(product.price).toLocaleString()}
            </p>
            <p className="text-sm sm:text-xl font-medium text-green-600">
              ({Math.round(((product.price - product.discounted_price) / product.price) * 100)}% OFF)
            </p>
              </div>
            ) : (
              <p className="text-3xl font-bold text-pink-600">
                ₱{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}

              <p className="text-lg text-gray-600">{product.category}</p>
              <p className="text-lg text-gray-600">Total Stock Available: {product.totalStock}</p>
              
              {/* Description */}
              {product.description && (
                <p className="text-base text-gray-600 whitespace-pre-line">
                  {showFullDescription
                    ? product.description
                    : product.description.split(" ").slice(0, 3).join(" ") + (product.description.split(" ").length > 3 ? "..." : "")}
                  {product.description.split(" ").length > 3 && (
                    <button
                      onClick={() => setShowFullDescription((prev) => !prev)}
                      className="ml-2 text-pink-500 underline hover:text-pink-700"
                    >
                      {showFullDescription ? "See less" : "See more"}
                    </button>
                  )}
                </p>
              )}

            </div>

              <div className="flex space-x-4">
                  {/* Wishlist Button */}
                  <button
                    onClick={handleToggleWishlist}
                    disabled={wishLoading}
                    className="relative group"
                  >
                    {wishLoading ? (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                      </div>
                    ) : (
                      <>
                        <FaHeart
                          className={`text-2xl transition duration-200 ${
                            wishlist.includes(product.id)
                              ? "text-red-500 hover:text-red-600"
                              : "text-gray-400 hover:text-red-400"
                          }`}
                        />
                        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 
                                        bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded-md 
                                        opacity-0 group-hover:opacity-100 transition duration-300 z-50 whitespace-nowrap">
                          {wishlist.includes(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                        </div>
                      </>
                    )}
                  </button>
                  
                  <button
                  onClick={handleToggleFavorite}
                  disabled={favLoading}
                  className="relative group"
                >
                  {favLoading ? (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                    </div>
                  ) : (
                    <>
                      <FaStar
                        className={`text-2xl transition duration-200 ${
                          favorites.includes(product.id)
                            ? "text-yellow-400 hover:text-yellow-500"
                            : "text-gray-400 hover:text-yellow-400"
                        }`}
                      />
                      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 
                                      bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded-md 
                                      opacity-0 group-hover:opacity-100 transition duration-300 z-50 whitespace-nowrap">
                        {favorites.includes(product.id) ? "Remove from Favorites" : "Add to Favorites"}
                      </div>
                    </>
                  )}
                </button>
                
          {/* ✅ Size Selection Combobox */}
          <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Select Size:</label>
          <select
            value={selectedSize}
            onChange={(e) => {
              setSelectedSize(e.target.value);
              if (e.target.value) {
                toast.success(`Selected (1) size: ${e.target.value}`, { position: "top-right" });
              }
            }}
            className="w-full p-2 border border-pink-300 bg-pink-50 rounded-full shadow-sm focus:ring-pink-400"
            disabled={product.totalStock <= 0}
          >
            <option value="">-- Choose a Size --</option>
            {productSizes.length > 0 ? (
            productSizes.map((item) => (
              <option
                key={item.size}
                value={item.size}
                disabled={item.stock <= 0}
              >
                {item.size} {item.stock <= 0 ? "(Out of Stock)" : `- Available Stock/s: ${item.stock}`}
              </option>
            ))
          ) : (
            <option disabled>No sizes available</option>
          )}

          </select>

        </div>


                </div>
      {/* Rental Date Selection & Pricing */}
      <div className="w-full bg-pink-100 shadow-xl rounded-2xl p-6 border border-pink-300 overflow-hidden">
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

        {product.totalStock > 0 ? (
          <>
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">
              Select Rental Dates
            </h3>

            <RentalCalendars
              product={product}
              rentalDetails={rentalDetails}
              setRentalDetails={setRentalDetails}
            />

            {/* Price Calculation */}
            <div className="mt-6 text-center">
              <p className="text-sm font-semibold text-gray-700">
                Added Rental Price:{" "}
                <span className="text-pink-600">
                  ₱{Number(rentalDetails.addedPrice || 0).toFixed(2)}
                </span>
              </p>
              <p className="mt-2 text-xl font-semibold text-gray-800">
                Final Total Price:{" "}
                <span className="text-pink-600">
                  ₱{Number(
                    (product.discounted_price && product.discounted_price !== "null"
                      ? Number(product.discounted_price)
                      : Number(product.price)) +
                      (rentalDetails.addedPrice || 0)
                  ).toFixed(2)}
                </span>
              </p>
            </div>

            {/* Booking Button */}
            {userRole === "admin" ? (
              <p className="mt-6 text-gray-500 text-center font-semibold">
                Admins are not allowed to book gowns.
              </p>
            ) : (
              <button
                onClick={handleBooking}
                className={`mt-6 w-full px-6 py-3 rounded-full transition flex items-center justify-center gap-2 ${
                  isBooking
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-pink-600 hover:bg-pink-700"
                } text-white`}
                disabled={isBooking}
              >
                {isBooking ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Booking...
                  </>
                ) : (
                  "Book Now"
                )}
              </button>
            )}
          </>
        ) : (
          <p className="mt-6 text-red-600 font-semibold text-lg text-center">
            ⚠ This gown is currently unavailable!
          </p>
        )}
      </div>

             


            </div>
          </div>
        </div>
        <div className="w-full flex flex-col items-center justify-center my-16">
        <div className="relative w-full max-w-xl mb-6">
        <div className="h-px bg-gradient-to-r from-pink-300 via-pink-500 to-pink-300" />
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-6 py-1 text-pink-600 font-semibold text-lg rounded-full shadow-md border border-pink-300 whitespace-nowrap text-center">
        ✨ Customer Reviews ✨
      </div>

      </div>

      <section id="review" ref={reviewRef} className="w-full flex justify-center my-16 px-4">
        <div className="w-full max-w-2xl">
          <ReviewSection productId={product.id} />
        </div>
      </section>

    </div>


        {/* Footer */}
        <Footer />
      </div>
    </AuthGuard>
  );
  
}  