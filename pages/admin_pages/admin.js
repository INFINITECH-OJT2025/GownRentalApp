"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminSidebar from "../../components/AdminSidebar";
import Head from "next/head";
import { toast, Toaster } from "react-hot-toast";
import { HiUsers, HiCube, HiClock, HiClipboardList, HiCheckCircle, HiCurrencyDollar, HiHeart, HiStar } from "react-icons/hi";
import AdminAnalyticsSection from "../../components/AdminAnalyticsSection";
import Header from "../../components/Header";
import dynamic from "next/dynamic";
const BookingCalendar = dynamic(() => import("../../components/BookingCalendar"), { ssr: false });

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [stats, setStats] = useState({ users: 0, products: 0, totalRevenue: 0 });
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Add loading state

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // Adjust the number of items per page
    

    // Search
    const [searchQuery, setSearchQuery] = useState("");

    // 🔍 Filter products based on search input
        const filteredProducts = products.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Pagination Logic
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);
        
        const fetchProducts = async () => {
            setIsLoading(true);  // Start loading state
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products-with-counts`, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                        "Accept": "application/json"
                    }
                });
        
                if (response.status === 429) {
                    // Handle 429 (Too Many Requests)
                    console.log("Too many requests, retrying...");
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
                    return fetchProducts(); // Retry fetching
                }
        
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
        
                const data = await response.json();
                console.log("📡 API Response (Products):", data);
        
                if (data.success && Array.isArray(data.data)) {
                    setProducts(data.data); // Set the products with counts directly
                } else {
                    alert("⚠ Unexpected API response format.");
                }
            } catch (error) {
                console.error("❌ Error fetching products:", error);
                alert("⚠ Unable to fetch products. Please check your internet connection or try again later.");
            } finally {
                setIsLoading(false); // Set loading to false after fetching
            }
        };
        
        
        useEffect(() => {
            if (typeof window !== "undefined") {
              const storedUser = JSON.parse(localStorage.getItem("user"));
              const token = localStorage.getItem("token");
          
              if (!storedUser || storedUser.role !== "admin") {
                if (token) {
                  router.push("/");
                }
              } else {
                setUser(storedUser);
              }
          
              fetchStats();
              fetchProducts();
            }
          }, [router]);
          

    const fetchStats = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Accept": "application/json"
                }
            });

            const text = await response.text();
            console.log("API Response:", text);
            const data = JSON.parse(text);
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
      }, [searchQuery]);

      
    return (
        <>
            <Toaster />
            <Head>
                <title>Admin Dashboard | Gown Rental</title>
                <meta name="description" content="Manage your profile and settings on Gown Rental." />
                <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
            </Head>

            <div className={`${darkMode ? "dark" : ""} flex h-screen bg-white dark:bg-[#0F172A]`}>
                {/* Floating burger (mobile only) */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className={`fixed top-2 left-4 z-50 bg-pink-600 text-white p-3 rounded-full shadow-lg ${
                        isSidebarOpen ? "hidden" : "block"
                        } md:hidden`}
                    >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            )}

            {/* ✅ Dark overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
            <div
                className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
            />
            )}


                <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className={`flex-1 transition-all duration-300 md:${isSidebarOpen ? "ml-60" : "ml-16"} min-w-0`}>
                  <Header isSidebarOpen={isSidebarOpen} />


                    <main className="p-6 mt-10">
                        
                        <nav className="my-6 flex px-5 py-3 text-gray-700 rounded-lg bg-gray-50 dark:bg-[#1E293B]" aria-label="Breadcrumb">
                            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                                <li className="inline-flex items-center">
                                    <a href="#" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                        </svg>
                                        Home
                                    </a>
                                </li>
                                <li>
                                    <div className="flex items-center">
                                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                        </svg>
                                        <a href="#" className="ml-1 text-sm font-medium text-gray-700 hover:text-gray-900 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                                            Dashboard
                                        </a>
                                    </div>
                                </li>
                            </ol>
                        </nav>

                        {/* === STATS + CALENDAR Section === */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-5 items-start">
                        {/* 🟣 Cards Section: 2 columns on large screens */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                            { title: "Total Users", value: stats.users, icon: <HiUsers className="text-5xl text-pink-600" /> },
                            { title: "Total Products", value: stats.products, icon: <HiCube className="text-5xl text-pink-600" /> },
                            { title: "Total Revenue", value: `₱${Number(stats.totalRevenue || 0).toLocaleString("en-PH")}`, icon: <span className="text-5xl text-pink-600 font-bold">₱</span> },
                            { title: "Total Bookings", value: stats.bookings, icon: <HiClipboardList className="text-5xl text-pink-600" /> },
                            { title: "Pending Bookings", value: stats.pendingBookings, icon: <HiClock className="text-5xl text-pink-600" /> },
                            { title: "Completed Bookings", value: stats.completedBookings, icon: <HiCheckCircle className="text-5xl text-pink-600" /> },
                            ].map((item, index) => (
                                <div
                                key={index}
                                className="bg-pink-100 shadow-md p-6 rounded-lg flex flex-col items-center transition-transform duration-300 hover:shadow-2xl hover:scale-[1.03] cursor-pointer"
                              >
                                {item.icon}
                                <h2 className="text-xl font-bold text-gray-700 text-center mt-2">{item.title}</h2>
                                <p className="text-2xl font-bold">{item.value}</p>
                            </div>
                            ))}
                        </div>

                        {/* 🗓️ Calendar Section */}
                        <div className="lg:col-span-1 h-full min-h-[800px] flex">
                        <BookingCalendar />
                    </div>
                    </div>



                        {/* Available Gowns Section */}
                        
                        {/* 📊 Admin Analytics Section (embedded here!) */}
                        <AdminAnalyticsSection isSidebarOpen={isSidebarOpen} />

                        <section className="mt-10">
                        <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                Products – Gowns
                            </h2>
                            
                            {/* 💅 Styled Search Input with Icon */}
                            <div className="relative flex items-center w-full sm:w-80">
                                <input
                                type="text"
                                placeholder="Search gowns..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-5 pr-12 py-2 rounded-full border border-pink-200 focus:ring-2 focus:ring-pink-300 text-sm shadow-sm"
                                />
                                <button
                                type="button"
                                className="absolute right-1 top-1 bottom-1 bg-pink-700 hover:bg-pink-800 text-white rounded-full p-2 transition"
                                disabled // 🔍 Optional: remove `disabled` if you want a click-to-search function
                                >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-4.35-4.35M16 10a6 6 0 11-12 0 6 6 0 0112 0z"
                                    />
                                </svg>
                                </button>
                            </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isLoading ? (
                                <p className="text-gray-500">Loading products...</p> // Show loading message
                            ) : paginatedProducts.length > 0 ? (
                                paginatedProducts.map((product) => (
                                    <div key={product.id} className="bg-white p-4 rounded-lg shadow-md transition-transform duration-300 hover:shadow-2xl hover:scale-[1.03] cursor-pointer">
                                        <div className="relative w-full h-48 md:h-64 flex justify-center items-center">
                                            {product.image_url ? (
                                                <Image 
                                                    src={product.image_url} 
                                                    alt={product.name} 
                                                    width={200} 
                                                    height={400} 
                                                    style={{ borderRadius: '0.5rem', objectFit: 'cover' }} 
                                                />

                                            ) : (
                                                <p>No Image Available</p>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold mt-3">{product.name}</h3>
                                        <p className="text-gray-600">{product.category}</p>
                                        <p className="text-xl font-bold text-red-500">
                                            {product.discounted_price ? (
                                                <>
                                                    <span className="line-through text-gray-500">₱{Number(product.price).toLocaleString("en-PH")}</span>{" "}
                                                    <span className="text-green-600">₱{Number(product.discounted_price).toLocaleString("en-PH")}</span>
                                                </>
                                            ) : (
                                                `₱${Number(product.price).toLocaleString("en-PH")}`
                                            )}
                                        </p>

                                        <p className="text-gray-600">
                                            Successful Bookings: <span className="font-bold text-green-600">{product.approved_bookings}</span>
                                        </p>
                                        {product.size_stocks && Object.entries(product.size_stocks).map(([sizes, count]) => (
                                        <p key={sizes} className="text-gray-600">
                                            Stock for {sizes}: <span className="font-bold">{count}</span>
                                        </p>
                                        ))}

                                        <p className={`text-lg font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {product.stock_status}
                                        </p>

                                        <div className="flex items-center space-x-4">
                                            {/* Wishlist Count with Tooltip */}
                                            <div className="relative group flex items-center space-x-1">
                                                <HiHeart className="text-red-500 text-2xl" />
                                                <span className="text-lg font-semibold text-gray-600">{product.wishlist_count}</span>
                                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition duration-300">
                                                    This is the total times this product was added to wishlists.
                                                    <div className="tooltip-arrow" data-popper-arrow></div>
                                                </div>
                                            </div>

                                            {/* Favorite Count with Tooltip */}
                                            <div className="relative group flex items-center space-x-1">
                                                <HiStar className="text-yellow-500 text-2xl" />
                                                <span className="text-lg font-semibold text-gray-600">{product.favorite_count}</span>
                                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition duration-300">
                                                    This is the total times this product was favorited.
                                                    <div className="tooltip-arrow" data-popper-arrow></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No products available.</p>
                            )}
                        </div>

                            {/* Pagination Controls */}
                        <div className="flex justify-center mt-8 space-x-4">
                            <button
                                className={`px-4 py-2 rounded-lg font-semibold ${
                                    currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-pink-600 text-white hover:bg-pink-700"
                                }`}
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span className="text-lg font-semibold text-pink-600">{currentPage} / {totalPages}</span>
                            <button
                                className={`px-4 py-2 rounded-lg font-semibold ${
                                    currentPage === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-pink-600 text-white hover:bg-pink-700"
                                }`}
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                        </div>
                        </section>
                    </main>
                </div>
            </div>
        </>
    );
}
