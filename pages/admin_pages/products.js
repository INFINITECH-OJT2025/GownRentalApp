"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import "../../../resources/css/styles/global.css";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("Unauthorized: No token found.");
            return;
        }
    
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/products", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log("Full API Response:", response.data); // Debugging
    
            if (response.data.success && Array.isArray(response.data.data)) {
                setProducts(response.data.data); // ✅ Fix: Use response.data.data
            } else {
                console.error("Error: products is not an array", response.data);
                throw new Error("Invalid API response format");
            }            
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const handleRowSelected = (state) => {
        setSelectedRows(state.selectedRows);
    };

    const handleDeleteSelected = () => {
        if (selectedRows.length === 0) return;
        console.log("Deleting selected products:", selectedRows);
        // Implement delete logic here
    };

    const handleDelete = (id) => {
        console.log("Deleting product with ID:", id);
        // Implement delete logic here
    };

    const handleEdit = (id) => {
        console.log("Editing product with ID:", id);
        // Implement edit navigation here
    };

    const columns = [
        {
            name: "Product Name",
            selector: (row) => row.name,
            sortable: true,
        },
        {
            name: "Price",
            selector: (row) => `₱${row.price}`,
            sortable: true,
        },
        {
            name: "Category",
            selector: (row) => row.category,
            sortable: true,
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="flex space-x-3">
                    <button onClick={() => handleEdit(row.id)} className="text-blue-500 hover:text-blue-700">
                        <Pencil size={20} />
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={20} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="flex h-screen bg-white dark:bg-[#0F172A]">
            {/* Sidebar */}
            <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Main Content */}
            <div className={`transition-all duration-300 flex-1 ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
                {/* Header */}
                <header className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
                    <h1 className="text-lg font-bold dark:text-white mr-auto">Gown Rental</h1>
                </header>

                {/* Page Content */}
                <main className="p-6 mt-16">
                    {/* Breadcrumb */}
                    <nav className="my-6 flex px-5 py-3 text-gray-700 rounded-lg bg-gray-50 dark:bg-[#1E293B]" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <a href="#" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                    </svg>
                                    Home
                                </a>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <a href="#" className="ml-1 text-sm font-medium text-gray-700 hover:text-gray-900 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                                        Products
                                    </a>
                                </div>
                            </li>
                        </ol>
                    </nav>

                    {/* Title & Buttons */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700">
                            <PlusCircle size={20} />
                            <span>Add Product</span>
                        </button>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={handleDeleteSelected}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                            >
                                Delete Selected
                            </button>
                        </div>

                        {/* DataTable */}
                        <DataTable
                            columns={columns}
                            data={products}
                            selectableRows
                            onSelectedRowsChange={handleRowSelected}
                            pagination
                            highlightOnHover
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}
