"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import Link from "next/link";
import AuthGuard from "../components/AuthGuard";
import { FaTrash } from "react-icons/fa";
import DataTable from "react-data-table-component";
import Navbar from "../components/Navbar";
import Head from "next/head";
import { useWishlist } from "../context/WishlistContext";
import { toast } from "react-hot-toast";
import Footer from "../components/Footer";

export default function WishlistPage() {
    const { wishlist, setWishlist } = useWishlist(); // ✅ Correct variable names
    const [search, setSearch] = useState("");
    const [filteredWishlist, setFilteredWishlist] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]); // ✅ Track selected items
    const [isDeletingSelected, setIsDeletingSelected] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState(null); // Track deleting item ID
    
    useEffect(() => {
        fetchWishlist();
    }, []);

    // ✅ Fetch Wishlist Items
    const fetchWishlist = () => {
        const token = localStorage.getItem("token");
    
        if (!token) {
            console.error("No authentication token found. Please log in.");
            return;
        }
    
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/wishlist`, {            headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
            setWishlist(response.data.data || []);
            setFilteredWishlist(response.data.data || []);
        })
        .catch((error) => {
            console.error("Error fetching wishlist:", error);
            if (error.response?.status === 401) {
                alert("You must be logged in to view your wishlist.");
            }
        });
    };

    // ✅ Select/Deselect a single item
    const handleCheckboxChange = (productId) => {
        setSelectedItems((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId) // Remove if already selected
                : [...prev, productId] // Add if not selected
        );
    };

    // ✅ Select/Deselect All
    const handleSelectAll = () => {
        if (selectedItems.length === wishlist.length) {
            setSelectedItems([]); // Deselect all
        } else {
            setSelectedItems(wishlist.map(item => item.product.id)); // Select all
        }
    };

    const removeSelectedItems = async () => {
        if (selectedItems.length === 0) {
            toast.error("No items selected for deletion.", { position: "top-right" });
            return;
        }
    
        const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedItems.length} items from your wishlist?`);
        if (!confirmDelete) return;
    
        setIsDeletingSelected(true); // ✅ Start loading state
    
        const token = localStorage.getItem("token");
        if (!token) return  toast.error("You must be logged in to remove items.", { position: "top-right" });
    
        try {
            await Promise.all(
                selectedItems.map(productId =>
                    axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/wishlist/${productId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                )
            );
    
            setWishlist((prev) => prev.filter(item => !selectedItems.includes(item.product.id)));
            setFilteredWishlist((prev) => prev.filter(item => !selectedItems.includes(item.product.id)));
            setSelectedItems([]); 
            toast.success(`Deleted ${selectedItems.length} items from wishlist.`, { position: "top-right" });
        } catch (error) {
            console.error("Error removing selected items:", error);
            toast.error("Failed to remove selected items.", { position: "top-right" });
        } finally {
            setIsDeletingSelected(false); // ✅ Stop loading state
        }
    };
    
    const removeFromWishlist = async (productId) => {
        const confirmDelete = window.confirm("Are you sure you want to remove this item from your wishlist?");
        if (!confirmDelete) return;
    
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("You must be logged in to remove wishlist items.", { position: "top-right" });
            return;
        }
    
        setDeletingItemId(productId); // ✅ Start loading state for this item
    
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/wishlist/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            setWishlist((prev) => prev.filter(item => item.product.id !== productId));
    
            localStorage.setItem("wishlistUpdated", Date.now());
            window.dispatchEvent(new Event("storage"));
    
            toast.success("Item removed from wishlist.", { position: "top-right" });
        } catch (error) {
            console.error("❌ Error removing product:", error);
            toast.error(error.response?.data?.message || "An error occurred.", { position: "top-right" });
        } finally {
            setDeletingItemId(null); // ✅ Stop loading state
        }
    };
    
    const removeAllItems = async () => {
        if (wishlist.length === 0) {
            toast.error("Wishlist is already empty.", { position: "top-right" });
            return;
        }
    
        const confirmDelete = window.confirm("Are you sure you want to delete ALL items from your wishlist?");
        if (!confirmDelete) return;
    
        setIsDeletingAll(true); // ✅ Start loading state
    
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("You must be logged in to clear your wishlist.", { position: "top-right" });
        return;
        }

        try {
            const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/wishlist/clear`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            if (response.data.success) {
                setWishlist([]);
                setFilteredWishlist([]);
                setSelectedItems([]);
                toast.success("Wishlist cleared successfully.", { position: "top-right" });
            } else {
                toast.error("Failed to clear wishlist.", { position: "top-right" });
            }
        } catch (error) {
            console.error("Error clearing wishlist:", error);
            toast.error("Failed to clear wishlist. Please try again.", { position: "top-right" });
        } finally {
            setIsDeletingAll(false); // ✅ Stop loading state
        }
    };
    

    useEffect(() => {
        const result = wishlist.filter(item =>
            item?.product?.name?.toLowerCase().includes(search.toLowerCase()) || 
            item?.product?.price?.toString().includes(search)
        );
        setFilteredWishlist(result);
    }, [search, wishlist]);
    

    // 📌 Table Columns
    const columns = [
        {
            name: (
                <input
                    type="checkbox"
                    checked={selectedItems.length === wishlist.length && wishlist.length > 0}
                    onChange={handleSelectAll}
                />
            ),
            cell: (row) => (
                <input
                    type="checkbox"
                    checked={selectedItems.includes(row.product.id)}
                    onChange={() => handleCheckboxChange(row.product.id)}
                />
            ),
            center: true,
        },
        {
            name: "Product",
            selector: row => row.product.name,
            sortable: true,
            cell: (row) => (
                <div className="flex items-center space-x-3">
                    <Image
                        src={row.product.image.startsWith("http")
                            ? row.product.image
                            : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${row.product.image}`}
                        alt={row.product.name}
                        width={50}
                        height={50}
                        className="rounded-md"
                    />
                    <p className="font-semibold text-gray-800">{row.product.name}</p>
                </div>
            )
        },
        {
            name: "Price",
            selector: row => `₱${(parseFloat(row.product.price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            sortable: true,
            center: true
        },
        {
            name: "Remove",
            center: true,
            cell: (row) => (
                <button onClick={() => removeFromWishlist(row.product.id)} disabled={deletingItemId === row.product.id}>
                {deletingItemId === row.product.id ? (
                    <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                ) : (
                    <FaTrash className="text-gray-600 hover:text-red-600 cursor-pointer" />
                )}
            </button>
            
            )
        }
        
    ];

    return (
        <AuthGuard>
            <Head>
                <title>Wishlist | Gown Rental</title> {/* ✅ Dynamic Title */}
                <meta name="description" content="Manage your profile and settings on Gown Rental." />
                <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
            </Head>

        <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800 font-poppins">
            <Navbar />

            {/* Main Content */}
            <div className="flex-grow container mx-auto px-6 py-20">
                <h1 className="text-4xl font-bold text-gray-800">My Wishlist</h1>
                <p className="text-gray-600 mt-2 mb-4">
                    There are {wishlist?.length || 0} product/s in this wishlist.
                </p>

                {/* 🔎 Search Bar */}
                <input
                    type="text"
                    placeholder="Search wishlist..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 mb-4"
                />

                {/* 📌 Delete Buttons */}
                <div className="flex space-x-4 mb-4">
                <button
                    onClick={removeSelectedItems}
                    className={`px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                        selectedItems.length > 0 ? "bg-red-500 text-white" : "bg-gray-300 text-gray-700 cursor-not-allowed"
                    }`}
                    disabled={selectedItems.length === 0 || isDeletingSelected}
                >
                    {isDeletingSelected ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            Deleting...
                        </>
                    ) : (
                        <>🗑️ Delete Selected ({selectedItems.length})</>
                    )}
                </button>

                <button
                    onClick={removeAllItems}
                    className={`px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                        wishlist.length > 0 ? "bg-red-600 text-white" : "bg-gray-300 text-gray-700 cursor-not-allowed"
                    }`}
                    disabled={wishlist.length === 0 || isDeletingAll}
                >
                    {isDeletingAll ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            Deleting...
                        </>
                    ) : (
                        <>🚨 Delete All</>
                    )}
                </button>

                </div>

                {/* 📌 DataTable */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={filteredWishlist}
                        pagination
                        responsive
                        highlightOnHover
                        striped
                    />
                </div>
            </div>

            <Footer />
        </div>
        </AuthGuard>
    );
}
