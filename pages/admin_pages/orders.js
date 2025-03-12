"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Filter, CalendarCheck, Hourglass, Ban, RefreshCw } from "lucide-react";
import Head from "next/head";
import ChatWidgetPage from "../../components/chat"; 
// import ScheduleCalendar from "./calendar";

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [monthlyOrders, setMonthlyOrders] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [statusCounts, setStatusCounts] = useState({
        approved: 0,
        pending: 0,
        canceled: 0,
        returned: 0,
    });

    const [isUpdatingStatus, setIsUpdatingStatus] = useState({}); // ✅ Track loading state for each order

    const [searchQuery, setSearchQuery] = useState("");

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
            const response = await axios.get("http://127.0.0.1:8000/api/orders", {
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
        const counts = { approved: 0, pending: 0, picked_up: 0, canceled: 0, returned: 0 };
    
        allOrders.forEach((order) => {
            const normalizedStatus = order.status.toLowerCase().replace(" ", "_"); // ✅ Normalize "picked up" to "picked_up"
            if (counts.hasOwnProperty(normalizedStatus)) {
                counts[normalizedStatus]++;
            }
        });
    
        setStatusCounts(counts);
    };
    
    const handleStatusChange = async (id, newStatus) => {
        setIsUpdatingStatus((prev) => ({ ...prev, [id]: true })); // ✅ Start loading for this order
        const token = localStorage.getItem("token");
    
        if (!token) {
            console.error("Unauthorized: No token found.");
            alert("Unauthorized: No token found.");
            setIsUpdatingStatus((prev) => ({ ...prev, [id]: false })); // ✅ Stop loading
            return;
        }
    
        const validStatuses = ["pending", "approved", "picked up", "canceled", "returned"];
        if (!validStatuses.includes(newStatus)) {
            console.error("Invalid status:", newStatus);
            alert("Invalid status selected.");
            setIsUpdatingStatus((prev) => ({ ...prev, [id]: false })); // ✅ Stop loading
            return;
        }
    
        try {
            console.log(`Updating order ${id} to status: ${newStatus}`);
    
            const response = await axios.put(
                `http://127.0.0.1:8000/api/orders/${id}/update-status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                console.log("Order updated successfully:", response.data);
                alert(`Order ${id} status updated to: ${newStatus}`);
                fetchOrders(); // ✅ Refresh orders after update
            } else {
                console.error("API responded with an error:", response.data);
                alert("Failed to update order. Server response: " + response.data.message);
            }
        } catch (error) {
            console.error("Error updating status:", error.response?.data || error);
            alert("Error updating status. Please try again.");
        } finally {
            setIsUpdatingStatus((prev) => ({ ...prev, [id]: false })); // ✅ Stop loading
        }
    };
    
    

    const handleFilterChange = (status) => {
        setSelectedFilter(status);
    
        if (status === "all") {
            setFilteredOrders(orders);
        } else if (status === "picked up") {
            setFilteredOrders(orders.filter((order) => order.status.toLowerCase() === "picked up"));
        } else {
            setFilteredOrders(orders.filter((order) => order.status === status));
        }
    };
    
    const columns = [
        { name: "Reference No.", selector: (row) => row.reference_number, sortable: true },
        { name: "User Name", selector: (row) => row.user_name, sortable: true },
        { name: "Address", selector: (row) => row.user_address, sortable: true },
        { name: "Product Name", selector: (row) => row.product_name, sortable: true },
        { name: "Start Date", selector: (row) => row.start_date, sortable: true },
        { name: "End Date", selector: (row) => row.end_date, sortable: true },
        { name: "Total Price", selector: (row) => `₱${row.total_price}`, sortable: true },
        
        // ✅ NEW COLUMNS ADDED
        { name: "Discounted Price", selector: (row) => `₱${row.discounted_price || "0.00"}`, sortable: true },
        { name: "Voucher Fee", selector: (row) => `₱${row.voucher_fee || "0.00"}`, sortable: true },
        { name: "Added Price", selector: (row) => `₱${row.added_price || "0.00"}`, sortable: true },
    
        { 
            name: "Booked Date", 
            selector: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", { 
                year: "numeric", month: "short", day: "numeric"
            }) : "N/A", 
            sortable: true 
        },
    
        {
            name: "GCash Receipt",
            cell: (row) => {
                if (!row.gcash_receipt) {
                    return <span className="text-gray-500">No receipt</span>;
                }
        
                // ✅ Ensure full URL is used
                const receiptUrl = row.gcash_receipt.startsWith("http")
                    ? row.gcash_receipt
                    : `http://127.0.0.1:8000/storage/${row.gcash_receipt}`;
        
                return (
                    <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                        <img src={receiptUrl} alt="Receipt" className="w-16 h-16 object-cover rounded-lg border" />
                    </a>
                );
            },
            sortable: false,
        },
        
        {
            name: "Status",
            cell: (row) => (
                <div className="relative">
                    <select
                        value={row.status}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        disabled={isUpdatingStatus[row.id]} // ✅ Disable dropdown while updating
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
        
                    {/* ✅ Loading Indicator */}
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
        },
        
    ];        
    

    return (
        <>
        <Head>
        <title>Order Management | Gown Rental</title> {/* ✅ Dynamic Title */}
        <meta name="description" content="Manage your profile and settings on Gown Rental." />
        <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
    </Head>
        <div className="flex h-screen bg-white dark:bg-[#0F172A]">
          <AdminSidebar 
                isSidebarOpen={isSidebarOpen} 
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
                style={{ position: "fixed", left: 0, top: 0, height: "100%", zIndex: 20, transition: "all 0.3s ease-in-out" }}
            />


                    <div style={{ 
                        transition: "all 0.3s", 
                        flex: 1, 
                        padding: "1rem", 
                        marginLeft: isSidebarOpen ? "15rem" : "4rem",
                        minWidth: 0
                    }}>

                <header
                    className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10 cursor-pointer"
                    onClick={() => handleFilterChange("all")}
                >
                    <h1 className="text-lg font-bold dark:text-white mr-auto">Gown Rental - Orders</h1>
                </header>

                <main className="p-6 mt-16">
                        {/* Clickable Status Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                            {["pending", "canceled", "approved", "picked_up", "returned"].map((status) => (
                                <div
                                    key={status}
                                    className={`p-4 ${
                                        status === "approved" ? "bg-green-500" :
                                        status === "pending" ? "bg-yellow-500" :
                                        status === "picked_up" ? "bg-purple-500" : // ✅ Matches the fixed status key
                                        status === "canceled" ? "bg-red-500" :
                                        "bg-blue-500"
                                    } text-white rounded-lg flex items-center cursor-pointer ${
                                        selectedFilter === status ? "border-4 border-white" : ""
                                    }`}
                                    onClick={() => handleFilterChange(status.replace("_", " "))} // ✅ Converts "picked_up" back to "picked up"
                                >
                                    {status === "pending" && <Hourglass className="mr-2" />}
                                    {status === "canceled" && <Ban className="mr-2" />}
                                    {status === "approved" && <CalendarCheck className="mr-2" />}
                                    {status === "picked_up" && <Filter className="mr-2" />} {/* ✅ Icon for Picked Up */}
                                    {status === "returned" && <RefreshCw className="mr-2" />}
                                    {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}: {statusCounts[status] || 0}
                                </div>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white"
                            />
                        </div>

                        <div style={{ 
                            overflowX: "auto", 
                            width: "100%", 
                            backgroundColor: "#fff", 
                            padding: "1rem", 
                            borderRadius: "8px", 
                            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)"
                        }}>
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
                    </main>

            </div>
        </div>
        <ChatWidgetPage />
        </>
    );
}
