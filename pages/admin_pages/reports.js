import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";

export default function BookingReports() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [pdfMake, setPdfMake] = useState(null); // ✅ Store pdfMake in state

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
            const response = await fetch("http://127.0.0.1:8000/api/bookings", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Accept": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
    
            // ✅ Map the data to replace IDs with names
            const bookingsWithNames = data.bookings.map(booking => ({
                ...booking,
                user_name: booking.user ? booking.user.name : "Unknown User", 
                product_name: booking.product ? booking.product.name : "Unknown Product",
            }));
    
            setBookings(bookingsWithNames);
            setFilteredBookings(bookingsWithNames);
        } catch (error) {
            console.error("❌ Error fetching bookings:", error);
        }
    };
    

    const handleFilter = () => {
        if (!startDate) return; // ✅ Only one date input is used now
    
        const filteredData = bookings.filter((booking) => {
            const createdAt = new Date(booking.created_at); // ✅ Filter by created date
            return createdAt.toISOString().split("T")[0] === startDate; // ✅ Match exact date
        });
    
        setFilteredBookings(filteredData);
    };
    
    
    const generatePDF = async () => {
        if (!pdfMake) {
            console.error("❌ PDFMake is not loaded yet!");
            return;
        }
    
        const todayDate = format(new Date(), "yyyy-MM-dd");
    
        // ✅ Ensure valid date format or set default text
        const createdDateText = startDate 
            ? `Created Date: ${format(new Date(startDate), "yyyy-MM-dd")}` 
            : "Created Date: All Records";
    
        const docDefinition = {
            pageSize: "A4",
            pageMargins: [10, 60, 10, 50], 
    
            header: {
                margin: [0, 10, 0, 10],
                table: {
                    widths: ["*"],
                    body: [
                        [
                            { 
                                text: "GOWN RENTAL SYSTEM", 
                                fontSize: 12,  
                                bold: true, 
                                color: "#FFFFFF", 
                                alignment: "center", 
                                margin: [0, 2, 0, 2] 
                            }
                        ]
                    ]
                },
                fillColor: "#FFC0CB",
                layout: "noBorders"
            },
    
            content: [
                {
                    text: createdDateText, // ✅ Fixed Created Date text
                    fontSize: 10,
                    bold: true,
                    alignment: "center",
                    margin: [0, 0, 0, 10]
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ["12%", "14%", "14%", "10%", "10%", "10%", "10%", "10%", "10%"],
                        body: [
                            [
                                { text: "Ref No.", bold: true, fontSize: 8 },
                                { text: "User", bold: true, fontSize: 8 },
                                { text: "Product", bold: true, fontSize: 8 },
                                { text: "Start Date", bold: true, fontSize: 8 },
                                { text: "End Date", bold: true, fontSize: 8 },
                                { text: "Added Price", bold: true, fontSize: 8 },
                                { text: "Voucher Fee", bold: true, fontSize: 8 },
                                { text: "Total Price", bold: true, fontSize: 8 },
                                { text: "Status", bold: true, fontSize: 8, alignment: "center" },
                            ],
                            ...filteredBookings.map((booking) => [
                                { text: booking.reference_number, fontSize: 7, margin: [0, 1] }, 
                                { text: booking.user_name, fontSize: 7, alignment: "center", margin: [0, 1] }, 
                                { text: booking.product_name, fontSize: 7, alignment: "center", margin: [0, 1] },
                                { text: format(new Date(booking.start_date), "yyyy-MM-dd"), fontSize: 7, alignment: "center", margin: [0, 1] },
                                { text: format(new Date(booking.end_date), "yyyy-MM-dd"), fontSize: 7, alignment: "center", margin: [0, 1] },
                                { text: `₱${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(booking.added_price)}`, fontSize: 7, alignment: "right", margin: [0, 1] },
                                { text: `₱${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(booking.voucher_fee)}`, fontSize: 7, alignment: "right", margin: [0, 1] },
                                { text: `₱${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(booking.total_price)}`, fontSize: 7, alignment: "right", margin: [0, 1] },
                                { 
                                    text: booking.status, 
                                    fontSize: 7,
                                    alignment: "center",
                                    margin: [0, 1],
                                    bold: true,
                                    color: booking.status === "approved" ? "green" : 
                                           booking.status === "pending" ? "orange" : "red"
                                },
                            ]),
                        ],
                    },
                    layout: "lightHorizontalLines",
                },
            ]
        };
    
        pdfMake.createPdf(docDefinition).download(`Booking_Reports_${todayDate}.pdf`);
    };
    
    
    
    
const columns = [
    { name: "Ref No.", selector: (row) => row.reference_number, sortable: true },
    { name: "User", selector: (row) => row.user_name, sortable: true }, // ✅ Replaced user_id
    { name: "Product", selector: (row) => row.product_name, sortable: true }, // ✅ Replaced product_id
    { name: "Start Date", selector: (row) => format(new Date(row.start_date), "yyyy-MM-dd"), sortable: true },
    { name: "End Date", selector: (row) => format(new Date(row.end_date), "yyyy-MM-dd"), sortable: true },
    { 
        name: "Added Price", 
        selector: (row) => `₱${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(row.added_price)}`, 
        sortable: true 
    },
    { 
        name: "Voucher Fee", 
        selector: (row) => `₱${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(row.voucher_fee)}`, 
        sortable: true 
    },
    { 
        name: "Total Price", 
        selector: (row) => `₱${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(row.total_price)}`, 
        sortable: true 
    },
    {
        name: "Status",
        selector: (row) => row.status,
        sortable: true,
        cell: (row) => (
            <span
                className={`px-4 py-1 text-white text-xs font-medium text-center rounded-full inline-block w-auto min-w-[50px] mx-auto flex justify-center
                ${row.status === "approved" ? "bg-green-500" :
                    row.status === "pending" ? "bg-yellow-500" :
                    "bg-red-500"}`}
            >
                {row.status}
            </span>
        ),
    },
];


    return (
        <div className={`${darkMode ? "dark" : ""} flex h-screen bg-white dark:bg-[#0F172A]`}>
            <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
                <header className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
                    <h1 className="text-lg font-bold dark:text-white mr-auto">Gown Rental - Reports</h1>
                    <div className="flex items-center space-x-2 md:space-x-4 mr-20">
                        {user?.image ? (
                            <Image
                                src={`http://127.0.0.1:8000/storage/profile_pictures/${user.image}`}
                                alt="Profile"
                                width={32}
                                height={32}
                                className="rounded-full border border-gray-300"
                            />
                        ) : (
                            <Image
                                src="/images/default_avatar.png"
                                alt="Default Profile"
                                width={32}
                                height={32}
                                className="rounded-full border border-gray-300"
                            />
                        )}
                        <span className="dark:text-white text-sm md:text-base">{user?.name || "Admin"}</span>
                    </div>
                </header>

                <main className="p-6 mt-16">
                <div className="flex gap-4 mb-4 items-center">
                    <span className="font-semibold">Booking Created Date:</span>
                    <input 
                        type="date" 
                        className="p-2 border rounded" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                    />
                    <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleFilter}>
                        Filter
                    </button>
                    <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={generatePDF}>
                        Export PDF
                    </button>
                </div>

                    <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold dark:text-white mb-4">Booking Reports</h2>
                        <DataTable
                            columns={columns}
                            data={filteredBookings}
                            pagination
                            highlightOnHover
                            striped
                            theme={darkMode ? "dark" : "light"}
                        />
                    </div>
                </main>
            </div>
            
        </div>
    );
}
