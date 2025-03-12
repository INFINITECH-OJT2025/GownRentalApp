"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Plus } from "lucide-react";
import Head from "next/head";
import ChatWidgetPage from "../../components/chat"; 

export default function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [stockLogs, setStockLogs] = useState([]); // ✅ Stock logs state
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockToAdd, setStockToAdd] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAddingStock, setIsAddingStock] = useState(false); // ✅ Track loading state

    useEffect(() => {
        fetchInventory();
        fetchStockLogs(); // ✅ Fetch stock logs
    }, []);

    // ✅ Fetch inventory data
    const fetchInventory = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("Unauthorized: No token found.");
            return;
        }

        try {
            const response = await axios.get("http://127.0.0.1:8000/api/inventory", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setInventory(response.data.data);
            } else {
                console.error("Invalid inventory response format", response.data);
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
        }
    };

    // ✅ Fetch stock logs
    const fetchStockLogs = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("Unauthorized: No token found.");
            return;
        }

        try {
            const response = await axios.get("http://127.0.0.1:8000/api/stock-logs", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setStockLogs(response.data.data);
            } else {
                console.error("Invalid stock log response format", response.data);
            }
        } catch (error) {
            console.error("Error fetching stock logs:", error);
        }
    };

    const handleOpenModal = (product) => {
        setSelectedProduct(product);
        setStockToAdd(0);
        setIsModalOpen(true);
    };

    const handleAddStock = async () => {
        if (!selectedProduct || stockToAdd <= 0) {
            alert("Please enter a valid stock quantity.");
            return;
        }
    
        setIsAddingStock(true); // ✅ Start loading
    
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("Unauthorized: No token found.");
            setIsAddingStock(false); // ✅ Stop loading
            return;
        }
    
        try {
            console.log("Sending stock update:", { stock: stockToAdd });
    
            const response = await axios.put(
                `http://127.0.0.1:8000/api/inventory/${selectedProduct.id}/add-stock`,
                { stock: Number(stockToAdd) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                alert("Stock updated successfully!");
                fetchInventory();
                fetchStockLogs(); // ✅ Refresh stock logs
                setIsModalOpen(false);
            } else {
                alert("Failed to update stock: " + response.data.message);
            }
        } catch (error) {
            console.error("Error updating stock:", error.response?.data || error);
            alert("Error updating stock. Check console logs.");
        } finally {
            setIsAddingStock(false); // ✅ Stop loading
        }
    };
    

    // ✅ Inventory Table Columns with Dynamic Background Colors
const inventoryColumns = [
    { name: "Product Name", selector: (row) => row.name, sortable: true },
    { name: "Price", selector: (row) => `₱${row.price}`, sortable: true },
    { name: "Category", selector: (row) => row.category, sortable: true },
    { name: "Stock", selector: (row) => row.stock, sortable: true },
    {
        name: "Status",
        selector: (row) => row.stock > 0 ? "Available" : "Out of Stock",
        sortable: true,
        cell: (row) => (
            <span className={`px-3 py-1 rounded-lg text-white ${row.stock > 0 ? "bg-green-500" : "bg-red-500"}`}>
                {row.stock > 0 ? "Available" : "Out of Stock"}
            </span>
        ),
    },
    {
        name: "Add Stock",
        cell: (row) => (
            <button onClick={() => handleOpenModal(row)} className="text-green-500 hover:text-green-700">
                <Plus size={20} />
            </button>
        ),
    },
];

// ✅ Stock Logs Table Columns with Styled Remarks
const stockLogsColumns = [
    { name: "Product Name", selector: (row) => row.product_name, sortable: true },
    { name: "Stock Added", selector: (row) => row.stock_added, sortable: true },
    { 
        name: "Remarks", 
        selector: (row) => row.remarks, 
        sortable: true,
        cell: (row) => (
            <span className="px-3 py-1 rounded-lg text-white bg-green-500">
                {row.remarks}
            </span>
        ),
    },
    { name: "Date", selector: (row) => row.created_at, sortable: true },
];

    return (
        <>
        <Head>
        <title>Inventory | Gown Rental</title> {/* ✅ Dynamic Title */}
        <meta name="description" content="Manage your profile and settings on Gown Rental." />
        <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
    </Head>
        <div className="flex h-screen bg-white dark:bg-[#0F172A]">
            <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className={`transition-all duration-300 flex-1 ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
                <header className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
                    <h1 className="text-lg font-bold dark:text-white mr-auto">Gown Rental</h1>
                </header>

                <main className="p-6 mt-16">
                    {/* Inventory Table */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Inventory</h1>
                        <DataTable columns={inventoryColumns} data={inventory} pagination highlightOnHover />
                    </div>

                    {/* Stock Logs Table */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Stock Logs</h1>
                        <DataTable columns={stockLogsColumns} data={stockLogs} pagination highlightOnHover />
                    </div>
                </main>
            </div>

            {/* Add Stock Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add Stock</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">Product: {selectedProduct?.name}</p>
                        <input
                            type="number"
                            value={stockToAdd}
                            onChange={(e) => setStockToAdd(parseInt(e.target.value) || 0)}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                            min="1"
                        />
                        <div className="flex justify-end space-x-3 mt-4">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700">
                                Cancel
                            </button>
                            <button 
                                onClick={handleAddStock} 
                                disabled={isAddingStock} // ✅ Disable while adding stock
                                className={`px-4 py-2 rounded-lg transition-all flex items-center justify-center space-x-2 ${
                                    isAddingStock 
                                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"  // ✅ Disabled state
                                        : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                            >
                                {isAddingStock ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        <span>Adding...</span>
                                    </>
                                ) : (
                                    <span>Add Stock</span>
                                )}
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
        <ChatWidgetPage />
        </>
    );
}
