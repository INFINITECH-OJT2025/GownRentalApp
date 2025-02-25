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
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [favoritesCount, setFavoritesCount] = useState(0);
    const [user, setUser] = useState(null);
    const { bookingCount } = useBook();

    // ✅ Function to Manually Update Wishlist Count in Real Time
    const updateWishlist = () => {
        localStorage.setItem("wishlistUpdated", Date.now());
    };

    // ✅ Function to Fetch Wishlist & Favorites Count
    const fetchCounts = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                console.log("No token found. Please log in.");
                return;
            }

            const wishlistResponse = await axios.get("http://127.0.0.1:8000/api/wishlist", {
                headers: { "Authorization": `Bearer ${token}` },
            });

            const favoritesResponse = await axios.get("http://127.0.0.1:8000/api/favorites", {
                headers: { "Authorization": `Bearer ${token}` },
            });

            setWishlistCount(wishlistResponse.data.data.length || 0);
            setFavoritesCount(favoritesResponse.data.data.length || 0);
        } catch (error) {
            console.error("Error fetching counts:", error);
            setWishlistCount(0);
            setFavoritesCount(0);
        }
    }, []);

        // ✅ Real-Time Wishlist, Favorites, and Booking Count Updates
        useEffect(() => {
            fetchCounts();

            const handleStorageChange = (event) => {
                if (event.key === "wishlistUpdated" || event.key === "favoritesUpdated" || event.key === "bookingUpdated") {
                    fetchCounts(); // ✅ Update counts instantly when localStorage changes
                }
            };

            window.addEventListener("storage", handleStorageChange);
            return () => window.removeEventListener("storage", handleStorageChange);
        }, [fetchCounts]);

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
                    });
        
                    setWishlist(wishlist.filter((id) => id !== productId)); // ✅ Remove from state
                } else {
                    await axios.post(
                        "http://127.0.0.1:8000/api/wishlist",
                        { product_id: productId },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
        
                    setWishlist([...wishlist, productId]); // ✅ Add to state
                }
        
                // ✅ Trigger real-time update
                localStorage.setItem("wishlistUpdated", Date.now());
                window.dispatchEvent(new Event("storage")); // ✅ Broadcast update
            } catch (error) {
                console.error("Error modifying wishlist:", error);
            }
        };
        


    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
    
            if (!token) {
                console.error("No token found.");
                return;
            }
    
            await axios.post("http://127.0.0.1:8000/api/logout", {}, {
                headers: { "Authorization": `Bearer ${token}` },
            });

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
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
                    <Link href="/" className="text-gray-700 hover:text-pink-600">Home</Link>
                    <Link href="/browse" className="text-gray-700 hover:text-pink-600">Browse</Link>
                    <Link href="/about" className="text-gray-700 hover:text-pink-600">About</Link>
                    <Link href="/contact" className="text-gray-700 hover:text-pink-600">Contact</Link>

                    <Link href="/wishlist" className="text-gray-700 hover:text-pink-600 flex items-center">
                        <Heart className="w-5 h-5 mr-1" /> Wishlist
                        <span className="ml-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {wishlist ? wishlist.length : 0} {/* ✅ Prevent undefined errors */}
                        </span>
                    </Link>

                    <Link href="/favorites" className="text-gray-700 hover:text-pink-600 flex items-center">
                <Star className="w-5 h-5 mr-1" /> Favorites
                <span className="ml-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {favorites.length}
                </span>
            </Link>

            <Link href="/bookhistory" className="text-gray-700 hover:text-pink-600 flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-1" /> Booking History
                    <span className="ml-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                        {bookingCount} {/* ✅ Correct count from API */}
                    </span>
                </Link>

                    <Link href="/profile" className="text-gray-700 hover:text-pink-600 flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <span>{user?.name || "Profile"}</span>
                    </Link>

                    {/* Logout Button */}
                    <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded flex items-center">
                        <LogOut className="w-5 h-5 mr-1" /> Logout
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button className="md:hidden text-gray-700 focus:outline-none" onClick={() => setIsOpen(!isOpen)}>
                    ☰
                </button>
            </div>

            {/* Mobile Dropdown Menu */}
            {isOpen && (
                <div className="md:hidden bg-white shadow-md">
                    <Link href="/" className="block px-6 py-3 text-gray-700 hover:bg-pink-100">Home</Link>
                    <Link href="/browse" className="block px-6 py-3 text-gray-700 hover:bg-pink-100">Browse</Link>
                    <Link href="/about" className="block px-6 py-3 text-gray-700 hover:bg-pink-100">About</Link>
                    <Link href="/contact" className="block px-6 py-3 text-gray-700 hover:bg-pink-100">Contact</Link>

                    <Link href="/wishlist" className="block px-6 py-3 text-gray-700 hover:bg-pink-100 flex items-center">
                        <Heart className="w-5 h-5 mr-2" /> Wishlist
                        <span className="ml-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {wishlistCount}
                        </span>
                    </Link>

                    <Link href="/favorites" className="block px-6 py-3 text-gray-700 hover:bg-pink-100 flex items-center">
                        <Star className="w-5 h-5 mr-2" /> Favorites
                        <span className="ml-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {favoritesCount}
                        </span>
                    </Link>

                    <Link href="/bookhistory" className="block px-6 py-3 text-gray-700 hover:bg-pink-100 flex items-center">
                        <ShoppingCart className="w-5 h-5 mr-2" /> Booking History
                        <span className="ml-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {bookingCount}
                        </span>
                    </Link>

                    <Link href="/profile" className="block px-6 py-3 text-gray-700 hover:bg-pink-100 flex items-center">
                        <User className="w-5 h-5 mr-2" /> Profile
                    </Link>

                    <button onClick={handleLogout} className="w-full text-left px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white flex items-center">
                        <LogOut className="w-5 h-5 mr-2" /> Logout
                    </button>
                </div>
            )}
        </nav>
    );
}
