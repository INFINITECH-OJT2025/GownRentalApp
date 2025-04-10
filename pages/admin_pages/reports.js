import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Head from "next/head";
import Papa from "papaparse";
import { toast } from "react-hot-toast";
import Header from "../../components/Header";

export default function BookingReports() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [pdfMake, setPdfMake] = useState(null);
    const [isClearingDate, setIsClearingDate] = useState(false);

    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isExportingCSV, setIsExportingCSV] = useState(false);

    const formatDate = (dateStr) => {
        return dateStr ? format(new Date(dateStr), "dd-MMM-yyyy") : "N/A";
    };
    
    const formatCurrency = (value) => {
        return `P${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    };

    
    const exportToCSV = () => {
        setIsExportingCSV(true);
        const csvData = filteredBookings.map(booking => ({
            "Reference No.": booking.reference_number,
            "User": booking.user_name,
            "Product": booking.product_name,
            "Size": booking.sizes,
            "Start Date": formatDate(booking.start_date),
            "End Date": formatDate(booking.end_date),
            "Created Date": formatDate(booking.created_at),
            "Total Price": formatCurrency(booking.total_price),
            "Discounted / Price": formatCurrency(booking.discounted_price),
            "Added Price": formatCurrency(booking.added_price),
            "Voucher Fee": formatCurrency(booking.voucher_fee),
            "Status": booking.status
        }));
    
        const csv = Papa.unparse(csvData);
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
    
        link.href = url;
        link.setAttribute("download", `Booking_Reports_${format(new Date(), "dd-MMM-yyyy")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    
        toast.success("CSV file exported successfully!", { position: "top-right" });

        setTimeout(() => setIsExportingCSV(false), 1000); // Simulate loading state
    };
    
    const generatePDF = async () => {
        setIsExportingPDF(true);
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const todayDate = format(new Date(), "dd-MMM-yyyy HH:mm:ss");
    
        const logoBase64 = process.env.NEXT_PUBLIC_LOGO_BASE64 || "";
    
        if (logoBase64) {
            doc.addImage(logoBase64, "PNG", 10, 10, 20, 20);
        }
    
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Gown Rental App Report", 35, 20);
    
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Created Date: ${todayDate}`, 35, 28);
    
        const totalPagesExp = "{total_pages_count_string}"; // placeholder
    
        autoTable(doc, {
            startY: 35,
            head: [[
                "Ref No.", "User", "Product", "Size", "Start Date", "End Date", "Created Date",
                "Total Price", "Discounted / Price", "Added Price", "Voucher Fee", "Status"
            ]],
            body: filteredBookings.map(booking => [
                booking.reference_number,
                booking.user_name,
                booking.product_name,
                booking.sizes,
                formatDate(booking.start_date),
                formatDate(booking.end_date),
                formatDate(booking.created_at),
                formatCurrency(booking.total_price),
                formatCurrency(booking.discounted_price),
                formatCurrency(booking.added_price),
                formatCurrency(booking.voucher_fee),
                booking.status
            ]),
            styles: { fontSize: 7, cellPadding: 1 },
            headStyles: { fillColor: [255, 105, 180], textColor: [255, 255, 255], fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 12 }, 1: { cellWidth: 22 }, 2: { cellWidth: 13 }, 3: { cellWidth: 10 },
                4: { cellWidth: 17 }, 5: { cellWidth: 17 }, 6: { cellWidth: 17 }, 7: { cellWidth: 17 },
                8: { cellWidth: 15 }, 9: { cellWidth: 15 }
            },
            theme: "grid",
            didDrawPage: function (data) {
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height || doc.internal.pageSize.getHeight();
    
                doc.setFontSize(9);
                doc.setTextColor(100);
    
                // Footer message
                doc.text("Generated by Gown Rental System", 10, pageHeight - 10);
    
                // Page number (using placeholder)
                const pageStr = "Page " + doc.internal.getNumberOfPages() + " of " + totalPagesExp;
                doc.text(pageStr, pageSize.width - 40, pageHeight - 10);
            }
        });
    
        // ✅ Replace placeholder with actual total pages count
        if (typeof doc.putTotalPages === "function") {
            doc.putTotalPages(totalPagesExp);
        }
    
        setTimeout(() => setIsExportingPDF(false), 1000);
        toast.success("PDF file exported successfully!", { position: "top-right" });
        doc.save(`Booking_Reports_${format(new Date(), "dd-MMM-yyyy")}.pdf`);
    };
    
    

    useEffect(() => {
        const loadPDFMake = async () => {
            try {
                const pdfMakeModule = await import("pdfmake/build/pdfmake");
                const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

                pdfMakeModule.default.vfs = pdfFontsModule.default.pdfMake ? pdfFontsModule.default.pdfMake.vfs : pdfFontsModule.default.vfs;

                setPdfMake(pdfMakeModule.default); // ✅ Set pdfMake in state
            } catch (error) {
                console.error("❌ Error loading pdfMake:", error);
            }
        };

        loadPDFMake(); // ✅ Load pdfMake dynamically

        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "admin") {
            router.push("/");
        } else {
            setUser(storedUser);
        }

        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            setDarkMode(true);
            document.documentElement.classList.add("dark");
        }

        fetchBookings();
    }, [router]);

    const fetchBookings = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`
, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Accept": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
    
            const bookingsWithNamesAndSizes = data.bookings.map(booking => ({
                ...booking,
                created_at: booking.created_at ? booking.created_at : new Date().toISOString(), // ✅ Default to current date if missing
                user_name: booking.user ? booking.user.name : "Unknown User",
                product_name: booking.product ? booking.product.name : "Unknown Product",
                sizes: booking.sizes ?? "N/A",
            }));
    
            setBookings(bookingsWithNamesAndSizes);
            setFilteredBookings(bookingsWithNamesAndSizes);
        } catch (error) {
            console.error("❌ Error fetching bookings:", error);
        }
    };
    
    const columns = [
        { name: "Ref No.", selector: (row) => row.reference_number ?? "N/A", sortable: true, width: "120px" },
        { name: "User", selector: (row) => row.user_name ?? "Unknown User", sortable: true, width: "180px" },
        { name: "Product", selector: (row) => row.product_name ?? "Unknown Product", sortable: true, width: "100px" },
        { name: "Size", selector: (row) => row.sizes ?? "N/A", sortable: true, width: "80px" },
        { name: "Start Date", selector: row => formatDate(row.start_date), sortable: true, width: "120px" },
        { name: "End Date", selector: row => formatDate(row.end_date), sortable: true, width: "120px" },
        { name: "Total Price", selector: row => formatCurrency(row.total_price), sortable: true, width: "120px" },
        { name: "Discounted / Price", selector: row => formatCurrency(row.discounted_price), sortable: true, width: "120px" },
        { name: "Added Price", selector: row => formatCurrency(row.added_price), sortable: true, width: "120px" },
        { name: "Voucher", selector: row => formatCurrency(row.voucher_fee), sortable: true, width: "100px" },
        { name: "Status", selector: (row) => row.status ?? "N/A", sortable: true, width: "120px", 
            cell: (row) => (
                <span
                    className={`px-4 py-1 text-white text-xs font-medium text-center rounded-full inline-block w-auto min-w-[50px] mx-auto flex justify-center
                    ${row.status === "approved" ? "bg-green-500" :
                        row.status === "pending" ? "bg-yellow-500" :
                        row.status === "returned" ? "bg-blue-500" :
                        "bg-red-500"}`}>
                    {row.status}
                </span>
            ),
        },
    ];
    
    return (
        <>
        <Head>
        <title>Reports | Gown Rental</title> {/* ✅ Dynamic Title */}
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
               
               {/* Top Section - Export Buttons */}
               <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-800">Reports</h1>

                <div className="flex flex-wrap items-center gap-2">
                <button 
                    onClick={exportToCSV}  
                    disabled={isExportingCSV}
                    className="bg-pink-800 text-white px-4 py-2 rounded hover:bg-pink-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isExportingCSV ? "Exporting..." : "Export CSV"}
                </button>
                <button 
                    onClick={generatePDF}  
                    disabled={isExportingPDF}
                    className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isExportingPDF ? "Exporting..." : "Export PDF"}
                </button>
                </div>

                </div>
                {/* Bottom Section - Date Filter + Search */}
                
                <div className="w-full bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-md overflow-hidden">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                {/* Left: Date Picker + Clear */}
                <div className="flex items-center gap-2 flex-wrap">
                    <label className="font-semibold whitespace-nowrap">Booking Creation Date:</label>
                    <input 
                    type="date" 
                    className="p-2 border rounded"
                    value={startDate} 
                    onChange={(e) => {
                        const selectedDate = e.target.value;
                        setStartDate(selectedDate);

                        if (!selectedDate) return;

                        const filteredData = bookings.filter((booking) => {
                        if (!booking.created_at) return false;
                        const createdAt = new Date(booking.created_at);
                        return !isNaN(createdAt) && createdAt.toISOString().split("T")[0] === selectedDate;
                        });

                        setFilteredBookings(filteredData);
                        toast.success("Filtered by date!", { position: "top-right" });
                    }}
                    />
                   <button
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        onClick={() => {
                            setIsClearingDate(true);
                            setTimeout(() => {
                            setStartDate("");
                            setFilteredBookings(bookings);
                            setIsClearingDate(false);
                            toast.success("Filters cleared!", { position: "top-right" });
                            }, 500);
                        }}
                        disabled={isClearingDate}
                        >
                        {isClearingDate ? "Clearing..." : "Clear Date"}
                        </button>

                </div>

                {/* Right: Search Bar */}
                <div className="relative flex items-center w-full sm:w-72">
                    <input
                    type="text"
                    placeholder="Search Booking..."
                    className="w-full pl-5 pr-12 py-2 rounded-full border border-pink-200 focus:ring-2 focus:ring-pink-300 text-sm shadow-sm"
                    onChange={(e) => {
                        const term = e.target.value.toLowerCase();
                        setFilteredBookings(
                        bookings.filter((b) =>
                            b.reference_number.toLowerCase().includes(term) ||
                            b.user_name.toLowerCase().includes(term) ||
                            b.product_name.toLowerCase().includes(term)
                        )
                        );
                    }}
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
                <div className="overflow-x-auto"> {/* ✅ Ensure table expands fully while allowing scroll */}
                    <h2 className="text-xl font-semibold dark:text-white mb-4">Booking Reports</h2>
                    <DataTable
                        columns={columns}
                        data={filteredBookings}
                        pagination
                        highlightOnHover
                        striped
                        className="w-full min-w-full" // ✅ Ensures table uses full width
                        theme={darkMode ? "dark" : "light"}
                    />
                </div>
            </div>
            </div>
                </main>
            </div>
                    
        </div>
          </>
    );
}
