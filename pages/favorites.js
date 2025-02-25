"use client";

import { useState, useEffect } from "react";
import AuthGuard from "../components/AuthGuard";
import Image from "next/image";
import axios from "axios";
import Link from "next/link";
import { FaTrash } from "react-icons/fa";
import DataTable from "react-data-table-component";
import "../../resources/css/styles/global.css";
import Navbar from "../components/Navbar";
import Head from "next/head";


export default function FavoritesPage() {
    const [selectedItems, setSelectedItems] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [search, setSearch] = useState("");
    const [filteredFavorites, setFilteredFavorites] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.error("⚠ No token found. User must log in.");
            return;
        }

        axios.get("http://127.0.0.1:8000/api/favorites", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
            setFavorites(response.data.data || []);
            setFilteredFavorites(response.data.data || []);
        })
        .catch((error) => {
            console.error("❌ Error fetching favorites:", error);
            if (error.response?.status === 401) {
                alert("⚠ You need to log in to view your favorites.");
            }
        });
    }, []);

    // ✅ Handle Select/Deselect a single item
    const handleCheckboxChange = (productId) => {
        setSelectedItems((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId) // Remove if already selected
                : [...prev, productId] // Add if not selected
        );
    };

    // ✅ Handle Select/Deselect All
    const handleSelectAll = () => {
        if (selectedItems.length === favorites.length) {
            setSelectedItems([]); // Deselect all
        } else {
            setSelectedItems(favorites.map(item => item.product.id)); // Select all
        }
    };

    const removeFromFavorites = async (productId) => {
        const confirmDelete = window.confirm("Are you sure you want to remove this item from your favorites?");
        if (!confirmDelete) return;
    
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠ You must be logged in to remove favorites.");
            return;
        }
    
        try {
            await axios.delete(`http://127.0.0.1:8000/api/favorites/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            // ✅ Update UI after successful deletion
            setFavorites((prev) => prev.filter(item => item.product.id !== productId));
            setFilteredFavorites((prev) => prev.filter(item => item.product.id !== productId));
    
            alert("✅ Item removed from favorites.");
        } catch (error) {
            console.error("❌ Error removing product:", error);
    
            if (error.response) {
                if (error.response.status === 401) {
                    alert("⚠ You are not authorized. Please log in.");
                } else if (error.response.status === 404) {
                    alert("⚠ Item not found in favorites.");
                } else {
                    alert(error.response.data.message || "❌ An error occurred.");
                }
            } else {
                alert("❌ Network error. Check your connection.");
            }
        }
    };
    

    // ✅ Remove Selected Items
    const removeSelectedItems = async () => {
        if (selectedItems.length === 0) {
            alert("No items selected for deletion.");
            return;
        }

        const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedItems.length} items from your favorites?`);
        if (!confirmDelete) return;

        const token = localStorage.getItem("token");
        if (!token) return alert("You must be logged in to remove items.");

        try {
            await Promise.all(
                selectedItems.map(productId =>
                    axios.delete(`http://127.0.0.1:8000/api/favorites/${productId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                )
            );

            setFavorites((prev) => prev.filter(item => !selectedItems.includes(item.product.id)));
            setFilteredFavorites((prev) => prev.filter(item => !selectedItems.includes(item.product.id)));
            setSelectedItems([]);
        } catch (error) {
            console.error("Error removing selected items:", error);
            alert("Failed to remove selected items.");
        }
    };

    // ✅ Remove All Items
    const removeAllItems = async () => {
        if (favorites.length === 0) {
            alert("Favorites list is already empty.");
            return;
        }

        const confirmDelete = window.confirm("Are you sure you want to delete ALL items from your favorites?");
        if (!confirmDelete) return;

        const token = localStorage.getItem("token");
        if (!token) return alert("You must be logged in to clear your favorites.");

        try {
            await axios.delete(`http://127.0.0.1:8000/api/favorites/clear`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setFavorites([]);
            setFilteredFavorites([]);
            setSelectedItems([]);
        } catch (error) {
            console.error("Error clearing favorites:", error);
            alert("Failed to clear favorites.");
        }
    };

    // ✅ Search Filter
    useEffect(() => {
        const result = favorites.filter(item =>
            item.product.name.toLowerCase().includes(search.toLowerCase()) ||
            item.product.price.toString().includes(search)
        );
        setFilteredFavorites(result);
    }, [search, favorites]);

    // ✅ Table Columns (AFTER all functions are declared)
    const columns = [
        {
            name: (
                <input
                    type="checkbox"
                    checked={selectedItems.length === favorites.length && favorites.length > 0}
                    onChange={handleSelectAll} // ✅ Now it can be accessed
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
                            : `http://127.0.0.1:8000/storage/${row.product.image}`}
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
            selector: row => `₱${(parseFloat(row.product.price) || 0).toFixed(2)}`,
            sortable: true,
            center: true
        },
        {
            name: "Remove",
            center: true,
            cell: (row) => (
                <button onClick={() => removeFromFavorites(row.product.id)}> {/* ✅ Fix function call */}
                    <FaTrash className="text-gray-600 hover:text-red-600 cursor-pointer" />
                </button>
            )
        }
        
    ];

    return (
        <AuthGuard>
            <Head>
                <title>Favorites | Gown Rental</title> {/* ✅ Dynamic Title */}
                <meta name="description" content="Manage your profile and settings on Gown Rental." />
                <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
            </Head>
        <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800 font-poppins">
            <Navbar />

            {/* Main Content */}
            <div className="flex-grow container mx-auto px-6 py-20">
                <h1 className="text-4xl font-bold text-gray-800">My Favorites</h1>
                <p className="text-gray-600 mt-2 mb-4">
                    There are {favorites?.length || 0} products in this favorites.
                </p>

                {/* Search Bar */}
                <input
                    type="text"
                    placeholder="Search favorites..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 mb-4"
                />

                {/* 📌 Delete Buttons */}
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={removeSelectedItems}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            selectedItems.length > 0 ? "bg-red-500 text-white" : "bg-gray-300 text-gray-700 cursor-not-allowed"
                        }`}
                        disabled={selectedItems.length === 0}
                    >
                        🗑️ Delete Selected ({selectedItems.length})
                    </button>
                    <button
                        onClick={removeAllItems}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            favorites.length > 0 ? "bg-red-600 text-white" : "bg-gray-300 text-gray-700 cursor-not-allowed"
                        }`}
                        disabled={favorites.length === 0}
                    >
                        🚨 Delete All
                    </button>
                </div>

                {/* DataTable */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={filteredFavorites}
                        pagination
                        responsive
                        highlightOnHover
                        striped
                    />
                </div>
            </div>

            {/* Footer now sticks to the bottom */}
            <footer className="bg-pink-600 text-white text-center py-6 mt-auto">
                <p>&copy; {new Date().getFullYear()} Gown Rental System. All Rights Reserved.</p>
            </footer>
        </div>
        </AuthGuard>
    );
}
