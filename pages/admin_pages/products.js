"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Pencil, Trash2, PlusCircle, XCircle,EyeOff, Eye } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Head from "next/head";
import { toast } from "react-hot-toast";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [photopeaURL, setPhotopeaURL] = useState(""); 
    const [categories, setCategories] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isAddingProduct, setIsAddingProduct] = useState(false); // ✅ Tracks Add Product button state
    const [isSavingChanges, setIsSavingChanges] = useState(false); // ✅ Tracks Save Changes button state

    const [selectedSize, setSelectedSize] = useState("Medium");

    const [searchQuery, setSearchQuery] = useState("");

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
        sizes: [], // ✅ Ensure it's an array
    });
    

    const handleSizeChange = (size) => {
        setSelectedSize(size);
    };
    
    useEffect(() => {
        fetchProducts();
    }, []);

    const getCategoryCounts = (products) => {
        const counts = {};
        products.forEach((product) => {
            counts[product.category] = (counts[product.category] || 0) + 1;
        });
        return counts;
    };

    // Fetch categories when products are loaded
  // Fetch categories when products are loaded
useEffect(() => {
    if (products.length > 0) {
        const uniqueCategories = [...new Set(products.map((product) => product.category))];
        setCategories(uniqueCategories);
        setFilteredProducts(products);
    }
}, [products]);

// ✅ Automatically filter products based on selected category & search query
useEffect(() => {
    let filtered = products;

    if (selectedCategory) {
        if (selectedCategory === "Hidden Products") {
            filtered = products.filter((product) => product.is_hidden === 1);
        } else {
            filtered = products.filter(
                (product) => product.category === selectedCategory && product.is_hidden === 0
            );
        }
    }

    if (searchQuery.trim() !== "") {
        filtered = filtered.filter((product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    setFilteredProducts(filtered);
}, [products, selectedCategory, searchQuery]);

    const filterByCategory = (category) => {
        setSelectedCategory(category);
        if (category === null) {
            setFilteredProducts(products);
        } else if (category === "Hidden Products") {
            setFilteredProducts(products.filter((product) => product.is_hidden === 1)); // ✅ Show only hidden products
        } else {
            setFilteredProducts(products.filter((product) => product.category === category && product.is_hidden === 0)); // ✅ Show only visible products in selected category
        }
    };
    
    

    const fetchProducts = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("Unauthorized: No token found.");
            alert("⚠️ You are not logged in.");
            return;
        }
    
        try {
            console.log("📡 Fetching products (Admin API)...");
            const response = await axios.get("http://127.0.0.1:8000/api/admin/products", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log("✅ API Response (Admin):", response.data);
    
            if (response.data.success && Array.isArray(response.data.data)) {
                setProducts(response.data.data);
                setFilteredProducts(response.data.data); // ✅ Set initial state
            } else {
                console.error("Invalid API response:", response.data);
            }
        } catch (error) {
            console.error("API Error:", error);
            alert("⚠️ API Error: " + error.message);
        }
    };

    const validateDates = () => {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
    
        // Clear time for accurate comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
    
        const minEndDate = new Date(startDate);
        minEndDate.setDate(minEndDate.getDate() + 2); // ✅ at least 2 days later
    
        const endDateValid = endDate >= minEndDate;
    
        return {
            endDateValid,
        };
    };
    

    const handleDateChange = (date, field) => {
        setFormData((prev) => ({ ...prev, [field]: date }));
    };
    

    const handleEdit = (product) => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(true);
    
        setSelectedProduct(product);
    
        // ✅ Convert stored sizes string back into an array
        const productSizes = product.sizes ? product.sizes.split(",").map(size => size.trim()) : [];
    
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
            sizes: productSizes, // ✅ Fetch sizes from API
        });
    };
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            alert("⚠️ No file selected.");
            return;
        }
    
        // ✅ Get file extension (lowercase)
        const fileExtension = file.name.split(".").pop().toLowerCase();
    
        // ✅ Allowed image types (Only PNG and JPG)
        if (!["jpg", "jpeg", "png"].includes(fileExtension)) {
            alert("⚠️ Invalid file type. Please upload a PNG with a transparent background.");
            return;
        }
    
        setIsProcessingImage(true); // Start processing state
    
        const reader = new FileReader();
        reader.readAsDataURL(file);
    
        reader.onload = async () => {
            try {
                const base64Image = reader.result.split(",")[1]; // Extract base64 data
                console.log("📤 Sending Image for Processing...");
    
                const response = await fetch("http://127.0.0.1:8000/api/process-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64Image }),
                });
    
                const result = await response.json();
    
                if (result.success && result.processed_image) {
                    console.log("✅ Image processed successfully:", result.processed_image);
    
                    if (fileExtension === "png") {
                        checkIfBackgroundRemoved(file).then((isBackgroundRemoved) => {
                            setFormData((prev) => ({
                                ...prev,
                                image: result.processed_image,
                                previewImage: `/storage/${result.processed_image.replace("storage/", "")}`,
                                isJpg: false,
                                hasTransparentBackground: isBackgroundRemoved, // ✅ Confirmed transparency
                                noBackgroundDetected: !isBackgroundRemoved, // ✅ Set flag for UI display
                            }));
                        });
                    } else {
                        setFormData((prev) => ({
                            ...prev,
                            image: result.processed_image,
                            previewImage: `/storage/${result.processed_image.replace("storage/", "")}`,
                            isJpg: true, // ✅ JPG detected
                            hasTransparentBackground: false, // ❌ JPGs don't have transparency
                            noBackgroundDetected: false, // JPGs are expected to have backgrounds
                        }));
                    }
                } else {
                    console.error("❌ Image Processing Failed:", result.message, result.error);
                    alert(`Image processing failed: ${result.message || "Unknown error"}`);
                }
            } catch (error) {
                console.error("🚨 Server Error:", error);
                alert("A network error occurred. Check console for details.");
            } finally {
                setIsProcessingImage(false);
            }
        };
    
        reader.onerror = () => {
            console.error("⚠️ Error reading file.");
            alert("Failed to read the image. Please try again.");
            setIsProcessingImage(false);
        };
    };
    

    const checkIfBackgroundRemoved = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
    
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
    
                // ✅ Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;
    
                let transparentPixels = 0;
                let totalPixels = pixels.length / 4;
    
                for (let i = 3; i < pixels.length; i += 4) {
                    if (pixels[i] < 230) {  // ✅ Adjusted threshold for better detection (was 200-220)
                        transparentPixels++;
                    }
                }
    
                const transparencyRatio = transparentPixels / totalPixels;
    
                // ✅ If transparency is above 10%, we assume background is removed
                resolve(transparencyRatio > 0.1);
            };
        });
    };
    
    
    
    const handleAddProduct = async () => {
        if (!formData.image) {
            alert("⚠️ Please process an image before submitting.");
            return;
        }
    
        setIsAddingProduct(true);
    
        const token = localStorage.getItem("token");
        if (!token) {
            alert("🚨 Unauthorized: No token found.");
            setIsAddingProduct(false);
            return;
        }
    
        // ✅ Ensure sizes is always an array and convert to comma-separated string
        const selectedSizes = Array.isArray(formData.sizes) && formData.sizes.length > 0 
            ? formData.sizes.join(", ") 
            : "";
    
        const productData = {
            name: formData.name,
            price: formData.price,
            category: formData.category,
            stock: formData.stock,
            description: formData.description,
            start_date: formData.start_date ? new Date(formData.start_date).toISOString().split("T")[0] : "",
            end_date: formData.end_date ? new Date(formData.end_date).toISOString().split("T")[0] : "",
            image_url: formData.image,
            sizes: selectedSizes, // ✅ Store as a comma-separated string
        };
    
        try {
            console.log("📡 Uploading product...");
            const response = await axios.post("http://127.0.0.1:8000/api/products", productData, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (response.data.success) {
                toast.success("Product added successfully!", { position: "top-right" });
                setIsAddModalOpen(false);
                fetchProducts();
            } else {
                toast.error("Failed to add product: " + response.data.message, { position: "top-right" });
            }
        } catch (error) {
            console.error("Error adding product:", error);
            alert("An error occurred: " + error.message);
        } finally {
            setIsAddingProduct(false);
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
    
        toast.loading("Redirecting to Photopea...", { position: "top-right" });

        // ✅ Open Photopea with the correct image
        setTimeout(() => {
            setPhotopeaURL(`https://www.photopea.com/#${encodedURL}`);
            setIsEditingImage(true);
            toast.dismiss(); // Remove loading toast after redirect
        }, 1000);
    };
    
    const handleHideProduct = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) return;
    
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
                toast.success(result.message, { position: "top-right" });
    
                // ✅ Update local state to instantly reflect changes
                setProducts((prevProducts) =>
                    prevProducts.map((product) =>
                        product.id === productId ? { ...product, is_hidden: product.is_hidden ? 0 : 1 } : product
                    )
                );
    
                // ✅ If currently in "Hidden Products", refresh the filter
                if (selectedCategory === "Hidden Products") {
                    setFilteredProducts(products.filter((p) => p.is_hidden === 1));
                }
            } else {
                toast.error("Failed to toggle visibility: " + result.message, { position: "top-right" });
            }
        } catch (error) {
            console.error("Error toggling visibility:", error);
            toast.error("An error occurred: " + error.message, { position: "top-right" });
        }
    };
    
    
    const handleUpdateProduct = async () => {
        if (!selectedProduct) return;
    
        setIsSavingChanges(true);
    
        const token = localStorage.getItem("token");
        if (!token) {
            setIsSavingChanges(false);
            return;
        }
    
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
    
        // ✅ Convert sizes array into a string before sending
        if (Array.isArray(formData.sizes) && formData.sizes.length > 0) {
            updateData.append("sizes", formData.sizes.join(", ")); // Convert array to string
        }
    
        if (formData.image && formData.image instanceof File) {
            updateData.append("image", formData.image);
        } else if (formData.previewImage) {
            const relativeImagePath = formData.previewImage.replace("http://127.0.0.1:8000/storage/", "");
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
                toast.success("Product updated successfully!", { position: "top-right" });
                setIsEditModalOpen(false);
                fetchProducts();
            } else {
                toast.error("Failed to update product: " + response.data.message, { position: "top-right" });
            }
        } catch (error) {
            console.error("Error updating product:", error.response?.data || error);
            alert("An error occurred: " + (error.response?.data?.message || "Unknown error"));
        } finally {
            setIsSavingChanges(false);
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
                    className={`hover:text-gray-700 ${row.is_hidden ? "text-red-500" : "text-green-500"}`}
                    title={row.is_hidden ? "Click to Unhide" : "Click to Hide"}
                >
                    {row.is_hidden ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>

                </div>
            ),
        },
    ];
    
    return (
        <>
        <Head>
        <title>Product Management | Gown Rental</title> {/* ✅ Dynamic Title */}
        <meta name="description" content="Manage your profile and settings on Gown Rental." />
        <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
    </Head>
        <div className="flex h-screen bg-white dark:bg-[#0F172A]">
            {/* Sidebar */}
            <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-60" : "ml-16"} w-full overflow-x-hidden`}>
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

                {/* Title Section */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3 md:mb-0">Products</h1>

                    {/* Centered Button on Mobile */}
                    <div className="flex justify-center">
                        <button
                            onClick={() => {
                                setSelectedProduct(null);
                                setIsEditModalOpen(false);
                                setIsAddModalOpen(true);
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
                            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 shadow-md transition"
                        >
                            <PlusCircle size={20} /> Add Product
                        </button>
                    </div>
                </div>

                {/* Category Buttons & Add Product */}
                    <div className="flex flex-wrap justify-between items-center gap-2 p-3 bg-gray-100 rounded-lg shadow-md">
                        {/* Category Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {/* "All" Button (Now a Dark Primary Color) */}
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => filterByCategory(null)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition ${
                                        selectedCategory === null ? "bg-gray-800 text-white" : "bg-gray-600 text-white hover:bg-gray-700"
                                    }`}
                                >
                                    All ({products.length})
                                </button>

                                <button 
                                    onClick={() => filterByCategory("Hidden Products")}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition ${
                                        selectedCategory === "Hidden Products" ? "bg-red-600 text-white" : "bg-red-500 text-white hover:bg-red-700"
                                    }`}
                                >
                                    Hidden Products
                                </button>

                            </div>


                            {/* Dynamic Colorful Category Buttons */}
                            {categories.map((category, index) => {
                        const categoryColors = [
                            "bg-blue-500 hover:bg-blue-600 text-white",
                            "bg-green-500 hover:bg-green-600 text-white",
                            "bg-purple-500 hover:bg-purple-600 text-white",
                            "bg-red-500 hover:bg-red-600 text-white",
                            "bg-pink-500 hover:bg-pink-600 text-white",
                            "bg-yellow-500 hover:bg-yellow-600 text-black",
                            "bg-indigo-500 hover:bg-indigo-600 text-white",
                        ];
                        const buttonColor = categoryColors[index % categoryColors.length] === "bg-gray-200"
                        ? "bg-gray-500" // Darken the gray color
                        : categoryColors[index % categoryColors.length];

                        const textColor = buttonColor.includes("gray") ? "text-black" : "text-white";

                                return (
                                    <button
                                    key={category}
                                    onClick={() => filterByCategory(category)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition ${buttonColor} ${textColor} ${
                                        selectedCategory === category ? "ring-2 ring-black ring-offset-2" : ""
                                    }`}
                                >
                                    {category} ({getCategoryCounts(products)[category] || 0})
                                </button>               
                                );
                            })}
                        </div>
                    </div>


                    {/* Table Container */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="overflow-x-auto"> {/* ✅ Ensures horizontal scroll only when needed */}
                            {/* Search Bar */}
                            <div className="flex justify-end mb-4">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="border border-gray-300 p-2 rounded-md w-64 focus:ring focus:ring-blue-300"
                                />
                            </div>

                            <DataTable 
                                columns={columns} 
                                data={filteredProducts} 
                                pagination 
                                highlightOnHover 
                                className="w-full min-w-[600px]" // ✅ Ensures proper width
                            />
                        </div>
                    </div>

                </main>
            </div>

            {isAddModalOpen && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-auto">
        <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                
            {/* Close Button */}
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

                {/* ✅ Size Selection (Checkboxes) */}
                <div className="flex flex-wrap gap-2">
                    {["Small", "Medium", "Large", "Extra Large", "Extra Extra Large"].map((size) => (
                        <label key={size} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-md shadow-md cursor-pointer">
                            <input
                                type="checkbox"
                                value={size}
                                checked={Array.isArray(formData.sizes) && formData.sizes.includes(size)} // ✅ Fix applied
                                onChange={(e) => {
                                    const selected = e.target.checked
                                        ? [...(Array.isArray(formData.sizes) ? formData.sizes : []), size] // ✅ Ensure array
                                        : (Array.isArray(formData.sizes) ? formData.sizes.filter((s) => s !== size) : []); // ✅ Ensure array
                                    setFormData((prev) => ({ ...prev, sizes: selected }));
                                }}
                                className="hidden"
                            />
                            <span className="w-4 h-4 border border-gray-500 rounded-md flex items-center justify-center">
                                {Array.isArray(formData.sizes) && formData.sizes.includes(size) && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                            </span>
                            <span className="text-sm">{size}</span>
                        </label>
                    ))}
                </div>

                {/* ✅ Date Pickers */}
                <DatePicker 
                    selected={formData.start_date ? new Date(formData.start_date) : null}
                    onChange={(date) => handleDateChange(date, "start_date")}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Start Date *"
                    className="border p-1 rounded-md w-full text-xs relative z-50"
                    required
                />

                    {formData.end_date && !validateDates().endDateValid && (
                        <p className="text-red-600 text-xs font-semibold mt-1">
                            ⚠️ End date must be at least 2 days after start date.
                        </p>
                    )}


                <DatePicker 
                    selected={formData.end_date ? new Date(formData.end_date) : null}
                    onChange={(date) => handleDateChange(date, "end_date")}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="End Date *"
                    className="border p-1 rounded-md w-full text-xs"
                    required
                />

                {/* 🔹 Upload Guidelines */}
                <div className="bg-yellow-100 p-3 rounded-md text-xs text-yellow-700 border border-yellow-400">
                    <strong>⚠️ Note:</strong>  
                    <ul className="list-disc ml-4 mt-1">
                        <li>Only <strong>PNG</strong> images with a removed background are allowed.</li>
                        <li>JPG images <strong>will not</strong> enable the "Add Product" button.</li>
                        <li><strong>JPG</strong> images can be edited in <a href="https://www.photopea.com" target="_blank" className="text-blue-600 underline">Photopea</a>.</li>
                        <li><strong>PNG</strong> images must have at least **50% transparency** to be accepted.</li>
                    </ul>
                </div>


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

                    {/* ✅ Show "Edit in Photopea" button for JPG images OR PNG without transparency */}
                    {(formData.isJpg || formData.noBackgroundDetected) && (
                        <>
                            <p className="text-red-600 text-xs font-semibold mt-1">
                                ⚠️ Image Needs Editing - Please Edit in Photopea
                            </p>
                            <button 
                                onClick={handleEditImage}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs"
                            >
                                Edit in Photopea
                            </button>
                        </>
                    )}

                    {/* ✅ Show success message if the PNG has transparency */}
                    {formData.hasTransparentBackground && (
                        <p className="text-green-600 text-xs font-semibold mt-1">
                            ✅ Background is removed (Transparent detected)
                        </p>
                    )}
                </div>
            )}


                {/* ✅ Image Upload Input */}
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="border p-1 rounded-md w-full text-xs" 
                    required
                />


                {/* ✅ Add Product Button */}
                <button 
                    onClick={handleAddProduct} 
                    disabled={
                        isAddingProduct || 
                        isProcessingImage || 
                        !formData.name || 
                        !formData.price || 
                        !formData.category || 
                        !formData.stock || 
                        !formData.description || 
                        !formData.start_date || 
                        !formData.end_date || 
                        !formData.image || 
                        !(Array.isArray(formData.sizes) && formData.sizes.length > 0) || 
                        !formData.hasTransparentBackground || 
                        !validateDates().endDateValid
                    }
                    
                    
                    className={`mt-2 px-2 py-1 rounded-md w-full text-xs flex items-center justify-center space-x-2 transition-all ${
                        isAddingProduct || 
                        isProcessingImage || 
                        !formData.name || 
                        !formData.price || 
                        !formData.category || 
                        !formData.stock || 
                        !formData.description || 
                        !formData.start_date || 
                        !formData.end_date || 
                        !formData.image || 
                        !(Array.isArray(formData.sizes) && formData.sizes.length > 0) || 
                        !formData.hasTransparentBackground
                            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                >
                    {isAddingProduct || isProcessingImage ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            <span>{isProcessingImage ? "Processing..." : "Adding..."}</span>
                        </>
                    ) : (
                        <span>Add Product</span>
                    )}
                </button>

            </div>
        </div>
    </div>
)}

{/* 🌐 Photopea Editing Modal */}
{isEditingImage && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-4 rounded-lg shadow-lg max-w-4xl w-full relative">
            {/* Close Button */}
            <button
                onClick={() => setIsEditingImage(false)}
                className="absolute top-3 right-3 text-gray-700 hover:text-red-600"
            >
                <XCircle size={24} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
                Drag Your Image here
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
<div className="relative bg-white p-4 rounded-lg shadow-lg max-w-3xl w-full max-h-[65vh] overflow-y-auto">

            {/* Close Button */}
            <button 
                className="absolute top-3 right-3 text-gray-700 hover:text-red-600"
                onClick={() => setIsEditModalOpen(false)}
            >
                <XCircle size={24} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">Edit Product</h2>

            {/* ✅ Edit Product Form */}
            <div className="flex flex-col gap-1">
            <input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} className="border p-2 rounded-md w-full text-sm" />
            <input type="number" name="price" placeholder="Price" value={formData.price} onChange={handleChange} className="border p-2 rounded-md w-full text-sm" />
            <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} className="border p-2 rounded-md w-full text-sm" />
            <input 
                type="number" 
                name="stock" 
                placeholder="Stock" 
                value={formData.stock} 
                disabled
                title="You may edit this stock in inventory"
                className="border p-2 rounded-md w-full text-sm cursor-not-allowed bg-gray-200 text-gray-600"
            />
            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="border p-2 rounded-md w-full text-sm"></textarea>

            <DatePicker 
                selected={formData.start_date ? new Date(formData.start_date) : null}
                onChange={(date) => handleDateChange(date, "start_date")}
                dateFormat="yyyy-MM-dd"
                placeholderText="Start Date"
                className="border p-2 rounded-md w-full text-xs"
            />

                {formData.end_date && !validateDates().endDateValid && (
                    <p className="text-red-600 text-xs font-semibold mt-1">
                        ⚠️ End date must be at least 2 days after start date.
                    </p>
                )}

            <DatePicker 
                selected={formData.end_date ? new Date(formData.end_date) : null}
                onChange={(date) => handleDateChange(date, "end_date")}
                dateFormat="yyyy-MM-dd"
                placeholderText="End Date"
                className="border p-2 rounded-md w-full text-xs"
            />

                {/* ✅ Size Selection (Checkboxes) */}
                <div className="flex flex-wrap gap-2">
                    {["Small", "Medium", "Large", "Extra Large", "Extra Extra Large"].map((size) => (
                        <label key={size} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-md shadow-md cursor-pointer">
                            <input
                                type="checkbox"
                                value={size}
                                checked={Array.isArray(formData.sizes) && formData.sizes.includes(size)}
                                onChange={(e) => {
                                    const selected = e.target.checked
                                        ? [...formData.sizes, size]
                                        : formData.sizes.filter((s) => s !== size);
                                    setFormData((prev) => ({ ...prev, sizes: selected }));
                                }}
                                className="hidden"
                            />
                            <span className="w-4 h-4 border border-gray-500 rounded-md flex items-center justify-center">
                                {formData.sizes.includes(size) && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                            </span>
                            <span className="text-sm">{size}</span>
                        </label>
                    ))}
                </div>


                 {/* 🔹 Upload Guidelines */}
            <div className="bg-yellow-100 p-3 rounded-md text-xs text-yellow-700 border border-yellow-400 mb-2">
                <strong>⚠️ Note:</strong>  
                <ul className="list-disc ml-4 mt-1">
                    <li>Only <strong>PNG</strong> images with a removed background are allowed.</li>
                    <li>JPG images <strong>will not</strong> enable the "Save Changes" button.</li>
                    <li><strong>JPG</strong> images can be edited in <a href="https://www.photopea.com" target="_blank" className="text-blue-600 underline">Photopea</a>.</li>
                    <li><strong>PNG</strong> images must have at least **50% transparency** to be accepted.</li>
                </ul>
            </div>

                {/* ✅ Image Preview */}
                {formData.previewImage && (
                    <div className="flex flex-col items-center gap-2">
                        <img 
                            src={formData.previewImage.startsWith("/") 
                                ? `http://127.0.0.1:8000${formData.previewImage}` 
                                : formData.previewImage
                            }
                            alt="Product Preview"
                            className="w-full max-h-40 object-contain rounded-md mt-2"
                            onError={(e) => e.target.style.display = "none"} // Hide image if not found
                        />

                        {/* 🔹 "Edit in Photopea" Button if Image is JPG or PNG without Transparency */}
                        {((formData.isJpg || formData.noBackgroundDetected) && formData.previewImage) && (
                             <>
                             <p className="text-red-600 text-xs font-semibold mt-1">
                                 ⚠️ Image Needs Editing - Please Edit in Photopea
                             </p>
                            <button 
                                onClick={handleEditImage}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs"
                            >
                                Edit in Photopea
                            </button>
                            </>
                        )}

                        {/* ✅ Show success message if PNG has transparency */}
                        {formData.hasTransparentBackground && (
                            <p className="text-green-600 text-xs font-semibold mt-1">
                                ✅ Background is removed (Transparent detected)
                            </p>
                        )}

                        {/* ❌ Warning if PNG does NOT have Transparency */}
                        {formData.noBackgroundDetected && (
                            <p className="text-red-600 text-xs font-semibold mt-1">
                                ⚠️ No Transparent Background Detected - Please Edit
                            </p>
                        )}
                    </div>
                )}

                {/* ✅ Image Upload Input */}
                <input type="file" accept="image/*" onChange={handleImageChange} className="border p-2 rounded-md w-full text-sm" />

                {/* ✅ Save Changes Button (Disabled for JPG or PNG without transparency) */}
                <button 
                    onClick={handleUpdateProduct} 
                    disabled={
                        isSavingChanges || 
                        formData.isJpg || 
                        formData.noBackgroundDetected || 
                        !validateDates().endDateValid
                    }                    
                    
                    className={`mt-3 px-3 py-2 rounded-md w-full flex items-center justify-center space-x-2 ${
                        isSavingChanges || formData.isJpg || formData.noBackgroundDetected
                            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                            : "bg-pink-600 text-white hover:bg-pink-700"
                    }`}
                >
                    {isSavingChanges ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            <span>Saving...</span>
                        </>
                    ) : (
                        <span>Save Changes</span>
                    )}
                </button>
            </div>
        </div>
    </div>
)}

        </div>
         </>
    );
}
