"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Filter, CalendarCheck, Hourglass, Ban, RefreshCw } from "lucide-react";
import Head from "next/head";
import { toast } from "react-hot-toast";
// import ScheduleCalendar from "./calendar";
import Header from "../../components/Header";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { format } from "date-fns";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
     const [darkMode, setDarkMode] = useState(false);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [monthlyOrders, setMonthlyOrders] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [statusCounts, setStatusCounts] = useState({
        approved: 0,
        pending: 0,
        canceled: 0,
        returned: 0,
    });
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const [filterDate, setFilterDate] = useState("");


    const [isUpdatingStatus, setIsUpdatingStatus] = useState({}); // ✅ Track loading state for each order

    const [searchQuery, setSearchQuery] = useState("");

    const [showColumnDropdown, setShowColumnDropdown] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
    reference_number: true,
    user_name: true,
    user_address: true,
    contact_number: true,
    product_name: true,
    sizes: true,
    start_date: true,
    end_date: true,
    total_price: true,
    discounted_price: true,
    voucher_fee: true,
    added_price: true,
    created_at: true,
    gcash_receipt: true,
    status: true
    });

    useEffect(() => {
        if (!filterDate) {
          setFilteredOrders(orders);
          return;
        }
      
        const filtered = orders.filter((order) => {
          const createdAt = new Date(order.created_at).toISOString().split("T")[0];
          return createdAt === filterDate;
        });
      
        setFilteredOrders(filtered);
      }, [filterDate, orders]);
      

      const exportToCSV = () => {
        setIsExportingCSV(true); // Start loading
      
        setTimeout(() => {
          const visibleFields = Object.entries(visibleColumns)
            .filter(([_, isVisible]) => isVisible)
            .map(([key]) => key);
      
          const csvData = filteredOrders.map((order) => {
            const row = {};
            if (visibleFields.includes("reference_number")) row["Reference No."] = order.reference_number;
            if (visibleFields.includes("user_name")) row["User Name"] = order.user_name;
            if (visibleFields.includes("user_address")) row["Address"] = order.user_address;
            if (visibleFields.includes("contact_number")) row["Contact Number"] = order.contact_number || "N/A";
            if (visibleFields.includes("product_name")) row["Product"] = order.product_name;
            if (visibleFields.includes("sizes")) row["Size"] = order.sizes;
            if (visibleFields.includes("start_date")) row["Start Date"] = format(new Date(order.start_date), "dd-MMM-yyyy");
            if (visibleFields.includes("end_date")) row["End Date"] = format(new Date(order.end_date), "dd-MMM-yyyy");
            if (visibleFields.includes("total_price")) row["Total Price"] = `₱${Number(order.total_price).toLocaleString()}`;
            if (visibleFields.includes("discounted_price")) row["Discounted Price"] = `₱${Number(order.discounted_price || 0).toLocaleString()}`;
            if (visibleFields.includes("voucher_fee")) row["Voucher Fee"] = `₱${Number(order.voucher_fee || 0).toLocaleString()}`;
            if (visibleFields.includes("added_price")) row["Added Price"] = `₱${Number(order.added_price || 0).toLocaleString()}`;            
            if (visibleFields.includes("created_at")) row["Date"] = format(new Date(order.created_at), "dd-MMM-yyyy");
            if (visibleFields.includes("status")) row["Status"] = order.status;
            return row;
          });
      
          const csv = Papa.unparse(csvData);
          const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `Orders_${format(new Date(), "dd-MMM-yyyy")}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      
          toast.success("CSV exported successfully!", { position: "top-right" });
          setIsExportingCSV(false); // Stop loading
        }, 1000); // Optional delay for better UX
      };
      
      const exportToPDF = () => {
        setIsExportingPDF(true); // Start loading
      
        setTimeout(() => {
          const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
          const today = format(new Date(), "dd-MMM-yyyy HH:mm:ss");
          const totalPagesExp = "{total_pages_count_string}";
      
          const logoBase64 = process.env.NEXT_PUBLIC_LOGO_BASE64 || "";
          if (logoBase64) {
            doc.addImage(logoBase64, "PNG", 10, 10, 20, 20);
          }
      
          doc.setFont("helvetica", "bold");
          doc.setFontSize(20);
          doc.text("Gown Rental - Order Report", 35, 20);
      
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`Generated on: ${today}`, 35, 28);
      
          const visibleFields = Object.entries(visibleColumns).filter(([_, val]) => val).map(([key]) => key);
         
        const headRow = [];
        if (visibleFields.includes("reference_number")) headRow.push("Ref No.");
        if (visibleFields.includes("user_name")) headRow.push("User");
        if (visibleFields.includes("user_address")) headRow.push("Address");
        if (visibleFields.includes("contact_number")) headRow.push("Contact");
        if (visibleFields.includes("product_name")) headRow.push("Product");
        if (visibleFields.includes("sizes")) headRow.push("Size");
        if (visibleFields.includes("start_date")) headRow.push("Start");
        if (visibleFields.includes("end_date")) headRow.push("End");
        if (visibleFields.includes("total_price")) headRow.push("Total");
        if (visibleFields.includes("discounted_price")) headRow.push("Discounted");
        if (visibleFields.includes("voucher_fee")) headRow.push("Voucher");
        if (visibleFields.includes("added_price")) headRow.push("Added");
        if (visibleFields.includes("created_at")) headRow.push("Date");
        if (visibleFields.includes("status")) headRow.push("Status");
      
        const bodyRows = filteredOrders.map((order) => {
          const row = [];
          if (visibleFields.includes("reference_number")) row.push(order.reference_number);
          if (visibleFields.includes("user_name")) row.push(order.user_name);
          if (visibleFields.includes("user_address")) row.push(order.user_address);
          if (visibleFields.includes("contact_number")) row.push(order.contact_number || "N/A");
          if (visibleFields.includes("product_name")) row.push(order.product_name);
          if (visibleFields.includes("sizes")) row.push(order.sizes);
          if (visibleFields.includes("start_date")) row.push(format(new Date(order.start_date), "dd-MMM-yyyy"));
          if (visibleFields.includes("end_date")) row.push(format(new Date(order.end_date), "dd-MMM-yyyy"));
          if (visibleFields.includes("total_price")) row.push(`P${Number(order.total_price).toLocaleString()}`);
          if (visibleFields.includes("discounted_price")) row.push(`P${Number(order.discounted_price || 0).toLocaleString()}`);
          if (visibleFields.includes("voucher_fee")) row.push(`P${Number(order.voucher_fee || 0).toLocaleString()}`);
          if (visibleFields.includes("added_price")) row.push(`P${Number(order.added_price || 0).toLocaleString()}`);
          if (visibleFields.includes("created_at")) row.push(format(new Date(order.created_at), "dd-MMM-yyyy"));
          if (visibleFields.includes("status")) row.push(order.status);
          return row;
        });

        // 🔄 Dynamically compute column widths
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20; // 10 left + 10 right
        const usablePageWidth = pageWidth - margin;
        const columnCount = headRow.length;
        const dynamicWidth = usablePageWidth / columnCount;

        const dynamicColumnStyles = {};
        for (let i = 0; i < columnCount; i++) {
        dynamicColumnStyles[i] = { cellWidth: dynamicWidth };
        }

        autoTable(doc, {
            startY: 35,
            head: [headRow],
            body: bodyRows,
            styles: {
              fontSize: 5.5,
              cellPadding: 1.5,
              overflow: 'linebreak',
              cellWidth: 'wrap',
              halign: 'left',
              valign: 'middle',
              wordBreak: 'normal',
            },
            headStyles: {
              fillColor: [236, 72, 153],
              textColor: 255,
              fontSize: 5.5,
            },
            columnStyles: dynamicColumnStyles, // ✅ auto-applied widths
            margin: { top: 35, left: 10, right: 10 },
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
      
          if (typeof doc.putTotalPages === "function") doc.putTotalPages(totalPagesExp);

            doc.save(`Orders_Report_${format(new Date(), "dd-MMM-yyyy")}.pdf`);
            toast.success("PDF exported successfully!", { position: "top-right" });
            setIsExportingPDF(false); // Stop loading
        }, 1000);
        };

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);
    
        const filtered = orders.filter((order) =>
            (order.reference_number?.toLowerCase().includes(query) || "") ||
            (order.user_name?.toLowerCase().includes(query) || "") ||
            (order.product_name?.toLowerCase().includes(query) || "") ||
            (order.status?.toLowerCase().includes(query) || "")
        );
    
        setFilteredOrders(filtered);
    };
    

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("Unauthorized: No token found.");
            return;
        }
    
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log("API Response Data:", response.data); // ✅ Log API data
    
            if (response.data.success && Array.isArray(response.data.data)) {
                setOrders(response.data.data);
                setFilteredOrders(response.data.data);
                filterThisMonthOrders(response.data.data);
                updateStatusCounts(response.data.data);
            } else {
                console.error("Invalid API response format", response.data);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };
    


    const filterThisMonthOrders = (allOrders) => {
        const currentMonth = new Date().getMonth() + 1;
        const filtered = allOrders.filter((order) => {
            const orderMonth = new Date(order.created_at).getMonth() + 1;
            return orderMonth === currentMonth;
        });
        setMonthlyOrders(filtered);
    };

    const updateStatusCounts = (allOrders) => {
        const counts = { all: allOrders.length, approved: 0, pending: 0, picked_up: 0, canceled: 0, returned: 0 };
    
        allOrders.forEach((order) => {
            const normalizedStatus = order.status.toLowerCase().replace(" ", "_"); // ✅ Normalize "picked up" to "picked_up"
            if (counts.hasOwnProperty(normalizedStatus)) {
                counts[normalizedStatus]++;
            }
        });
    
        setStatusCounts(counts);
    };
    
    
    const handleStatusChange = async (id, newStatus) => {
        setIsUpdatingStatus((prev) => ({ ...prev, [id]: true }));
        const token = localStorage.getItem("token");
    
        if (!token) {
            toast.error("Unauthorized: No token found.", { position: "top-right" });
            setIsUpdatingStatus((prev) => ({ ...prev, [id]: false }));
            return;
        }
    
        try {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/update-status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                toast.success(`Order ${orders.find(o => o.id === id)?.reference_number || "N/A"} updated to: ${newStatus}`, { position: "top-right" });
    
                // ✅ Refetch orders
                const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
    
                if (refreshed.data.success) {
                    const newOrders = refreshed.data.data;
                    setOrders(newOrders);
                    setFilteredOrders(newOrders); 
                    setSelectedFilter("all");    
                    updateStatusCounts(newOrders);
                }
            } else {
                toast.error(`Update failed: ${response.data.message}`, { position: "top-right" });
            }
    
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("⚠️ Error updating order. Please try again.", { position: "top-right" });
        } finally {
            setIsUpdatingStatus((prev) => ({ ...prev, [id]: false }));
        }
    };
    
    const handleFilterChange = (status) => {
        setSelectedFilter(status);
        setIsFilterLoading(true); // Start loading
    
        setTimeout(() => {
            if (status === "all") {
                setFilteredOrders(orders);
            } else if (status === "picked up") {
                setFilteredOrders(orders.filter((order) => order.status.toLowerCase() === "picked up"));
            } else {
                setFilteredOrders(orders.filter((order) => order.status === status));
            }
    
            setIsFilterLoading(false); // End loading after filtering
        }, 300); // Optional delay for smoothness (adjust if needed)
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).replace(/ /g, "-"); // ✅ Convert spaces to dashes
    };

    
    const allColumns = [
        { name: "Reference No.", selector: (row) => row.reference_number, sortable: true, width: "150px", key: "reference_number" },
        { name: "User Name", selector: (row) => row.user_name, sortable: true, width: "180px", key: "user_name" },
        { name: "Address", selector: (row) => row.user_address, sortable: true, width: "280px", key: "user_address" },
        { name: "Contact Number", selector: (row) => row.contact_number || "N/A", sortable: true, width: "160px", key: "contact_number" },
        { name: "Product Name", selector: (row) => row.product_name, sortable: true, width: "140px", key: "product_name" },
        { name: "Selected Size", selector: (row) => row.sizes || "N/A", sortable: true, width: "150px", key: "sizes" },
        { name: "Start Date", selector: (row) => formatDate(row.start_date), sortable: true, key: "start_date" },
        { name: "End Date", selector: (row) => formatDate(row.end_date), sortable: true, key: "end_date" },
        { name: "Total Price", selector: (row) => `₱${Number(row.total_price).toLocaleString()}`, sortable: true, key: "total_price" },
        { name: "Discounted / Price", selector: (row) => `₱${Number(row.discounted_price || 0).toLocaleString()}`, sortable: true, width: "150px", key: "discounted_price" },
        { name: "Voucher Fee", selector: (row) => `₱${Number(row.voucher_fee || 0).toLocaleString()}`, sortable: true, width: "150px", key: "voucher_fee" },
        { name: "Added Price", selector: (row) => `₱${Number(row.added_price || 0).toLocaleString()}`, sortable: true, width: "150px", key: "added_price" },
        { name: "Booked Date", selector: (row) => formatDate(row.created_at), sortable: true, key: "created_at" },
        {
          name: "GCash Receipt",
          cell: (row) => {
            if (!row.gcash_receipt) return <span className="text-gray-500">No receipt</span>;
            const receiptUrl = row.gcash_receipt.startsWith("http") ? row.gcash_receipt : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${row.gcash_receipt}`;
            return <a href={receiptUrl} target="_blank" rel="noopener noreferrer"><img src={receiptUrl} className="w-16 h-16 object-cover rounded-lg border" /></a>;
          },
          sortable: false,
          key: "gcash_receipt"
        },
        {
          name: "Status",
          cell: (row) => (
            <div className="relative">
              <select
                value={row.status}
                onChange={(e) => handleStatusChange(row.id, e.target.value)}
                disabled={isUpdatingStatus[row.id]}
                        className={`px-3 py-1 text-white font-semibold rounded-full transition-all duration-200 focus:outline-none
                            ${
                                row.status === "pending"
                                    ? "bg-yellow-500"
                                    : row.status === "approved"
                                    ? "bg-green-500"
                                    : row.status === "picked up"
                                    ? "bg-purple-500"
                                    : row.status === "canceled"
                                    ? "bg-red-500"
                                    : row.status === "returned"
                                    ? "bg-blue-500"
                                    : "bg-gray-500"
                            }
                        `}
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="picked up">Picked Up</option> {/* ✅ New status */}
                        <option value="canceled">Canceled</option>
                        <option value="returned">Returned</option>
                    </select>
        
                    {isUpdatingStatus[row.id] && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                </span>
                )}
            </div>
            ),
            key: "status"
        },
        ];

        const columns = allColumns.filter(col => visibleColumns[col.key]);
    

    return (
        <>
        <Head>
        <title>Order Management | Gown Rental</title> {/* ✅ Dynamic Title */}
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
                <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                {/* Left: Title */}
                <h1 className="text-3xl font-bold text-gray-800">Orders</h1>

                {/* Right: Filter, Clear, Export */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-3 sm:mt-0">

                {/* <button
                    onClick={exportToCSV}
                    disabled={isExportingCSV}
                    className="bg-pink-800 text-white px-4 py-2 rounded hover:bg-pink-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                    {isExportingCSV ? (
                        <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Exporting...</span>
                        </>
                    ) : (
                        <span>Export CSV</span>
                    )}
                    </button>

                    <button
                    onClick={exportToPDF}
                    disabled={isExportingPDF}
                    className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                    {isExportingPDF ? (
                        <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Exporting...</span>
                        </>
                    ) : (
                        <span>Export PDF</span>
                    )}
                    </button> */}

                </div>
                </div>

                        {/* Clickable Status Summary Cards */}
                        <div className="flex flex-wrap gap-4 mb-6 mt-5">
                        {["all", "pending", "canceled", "approved", "picked_up", "returned"].map((statusKey) => {
                            const displayLabel = statusKey.replace("_", " ");
                            const isActive = selectedFilter === displayLabel;

                            return (
                                <button
                                    key={statusKey}
                                    onClick={() => handleFilterChange(displayLabel)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200
                                        ${isActive
                                            ? "border border-pink-500 text-pink-600 bg-pink-100"
                                            : "text-gray-700 hover:text-pink-500"
                                        }`}
                                >
                                    {isFilterLoading && isActive ? (
                                        <svg className="animate-spin h-4 w-4 text-pink-500" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                    ) : (
                                        <>
                                            {statusKey === "pending" && <Hourglass className="w-4 h-4" />}
                                            {statusKey === "canceled" && <Ban className="w-4 h-4" />}
                                            {statusKey === "approved" && <CalendarCheck className="w-4 h-4" />}
                                            {statusKey === "picked_up" && <Filter className="w-4 h-4" />}
                                            {statusKey === "returned" && <RefreshCw className="w-4 h-4" />}
                                        </>
                                    )}
                                    <span>
                                        {displayLabel.charAt(0).toUpperCase() + displayLabel.slice(1)}: {statusCounts[statusKey] || 0}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                        <div style={{ 
                            overflowX: "auto", 
                            width: "100%", 
                            backgroundColor: "#fff", 
                            padding: "1rem", 
                            borderRadius: "8px", 
                            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)"
                        }}>

                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    {/* Filter Column + Search + Date filter row */}
                    <div className="flex items-center flex-wrap gap-2">
                        <label className="text-sm font-semibold whitespace-nowrap">Booking Creation Date:</label>
                        <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="border px-3 py-2 rounded text-sm"
                        />

                        <button
                        onClick={() => {
                            setFilterDate("");
                            setFilteredOrders(orders);
                            toast.success("Date filter cleared", { position: "top-right" });
                        }}
                        className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                        >
                        Clear Date
                        </button>

                        {/* Filter Columns Button */}
                        <div className="relative">
                        <button
                            onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                            className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 flex items-center gap-2 text-sm"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
                            </svg>
                            {showColumnDropdown ? "Hide Filters" : "Filter Columns"}
                        </button>

                        {showColumnDropdown && (
                            <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-4 max-h-60 overflow-y-auto z-20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm text-gray-800">Quick Select:</span>
                                <button
                                onClick={() => {
                                    const allChecked = Object.values(visibleColumns).every(Boolean);
                                    const updated = Object.fromEntries(
                                    Object.entries(visibleColumns).map(([k]) => [k, !allChecked])
                                    );
                                    setVisibleColumns(updated);
                                }}
                                className="text-sm text-pink-600 hover:underline"
                                >
                                {Object.values(visibleColumns).every(Boolean) ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            {Object.entries(visibleColumns).map(([key, value]) => (
                                <label key={key} className="flex items-center space-x-2 mb-2">
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={() =>
                                    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))
                                    }
                                />
                                <span className="capitalize text-sm">{key.replace(/_/g, " ")}</span>
                                </label>
                            ))}
                            </div>
                        )}
                        </div>
                    </div>

                    {/* Search Bar aligned to far right */}
                    <div className="relative flex items-center w-full sm:w-80">
                        <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-5 pr-12 py-2 rounded-full border border-pink-200 focus:ring-2 focus:ring-pink-300 text-sm shadow-sm"
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


                            <DataTable
                                title="All Bookings"
                                columns={columns}
                                data={filteredOrders}
                                pagination
                                highlightOnHover
                            />
                        </div>
                        {/* <div className="mt-10">
                              <ScheduleCalendar />
                      </div> */}
                      </div>
                    </main>

            </div>
        </div>
        </>
    );
}
