"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Heart, Star, ShoppingCart, User, Bell, LogOut } from "lucide-react"; 
import { useWishlist } from "../context/WishlistContext";
import { useFavorites } from "../context/FavoritesContext";
import { useBook } from "../context/BookContext"; 
import moment from "moment";
import { ChatContext } from "../context/ChatContext"; 

export default function Navbar() {
    const router = useRouter();

    const { wishlist } = useWishlist() || { wishlist: [] };
    const { favorites } = useFavorites() || { favorites: [] }; 
    const { bookingCount, updateBookingCount } = useBook(); 
    const [wishlistCount, setWishlistCount] = useState(0);
    const [favoritesCount, setFavoritesCount] = useState(0);
    const [loadingLink, setLoadingLink] = useState(null); // ✅ Track which link is loading
    const [loadingLogout, setLoadingLogout] = useState(false); // ✅ Track logout loading state
    const [isOpen, setIsOpen] = useState(false);
    const { newMessageTotal, senders, fetchChatSenders, clearNotifications } = useContext(ChatContext);
    const [showNotifications, setShowNotifications] = useState(false);
    const [user, setUser] = useState(null);
    const [ setSenders] = useState([]); 
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchChatSenders(parsedUser.id); // ✅ Fetch messages for logged-in user
        }
    }, []);

    useEffect(() => {
        if (user?.id) {
            fetchChatSenders(user.id); // ✅ Fetch who messaged this user
        }
    }, [user]);

   
    const handleNotificationClick = async () => {
        if (showNotifications) {
            // ✅ If clicked twice, clear the messages
            clearNotifications(user.id);
        }
        setShowNotifications((prev) => !prev);
    };
    


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

                    <div className="hidden md:flex space-x-6 items-center">
                    <div className="relative">
                    <button className="relative text-black hover:text-pink-500" onClick={handleNotificationClick}>
                            <Bell className="h-6 w-6" />
                            {newMessageTotal > 0 && (
                                 <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center justify-center">
                                 !
                             </span>
                            )}
                        </button>

                      {/* 📩 Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-md z-50 border border-gray-300 overflow-hidden">
                            <div className="p-3 border-b text-gray-700 font-semibold">
                                New Messages ({newMessageTotal})
                            </div>
                            <div className="max-h-64 overflow-y-auto"> {/* ✅ Scrollable */}
                                {senders.length > 0 ? (
                                    <ul className="p-3 text-gray-500 text-sm">
                                        {senders.map((sender) => (
                                            <li key={sender.id} className="flex items-center space-x-2 border-b py-2">
                                                <div>
                                                    <span className="font-semibold">{sender.name}</span> sent you a message!
                                                    <br />
                                                    <span className="text-xs text-gray-400">{moment(sender.created_at).calendar()}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-3 text-gray-500 text-sm">No new messages</div>
                                )}
                            </div>
                        </div>
                    )}
                        </div>
                        </div>

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

                    <div className="md:flex space-x-6 items-center">
                        {/* 🔔 Notification Bell (Desktop) */}
                        <div className="hidden md:block relative">
                            <button className="relative text-gray-700 hover:text-pink-600" onClick={handleNotificationClick}>
                                <Bell className="h-6 w-6" />
                                {newMessageTotal > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                       !
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* 📱 Mobile Notification Bell */}
                        <div className="md:hidden flex items-center space-x-3">
                            <button className="relative text-gray-700 hover:text-pink-600" onClick={handleNotificationClick}>
                                <Bell className="h-6 w-6" />
                                {newMessageTotal > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                       !
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* 📩 Notification Dropdown - Adjusted for Mobile */}
                        {showNotifications && (
                            <div className="absolute right-0 md:left-auto top-12 md:top-auto w-72 bg-white shadow-lg rounded-md z-50 border border-gray-300 overflow-hidden md:w-64 md:right-0">
                                <div className="p-3 border-b text-gray-700 font-semibold flex justify-between items-center">
                                    <span>New Messages</span>
                                    <button 
                                        onClick={() => setShowNotifications(false)} 
                                        className="text-red-500 text-sm hover:underline"
                                    >
                                        Close
                                    </button>
                                </div>
                                <div className="max-h-64 overflow-y-auto p-3"> {/* ✅ Scrollable */}
                                    {senders.length > 0 ? (
                                        <ul className="text-gray-500 text-sm space-y-2">
                                            {senders.map((sender) => (
                                                <li key={sender.id} className="flex items-center space-x-3 border-b py-2">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{sender.name}</span> 
                                                        <span className="text-xs text-gray-400">{moment(sender.created_at).calendar()}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-gray-500 text-sm">No new messages</div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>


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
