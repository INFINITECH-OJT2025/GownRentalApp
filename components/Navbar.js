"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Heart, Star, ShoppingCart, User, LogOut } from "lucide-react"; 
import { useWishlist } from "../context/WishlistContext";
import { useFavorites } from "../context/FavoritesContext";
import { useBook } from "../context/BookContext"; // ✅ Add this line

export default function Navbar() {
    const { wishlist } = useWishlist() || { wishlist: [] };
    const { favorites } = useFavorites() || { favorites: [] }; 
    const { bookingCount, updateBookingCount } = useBook(); // ✅ Use updateBookingCount
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [favoritesCount, setFavoritesCount] = useState(0);
    const [user, setUser] = useState(null);
    const [loadingLink, setLoadingLink] = useState(null); // ✅ Track which link is loading
    const [loadingLogout, setLoadingLogout] = useState(false); // ✅ Track logout loading state

    // ✅ Function to Manually Update Wishlist Count in Real Time

    const handleNavigation = (href) => {
        setLoadingLink(href); // ✅ Set loading state for the clicked link
        router.push(href);
    };

    
    const updateWishlist = () => {
        localStorage.setItem("wishlistUpdated", Date.now());
    };

    const fetchCounts = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.log("No token found. Please log in.");
                return;
            }
    
            const [wishlistResponse, favoritesResponse] = await Promise.all([
                axios.get("http://127.0.0.1:8000/api/wishlist", {
                    headers: { "Authorization": `Bearer ${token}` },
                }).catch(() => alert("⚠ Network error! Unable to fetch wishlist.")),
    
                axios.get("http://127.0.0.1:8000/api/favorites", {
                    headers: { "Authorization": `Bearer ${token}` },
                }).catch(() => alert("⚠ Network error! Unable to fetch favorites."))
            ]);
    
            setWishlistCount(wishlistResponse?.data?.data?.length || 0);
            setFavoritesCount(favoritesResponse?.data?.data?.length || 0);
        } catch {
            alert("⚠ Network error! Please check your internet connection.");
        }
    }, []);
    
    

    useEffect(() => {
        fetchCounts(); // ✅ Initial fetch when Navbar loads
        updateBookingCount(); // ✅ Update Booking Count on load
    
        const handleStorageChange = (event) => {
            if (["wishlistUpdated", "favoritesUpdated", "bookingUpdated"].includes(event.key)) {
                fetchCounts(); // ✅ Fetch wishlist & favorites
                updateBookingCount(); // ✅ Fetch booking count
            }
        };
    
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [fetchCounts, updateBookingCount]);
    

    const toggleWishlist = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠ You must be logged in to modify your wishlist.");
            return;
        }
    
        const isAlreadyInWishlist = wishlist.includes(productId);
    
        try {
            if (isAlreadyInWishlist) {
                await axios.delete(`http://127.0.0.1:8000/api/wishlist/${productId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).catch(() => alert("⚠ Network error! Unable to remove from wishlist."));
    
                setWishlist(wishlist.filter((id) => id !== productId)); // ✅ Remove from state
            } else {
                await axios.post(
                    "http://127.0.0.1:8000/api/wishlist",
                    { product_id: productId },
                    { headers: { Authorization: `Bearer ${token}` } }
                ).catch(() => alert("⚠ Network error! Unable to add to wishlist."));
    
                setWishlist([...wishlist, productId]); // ✅ Add to state
            }
    
            // ✅ Trigger real-time update
            localStorage.setItem("wishlistUpdated", Date.now());
            window.dispatchEvent(new Event("storage")); // ✅ Broadcast update
        } catch {
            alert("⚠ Network error! Please check your connection.");
        }
    };
    
    const handleLogout = async () => {
        setLoadingLogout(true); // ✅ Start loading state
    
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("⚠ No token found. You are already logged out.");
                setLoadingLogout(false); // ✅ Stop loading state
                return;
            }
    
            await axios.post("http://127.0.0.1:8000/api/logout", {}, {
                headers: { "Authorization": `Bearer ${token}` },
            }).catch(() => alert("⚠ Network error! Unable to logout."));
    
            localStorage.removeItem("token");
            localStorage.removeItem("user");
    
            router.push("/login");
        } catch {
            alert("⚠ Network error! Please check your connection.");
        } finally {
            setLoadingLogout(false); // ✅ Ensure loading state stops after API call
        }
    };
    
    
    return (
        <nav className="bg-white shadow-md fixed top-0 w-full z-50">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <Image src="/gownrentalsicon.svg" alt="GownRental Logo" width={40} height={40} />
                    <span className="text-2xl font-bold text-pink-600 ml-1">GownRental</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex space-x-6 items-center">
                <button
                        onClick={() => handleNavigation("/")}
                        className={`text-gray-700 hover:text-pink-600 ${loadingLink === "/" ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loadingLink === "/"}
                    >
                        {loadingLink === "/" ? "Loading..." : "Home"}
                    </button>

                    <button
                        onClick={() => handleNavigation("/browse")}
                        className={`text-gray-700 hover:text-pink-600 ${loadingLink === "/browse" ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loadingLink === "/browse"}
                    >
                        {loadingLink === "/browse" ? "Loading..." : "Browse"}
                    </button>

                    <button
                        onClick={() => handleNavigation("/about")}
                        className={`text-gray-700 hover:text-pink-600 ${loadingLink === "/about" ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loadingLink === "/about"}
                    >
                        {loadingLink === "/about" ? "Loading..." : "About"}
                    </button>

                    <button
                        onClick={() => handleNavigation("/contact")}
                        className={`text-gray-700 hover:text-pink-600 ${loadingLink === "/contact" ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loadingLink === "/contact"}
                    >
                        {loadingLink === "/contact" ? "Loading..." : "Contact"}
                    </button>

                    <button
                        onClick={() => handleNavigation("/wishlist")}
                        className={`text-gray-700 hover:text-pink-600 flex items-center ${
                            loadingLink === "/wishlist" ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={loadingLink === "/wishlist"}
                    >
                        <Heart className="w-5 h-5 mr-1" />
                        {loadingLink === "/wishlist" ? "Loading..." : "Wishlist"}
                        <span className="ml-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {wishlist.length} {/* ✅ Show Count Badge */}
                        </span>
                    </button>

                    <button
                        onClick={() => handleNavigation("/favorites")}
                        className={`text-gray-700 hover:text-pink-600 flex items-center ${
                            loadingLink === "/favorites" ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={loadingLink === "/favorites"}
                    >
                        <Star className="w-5 h-5 mr-1" />
                        {loadingLink === "/favorites" ? "Loading..." : "Favorites"}
                        <span className="ml-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {favorites.length} {/* ✅ Show Count Badge */}
                        </span>
                    </button>

                    <button
                        onClick={() => handleNavigation("/bookhistory")}
                        className={`text-gray-700 hover:text-pink-600 flex items-center ${
                            loadingLink === "/bookhistory" ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={loadingLink === "/bookhistory"}
                    >
                        <ShoppingCart className="w-5 h-5 mr-1" />
                        {loadingLink === "/bookhistory" ? "Loading..." : "Booking History"}
                        <span className="ml-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                            {bookingCount} {/* ✅ Show Count Badge */}
                        </span>
                    </button>


                    <button
                        onClick={() => handleNavigation("/profile")}
                        className={`text-gray-700 hover:text-pink-600 flex items-center space-x-2 ${loadingLink === "/profile" ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loadingLink === "/profile"}
                    >
                        <User className="w-5 h-5" />
                        {loadingLink === "/profile" ? "Loading..." : "Profile"}
                    </button>

                    <button
                        onClick={handleLogout}
                        className={`bg-red-500 text-white px-4 py-2 rounded flex items-center ${
                            loadingLogout ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={loadingLogout}
                    >
                        <LogOut className="w-5 h-5 mr-1" />
                        {loadingLogout ? "Logging out..." : "Logout"}
                    </button>

                </div>

                {/* Mobile Menu Button */}
                <button className="md:hidden text-gray-700 focus:outline-none" onClick={() => setIsOpen(!isOpen)}>
                    ☰
                </button>
            </div>

                {/* Mobile Dropdown Menu */}
            {isOpen && (
                <div className="md:hidden flex flex-col bg-white shadow-md p-4 space-y-3">
                    <button
                        onClick={() => handleNavigation("/")}
                        className="relative w-full text-gray-700 text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded"
                        disabled={loadingLink === "/"}
                    >
                        {loadingLink === "/" ? "Loading..." : "Home"}
                    </button>

                    <button
                        onClick={() => handleNavigation("/browse")}
                        className="relative w-full text-gray-700 text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded"
                        disabled={loadingLink === "/browse"}
                    >
                        {loadingLink === "/browse" ? "Loading..." : "Browse"}
                    </button>

                    <button
                        onClick={() => handleNavigation("/wishlist")}
                        className="relative w-full text-gray-700 text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded"
                        disabled={loadingLink === "/wishlist"}
                    >
                        <span>{loadingLink === "/wishlist" ? "Loading..." : "Wishlist"}</span>
                        <span className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {wishlist.length}
                        </span>
                    </button>

                    <button
                        onClick={() => handleNavigation("/favorites")}
                        className="relative w-full text-gray-700 text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded"
                        disabled={loadingLink === "/favorites"}
                    >
                        <span>{loadingLink === "/favorites" ? "Loading..." : "Favorites"}</span>
                        <span className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {favorites.length}
                        </span>
                    </button>

                    <button
                        onClick={() => handleNavigation("/bookhistory")}
                        className="relative w-full text-gray-700 text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded"
                        disabled={loadingLink === "/bookhistory"}
                    >
                        <span>{loadingLink === "/bookhistory" ? "Loading..." : "Booking History"}</span>
                        <span className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                            {bookingCount}
                        </span>
                    </button>

                    <button
                        onClick={() => handleNavigation("/profile")}
                        className="relative w-full text-gray-700 text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded"
                        disabled={loadingLink === "/profile"}
                    >
                        {loadingLink === "/profile" ? "Loading..." : "Profile"}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 text-white text-lg font-medium hover:bg-red-600 p-3 rounded flex justify-center"
                        disabled={loadingLogout}
                    >
                        {loadingLogout ? "Logging out..." : "Logout"}
                    </button>
                </div>
            )}

        </nav>
    );
}
