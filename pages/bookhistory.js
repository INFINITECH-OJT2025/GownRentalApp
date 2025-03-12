"use client";

import Head from "next/head";
import AuthGuard from "../components/AuthGuard";
import Navbar from "../components/Navbar"; 
import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { useRouter } from "next/navigation";
import AdminPaymentDetails from "../components/AdminPaymentDetails";
import ChatWidget from "../components/ChatWidget"; 

export default function BookHistoryPage() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [loadingAction, setLoadingAction] = useState(null);

    // ✅ Modal States
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState("");

    const router = useRouter();
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [uploading, setUploading] = useState(false);

const handleFileChange = (event, bookingId) => {
    setSelectedFile(event.target.files[0]);
    setSelectedBookingId(bookingId);
};

const handleUpload = async () => {
    if (!selectedFile) {
        alert("⚠ Please select a receipt image to upload.");
        return;
    }

    if (!selectedBookingId) {
        alert("❌ Booking ID is missing!");
        return;
    }

    setLoadingAction(selectedBookingId); // ✅ Start loading state
    setUploading(true);

    const formData = new FormData();
    formData.append("receipt", selectedFile);
    formData.append("booking_id", selectedBookingId);

    try {
        const token = localStorage.getItem("token");
        await axios.post("http://127.0.0.1:8000/api/bookings/upload-receipt", formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        });

        alert("✅ Receipt uploaded successfully!");
        window.location.reload();
    } catch (error) {
        console.error("Upload Error:", error.response?.data || error);
        alert("❌ Upload failed. Please try again.");
    } finally {
        setUploading(false);
        setLoadingAction(null); // ✅ Stop loading state
    }
};



useEffect(() => {
    const fetchBookings = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await axios.get("http://127.0.0.1:8000/api/user/bookings", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setBookings(response.data.bookings);
                setFilteredBookings(response.data.bookings);
            }
        } catch (error) {
            console.error("API Error:", error.message);
        }
    };

    fetchBookings();
}, []);


const handleShowProduct = (product, voucherFee) => {
    if (!product) {
        alert("⚠ Product details not available.");
        return;
    }

    setLoadingAction(product.id); // ✅ Start loading state

    setTimeout(() => {
        setSelectedProduct({
            ...product,
            voucherFee: voucherFee || 0,
            startDate: product.start_date || null,
            endDate: product.end_date || null,
        });

        setShowProductModal(true);
        setLoadingAction(null); // ✅ Stop loading state
    }, 800); // Simulated delay for UI effect
};



    // ✅ Close Product Modal
    const closeProductModal = () => {
        setShowProductModal(false);
        setSelectedProduct(null);
    };

    const handleShowReceipt = (receipt) => {
        if (!receipt) {
            alert("❌ No receipt found!");
            return;
        }
        setReceiptUrl(`http://127.0.0.1:8000/storage/${receipt}`);
        setShowReceiptModal(true);
    };
    

    // ✅ Close Receipt Modal
    const closeReceiptModal = () => {
        setShowReceiptModal(false);
        setReceiptUrl("");
    };

    useEffect(() => {
        let filtered = bookings;

        if (searchTerm) {
            filtered = filtered.filter(
                (booking) =>
                    booking.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (booking.product && booking.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (filterStatus) {
            filtered = filtered.filter((booking) => booking.status === filterStatus);
        }

        setFilteredBookings(filtered);
    }, [searchTerm, filterStatus, bookings]);

    const columns = [
        {
            name: "Reference #",
            selector: (row) => row.reference_number,
            sortable: true,
        },
        {
            name: "Product",
            selector: (row) => row.product?.name || "N/A",
            sortable: true,
        },
        {
            name: "Start Date",
            selector: (row) => row.start_date,
            sortable: true,
        },
        {
            name: "End Date",
            selector: (row) => row.end_date,
            sortable: true,
        },
        {
            name: "Basic Price",
            selector: (row) => `₱${Number(row.product?.price).toLocaleString()}`,
            sortable: true,
            sortable: true,
        },
        {
            name: "Discounted Price",
            selector: (row) => `₱${Number(row.product?.discounted_price).toLocaleString()}`,
            sortable: true,
            sortable: true,
        },
        {
            name: "Added Price",
            selector: (row) => `₱${Number(row.added_price).toLocaleString()}`,
            sortable: true,
        },
        {
            name: "Voucher Fee", 
            selector: (row) => `₱${Number(row.voucher_fee || 0).toLocaleString()}`, 
            sortable: true,
        },
        {
            name: "Total Price",
            selector: (row) => `₱${Number(row.total_price).toLocaleString()}`,
            sortable: true,
        },
        {
            name: "Status",
            selector: (row) => row.status,
            sortable: true,
            width: "180px", // ✅ Adjusted column width
            cell: (row) => (
                <span
                    className={`px-5 py-2 text-white font-semibold rounded-full flex justify-center items-center text-center w-full ${
                        row.status === "pending"
                            ? "bg-yellow-500"
                            : row.status === "canceled"
                            ? "bg-red-500"
                            : row.status === "returned"
                            ? "bg-blue-500"
                            : row.status === "picked up"
                            ? "bg-purple-500"
                            : "bg-green-500"
                    }`}
                    style={{ minWidth: "15px" }} // ✅ Ensures a minimum width
                >
                    {row.status}
                </span>
            ),
        },
        {
            name: "Created Date",
            selector: (row) => new Date(row.created_at).toLocaleString(),
            sortable: true,
            width: "140px", // ✅ Increased width
            cell: (row) => (
                <span className="whitespace-nowrap px-3">
                    {new Date(row.created_at).toLocaleString()}
                </span>
            ),
        },
        
        {
            name: "Actions",
            selector: (row) => row.actions, 
            center: true, 
            width: "300px", 
            cell: (row) => (
                <div className="flex flex-col items-center justify-center gap-2 w-full">
                    
                    {/* 👁 View Product */}
                    <button
                        className={`w-44 px-6 py-2 text-white rounded-lg text-lg transition ${
                            loadingAction === row.product?.id ? "bg-gray-500 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700"
                        }`}
                        onClick={() => row.product && handleShowProduct(row.product)}
                        disabled={!row.product || loadingAction === row.product?.id}
                    >
                        {loadingAction === row.product?.id ? "Loading..." : "👁 View"}
                    </button>
        
                    {/* 📤 Upload Receipt */}
                    {row.gcash_receipt ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShowReceipt(row.gcash_receipt);
                            }}
                            className="w-44 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg"
                        >
                            📄 View Receipt
                        </button>
                    ) : (
                        <>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`file-upload-${row.id}`}
                                onChange={(event) => handleFileChange(event, row.id)}
                                disabled={row.status === "canceled"}
                            />
                            <label
                                htmlFor={`file-upload-${row.id}`}
                                className={`w-44 px-6 py-2 text-lg text-black text-center cursor-pointer transition 
                                bg-gradient-to-b from-white to-orange-600 hover:to-orange-700 ${
                                    row.status === "canceled" ? "bg-gray-400 cursor-not-allowed" : ""
                                }`}
                            >
                                📤 Upload
                            </label>
        
                            {/* ✅ Show Save Button After Selecting a File */}
                            {selectedFile && selectedBookingId === row.id && (
                                <button
                                    onClick={handleUpload}
                                    className={`w-44 px-6 py-2 text-white rounded-lg text-lg transition ${
                                        loadingAction === row.id ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                    disabled={loadingAction === row.id}
                                >
                                    {loadingAction === row.id ? "Uploading..." : "💾 Save Upload"}
                                </button>
                            )}
                        </>
                    )}
        
                    {/* ⭐ Review Product */}
                    {row.status === "returned" ? (
                        <button
                            onClick={() => {
                                setLoadingAction(row.id); // ✅ Start loading state
                                router.push(`/products/${row.product.id}`);
                            }}
                            className={`w-44 px-6 py-2 text-white rounded-lg text-lg transition ${
                                loadingAction === row.id ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                            disabled={loadingAction === row.id}
                        >
                            {loadingAction === row.id ? "Loading..." : "⭐ Review"}
                        </button>
                    ) : (
                        <button
                            className="w-44 px-6 py-2 bg-gray-400 text-gray-700 rounded-lg cursor-not-allowed text-lg"
                            disabled
                        >
                            🚫 Review
                        </button>
                    )}
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
        },        
        
    ];
    
    return (
        <AuthGuard>
            <Head>
                <title>Booking History | Gown Rental</title>
            </Head>

            <div className="min-h-screen bg-pink-50 text-gray-800 font-poppins">
                <Navbar />
    
                {/* Page Header - Adjusted for More Spacing */}
                <section className="relative bg-gradient-to-r from-pink-300 via-pink-200 to-pink-100 text-center py-20 md:py-24">
                    <h1 className="text-3xl font-bold text-pink-900">Booking History</h1>
                    <h4 className="text-1xl font text-pink-900">View past bookings</h4>
                </section>
    
                {/* Search & Filter Section */}
                <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-16 mt-6 space-y-4 md:space-y-0">
                    {/* 🔎 Search by Reference Number */}
                    <input
                        type="text"
                        placeholder="🔎 Search by Reference #"
                        className="border p-2 rounded w-full md:w-1/3"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
    
                    {/* 🔽 Filter by Status */}
                      <select
                        className="border p-2 rounded w-full md:w-1/4"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">📌 All Status</option>
                        <option value="pending">🟡 Pending</option>
                        <option value="approved">✅ Approved</option>
                        <option value="picked up">🟣 Picked Up</option> {/* ✅ Added Picked Up Status */}
                        <option value="canceled">❌ Canceled</option>
                        <option value="returned">✅ Returned</option>
                    </select>

                </div>

                {/* Booking Table */}
                <section className="py-10 px-6 md:px-16">
                    <DataTable
                        title="Your Bookings"
                        columns={columns}
                        data={filteredBookings}
                        pagination
                        highlightOnHover
                        responsive
                    />
                </section>

                {/* 🏷 Product Details Modal */}
                    {showProductModal && selectedProduct && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                            <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-lg w-full text-center">
                                <button
                                    className="absolute top-2 right-2 text-gray-700 text-xl font-bold hover:text-red-600 transition"
                                    onClick={closeProductModal}
                                >
                                    ✖
                                </button>
                                <h2 className="text-2xl font-semibold text-gray-800">Product Details</h2>
                                <div className="mt-4 text-lg">
                                    <p><strong>Name:</strong> {selectedProduct.name}</p>
                                    <p><strong>Description:</strong> {selectedProduct.description || "No description available."}</p>
                                </div>
                                  <AdminPaymentDetails />
                            </div>
                        </div>
                    )}
                    {/* 🖼 Receipt Modal */}
                    {showReceiptModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                            <div className="relative bg-white p-4 rounded-lg shadow-lg w-[300px] h-[300px] flex items-center justify-center">
                                <button 
                                    className="absolute top-2 right-2 text-gray-700 text-lg font-bold hover:text-red-600 transition" 
                                    onClick={closeReceiptModal}
                                >
                                    ✖
                                </button>
                                <img 
                                    src={receiptUrl} 
                                    alt="Receipt" 
                                    className="w-[250px] h-[250px] object-cover rounded-md"
                                />
                            </div>
                        </div>
                    )}
            </div>
             <ChatWidget />
        </AuthGuard>
    );
}