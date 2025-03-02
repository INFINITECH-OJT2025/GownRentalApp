"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Pencil, Trash2, PlusCircle, XCircle,EyeOff } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [photopeaURL, setPhotopeaURL] = useState(""); 

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "",
        stock: "",
        description: "",
        start_date: "",
        end_date: "",
        image: null,
        previewImage: null,
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("Unauthorized: No token found.");
            alert("⚠️ You are not logged in.");
            return;
        }
    
        try {
            console.log("📡 Fetching products...");
            const response = await axios.get("http://127.0.0.1:8000/api/products", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log("✅ API Response:", response.data); // Log API response
    
            if (response.data.success && Array.isArray(response.data.data)) {
                setProducts(response.data.data);
                console.log("✅ Products stored in state:", response.data.data);
            } else {
                console.error("❌ Invalid API response:", response.data);
            }
        } catch (error) {
            console.error("❌ API Error:", error);
            alert("⚠️ API Error: " + error.message);
        }
    };
    

    const handleDateChange = (date, field) => {
        setFormData((prev) => ({ ...prev, [field]: date }));
    };
    

    const handleEdit = (product) => {
        setIsAddModalOpen(false); // Ensure "Add Product" modal is closed
        setIsEditModalOpen(true); // Open "Edit Product" modal
    
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            price: product.price,
            category: product.category,
            stock: product.stock,
            description: product.description,
            start_date: product.start_date,
            end_date: product.end_date,
            image: null,
            previewImage: product.image_url || null,
        });
    };
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
    
        setIsProcessingImage(true); // Start processing state
    
        const reader = new FileReader();
        reader.readAsDataURL(file);
    
        reader.onload = async () => {
            try {
                const base64Image = reader.result.split(",")[1]; // Extract base64 data
                console.log("📤 Sending Image for Processing...");
    
                const response = await fetch("http://127.0.0.1:8000/api/process-image", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ image: base64Image }),
                });
    
                const result = await response.json();
    
                if (result.success && result.processed_image) {
                    console.log("✅ Image processed successfully:", result.processed_image);
    
                    setFormData((prev) => ({
                        ...prev,
                        image: result.processed_image, // ✅ Store processed image for API submission
                        previewImage: `/storage/${result.processed_image.replace('storage/', '')}`, // ✅ Ensure correct path for preview                    
                    }));
                } else {
                    console.error("❌ Image Processing Failed:", result.message, result.error);
                    alert(`❌ Image processing failed: ${result.message || "Unknown error"}`);
                }
            } catch (error) {
                console.error("❌ Server Error:", error);
                alert("❌ A network error occurred. Check console for details.");
            } finally {
                setIsProcessingImage(false); // Reset processing state
            }
        };
    
        reader.onerror = () => {
            console.error("❌ Error reading file.");
            alert("❌ Failed to read the image. Please try again.");
            setIsProcessingImage(false);
        };
    };
    
    
    
    const handleAddProduct = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("🚨 Unauthorized: No token found.");
            return;
        }
    
            if (!formData.image) {
                alert("⚠️ Please process an image before submitting.");
                return;
            }
            const formattedStartDate = formData.start_date 
            ? new Date(formData.start_date).toISOString().split("T")[0] 
            : "";
        const formattedEndDate = formData.end_date 
            ? new Date(formData.end_date).toISOString().split("T")[0] 
            : "";
        
        const productData = new FormData();
        productData.append("name", formData.name);
        productData.append("price", formData.price);
        productData.append("category", formData.category);
        productData.append("stock", formData.stock);
        productData.append("description", formData.description);
        productData.append("start_date", formattedStartDate); // ✅ Ensure Date is Properly Formatted
        productData.append("end_date", formattedEndDate); // ✅ Ensure Date is Properly Formatted
        productData.append("image_url", formData.image);
        
    
        try {
            console.log("📡 Uploading product...");
            const response = await fetch("http://127.0.0.1:8000/api/products", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(Object.fromEntries(productData)),
            });
    
            const result = await response.json();
    
            if (result.success) {
                alert("✅ Product added successfully!");
                setIsAddModalOpen(false);
                fetchProducts();
            } else {
                alert("❌ Failed to add product: " + result.message);
            }
        } catch (error) {
            console.error("❌ Error adding product:", error);
            alert("❌ An error occurred: " + error.message);
        }
    };
    
    const handleEditImage = () => {
        if (!formData.previewImage) {
            alert("⚠️ No image to edit.");
            return;
        }
    
        // ✅ Fix: Ensure the correct public URL
        const baseURL = "http://127.0.0.1:8000/storage/";
        const cleanImagePath = formData.previewImage.replace("/storage/", ""); // Remove `/storage/` if present
        const absoluteURL = formData.previewImage.startsWith("http")
            ? formData.previewImage
            : `${baseURL}${cleanImagePath}`; // Ensure absolute URL
    
        console.log("🔗 Opening Photopea with:", absoluteURL); // Debugging URL
    
        // ✅ Fix: Ensure proper URL encoding
        const encodedURL = encodeURIComponent(absoluteURL);
    
        // ✅ Open Photopea with the correct image
        setPhotopeaURL(`https://www.photopea.com/#${encodedURL}`);
        setIsEditingImage(true);
    };
    
    const handleHideProduct = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("🚨 Unauthorized: No token found.");
            return;
        }
    
        if (!window.confirm("Are you sure you want to toggle product visibility?")) return;
    
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/products/${productId}/toggle-visibility`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, 
                    "Content-Type": "application/json",
                },
            });
    
            const result = await response.json();
    
            if (result.success) {
                alert(`✅ ${result.message}`);
    
                // ✅ Update local state immediately
                setProducts((prevProducts) =>
                    prevProducts.map((product) =>
                        product.id === productId ? { ...product, is_hidden: product.is_hidden ? 0 : 1 } : product
                    )
                );
            } else {
                alert("❌ Failed to toggle visibility: " + result.message);
            }
        } catch (error) {
            console.error("❌ Error toggling visibility:", error);
            alert("❌ An error occurred: " + error.message);
        }
    };
    
    
    const handleUpdateProduct = async () => {
        const token = localStorage.getItem("token");
        if (!token || !selectedProduct) return;
    
        const formattedStartDate = formData.start_date 
            ? new Date(formData.start_date).toISOString().split("T")[0] 
            : "";
        const formattedEndDate = formData.end_date 
            ? new Date(formData.end_date).toISOString().split("T")[0] 
            : "";
    
        const updateData = new FormData();
        updateData.append("name", formData.name);
        updateData.append("price", formData.price);
        updateData.append("category", formData.category);
        updateData.append("stock", formData.stock);
        updateData.append("description", formData.description);
        updateData.append("start_date", formattedStartDate);
        updateData.append("end_date", formattedEndDate);
    
        // ✅ Fix: Remove `http://127.0.0.1:8000/storage/` & ensure proper format
        if (formData.image && formData.image instanceof File) {
            updateData.append("image", formData.image); // Upload new file
        } else if (formData.previewImage) {
            const relativeImagePath = formData.previewImage.replace("http://127.0.0.1:8000/storage/", ""); // ✅ Remove base URL
            updateData.append("image_url", relativeImagePath);
        }
    
        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/products/${selectedProduct.id}/update`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
    
            if (response.data.success) {
                alert("✅ Product updated successfully!");
                setIsEditModalOpen(false);
                fetchProducts(); // Refresh the product list
            } else {
                alert("❌ Failed to update product: " + response.data.message);
            }
        } catch (error) {
            console.error("❌ Error updating product:", error.response?.data || error);
            alert("❌ An error occurred: " + (error.response?.data?.message || "Unknown error"));
        }
    };
        
    
    const columns = [
        {
            name: "Product Name",
            selector: (row) => row.name || "No Name", 
            sortable: true,
        },
        {
            name: "Price",
            selector: (row) => `₱${parseFloat(row.price).toLocaleString()}`,
            sortable: true,
        },
        {
            name: "Category",
            selector: (row) => row.category || "Uncategorized",
            sortable: true,
        },
        {
            name: "Stock",
            selector: (row) => row.stock,
            sortable: true,
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="flex space-x-2">
                    {/* Edit Button */}
                    <button onClick={() => handleEdit(row)} className="text-pink-500 hover:text-pink-700">
                        <Pencil size={20} />
                    </button>
    
                    {/* Hide/Unhide Button */}
                    <button 
                        onClick={() => handleHideProduct(row.id)} 
                        className={`hover:text-gray-700 ${row.is_hidden ? "text-red-500" : "text-gray-500"}`}
                        title={row.is_hidden ? "Click to Unhide" : "Click to Hide"}
                    >
                        <EyeOff size={20} />
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
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="#" className="ml-1 text-sm font-medium text-gray-700 hover:text-gray-900 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                                    Products
                                </a>
                            </li>
                        </ol>
                    </nav>

                  {/* Title & Buttons */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Products</h1>

                        {/* ✅ Separate Add Product Button */}
                        <button
                            onClick={() => {
                                setSelectedProduct(null);
                                setIsEditModalOpen(false); // Ensure "Edit Product" modal is closed
                                setIsAddModalOpen(true); // Open "Add Product" modal

                                setFormData({
                                    name: "",
                                    price: "",
                                    category: "",
                                    stock: "",
                                    description: "",
                                    start_date: "",
                                    end_date: "",
                                    image: null,
                                    previewImage: null,
                                });
                            }}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                            <PlusCircle size={20} /> Add Product
                        </button>

                    </div>



                    {/* Table Container */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <DataTable columns={columns} data={products} pagination highlightOnHover />
                    </div>
                </main>
            </div>

            {isAddModalOpen && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-auto">
        <div className="relative bg-white p-4 rounded-lg shadow-lg max-w-sm w-full max-h-[85vh] overflow-y-auto">
            
            {/* ❌ Close Button */}
            <button 
                className="absolute top-2 right-2 text-gray-700 hover:text-red-600"
                onClick={() => setIsAddModalOpen(false)}
            >
                <XCircle size={20} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">Add Product</h2>

            {/* ✅ Add Product Form */}
            <div className="flex flex-col gap-2">
                <input 
                    type="text" 
                    name="name" 
                    placeholder="Product Name *" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className="border p-1 rounded-md w-full text-xs"
                    required
                />

                <input 
                    type="number" 
                    name="price" 
                    placeholder="Price *" 
                    value={formData.price} 
                    onChange={handleChange} 
                    className="border p-1 rounded-md w-full text-xs"
                    required
                />

                <input 
                    type="text" 
                    name="category" 
                    placeholder="Category *" 
                    value={formData.category} 
                    onChange={handleChange} 
                    className="border p-1 rounded-md w-full text-xs"
                    required
                />

                <input 
                    type="number" 
                    name="stock" 
                    placeholder="Stock *" 
                    value={formData.stock} 
                    onChange={handleChange} 
                    className="border p-1 rounded-md w-full text-xs"
                    required
                />

                <textarea 
                    name="description" 
                    placeholder="Description *" 
                    value={formData.description} 
                    onChange={handleChange} 
                    className="border p-1 rounded-md w-full text-xs"
                    required
                ></textarea>

                {/* ✅ Date Pickers */}
                <DatePicker 
                    selected={formData.start_date ? new Date(formData.start_date) : null}
                    onChange={(date) => handleDateChange(date, "start_date")}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Start Date *"
                    className="border p-1 rounded-md w-full text-xs"
                    required
                />

                <DatePicker 
                    selected={formData.end_date ? new Date(formData.end_date) : null}
                    onChange={(date) => handleDateChange(date, "end_date")}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="End Date *"
                    className="border p-1 rounded-md w-full text-xs"
                    required
                />

                {/* ✅ Image Upload with Edit Button */}
                {formData.previewImage && (
                    <div className="flex flex-col items-center gap-1">
                        <img 
                            src={formData.previewImage.startsWith("/") 
                                ? `http://127.0.0.1:8000${formData.previewImage}` 
                                : formData.previewImage
                            }
                            alt="Product Preview"
                            className="w-2/3 max-h-24 object-contain rounded-md mt-1"
                            onError={(e) => e.target.style.display = "none"}
                        />

                        {/* 🖌️ Edit Image Button */}
                        <button 
                            onClick={handleEditImage}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md text-xs"
                        >
                            Edit in Photopea
                        </button>
                    </div>
                )}

                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="border p-1 rounded-md w-full text-xs" 
                    required
                />

                {/* ✅ Show Loading Indicator if Image is Processing */}
                {isProcessingImage && (
                    <p className="text-center text-blue-500 mt-1 text-xs">⏳ Processing image...</p>
                )}

                {/* ✅ Add Product Button */}
                <button 
                    onClick={handleAddProduct} 
                    className={`mt-2 px-2 py-1 rounded-md w-full text-xs ${
                        isProcessingImage || 
                        !formData.name || 
                        !formData.price || 
                        !formData.category || 
                        !formData.stock || 
                        !formData.description || 
                        !formData.start_date || 
                        !formData.end_date || 
                        !formData.image 
                            ? "bg-gray-400 cursor-not-allowed"  
                            : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                    disabled={
                        isProcessingImage || 
                        !formData.name || 
                        !formData.price || 
                        !formData.category || 
                        !formData.stock || 
                        !formData.description || 
                        !formData.start_date || 
                        !formData.end_date || 
                        !formData.image
                    }
                >
                    {isProcessingImage ? "Processing..." : "Add Product"}
                </button>
            </div>
        </div>
    </div>
)}


{/* 🌐 Photopea Editing Modal */}
{isEditingImage && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-4 rounded-lg shadow-lg max-w-4xl w-full relative">
            {/* ❌ Close Button */}
            <button
                onClick={() => setIsEditingImage(false)}
                className="absolute top-3 right-3 text-gray-700 hover:text-red-600"
            >
                <XCircle size={24} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                Drag Your Image here in Photopea
            </h2>

            {/* 🌐 Photopea Iframe */}
            {photopeaURL ? (
                <iframe
                    src={photopeaURL}
                    width="100%"
                    height="600px"
                    className="border rounded-lg"
                    allowFullScreen
                ></iframe>
            ) : (
                <p className="text-center text-gray-500">⚠️ No image selected for editing.</p>
            )}
        </div>
    </div>
)}


            {isEditModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-auto">
                    <div className="relative bg-white p-4 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Close Button */}
                        <button 
                            className="absolute top-3 right-3 text-gray-700 hover:text-red-600"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            <XCircle size={24} />
                        </button>

                        <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">Edit Product</h2>

                        {/* ✅ Edit Product Form */}
                        <div className="flex flex-col gap-3">
                            <input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} className="border p-2 rounded-md w-full text-sm" />
                            <input type="number" name="price" placeholder="Price" value={formData.price} onChange={handleChange} className="border p-2 rounded-md w-full text-sm" />
                            <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} className="border p-2 rounded-md w-full text-sm" />
                            <input type="number" name="stock" placeholder="Stock" value={formData.stock} onChange={handleChange} className="border p-2 rounded-md w-full text-sm" />
                            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="border p-2 rounded-md w-full text-sm"></textarea>

                            {/* ✅ Date Pickers */}
                            <DatePicker 
                                selected={formData.start_date ? new Date(formData.start_date) : null}
                                onChange={(date) => handleDateChange(date, "start_date")}
                                dateFormat="yyyy-MM-dd"
                                placeholderText="Start Date"
                                className="border p-2 rounded-md w-full text-sm"
                            />

                            <DatePicker 
                                selected={formData.end_date ? new Date(formData.end_date) : null}
                                onChange={(date) => handleDateChange(date, "end_date")}
                                dateFormat="yyyy-MM-dd"
                                placeholderText="End Date"
                                className="border p-2 rounded-md w-full text-sm"
                            />

                            {/* ✅ Image Upload */}
                            {formData.previewImage && (
                          <img 
                          src={formData.previewImage.startsWith("products/") 
                              ? `http://127.0.0.1:8000/storage/${formData.previewImage}` 
                              : formData.previewImage
                          }
                          alt="Product Preview"
                          className="w-full max-h-40 object-contain rounded-md mt-2"
                          onError={(e) => e.target.style.display = "none"} // Hide image if not found
                      />                      
                      
                            )}

                            <input type="file" accept="image/*" onChange={handleImageChange} className="border p-2 rounded-md w-full text-sm" />

                            {/* ✅ Save Changes Button Now Calls `handleUpdateProduct` */}
                            <button 
                                onClick={handleUpdateProduct}  // 🔹 This ensures the function is used
                                className="mt-3 bg-pink-600 text-white px-3 py-2 rounded-md hover:bg-pink-700 w-full text-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}



        </div>
    );
}
