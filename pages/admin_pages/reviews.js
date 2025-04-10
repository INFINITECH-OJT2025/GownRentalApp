"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Star, ArrowRightCircle } from "lucide-react";
import Head from "next/head";
import toast from "react-hot-toast";
import Header from "../../components/Header";

export default function Reviews() {
    const [reviews, setReviews] = useState([]);
     const [darkMode, setDarkMode] = useState(false);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [reply, setReply] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRating, setSelectedRating] = useState(null); // ⭐ Selected rating filter
    const [isReplying, setIsReplying] = useState({}); // ✅ Track loading state for each reply button
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
    const [activeReplyReview, setActiveReplyReview] = useState(null);
    const [openingReplyId, setOpeningReplyId] = useState(null); // Tracks which "Reply" button is loading
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewedReview, setViewedReview] = useState(null);
    const [isAdminReplyModalOpen, setIsAdminReplyModalOpen] = useState(false);
    const [viewedAdminReply, setViewedAdminReply] = useState(null);

    
    useEffect(() => {
        fetchReviews();
    }, []);

    // ✅ Fetch Reviews from API
    const fetchReviews = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Unauthorized: No token found.");
                return;
            }

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reviews`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                console.log("Review booking sizes", response.data.reviews.map(r => r.booking?.sizes));
                setReviews(response.data.reviews);
                setFilteredReviews(response.data.reviews);
            } else {
                setError("Failed to fetch reviews.");
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
            setError("Error fetching reviews.");
        }
    };

    // ✅ Handle Admin Reply
    const handleReplyChange = (reviewId, text) => {
        setReply({ ...reply, [reviewId]: text });
    };

    const submitReply = async (reviewId) => {
        const replyText = reply[reviewId]?.trim();
    
        if (!replyText) {
            toast.error("Reply cannot be empty.", {
                duration: 3000,
                position: "top-right",
            });
            return;
        }
    
        setIsReplying((prev) => ({ ...prev, [reviewId]: true }));
    
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized: No token found.");
                return;
            }
    
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/reviews/${reviewId}/reply`,
                { reply: replyText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                toast.success("Reply submitted successfully!", {
                    duration: 3000,
                    position: "top-right",
                });
                fetchReviews();
            } else {
                toast.error("Failed to submit reply.", {
                    duration: 3000,
                    position: "top-right",
                });
            }
        } catch (error) {
            console.error("Error submitting reply:", error);
            toast.error("Error submitting reply. Please try again.", {
                duration: 3000,
                position: "top-right",
            });
        } finally {
            setIsReplying((prev) => ({ ...prev, [reviewId]: false }));
        }
    };
    
    
    // ✅ Filter Logic (Search & Rating)
    useEffect(() => {
        let filteredData = reviews.filter((review) =>
            (review.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (review.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (review.comment || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (review.admin_reply || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.rating.toString().includes(searchTerm)
        );

        // ⭐ Filter by selected rating if any rating button is clicked
        if (selectedRating !== null) {
            filteredData = filteredData.filter((review) => review.rating === selectedRating);
        }

        setFilteredReviews(filteredData);
    }, [searchTerm, reviews, selectedRating]);

    // ✅ Rating Filter Buttons
    const ratingCounts = [5, 4, 3, 2, 1]; // Ratings to filter
    const getTotalCount = (rating) => reviews.filter((review) => review.rating === rating).length;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).replace(/ /g, "-"); // ✅ Convert spaces to dashes
    };

    const columns = [
        { name: "Customer", selector: (row) => row.user?.name || "Anonymous", sortable: true },
        { name: "Product", selector: (row) => row.product?.name || "Unknown Product", sortable: true },
        { name: "Product Size", selector: (row) => row.booking?.sizes || "Unknown Size", sortable: true },
        { 
            name: "Rating", 
            cell: (row) => (
                <div className="flex">
                    {[...Array(row.rating)].map((_, i) => (
                        <Star key={i} size={18} className="text-yellow-400" />
                    ))}
                </div>
            ),
            sortable: true 
        },
        { 
            name: "Created Date", 
            selector: (row) => formatDate(row.created_at), 
            sortable: true 
        }, 
        {
            name: "Comment",
            cell: (row) => {
              const words = row.comment?.split(" ") || [];
              const preview = words.slice(0, 10).join(" ");
              const isLong = words.length > 10;
          
              return (
                <div>
                  {preview}
                  {isLong && (
                    <button
                      className="text-blue-500 underline ml-1"
                      onClick={() => {
                        setViewedReview(row);
                        setIsViewModalOpen(true);
                      }}
                    >
                      ...See more
                    </button>
                  )}
                </div>
              );
            },
            sortable: false,
          },          
          
          {
            name: "Admin Reply", 
            cell: (row) => {
                const words = row.admin_reply?.split(" ") || [];
                const preview = words.slice(0, 10).join(" ");
                const isLong = words.length > 10;
            
                return (
                    <div>
                        {row.admin_reply ? (
                            <>
                                {preview}
                                {isLong && (
                                    <button
                                        className="text-blue-500 underline ml-1"
                                        onClick={() => {
                                            setViewedAdminReply(row.admin_reply);
                                            setIsAdminReplyModalOpen(true);
                                        }}
                                    >
                                        ...See more
                                    </button>
                                )}
                            </>
                        ) : (
                            "No reply yet"
                        )}
                    </div>
                );
            },
            sortable: false 
        },        
        {
            name: "Action",
            cell: (row) => (
                <button
                    className={`flex items-center gap-2 px-3 py-1 rounded font-semibold ${
                        openingReplyId === row.id
                            ? "bg-yellow-300 text-yellow-800 cursor-not-allowed"
                            : "bg-yellow-400 hover:bg-yellow-500 text-white"
                    }`}
                    disabled={openingReplyId === row.id}
                    onClick={() => {
                        setOpeningReplyId(row.id); // Start loading
                        setTimeout(() => {
                            setActiveReplyReview(row);
                            setIsReplyModalOpen(true);
                            setOpeningReplyId(null); // Stop loading
                        }, 300); // Simulate small delay for smooth UX
                    }}
                >
                    {openingReplyId === row.id ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            <span className="text-sm">Loading...</span>
                        </>
                    ) : (
                        <>
                            <ArrowRightCircle size={18} /> Reply
                        </>
                    )}
                </button>
            ),
            sortable: false,
        }
        
    ];
    
    return (
        <>
        <Head>
        <title>Customer Reviews | Gown Rental</title> {/* ✅ Dynamic Title */}
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

                <main className="p-6 mt-16 w-full overflow-x-auto">
                <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-3 md:mb-0">Customer Reviews</h1>

                    {error && <p className="text-red-500">{error}</p>}

                   {/* ⭐ Responsive Rating Filter Buttons */}
                       {/* ⭐ Filter + Search Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 mt-5">

                    {/* ⭐ Rating Filter Buttons */}
                    <div className="flex flex-wrap gap-2">
                    <button 
                        className={`px-4 py-2 rounded text-white font-bold ${
                        selectedRating === null ? "bg-gray-600" : "bg-gray-400 hover:bg-gray-500"
                        }`} 
                        onClick={() => setSelectedRating(null)}
                    >
                        All
                    </button>
                    {ratingCounts.map((rating) => (
                        <button
                        key={rating}
                        className={`flex items-center px-4 py-2 rounded text-white font-bold ${
                            selectedRating === rating ? "bg-yellow-600" : "bg-yellow-400 hover:bg-yellow-500"
                        }`}
                        onClick={() => setSelectedRating(rating)}
                        >
                        ⭐ {rating} ({getTotalCount(rating)})
                        </button>
                    ))}
                    </div>

                    {/* ✅ Search Input */}
                    <div className="relative flex items-center w-full sm:w-80">
                    <input
                        type="text"
                        placeholder="Search Reviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-5 pr-12 py-2 rounded-full border border-pink-200 focus:ring-2 focus:ring-pink-300 text-sm shadow-sm"
                    />
                    <button
                        type="button"
                        className="absolute right-1 top-1 bottom-1 bg-pink-700 hover:bg-pink-800 text-white rounded-full p-2 transition"
                        disabled
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
                    <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="overflow-x-auto"> {/* ✅ Ensures horizontal scroll only when needed */}
                        <DataTable 
                            title="Customer Reviews" 
                            columns={columns} 
                            data={filteredReviews} 
                            pagination 
                            highlightOnHover
                            className="w-full min-w-[1024px]" // ✅ Ensures the table is wide enough for mobile and desktop
                        />

                        {isReplyModalOpen && activeReplyReview && (
                            <div 
                                className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                                onClick={() => setIsReplyModalOpen(false)}
                            >
                                <div 
                                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 relative"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* ❌ Close Button */}
                                    <button 
                                        className="absolute top-3 right-3 text-gray-700 dark:text-white hover:text-red-600"
                                        onClick={() => setIsReplyModalOpen(false)}
                                    >
                                        ✖
                                    </button>

                                    <h2 className="text-lg font-semibold mb-2 dark:text-white">Reply to Review</h2>
                                    <div className="mt-4 px-6 pb-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>
                                    <p className="text-sm mb-2 text-gray-600 dark:text-gray-300">
                                        <strong>Product:</strong> {activeReplyReview.product?.name || "Unknown"}
                                    </p>
                                    <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
                                        <strong>Customer:</strong> {activeReplyReview.user?.name || "Anonymous"}
                                    </p>

                                    <textarea
                                        className="border p-2 rounded w-full dark:bg-gray-700 dark:text-white"
                                        placeholder="Reply here..."
                                        value={reply[activeReplyReview.id] || ""}
                                        onChange={(e) => handleReplyChange(activeReplyReview.id, e.target.value)}
                                    ></textarea>

                                    <button
                                        className={`mt-4 w-full py-2 rounded flex items-center justify-center gap-2 ${
                                            isReplying[activeReplyReview.id]
                                                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                                : "bg-yellow-500 hover:bg-yellow-600 text-white"
                                        }`}
                                        onClick={() => submitReply(activeReplyReview.id)}
                                        disabled={isReplying[activeReplyReview.id]}
                                    >
                                        {isReplying[activeReplyReview.id] ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                                </svg>
                                                <span className="ml-2">Replying...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRightCircle size={18} /> <span>Submit Reply</span>
                                            </>
                                        )}
                                    </button>
                                    </div>
                                </div>
                            </div>
                        )}


                {isViewModalOpen && viewedReview && (
                <div
                    className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 overflow-y-auto pt-10 pb-10"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 relative"
                    onClick={(e) => e.stopPropagation()}
                    >
                    {/* ❌ Close Button */}
                    <button
                        className="absolute top-3 right-3 text-gray-700 dark:text-white hover:text-red-600"
                        onClick={() => setIsViewModalOpen(false)}
                    >
                        ✖
                    </button>

                    <h2 className="text-lg font-semibold mb-2 dark:text-white">Review Details</h2>

                    <div className="mt-4 px-6 pb-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>
                    <p className="text-sm mb-2 text-gray-600 dark:text-gray-300">
                        <strong>Product:</strong> {viewedReview.product?.name || "Unknown"}
                    </p>
                    <p className="text-sm mb-2 text-gray-600 dark:text-gray-300">
                        <strong>Customer:</strong> {viewedReview.user?.name || "Anonymous"}
                    </p>
                    <p className="text-sm mb-4 text-gray-700 dark:text-gray-200 whitespace-pre-line">
                        <strong>Comment:</strong> {viewedReview.comment || "No comment"}
                    </p>
                    </div>
                    </div>
                </div>
                )}

                {isAdminReplyModalOpen && viewedAdminReply && (
                    <div 
                        className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 overflow-y-auto pt-10 pb-10"
                        onClick={() => setIsAdminReplyModalOpen(false)}
                    >
                        <div 
                            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button 
                                className="absolute top-3 right-3 text-gray-700 dark:text-white hover:text-red-600"
                                onClick={() => setIsAdminReplyModalOpen(false)}
                            >
                                ✖
                            </button>

                            <h2 className="text-lg font-semibold mb-2 dark:text-white">Admin Reply</h2>
                            <div className="mt-4 px-6 pb-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>
                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                                {viewedAdminReply}
                            </p>
                        </div>
                        </div>
                    </div>
                )}


                      </div>
                      </div>
                      </div>
                </main>
            </div>
        </div>
        </>
    );
}
