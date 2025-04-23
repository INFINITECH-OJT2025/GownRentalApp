"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import { Heart, Star, ShoppingCart, User, ArrowLeft, Bell, LogOut } from "lucide-react"; 
import { useWishlist } from "../context/WishlistContext";
import { useFavorites } from "../context/FavoritesContext";
import { useBook } from "../context/BookContext"; 
import moment from "moment";
import Cookies from "js-cookie";
import { getCurrentUser } from "../utils/api";
import { useUser } from "../context/UserContext";

export default function Navbar() {
    const pathname = usePathname();

    const router = useRouter();

    const { wishlist } = useWishlist();
    const { favorites } = useFavorites() || { favorites: [] }; 
    const { bookingCount, updateBookingCount } = useBook(); 

    const [loadingLink, setLoadingLink] = useState(null);
    const [loadingLogout, setLoadingLogout] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    
    // const [user, setUser] = useState(null);
    // const [userRole, setUserRole] = useState(null);

    const { user, setUser, userRole, setUserRole, version } = useUser();

    const [chatHasNotification, setChatHasNotification] = useState(false);

    const handleNavigation = (href) => {
    if (loadingLink === href) return;

    setLoadingLink(href);
    router.push(href);

    // Optional: allow re-navigation after 2 seconds
    setTimeout(() => setLoadingLink(null), 2000);
};

    const updateWishlist = () => {
        localStorage.setItem("wishlistUpdated", Date.now());
    };


    useEffect(() => {
        const handleClickOutside = (e) => {
          if (!e.target.closest(".profile-dropdown")) {
            setIsProfileDropdownOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }, []);
      
    useEffect(() => {
        updateBookingCount(); // Initial fetch
    
        let debounceTimer;
    
        const handleStorageChange = (event) => {
            if (event.key === "bookingUpdated") {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    updateBookingCount(); // ✅ Will only run after 300ms of no new trigger
                }, 300);
            }
        };
    
        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            clearTimeout(debounceTimer); // ✅ Clean up
        };
    }, [updateBookingCount]);
    
 
      
    const handleLogout = async () => {
        setLoadingLogout(true);
    
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("⚠ You are already logged out.");
                setLoadingLogout(false); 
                return;
            }
    
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {}, {
                headers: { "Authorization": `Bearer ${token}` },
            }).catch(() => alert("⚠ Network error! Unable to logout."));
    
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            Cookies.remove("auth_token");
            Cookies.remove("user_role");
    
            window.location.href = "/login";
        } catch {
            alert("⚠ Network error! Please check your connection.");
        } finally {
            setLoadingLogout(false);
        }
    };
    
    return (
        <nav className="bg-white shadow-md fixed top-0 w-full z-50">
            <div className="container mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <Image src="/gownrentalsicon.svg" alt="GownRental Logo" width={40} height={40} />
                    <span className="text-2xl font-bold text-pink-600 ml-1">GownRental</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex space-x-6 items-center">

                    
                {userRole === "admin" && (
                        <button
                            onClick={() => handleNavigation("/admin_pages/admin")}
                            className={`${
                                pathname === "/admin_pages/admin" ? "text-pink-600 " : "text-gray-700"
                            } hover:text-pink-600 flex items-center ${
                                loadingLink === "/admin_pages/admin" ? "opacity-50 cursor-not-allowed" : "Back to Admin Dashboard"
                            }`}                     
                            disabled={loadingLink === "/admin_pages/admin"}
                        >
                              <ArrowLeft className="w-5 h-5 mr-1" />
                            {loadingLink === "/admin_pages/admin" ? "Loading..." : "Back to Admin Dashboard"}
                        </button>
                    )}

                <button
                        onClick={() => handleNavigation("/")}
                        className={`${
                            pathname === "/" ? "text-pink-600 " : "text-gray-700"
                          } hover:text-pink-600 ${loadingLink === "/" ? "opacity-50 cursor-not-allowed" : ""}`}                          
                        disabled={loadingLink === "/"}
                    >
                        {loadingLink === "/" ? "Loading..." : "Home"}
                    </button>

                    <button
                        onClick={() => handleNavigation("/browse")}
                        className={`${
                            pathname === "/browse" ? "text-pink-600 " : "text-gray-700"
                          } hover:text-pink-600 ${loadingLink === "/browse" ? "opacity-50 cursor-not-allowed" : ""}`}
                          
                        disabled={loadingLink === "/browse"}
                    >
                        {loadingLink === "/browse" ? "Loading..." : "Browse"}
                    </button>

                    {userRole !== "admin" && (
                        <>
                            <button
                            onClick={() => handleNavigation("/about")}
                            className={`${pathname === "/about" ? "text-pink-600" : "text-gray-700"} hover:text-pink-600 ${loadingLink === "/about" ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={loadingLink === "/about"}
                            >
                            {loadingLink === "/about" ? "Loading..." : "About"}
                            </button>

                            <button
                            onClick={() => handleNavigation("/contact")}
                            className={`${pathname === "/contact" ? "text-pink-600" : "text-gray-700"} hover:text-pink-600 ${loadingLink === "/contact" ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={loadingLink === "/contact"}
                            >
                            {loadingLink === "/contact" ? "Loading..." : "Contact"}
                            </button>

                            <button
                            onClick={() => handleNavigation("/wishlist")}
                            className={`${pathname === "/wishlist" ? "text-pink-600" : "text-gray-700"} hover:text-pink-600 flex items-center ${loadingLink === "/wishlist" ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={loadingLink === "/wishlist"}
                            >
                            <Heart className="w-5 h-5 mr-1" />
                            {loadingLink === "/wishlist" ? "Loading..." : "Wishlist"}
                            <span className="ml-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full">{wishlist.length}</span>
                            </button>

                            <button
                            onClick={() => handleNavigation("/favorites")}
                            className={`${pathname === "/favorites" ? "text-pink-600" : "text-gray-700"} hover:text-pink-600 flex items-center ${loadingLink === "/favorites" ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={loadingLink === "/favorites"}
                            >
                            <Star className="w-5 h-5 mr-1" />
                            {loadingLink === "/favorites" ? "Loading..." : "Favorites"}
                            <span className="ml-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full">{favorites.length}</span>
                            </button>

                       
                        <button
                            onClick={() => handleNavigation("/bookhistory")}
                            className={`${
                                pathname === "/bookhistory" ? "text-pink-600 " : "text-gray-700"
                            } hover:text-pink-600 flex items-center ${
                                loadingLink === "/bookhistory" ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            disabled={loadingLink === "/bookhistory"}
                        >
                            <ShoppingCart className="w-5 h-5 mr-1" />
                            {loadingLink === "/bookhistory" ? "Loading..." : "Booking History"}
                            <span className="ml-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full">
                                {bookingCount}
                            </span>
                        </button>

                       {/* NEW - Desktop Profile Dropdown */}
                       {/* {userRole && (
                        <div className="relative profile-dropdown hidden md:block">
                        <button
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        className={`focus:outline-none flex items-center rounded-full p-1 border-2 ${
                            isProfileDropdownOpen ? "bg-pink-100 border-pink-600" : "border-transparent"
                        }`}
                        >


                    <img
                        key={`${user?.image}-${version}`} // ✅ ensures re-render on update
                        src={user?.image || "/images/default-profile.svg"
                        }
                        alt="User Profile"
                        className="w-10 h-10 rounded-full border-2 border-pink-600 object-cover"
                        />

                        </button>

                        {isProfileDropdownOpen && (
                     <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border z-50 py-2 transition-all duration-200 ease-in-out">
                     <div className="px-4 py-2 border-b">
                       <p className="font-medium text-sm">{user?.name || "My Account"}</p>
                       <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                     </div>
                     <button
                    onClick={() => handleNavigation("/profile")}
                    disabled={loadingLink === "/profile"}
                    className={`w-full text-left px-4 py-2 text-gray-700 text-sm disabled:opacity-50 ${
                        pathname === "/profile" ? "bg-pink-100 font-semibold" : "hover:bg-pink-100"
                    }`}
                    >
                    {loadingLink === "/profile" ? "Loading..." : "My Profile"}
                    </button>

                     <button
                       onClick={handleLogout}
                       className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 text-sm disabled:opacity-50"
                       disabled={loadingLogout}
                     >
                       {loadingLogout ? "Logging out..." : "Log Out"}
                     </button>
                   </div>
                   
                        )}
                    </div>
                    )} */}

                    <button
                        onClick={() => handleNavigation("/profile")}
                        className={`${
                            pathname === "/profile" ? "text-pink-600 " : "text-gray-700"
                        } hover:text-pink-600 ${loadingLink === "/profile" ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loadingLink === "/profile"}
                        >
                        {loadingLink === "/profile" ? "Loading..." : "Profile"}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition disabled:opacity-50"
                            disabled={loadingLogout}
                        >
                            {loadingLogout ? "Logging out..." : "Logout"}
                        </button>
                            </>
                        
                    )}
                  

                </div>

                {/* Mobile Menu Button */}
                <button className="md:hidden text-gray-700 focus:outline-none" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    ☰
                </button>
            </div>

                {/* Mobile Dropdown Menu */}
                {isMobileMenuOpen && (
                <div className="md:hidden fixed top-[64px] left-0 w-full bg-white shadow-md p-4 space-y-3 z-50">

                    <button
                        onClick={() => handleNavigation("/")}
                        className={`relative w-full ${
                            pathname === "/" ? "text-pink-600 " : "text-gray-700"
                          } text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded`}
                    >
                        {loadingLink === "/" ? "Loading..." : "Home"}
                    </button>

                    <button
                        onClick={() => handleNavigation("/browse")}
                        className={`relative w-full ${
                            pathname === "/browse" ? "text-pink-600 " : "text-gray-700"
                          } text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded`}                          
                    >
                        {loadingLink === "/browse" ? "Loading..." : "Browse"}
                    </button>

                    {userRole !== "admin" && (
                        <>
                            <button
                            onClick={() => handleNavigation("/about")}
                            className={`relative w-full ${pathname === "/about" ? "text-pink-600" : "text-gray-700"} text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded`}
                            >
                            {loadingLink === "/about" ? "Loading..." : "About"}
                            </button>

                            <button
                            onClick={() => handleNavigation("/contact")}
                            className={`relative w-full ${pathname === "/contact" ? "text-pink-600" : "text-gray-700"} text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded`}
                            >
                            {loadingLink === "/contact" ? "Loading..." : "Contact"}
                            </button>

                            <button
                            onClick={() => handleNavigation("/wishlist")}
                            className={`relative w-full ${pathname === "/wishlist" ? "text-pink-600" : "text-gray-700"} text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded`}
                            >
                            <span>{loadingLink === "/wishlist" ? "Loading..." : "Wishlist"}</span>
                            <span className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">{wishlist.length}</span>
                            </button>

                            <button
                            onClick={() => handleNavigation("/favorites")}
                            className={`relative w-full ${pathname === "/favorites" ? "text-pink-600" : "text-gray-700"} text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded`}
                            >
                            <span>{loadingLink === "/favorites" ? "Loading..." : "Favorites"}</span>
                            <span className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">{favorites.length}</span>
                            </button>
                        </>
                        )}


                    {userRole !== "admin" ? (
                        <button
                            onClick={() => handleNavigation("/bookhistory")}
                            className={`relative w-full ${
                                pathname === "/bookhistory" ? "text-pink-600 " : "text-gray-700"
                            } text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded`}
                        >
                            <span>{loadingLink === "/bookhistory" ? "Loading..." : "Booking History"}</span>
                            <span className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {bookingCount}
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={() => handleNavigation("/admin_pages/admin")}
                            className="relative w-full text-lg font-medium flex items-center justify-between text-gray-700 hover:bg-pink-100 p-3 rounded"
                        >
                            Back to Admin Dashboard
                        </button>
                    )}


                {userRole !== "admin" && (
                        <>
                        <button
                        onClick={() => handleNavigation("/profile")}
                        className={`relative w-full ${pathname === "/profile" ? "text-pink-600" : "text-gray-700"} text-lg font-medium flex items-center justify-between hover:bg-pink-100 p-3 rounded`}
                        >
                        {loadingLink === "/profile" ? "Loading..." : "Profile"}
                        </button>
                        </>
                    )}

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
