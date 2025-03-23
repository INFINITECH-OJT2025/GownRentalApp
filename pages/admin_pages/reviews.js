"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Star } from "lucide-react";
import Head from "next/head";

export default function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [reply, setReply] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRating, setSelectedRating] = useState(null); // ⭐ Selected rating filter
    const [isReplying, setIsReplying] = useState({}); // ✅ Track loading state for each reply button

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

            const response = await axios.get("http://127.0.0.1:8000/api/admin/reviews", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
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
        setIsReplying((prev) => ({ ...prev, [reviewId]: true })); // ✅ Start loading for this review
    
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Unauthorized: No token found.");
                return;
            }
    
            const response = await axios.post(
                `http://127.0.0.1:8000/api/admin/reviews/${reviewId}/reply`,
                { reply: reply[reviewId] },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                alert("✅ Reply submitted successfully!");
                fetchReviews(); // ✅ Refresh reviews
            } else {
                alert("❌ Failed to submit reply.");
            }
        } catch (error) {
            console.error("Error submitting reply:", error);
            alert("❌ Error submitting reply. Please try again.");
        } finally {
            setIsReplying((prev) => ({ ...prev, [reviewId]: false })); // ✅ Stop loading
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
        { name: "Comment", selector: (row) => row.comment, sortable: false },
        { 
            name: "Admin Reply", 
            selector: (row) => row.admin_reply || "No reply yet", 
            sortable: false 
        },
        {
            name: "Reply",
            cell: (row) => (
                <div>
                    <textarea
                        className="border p-2 rounded w-full"
                        placeholder="Reply here..."
                        value={reply[row.id] || ""}
                        onChange={(e) => handleReplyChange(row.id, e.target.value)}
                    ></textarea>
                  <button
                    className={`mt-2 px-4 py-1 rounded flex items-center justify-center transition ${
                        isReplying[row.id] 
                            ? "bg-gray-400 text-gray-600 cursor-not-allowed"  // ✅ Disabled state
                            : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                    onClick={() => submitReply(row.id)}
                    disabled={isReplying[row.id]} // ✅ Disable button while submitting
                >
                    {isReplying[row.id] ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            <span className="ml-2">Replying...</span>
                        </>
                    ) : (
                        <span>Reply</span>
                    )}
                </button>

                </div>
            ),
            sortable: false,
        },
    ];
    
    return (
        <>
        <Head>
        <title>Customer Reviews | Gown Rental</title> {/* ✅ Dynamic Title */}
        <meta name="description" content="Manage your profile and settings on Gown Rental." />
        <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
    </Head>
        <div className="flex h-screen bg-white dark:bg-[#0F172A]">
            {/* ✅ Sidebar */}
            <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* ✅ Main Content */}
            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-60" : "ml-16"} w-full overflow-x-hidden`}>
                <header className="fixed top-0 w-full flex items-center justify-between bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
                    <h1 className="text-lg font-bold dark:text-white">Customer Reviews</h1>
                </header>

                <main className="p-6 mt-16 w-full overflow-x-auto">
                    <h2 className="text-xl font-semibold mb-4">Manage Customer Reviews</h2>

                    {error && <p className="text-red-500">{error}</p>}

                   {/* ⭐ Responsive Rating Filter Buttons */}
                        <div className="flex flex-wrap gap-2 mb-4">
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
                    <div className="mb-4">
                        <input
                            type="text"
                            className="w-full p-3 border rounded-md dark:bg-[#1E293B] dark:text-white"
                            placeholder="Search by customer, product, rating, or comment..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
                      </div>
                      </div>

                </main>
            </div>
        </div>
        </>
    );
}
