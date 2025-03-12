"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Pencil, XCircle } from "lucide-react";
import Head from "next/head";
import ChatWidgetPage from "../../components/chat"; 

export default function PromotionalPage() {
    const [discountGroups, setDiscountGroups] = useState({});
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [isSaving, setIsSaving] = useState(false); // ✅ New loading state for button


    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/products", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log("📡 API Response:", response.data); // ✅ Debugging API Response
    
            if (response.data.success && Array.isArray(response.data.data)) {
                setProducts(response.data.data); // ✅ Store all products
    
                // ✅ Group products by discount percentage
                const discountGroups = {};
                response.data.data.forEach((product) => {
                    if (product.discounted_price && product.price) {
                        const discount = Math.round(((product.price - product.discounted_price) / product.price) * 100);
                        if (discount > 0) {
                            if (!discountGroups[discount]) {
                                discountGroups[discount] = [];
                            }
                            discountGroups[discount].push(product);
                        }
                    }
                });
    
                setDiscountGroups(discountGroups); // ✅ Store grouped discounts
            } else {
                console.error("❌ Invalid API response:", response.data);
            }
        } catch (error) {
            console.error("❌ API Error:", error);
            alert("⚠️ API Error: " + error.message);
        }
    };
    

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setDiscountPercentage("");
        setIsEditModalOpen(true);
    };

    const handleSaveDiscount = async () => {
        if (!selectedProduct) return;
        setIsSaving(true); // ✅ Start loading
        const token = localStorage.getItem("token");
    
        try {
            const response = await axios.put(
                `http://127.0.0.1:8000/api/admin/product/${selectedProduct.id}/discount`,
                { discount_percentage: discountPercentage },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
    
            if (response.data.success) {
                alert("✅ Discount updated successfully!");
                fetchProducts(); // ✅ Refresh product list
                setIsEditModalOpen(false);
            } else {
                alert("❌ Failed to update discount.");
            }
        } catch (error) {
            console.error("Error updating discount:", error);
            alert("❌ Error updating discount.");
        } finally {
            setIsSaving(false); // ✅ Stop loading
        }
    };
    

    const columns = [
        { name: "Product Name", selector: (row) => row.name || "No Name", sortable: true },
        { name: "Original Price", selector: (row) => `₱${parseFloat(row.price).toLocaleString()}`, sortable: true },
        { 
            name: "Discounted Price", 
            selector: (row) => row.discounted_price && row.discounted_price !== "null" 
                ? `₱${parseFloat(row.discounted_price).toLocaleString()}`
                : "No Discount", 
            sortable: true 
        },
        {
            name: "Actions",
            cell: (row) => (
                <button onClick={() => handleEdit(row)} className="text-blue-500 hover:text-blue-700">
                    <Pencil size={20} />
                </button>
            ),
        },
    ];

    const bgColors = [
        "bg-pink-500",
        "bg-purple-500",
        "bg-green-500",
        "bg-yellow-500",
        "bg-orange-500"
    ];
    
    return (
        <>
        <Head>
        <title>Promotional Tools | Gown Rental</title> {/* ✅ Dynamic Title */}
        <meta name="description" content="Manage your profile and settings on Gown Rental." />
        <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
    </Head>
        <div className="flex h-screen bg-white dark:bg-[#0F172A]">
            <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className={`transition-all duration-300 flex-1 ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
                <header className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
                    <h1 className="text-lg font-bold dark:text-white mr-auto">Gown Rental - Promotional Management</h1>
                </header>

                <main className="p-6 mt-16">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Promotions</h1>

                    {Object.keys(discountGroups).map((discount, idx) => (
                        <div key={idx} className={`p-4 rounded-lg shadow-md my-4 ${bgColors[idx % bgColors.length]} text-white text-center`}>
                            🎉 {discount}% OFF on:
                            <ul className="mt-2">
                                {discountGroups[discount].map((product, index) => (
                                    <li
                                        key={product.id}
                                        className="inline-block px-3 py-1 font-semibold text-white bg-gray-900 rounded-lg mx-1"
                                    >
                                        {product.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <DataTable columns={columns} data={products} pagination highlightOnHover />
                    </div>
                </main>
            </div>

            {isEditModalOpen && selectedProduct && (
    <div 
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        onClick={() => setIsEditModalOpen(false)} // ✅ Clicking outside the modal closes it
    >
        <div 
            className="bg-white p-6 rounded-lg shadow-lg w-96 relative"
            onClick={(e) => e.stopPropagation()} // ✅ Prevents closing when clicking inside the modal
        >
            {/* ❌ Close Button */}
            <button 
                className="absolute top-3 right-3 text-gray-700 hover:text-red-600 transition duration-200"
                onClick={() => setIsEditModalOpen(false)} // ✅ Clicking "X" closes modal
            >
                <XCircle size={24} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-3">Edit Discount</h2>

            <p className="text-gray-700">Product: {selectedProduct.name}</p>
            <p>Original Price: ₱{selectedProduct.price.toLocaleString()}</p>

            {/* ✅ Input for Discount */}
            <input
                type="number"
                placeholder="Enter Discount Percentage"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                className="border p-2 rounded-md w-full mt-3"
            />

            {/* ✅ Save Discount Button */}
            <button 
                onClick={handleSaveDiscount} 
                disabled={isSaving} // ✅ Disable button while saving
                className={`mt-4 px-4 py-2 rounded-md w-full transition-all flex items-center justify-center space-x-2 ${
                    isSaving 
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed" // ✅ Disabled state
                        : "bg-green-600 text-white hover:bg-green-700"
                }`}
            >
                {isSaving ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-green-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Saving...</span>
                    </>
                ) : (
                    <span>Save Discount</span>
                )}
            </button>

        </div>
    </div>
)}

        </div>
         <ChatWidgetPage />
        </>
    );
}
