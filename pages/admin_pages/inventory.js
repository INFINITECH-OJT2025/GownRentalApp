"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Plus, Minus } from "lucide-react";
import Head from "next/head";
import { toast } from "react-hot-toast";
import Header from "../../components/Header";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [stockLogs, setStockLogs] = useState([]); // ✅ Stock logs state
    const [darkMode, setDarkMode] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockToAdd, setStockToAdd] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAddingStock, setIsAddingStock] = useState(false); // ✅ Track loading state
    const [isMinusModalOpen, setIsMinusModalOpen] = useState(false);
    const [stockToMinus, setStockToMinus] = useState(0);
    const [isMinusLoading, setIsMinusLoading] = useState(false);
    const [inventorySearch, setInventorySearch] = useState("");
    const [stockLogsSearch, setStockLogsSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [filteredInventory, setFilteredInventory] = useState([]);
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [statusFilter, setStatusFilter] = useState("All");

    const [activeTab, setActiveTab] = useState("inventory"); // Track the active tab

    useEffect(() => {
        fetchInventory();
        fetchStockLogs(); // ✅ Fetch stock logs
    }, []);

    const handleOpenMinusModal = (product) => {
        setSelectedProduct(product);
        setStockToMinus(0);
        setIsMinusModalOpen(true);
    };

    const filteredData = (filteredInventory.length ? filteredInventory : inventory).filter((item) => {
        const search = inventorySearch.toLowerCase();
        const status = item.stock > 0 ? "Available" : "Out of Stock";
        const matchesSearch =
          item.name.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search) ||
          item.sizes.toLowerCase().includes(search) ||
          status.toLowerCase().includes(search) ||
          item.stock.toString().includes(search) ||
          item.price.toString().includes(search);
        const matchesStatus = statusFilter === "All" || status === statusFilter;
        return matchesSearch && matchesStatus;
      });
      
    
      const handleExportCSV = () => {
        setIsExportingCSV(true);
      
        const rows = filteredData;
      
        const csvData = rows.map((item) => ({
          "Product Name": item.name,
          "Price": `"₱${Number(item.price).toLocaleString()}"`,
          "Category": item.category,
          "Size": item.sizes,
          "Stock": item.stock,
          "Status": item.stock > 0 ? "Available" : "Out of Stock",
        }));
      
        const csvContent = [
          Object.keys(csvData[0]).join(","),
          ...csvData.map((row) => Object.values(row).join(",")),
        ].join("\n");
      
        const blob = new Blob(["\uFEFF" + csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Inventory_Report_${statusFilter || "All"}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      
        // 🔁 Add a short delay to show "Exporting..." state
        setTimeout(() => {
          toast.success("CSV exported!", { position: "top-right" });
          setIsExportingCSV(false);
        }, 1000); // 1s delay
      };
      
      
      const handleExportPDF = () => {
        setIsExportingPDF(true);
      
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const now = new Date();
        const dateStr = `${now.getDate().toString().padStart(2, "0")}-${now.toLocaleString("en-GB", { month: "short" })}-${now.getFullYear()}`;
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
        const today = `${dateStr} ${timeStr}`;
        
        const totalPagesExp = "{total_pages_count_string}";
        const logoBase64 = process.env.NEXT_PUBLIC_LOGO_BASE64 || "";
      
        if (logoBase64) {
          doc.addImage(logoBase64, "PNG", 10, 10, 20, 20);
        }
      
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Gown Rental - Inventory Report", 35, 20);
      
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Generated on: ${today}`, 35, 28);
      
        const head = [["Product", "Price", "Category", "Size", "Stock", "Status"]];
        const body = filteredData.map((item) => [
          item.name,
          `P${Number(item.price).toLocaleString()}`,
          item.category,
          item.sizes,
          item.stock,
          item.stock > 0 ? "Available" : "Out of Stock",
        ]);
      
        autoTable(doc, {
          startY: 35,
          head,
          body,
          styles: {
            fontSize: 6.5,
            cellPadding: 1.5,
            overflow: "linebreak",
            valign: "middle",
            halign: "left",
            wordBreak: "normal",
          },
          headStyles: {
            fillColor: [236, 72, 153],
            textColor: 255,
            fontSize: 7,
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 40 },
            2: { cellWidth: 40 },
            3: { cellWidth: 40 },
            4: { cellWidth: 15 },
            5: { cellWidth: 15 },
          },
          margin: { top: 35, left: 10, right: 10 },
          didDrawPage: function (data) {
            const pageHeight =
              doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
      
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text("Generated by Gown Rental System", 10, pageHeight - 10);
      
            const pageStr =
              "Page " + doc.internal.getNumberOfPages() + " of " + totalPagesExp;
            doc.text(pageStr, doc.internal.pageSize.width - 40, pageHeight - 10);
          },
        });
      
        if (typeof doc.putTotalPages === "function") {
          doc.putTotalPages(totalPagesExp);
        }
      
        doc.save(`Inventory_Report_${statusFilter || "All"}_${today.split(",")[0]}.pdf`);
      
        // ⏱ Add delay to allow spinner display
        setTimeout(() => {
          toast.success("PDF exported successfully!", { position: "top-right" });
          setIsExportingPDF(false);
        }, 1000); // Delay to visualize "Exporting..." state
      };
      
    // ✅ Fetch inventory data
    const fetchInventory = async () => {
        if (typeof window === "undefined") return;
    
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("Unauthorized: No token found.");
            return;
        }
    
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
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
    

    const fetchStockLogs = async () => {
        if (typeof window === "undefined") return;
    
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("Unauthorized: No token found.");
            return;
        }
    
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stock-logs`, {
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
    
    const handleMinusStock = async () => {
        if (!selectedProduct || stockToMinus <= 0) {
            toast.error("Please enter a valid quantity to deduct.", { position: "top-right" });
            return;
        }
    
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Unauthorized: No token found.", { position: "top-right" });
            return;
        }
    
        setIsMinusLoading(true); // ✅ Start loading
    
        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/inventory/${selectedProduct.id}/minus-stock`,
                { stock: Number(stockToMinus) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                toast.success("Stock reduced successfully!", { position: "top-right" });
                fetchInventory();
                fetchStockLogs();
                setIsMinusModalOpen(false);
            } else {
                toast.error("Failed to reduce stock: " + response.data.message, { position: "top-right" });
            }
        } catch (error) {
            console.error("Error reducing stock:", error.response?.data || error);
            toast.error("Error reducing stock. Check console logs.", { position: "top-right" });
        } finally {
            setIsMinusLoading(false); // ✅ Stop loading
        }
    };
    

    const handleOpenModal = (product) => {
        setSelectedProduct(product);
        setStockToAdd(0);
        setIsModalOpen(true);
    };

    const handleAddStock = async () => {
        if (!selectedProduct || stockToAdd <= 0) {
            toast.error("Please enter a valid stock quantity.", { position: "top-right" });
            return;
        }
    
        setIsAddingStock(true); // ✅ Start loading
    
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Unauthorized: No token found.", { position: "top-right" });
            setIsAddingStock(false);
            return;
        }
    
        try {
            console.log("📡 Sending stock update:", { stock: stockToAdd });
    
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/inventory/${selectedProduct.id}/add-stock`,
                { stock: Number(stockToAdd) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                toast.success("Stock added successfully!", { position: "top-right" });
                fetchInventory();
                fetchStockLogs(); // ✅ Refresh stock logs
                setIsModalOpen(false);
            } else {
                toast.error("Failed to update stock: " + response.data.message, { position: "top-right" });
            }
        } catch (error) {
            console.error("Error updating stock:", error.response?.data || error);
            toast.error("Error updating stock. Check console logs.", { position: "top-right" });
        } finally {
            setIsAddingStock(false); // ✅ Stop loading
        }
    };    
    

    // ✅ Inventory Table Columns with Dynamic Background Colors
const inventoryColumns = [
    { name: "Product Name", selector: (row) => row.name, sortable: true },
    { name: "Price", selector: (row) => `₱${Number(row.price).toLocaleString()}`, sortable: true },
    { name: "Category", selector: (row) => row.category, sortable: true },
    { name: "Size", selector: (row) => row.sizes, sortable: true },
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
    {
        name: "Minus Stock",
        cell: (row) => (
            <button
                onClick={() => handleOpenMinusModal(row)}
                className="text-red-500 hover:text-red-700"
            >
                <Minus size={20} />
            </button>
        ),
    },
    
];

// ✅ Stock Logs Table Columns with Styled Remarks & Properly Formatted Date
const stockLogsColumns = [
    { name: "Product Name", selector: (row) => row.product_name, sortable: true },
    { name: "Product Size", selector: (row) => row.sizes, sortable: true },
    { name: "Stock Change", selector: (row) => row.stock_added, sortable: true },
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
    { 
        name: "Date", 
        selector: (row) => row.created_at, 
        sortable: true,
        cell: (row) => {
            const date = new Date(row.created_at);
            const formattedDate = `${date.getDate().toString().padStart(2, "0")}-${date.toLocaleString("en-GB", { month: "short" })}-${date.getFullYear()}`;

            return <span>{formattedDate}</span>;
        },
    },
];

    return (
        <>
        <Head>
        <title>Inventory | Gown Rental</title> {/* ✅ Dynamic Title */}
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
                    {/* Inventory Table */}
                    <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-6">
                    <div className="mb-4">
  {/* Tabs */}
  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
    <div className="flex space-x-4">
      <span
        onClick={() => {
          setActiveTab("inventory");
          toast.success("Inventory table is now visible.", { position: "top-right" });
        }}
        className={`px-4 py-2 font-semibold cursor-pointer rounded-lg ${
          activeTab === "inventory" ? "bg-pink-600 text-white font-bold" : "text-black"
        }`}
      >
        Inventory
      </span>
      <span
        onClick={() => {
          setActiveTab("stockLogs");
          toast.success("Stock Logs table is now visible.", { position: "top-right" });
        }}
        className={`px-4 py-2 font-semibold cursor-pointer rounded-lg ${
          activeTab === "stockLogs" ? "bg-pink-600 text-white font-bold" : "text-black"
        }`}
      >
        Stock Logs
      </span>
    </div>

    {activeTab === "inventory" && (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full sm:w-auto">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <label className="font-medium text-sm whitespace-nowrap">Filter by Status:</label>
          <select
            className="p-2 border border-gray-300 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Available">Available</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={isExportingCSV}
            className="bg-pink-800 text-white px-4 py-2 rounded hover:bg-pink-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isExportingCSV ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <span>Export CSV</span>
            )}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isExportingPDF ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <span>Export PDF</span>
            )}
          </button>
        </div>
      </div>
    )}
  </div>
</div>




                 {/* Render Inventory Table or Stock Logs Table based on activeTab */}
                 {activeTab === "inventory" && (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        {/* Search bar inside table */}
                        <div className="relative flex justify-end mb-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={inventorySearch}
                            onChange={(e) => setInventorySearch(e.target.value)}
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

                        <div className="overflow-x-auto">
                        <DataTable
                            columns={inventoryColumns}
                            data={
                                (filteredInventory.length ? filteredInventory : inventory)
                                  .filter(item => {
                                    const search = inventorySearch.toLowerCase();
                                    const status = item.stock > 0 ? "Available" : "Out of Stock";
                                    const matchesSearch = (
                                    item.name.toLowerCase().includes(search) ||
                                    item.category.toLowerCase().includes(search) ||
                                    item.sizes.toLowerCase().includes(search) ||
                                    status.toLowerCase().includes(search) ||
                                    item.stock.toString().includes(search) ||
                                    item.price.toString().includes(search)
                                    );
                                    const matchesStatus = statusFilter === "All" || status === statusFilter;
                                    return matchesSearch && matchesStatus;
                                })
                            }
                            pagination
                            highlightOnHover
                            className="min-w-[600px]"
                            />

                        </div>
                    </div>
                    )}

                    {activeTab === "stockLogs" && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        {/* Search bar inside stock logs */}
                        <div className="relative flex justify-end mb-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={stockLogsSearch}
                            onChange={(e) => setStockLogsSearch(e.target.value)}
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

                        <div className="overflow-x-auto">
                        <DataTable
                            columns={stockLogsColumns}
                            data={stockLogs.filter(item => {
                            const search = stockLogsSearch.toLowerCase();
                            const createdDate = new Date(item.created_at).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            });

                            return (
                                item.product_name.toLowerCase().includes(search) ||
                                item.remarks.toLowerCase().includes(search) ||
                                item.sizes.toLowerCase().includes(search) ||
                                item.stock_added.toString().includes(search) ||
                                createdDate.toLowerCase().includes(search)
                            );
                            })}
                            pagination
                            highlightOnHover
                            className="min-w-[600px]"
                        />
                        </div>
                    </div>
                    )}


                        </div>
                </main>
            </div>

            {/* Add Stock Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
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

            {isMinusModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Minus Stock</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">Product: {selectedProduct?.name}</p>
                        <input
                            type="number"
                            value={stockToMinus}
                            onChange={(e) => setStockToMinus(parseInt(e.target.value) || 0)}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                            min="1"
                        />
                        <div className="flex justify-end space-x-3 mt-4">
                            <button onClick={() => setIsMinusModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-700">
                                Cancel
                            </button>
                            <button
                                onClick={handleMinusStock}
                                disabled={isMinusLoading}
                                className={`px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                                    isMinusLoading 
                                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                        : "bg-red-600 text-white hover:bg-red-700"
                                }`}
                            >
                                {isMinusLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <span>Confirm Minus</span>
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


