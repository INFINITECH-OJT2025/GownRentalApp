"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { HiUsers, HiCube, HiClipboardList, HiCurrencyDollar, HiClock, HiCheckCircle } from "react-icons/hi"; 
import { toast } from "react-hot-toast";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { format } from "date-fns";
import DataTable from "react-data-table-component";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminAnalyticsSection({ isSidebarOpen }) {
    // Add this to prevent horizontal scroll when sidebar is open
    useEffect(() => {
        document.body.style.overflowX = isSidebarOpen ? 'hidden' : ''; // Prevent horizontal scrolling based on sidebar state
        return () => {
            document.body.style.overflowX = ''; // Reset to default when component unmounts
        };
    }, [isSidebarOpen]);

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([]);
    const filteredBookings = stats?.monthlyBookings?.filter(item => item.year === selectedYear) || [];
    const [searchTerm, setSearchTerm] = useState("");
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    
    const successfulStatuses = ["returned"];

const filteredTableData = stats?.bookingsList?.filter((b) => {
  const year = new Date(b.created_at).getFullYear();
  const matchesYear = year === selectedYear;
  const isSuccessful = successfulStatuses.includes(b.status.toLowerCase());
  const matchesSearch =
    b.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());

  return matchesYear && isSuccessful && matchesSearch;
});


    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Unauthorized: Please log in.");
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data.success) {
                    setStats(response.data.stats);

                    // Extract available years from the `monthlyBookings`
                    const years = [...new Set(response.data.stats.monthlyBookings.map(item => item.year))];
                    setAvailableYears(years);
                    
                    // Ensure the selected year is the most recent available
                    setSelectedYear(Math.max(...years));
                } else {
                    setError("Failed to load analytics.");
                }
            } catch (error) {
                setError("Error fetching analytics.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const exportBarChartToPDF = () => {
      setIsExportingPDF(true);
    
      setTimeout(() => {
        toast.promise(
          new Promise((resolve) => {
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const currentDate = format(new Date(), "dd-MMM-yyyy HH:mm:ss");
            const logoBase64 = process.env.NEXT_PUBLIC_LOGO_BASE64 || "";
            const totalPagesExp = "{total_pages_count_string}";
    
            if (logoBase64) {
              doc.addImage(logoBase64, "PNG", 10, 10, 20, 20);
            }
    
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text(`Bookings Per Month Report (${selectedYear})`, 35, 20);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Generated on: ${currentDate}`, 35, 28);
    
            autoTable(doc, {
              startY: 35,
              head: [["Month", "Booking Count"]],
              body: filteredBookings.map(item => [
                format(new Date(selectedYear, item.month - 1), "MMMM"),
                item.count
              ]),
              styles: { fontSize: 10, cellPadding: 2 },
              headStyles: { fillColor: [255, 105, 180], textColor: [255, 255, 255] },
              theme: "grid",
            });
    
            autoTable(doc, {
              startY: doc.lastAutoTable.finalY + 10,
              head: [["Reference No.", "Product", "Status", "Date"]],
              body: filteredTableData.map(b => [
                b.reference_number,
                b.product?.name || "N/A",
                b.status,
                b.created_at ? format(new Date(b.created_at), "dd-MMM-yyyy") : "N/A"
              ]),
              styles: { fontSize: 9, cellPadding: 2 },
              headStyles: { fillColor: [255, 105, 180], textColor: [255, 255, 255] },
              theme: "striped",
              didDrawPage: (data) => {
                const pageHeight = doc.internal.pageSize.height;
                const pageWidth = doc.internal.pageSize.width;
                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text("Generated by Gown Rental System", 10, pageHeight - 10);
                const pageStr = `Page ${data.pageNumber} of ${totalPagesExp}`;
                doc.text(pageStr, pageWidth - 40, pageHeight - 10);
              },
            });
    
            if (typeof doc.putTotalPages === "function") {
              doc.putTotalPages(totalPagesExp);
            }
    
            doc.save(`Bookings_Per_Month_${selectedYear}.pdf`);
            resolve();
          }).finally(() => setIsExportingPDF(false)),
          {
            loading: "Generating PDF...",
            success: "PDF downloaded successfully!",
            error: "Failed to generate PDF.",
          }
        );
      }, 100); // Delay so the loading state shows
    };
    
  const exportBarChartToCSV = () => {
    setIsExportingCSV(true);
  
    setTimeout(() => {
      try {
        const chartSection = [
          ["Bookings Per Month Summary"],
          [`Year: ${selectedYear}`],
          ["Month", "Booking Count"],
          ...filteredBookings.map(item => [format(new Date(selectedYear, item.month - 1), "MMMM"), item.count]),
          [],
        ];
  
        const tableSection = [
          ["Detailed Booking List"],
          ["Reference No.", "Product", "Status", "Date"],
          ...filteredTableData.map(b => [
            b.reference_number,
            b.product?.name || "N/A",
            b.status,
            b.created_at ? format(new Date(b.created_at), "dd-MMM-yyyy") : ""
          ])
        ];
  
        const allRows = [...chartSection, ...tableSection];
        const csv = allRows.map(row => row.join(",")).join("\n");
  
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Bookings_Per_Month_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  
        toast.success("CSV exported successfully!");
      } catch (err) {
        toast.error("Failed to export CSV.");
      } finally {
        setIsExportingCSV(false);
      }
    }, 100); // Delay ensures re-render happens before logic
  };
  
    const chartData = {
        labels: filteredBookings.length > 0
  ? filteredBookings.map(item => format(new Date(selectedYear, item.month - 1), "MMMM"))
  : ["No Data"],
        datasets: [
            {
                label: `Successful Bookings Per Month in ${selectedYear}`,
                data: filteredBookings.length > 0 ? filteredBookings.map(item => item.count) : [0], // ✅ Prevents NaN
                backgroundColor: [
                    "#FF69B4", // Hot Pink
                    "#FF1493", // Deep Pink
                    "#DB7093", // Pale Violet Red
                    "#C71585", // Medium Violet Red
                ],
                borderColor: "#C71585",
                borderWidth: 1,
            },
        ],
    };

    const columns = [
        {
          name: "Reference No.",
          selector: (row) => row.reference_number,
          sortable: true,
        },
        {
          name: "Product",
          selector: (row) => row.product?.name || "N/A",
          sortable: true,
        },
        {
          name: "Status",
          selector: (row) => row.status,
          sortable: true,
          cell: (row) => (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium
                ${row.status === "approved"
                  ? "bg-green-500 text-white"
                  : row.status === "pending"
                  ? "bg-yellow-400 text-white"
                  : row.status === "returned"
                  ? "bg-blue-500 text-white"
                  : row.status === "picked up"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-400 text-white"}`}
            >
              {row.status}
            </span>
          ),
        },
        {
          name: "Date",
          selector: (row) => format(new Date(row.created_at), "dd-MMM-yyyy"),
          sortable: true,
        },
      ];
        
    

    return (
        <>
         <section className="mt-10">
               
         <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-6">
                 {/* ✅ Year Filter Dropdown */}
                 <div className="flex justify-between items-center gap-4 mb-4 mt-0">
                  {/* Filter by Year */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-white mb-0">Filter by Year:</label>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-white focus:ring focus:ring-pink-300"
                    >
                        {availableYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                  <button
                  onClick={exportBarChartToCSV}
                  disabled={isExportingCSV}
                  className="bg-pink-800 text-white px-4 py-2 rounded hover:bg-pink-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isExportingCSV ? "Exporting..." : "Export CSV"}
                </button>

                <button
                  onClick={exportBarChartToPDF}
                  disabled={isExportingPDF}
                  className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isExportingPDF ? "Exporting..." : "Export PDF"}
                </button>

                  </div>
                </div>



                  {/* 📊 Bar Chart and 📋 Table Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* 📊 Bar Chart Section (Left) */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">
                        Bookings Per Month ({selectedYear})
                    </h2>
                 
                    </div>
                    <div className="w-full" style={{ height: "500px" }}>
                    <Bar 
                        data={chartData} 
                        options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                            position: "bottom",
                            },
                        },
                        layout: {
                            padding: { right: 20 },
                        },
                        }} 
                    />
                    </div>
                </div>

                {/* 📋 Table Section (Right) */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    
               
                       
                        

                        {/* Right side: Search + Export */}
                        <div className="flex justify-between items-center w-full mb-4">
                        {/* Title: Left-aligned */}
                        <h2 className="text-lg font-semibold text-gray-700">
                          Booking Per Month Details ({selectedYear})
                        </h2>

                        {/* Right side: Search + Export */}
                        <div className="relative w-full sm:w-64">
                                <input
                                type="text"
                                placeholder="Search by Ref No. or Product..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-5 pr-12 py-2 rounded-full border border-pink-200 focus:ring-2 focus:ring-pink-300 text-sm shadow-sm"
                                />
                                <button
                                type="button"
                                className="absolute right-1 top-1 bottom-1 bg-pink-700 hover:bg-pink-800 text-white rounded-full p-2 transition"
                                disabled
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16 10a6 6 0 11-12 0 6 6 0 0112 0z" />
                                </svg>
                                </button>
                            </div>
                      </div>



                    <DataTable
                    columns={columns}
                    data={filteredTableData || []}
                    pagination
                    highlightOnHover
                    striped
                    noDataComponent={`No successful bookings found for ${selectedYear}.`}
                    className="min-w-full"
                    />
                </div>
                </div>
                </div>     
        </section>
        </>
    );
}
