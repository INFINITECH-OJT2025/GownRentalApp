"use client";

import Head from "next/head";
import AuthGuard from "../components/AuthGuard";
import Navbar from "../components/Navbar"; // ✅ Navbar Component
import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "react-data-table-component"; // ✅ Import DataTable
import { useRouter } from "next/navigation";
import AdminPaymentDetails from "../components/AdminPaymentDetails";

export default function BookHistoryPage() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

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

    setUploading(true);
    const formData = new FormData();
    formData.append("receipt", selectedFile);
    formData.append("booking_id", selectedBookingId);

    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            "http://127.0.0.1:8000/api/bookings/upload-receipt",
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        if (response.data.success) {
            alert("✅ Receipt uploaded successfully!");
            window.location.reload(); // ✅ Refresh page to update receipt status
        } else {
            alert("❌ Failed to upload receipt. Please try again.");
        }
    } catch (error) {
        console.error("Error uploading receipt:", error);
        alert("❌ An error occurred while uploading. Please try again.");
    } finally {
        setUploading(false);
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

    setSelectedProduct({
        ...product,
        voucherFee: voucherFee || 0, // ✅ Include voucher fee
        startDate: product.start_date || null,
        endDate: product.end_date || null,
    });

    setShowProductModal(true);
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
            cell: (row) => (
                <span
                    className={`px-3 py-1 text-white font-semibold rounded-full ${
                        row.status === "pending"
                            ? "bg-yellow-500"
                            : row.status === "canceled"
                            ? "bg-red-500"
                            : "bg-green-500"
                    }`}
                >
                    {row.status}
                </span>
            ),
        },
        {
            name: "Created Date",
            selector: (row) => new Date(row.created_at).toLocaleString(),
            sortable: true,
        },

        {
            name: "Actions",
            cell: (row) => (
                <div className="flex space-x-2">
                    {/* 👁 View Product Details */}
                    {row.product ? (
                        <button
                            className="px-3 py-1 bg-pink-600 text-white rounded hover:bg-pink-700 transition"
                            onClick={() => handleShowProduct(row.product)}
                        >
                            👁 View Product
                        </button>
                    ) : (
                        <button className="px-3 py-1 bg-gray-400 text-gray-700 rounded cursor-not-allowed" disabled>
                            ⚠ No Product
                        </button>
                    )}
    
                    {/* 📄 View Receipt */}
                    {row.gcash_receipt ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShowReceipt(row.gcash_receipt);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                            📄 Receipt
                        </button>
                    ) : (
                        <>
                            {/* Upload File Input */}
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
                                className={`px-3 py-1 text-black rounded cursor-pointer transition ${
                                    row.status === "canceled"
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-orange-600 hover:bg-orange-700"
                                }`}
                            >
                                📤 Upload
                            </label>
    
                            {/* Upload Button */}
                            {selectedBookingId === row.id && selectedFile && (
                                <button
                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition ml-2"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                >
                                    {uploading ? "Uploading..." : "Upload"}
                                </button>
                            )}
                        </>
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
                        <option value="canceled">❌ Canceled</option>
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
                        <div className="relative bg-white p-4 rounded-lg shadow-lg max-w-lg w-full">
                            <button className="absolute top-2 right-2 text-gray-700 text-xl font-bold hover:text-red-600 transition" onClick={closeReceiptModal}>
                                ✖
                            </button>
                            <img src={receiptUrl} alt="Receipt" className="w-full rounded-lg" />
                        </div>
                    </div>
                )}
            </div>
        </AuthGuard>
    );
}