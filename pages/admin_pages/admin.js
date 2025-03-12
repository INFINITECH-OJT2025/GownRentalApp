"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminSidebar from "../../components/AdminSidebar";
import Head from "next/head";
import ChatWidgetPage from "../../components/chat";
import { toast, Toaster } from "react-hot-toast";

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [stats, setStats] = useState({ users: 0, products: 0, totalRevenue: 0 });
    const [products, setProducts] = useState([]);
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
            try {
                const response = await fetch("http://127.0.0.1:8000/api/products", {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                        "Accept": "application/json"
                    }
                });
        
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
        
                const data = await response.json();
                console.log("📡 API Response (Products):", data);
        
                if (data.success && Array.isArray(data.data)) {
                    const formattedProducts = await Promise.all(
                        data.data.map(async (product) => {
                            const approvedBookings = await fetchApprovedBookingCount(product.id); // ✅ Fetch approved bookings
                            return {
                                ...product,
                                approved_bookings: approvedBookings,
                                image_url: product.image_url.startsWith("http")
                                    ? product.image_url
                                    : `http://127.0.0.1:8000/storage/${product.image}`
                            };
                        })
                    );
        
                    setProducts([...formattedProducts]);
                    console.log("Updated Products State:", formattedProducts);
                } else {
                    alert("⚠ Unexpected API response format. Please try again later.");
                }
            } catch (error) {
                console.error("❌ Error fetching products:", error);
                alert("⚠ Unable to fetch products. Please check your internet connection or try again later.");
            }
        };
        
        
        const fetchApprovedBookingCount = async (productId) => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/product/${productId}/approved-bookings`, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                        "Accept": "application/json"
                    }
                });
        
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
        
                const data = await response.json();
                console.log(`📡 API Response for product ${productId}:`, data);
        
                return data.approved_bookings || 0; // ✅ Ensure count is correct
            } catch (error) {
                console.error(`❌ Error fetching approved bookings for product ${productId}:`, error);
                
                // ✅ Show a user-friendly Windows-style alert
                alert(`⚠ Unable to fetch approved bookings for product ${productId}. Please check your internet connection or try again later.`);
                
                return 0; // ✅ Return 0 instead of crashing the app
            }
        };
        
        useEffect(() => {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            const token = localStorage.getItem("token");
        
            if (!storedUser || storedUser.role !== "admin") {
                if (token) {  
                    router.push("/"); // ✅ Redirects to `/` only if there's an active session
                }
            } else {
                setUser(storedUser);
            }

              // Fetch statistics and available products
              fetchStats();
              fetchProducts(); // ✅ This is now defined, so no more error

        }, [router]);


    const fetchStats = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/dashboard/stats", {
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

    

   

    return (
        <>
            <Toaster />
            <Head>
                <title>Admin Dashboard | Gown Rental</title>
                <meta name="description" content="Manage your profile and settings on Gown Rental." />
                <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
            </Head>

            <div className={`${darkMode ? "dark" : ""} flex h-screen bg-white dark:bg-[#0F172A]`}>
                <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
                    <header className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
                        <h1 className="text-lg font-bold dark:text-white mr-auto">Gown Rental</h1>
                    </header>

                    <main className="p-6 mt-16">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
                                <h2 className="text-xl font-bold">Total Users</h2>
                                <p>{stats.users}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
                                <h2 className="text-xl font-bold">Total Products</h2>
                                <p>{stats.products}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
                                <h2 className="text-xl font-bold">Total Revenue</h2>
                                <p>₱{Number(stats.totalRevenue || 0).toLocaleString("en-PH")}</p>
                            </div>
                        </div>

                        {/* Available Gowns Section */}
                        <section className="mt-10">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Products - Gowns</h2>
                                <input
                                    type="text"
                                    placeholder="Search gowns..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:ring focus:ring-pink-300"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedProducts.length > 0 ? (
                                    paginatedProducts.map((product) => (
                                        <div key={product.id} className="bg-white p-4 rounded-lg shadow-md">
                                           <div className="relative w-full h-48 md:h-64 flex justify-center items-center">
                                                                                  {product.image ? (
                                                                                  <Image 
                                                                                   src={`http://127.0.0.1:8000/storage/${product.image}`} 
                                                                                   alt={product.name}
                                                                                   width={200}
                                                                                   height={400}
                                                                                   className="rounded-lg object-cover"
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
                                                Approved Bookings: <span className="font-bold text-green-600">{product.approved_bookings}</span>
                                            </p>
                                            <p className="text-gray-600">
                                                Stock: <span className="font-bold">{product.stock}</span>
                                            </p>
                                            <p className={`text-lg font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {product.stock_status}
                                            </p>
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

                        </section>

                    </main>
                </div>
            </div>
            <ChatWidgetPage />
        </>
    );
}
