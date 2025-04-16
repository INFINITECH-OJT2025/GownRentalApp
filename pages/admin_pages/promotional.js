"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Pencil, XCircle } from "lucide-react";
import Head from "next/head";
import { toast } from "react-hot-toast";
import { PartyPopper } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "../../components/Header";

export default function PromotionalPage() {
    const [discountGroups, setDiscountGroups] = useState({});
     const [darkMode, setDarkMode] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [isSaving, setIsSaving] = useState(false); // ✅ New loading state for button
    const [productSearch, setProductSearch] = useState("");
    const [selectedDiscount, setSelectedDiscount] = useState("All");
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    
    const [showAllDiscounts, setShowAllDiscounts] = useState(false);


    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const token = localStorage.getItem("token");
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            console.log("📡 API Response:", response.data); // ✅ Debugging API Response
    
            if (response.data.success && Array.isArray(response.data.data)) {
              // Group by name + price + description + category + image
                const grouped = {};
                response.data.data.forEach((item) => {
                    const key = `${item.name}_${item.price}_${item.description}_${item.category}_${item.image_url}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            ...item,
                            size_stock: { [item.sizes]: item.stock },
                            grouped_ids: [item.id],
                        };
                    } else {
                        grouped[key].size_stock[item.sizes] = item.stock;
                        grouped[key].grouped_ids.push(item.id);
                    }
                });
                setProducts(Object.values(grouped));

                    
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

    const handleExportCSV = () => {
        setIsExportingCSV(true);
        setTimeout(() => {
        const csvData = filteredProducts.map((item) => ({
            "Product Name": item.name,
            "Original Price": `₱${Number(item.price).toLocaleString("en-US")}`,
            "Discounted Price": item.discounted_price
              ? `₱${Number(item.discounted_price).toLocaleString("en-US")}`
              : "No Discount",
            "Sizes & Stock": Object.entries(item.size_stock || {})
              .map(([size, stock]) => `${size}: ${stock}`)
              .join(", "),
          }));
          
          const csvContent = [
            Object.keys(csvData[0]).join(","),
            ...csvData.map((row) =>
              Object.values(row)
                .map((value) => `"${value}"`) // wrap every value in quotes
                .join(",")
            ),
          ].join("\n");
          
      
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Promotions_Report_${selectedDiscount}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      
        toast.success("CSV exported!", { position: "top-right" });
        setIsExportingCSV(false);
    }, 1000); // 1-second delay
};
      
      const handleExportPDF = () => {
        setIsExportingPDF(true);
        setTimeout(() => {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const formatDateWithDash = (date) => {
            return date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }).replace(/ /g, "-");
        };
        const todayDate = `${formatDateWithDash(new Date())} ${new Date().toLocaleTimeString("en-GB")}`;
        
    
        // Optional: base64 logo from env
        const logoBase64 = process.env.NEXT_PUBLIC_LOGO_BASE64 || "";
    
        if (logoBase64) {
            doc.addImage(logoBase64, "PNG", 10, 10, 20, 20);
        }
    
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Gown Rental - Promotional Discount Report", 35, 20);
    
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Created Date: ${todayDate}`, 35, 28);
    
        const totalPagesExp = "{total_pages_count_string}";
    
        autoTable(doc, {
            startY: 35,
            head: [["Product", "Original Price", "Discounted Price", "Sizes & Stock", "Created Date"]],
            body: filteredProducts.map((item) => {
                const priceFormatted = `P${parseFloat(item.price).toLocaleString()}`;
                const discountedFormatted = item.discounted_price
                    ? `P${parseFloat(item.discounted_price).toLocaleString()}`
                    : "No Discount";
                    const formattedDate = item.created_at
                    ? new Date(item.created_at)
                          .toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                          })
                          .replace(/ /g, "-")
                    : "—";                
    
                return [
                    item.name,
                    priceFormatted,
                    discountedFormatted,
                    Object.entries(item.size_stock || {})
                        .map(([size, stock]) => `${size}: ${stock}`)
                        .join(", "),
                    formattedDate,
                ];
            }),
            styles: { fontSize: 7, cellPadding: 1 },
            headStyles: {
                fillColor: [255, 105, 180], // 🌸 PINK
                textColor: [255, 255, 255],
                fontSize: 8,
            },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 25 },
                2: { cellWidth: 30 },
                3: { cellWidth: 55 },
                4: { cellWidth: 25 },
            },
            theme: "grid",
            didDrawPage: function (data) {
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height || doc.internal.pageSize.getHeight();
    
                doc.setFontSize(9);
                doc.setTextColor(100);
    
                doc.text("Generated by Gown Rental System", 10, pageHeight - 10);
                const pageStr = "Page " + doc.internal.getNumberOfPages() + " of " + totalPagesExp;
                doc.text(pageStr, pageSize.width - 40, pageHeight - 10);
            },
        });
    
        if (typeof doc.putTotalPages === "function") {
            doc.putTotalPages(totalPagesExp);
        }
    
        doc.save(`Promotions_Report_${selectedDiscount}_${formatDateWithDash(new Date())}.pdf`);
        toast.success("PDF exported!", { position: "top-right" });
        setIsExportingPDF(false);
    }, 1000); // 1-second delay
};
    
    
    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
      
        const hasDiscount = product.discounted_price && product.price;
        const discount = hasDiscount
          ? Math.round(((product.price - product.discounted_price) / product.price) * 100)
          : null;
      
        const matchesDiscount =
          selectedDiscount === "All" || parseInt(selectedDiscount) === discount;
      
        return matchesSearch && matchesDiscount;
      });
      
    

      const handleEdit = (product) => {
        setSelectedProduct(product);
    
        // Calculate existing discount % if available
        if (product.discounted_price && product.price) {
            const discount = Math.round(((product.price - product.discounted_price) / product.price) * 100);
            setDiscountPercentage(discount.toString());
        } else {
            setDiscountPercentage(""); // No discount
        }
    
        setIsEditModalOpen(true);
    };
    

    const handleSaveDiscount = async () => {
        if (!selectedProduct) return;
        setIsSaving(true); // ✅ Start loading
        const token = localStorage.getItem("token");
    
        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/product/${selectedProduct.id}/discount`,
                { discount_percentage: discountPercentage },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );            
    
            if (response.data.success) {
                toast.success("Discount updated successfully!", { position: "top-right" });
                fetchProducts(); // ✅ Refresh product list
                setIsEditModalOpen(false);
            } else {
                toast.error("Failed to update discount.", { position: "top-right" });
            }
        } catch (error) {
            console.error("Error updating discount:", error);
            toast.error("Error updating discount. Please try again.", { position: "top-right" });
        } finally {
            setIsSaving(false); // ✅ Stop loading
        }
    };
    
    const handleDeleteDiscount = async (product) => {
        const confirmed = window.confirm(`Are you sure you want to remove the discount for "${product.name}"?`);
        if (!confirmed) return;
    
        const token = localStorage.getItem("token");
    
        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/product/${product.id}/discount`,
                { discount_percentage: 0 },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
    
            if (response.data.success) {
                toast.success("Discount removed successfully!", { position: "top-right" });
                fetchProducts();
            } else {
                toast.error("Failed to remove discount.", { position: "top-right" });
            }
        } catch (error) {
            console.error("Error deleting discount:", error);
            toast.error("Error removing discount. Please try again.", { position: "top-right" });
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
            name: "Size",
            selector: (row) => Object.entries(row.size_stock || {})
                .map(([size, stock]) => `${size}: ${stock}`)
                .join(", "),
        },
        {
            name: "Actions",
            cell: (row) => (
                <div className="flex gap-2">
                    <button onClick={() => handleEdit(row)} className="text-blue-500 hover:text-blue-700">
                        <Pencil size={20} />
                    </button>
                    {row.discounted_price && row.discounted_price !== "null" && (
                        <button onClick={() => handleDeleteDiscount(row)} className="text-red-500 hover:text-red-700">
                            <XCircle size={20} />
                        </button>
                    )}
                </div>
            ),
        },
        
    ];

    const bgColors = [
        "bg-pink-500",
        "bg-purple-500",
        "bg-green-500",
        "bg-yellow-500",
    ];
    
    return (
        <>
        <Head>
        <title>Promotional Tools | Gown Rental</title> {/* ✅ Dynamic Title */}
        <meta name="description" content="Manage your profile and settings on Gown Rental." />
        <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
    </Head>
    <div className={`${darkMode ? "dark" : ""} flex h-screen bg-white dark:bg-[#0F172A]`}>
            {/* Floating burger (mobile only) */}
                           {!isSidebarOpen && (
                               <button
                                   onClick={() => setIsSidebarOpen(true)}
                                   className={`fixed top-2 left-4 z-50 bg-pink-600 text-white p-3 rounded-full shadow-lg ${
                                   isSidebarOpen ? "hidden" : "block"
                                   } md:hidden`}
                               >
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                           </svg>
                       </button>
                       )}
           
                       {/* ✅ Dark overlay for mobile when sidebar is open */}
                       {isSidebarOpen && (
                       <div
                           className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
                           onClick={() => setIsSidebarOpen(false)}
                       />
                       )}
           
           
                           <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
           
                   <div className={`flex-1 transition-all duration-300 md:${isSidebarOpen ? "ml-60" : "ml-16"} min-w-0`}>
              <Header isSidebarOpen={isSidebarOpen} />

                <main className="p-6 mt-16">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Promotions</h1>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {Object.keys(discountGroups)
                        .sort((a, b) => parseInt(b) - parseInt(a)) // Optional: highest discount first
                        .slice(0, showAllDiscounts ? Object.keys(discountGroups).length : 6)
                        .map((discount, idx) => (
                        <div
                            key={idx}
                            className="relative bg-pink-100 text-pink-800 shadow-md p-6 my-2 rounded-none overflow-hidden"
                        >
                            <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full z-10 shadow-sm"></div>
                            <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full z-10 shadow-sm"></div>

                            <div className="flex items-center justify-center mb-3 text-center">
                            <PartyPopper className="w-8 h-8 text-pink-500 mr-2" />
                            <span className="text-2xl font-bold">{discount}% OFF</span>
                            </div>

                            <div className="text-sm font-semibold text-gray-700 mb-2 text-center">
                            Product/s:
                            </div>

                            <div className="flex flex-wrap justify-center gap-2 text-xs">
                            {discountGroups[discount].map((product) => (
                                <span
                                key={product.id}
                                className="bg-pink-600 text-white px-3 py-1 rounded-full"
                                >
                                {product.name}
                                </span>
                            ))}
                            </div>
                        </div>
                    ))}
                    </div>

                    {Object.keys(discountGroups).length > 6 && (
                <div className="text-center mb-6">
                    <button
                    onClick={() => setShowAllDiscounts(!showAllDiscounts)}
                    className="text-sm text-pink-600 hover:underline focus:outline-none"
                    >
                    {showAllDiscounts ? "See less" : "See More..."}
                    </button>
                </div>
                )}


                <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-6">
                {/* 🔧 Top row layout: Filter + Export on left, Search on right */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                {/* Left side: Discount Filter + Export Buttons */}
                <div className="flex flex-wrap gap-2 items-center">
                    <label className="text-sm font-medium whitespace-nowrap">Filter by Discount:</label>
                    <select
                    className="p-2 border border-gray-300 rounded"
                    value={selectedDiscount}
                    onChange={(e) => setSelectedDiscount(e.target.value)}
                    >
                    <option value="All">All</option>
                    {Object.keys(discountGroups)
                        .sort((a, b) => parseInt(a) - parseInt(b))
                        .map((discount) => (
                        <option key={discount} value={discount}>
                            {discount}% OFF
                        </option>
                        ))}
                    </select>

                    <button
                    onClick={handleExportCSV}
                    disabled={isExportingCSV}
                    className="bg-pink-800 text-white px-4 py-2 rounded hover:bg-pink-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                    {isExportingCSV ? "Exporting..." : "Export CSV"}
                    </button>
                    <button
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                    {isExportingPDF ? "Exporting..." : "Export PDF"}
                    </button>
                </div>

                {/* Right side: Search bar */}
                <div className="relative">
                    <input
                    type="text"
                    placeholder="Search Product Name..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full sm:w-80 pl-5 pr-12 py-2 rounded-full border border-pink-200 focus:ring-2 focus:ring-pink-300 text-sm shadow-sm"
                    />
                    <button
                    type="button"
                    className="absolute right-1 top-1 bottom-1 bg-pink-700 hover:bg-pink-800 text-white rounded-full p-2 transition"
                    disabled
                    >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-4.35-4.35M16 10a6 6 0 11-12 0 6 6 0 0112 0z"
                        />
                    </svg>
                    </button>
                </div>
                </div>

                

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="overflow-x-auto">
                        {/* 📦 Product Table */}
                        <DataTable
                        columns={columns}
                        data={filteredProducts}
                        pagination
                        highlightOnHover
                        />

                    </div>
                    </div>
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
            <p className="text-gray-700">
            Current Discount:{" "}
            {selectedProduct.discounted_price && selectedProduct.discounted_price !== "null"
                ? `${discountPercentage}%`
                : "No Discount"}
        </p>

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
        </>
    );
}
