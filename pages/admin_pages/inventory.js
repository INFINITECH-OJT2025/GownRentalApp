"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Pencil, Trash2, PlusCircle, Plus } from "lucide-react";

export default function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockToAdd, setStockToAdd] = useState(0);

    useEffect(() => {
        fetchInventory();
    }, []);

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

            if (response.data.success && Array.isArray(response.data.data)) {
                setInventory(response.data.data);
            } else {
                console.error("Invalid inventory response format", response.data);
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
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
    
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("Unauthorized: No token found.");
            return;
        }
    
        try {
            const response = await axios.put(
                `http://127.0.0.1:8000/api/inventory/${selectedProduct.id}/add-stock`, // ✅ Fix API URL
                { stock: stockToAdd }, // ✅ Send only the amount to add
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                fetchInventory(); // Refresh inventory after adding stock
                setIsModalOpen(false); // Close modal
            } else {
                console.error("Failed to update stock", response.data);
            }
        } catch (error) {
            console.error("Error updating stock:", error);
        }
    };
    
    const columns = [
        { name: "Product Name", selector: (row) => row.name, sortable: true },
        { name: "Price", selector: (row) => `₱${row.price}`, sortable: true },
        { name: "Category", selector: (row) => row.category, sortable: true },
        { name: "Stock", selector: (row) => row.stock, sortable: true },
        { name: "Status", selector: (row) => (row.stock > 0 ? "Available" : "Out of Stock"), sortable: true },
        {
            name: "Add Stock Quantity",
            cell: (row) => (
                <div className="flex space-x-3">
                    <button onClick={() => handleOpenModal(row)} className="text-green-500 hover:text-green-700">
                        <Plus size={20} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="flex h-screen bg-white dark:bg-[#0F172A]">
            <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className={`transition-all duration-300 flex-1 ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
                <header className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
                    <h1 className="text-lg font-bold dark:text-white mr-auto">Gown Rental</h1>
                </header>

                <main className="p-6 mt-16">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Inventory</h1>
                        </div>

                        <DataTable
                            columns={columns}
                            data={inventory}
                            selectableRows
                            onSelectedRowsChange={(state) => setSelectedRows(state.selectedRows)}
                            pagination
                            highlightOnHover
                        />
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
                            <button onClick={handleAddStock} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Add Stock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
