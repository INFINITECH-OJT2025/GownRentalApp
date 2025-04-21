"use client";

import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { useRouter } from "next/navigation";
import AdminPaymentDetails from "../components/AdminPaymentDetails";
import { toast } from "react-hot-toast";
import { FaExclamationCircle } from "react-icons/fa";
import AuthGuard from "../components/AuthGuard";
import Navbar from "../components/Navbar"; 
import { Eye, Menu, Upload, Save, PencilLine, Ban, FileText } from "lucide-react";
import Footer from "../components/Footer";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { format } from "date-fns";


export default function BookHistoryPage() {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [receiptRequiredBookings, setReceiptRequiredBookings] = useState([]);
    const [showAttentionModal, setShowAttentionModal] = useState(false); // Modal state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [loadingAction, setLoadingAction] = useState(null);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const columnDropdownRef = useRef(null);
    const columnToggleRef = useRef(null);

    const [startDate, setStartDate] = useState("");
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);


    // ✅ Modal States
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState("");

    const router = useRouter();
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [uploading, setUploading] = useState(false);

    

const handleFileChange = (event, bookingId) => {
    setSelectedFile(event.target.files[0]);
    setSelectedBookingId(bookingId);
};

const handleUpload = async () => {
    if (!selectedFile) {
        toast.error("Please select a receipt image to upload.", { position: "top-right" });
        return;
    }

    if (!selectedBookingId) {
        toast.error("Booking ID is missing!", { position: "top-right" });
        return;
    }

    setLoadingAction(selectedBookingId); // ✅ Start loading state
    setUploading(true);

    const formData = new FormData();
    formData.append("receipt", selectedFile);
    formData.append("booking_id", selectedBookingId);

    try {
        const token = localStorage.getItem("token");
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/bookings/upload-receipt`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        });

        toast.success("Receipt uploaded successfully!", { position: "top-right" });
        window.location.reload();
    } catch (error) {
        console.error("Upload Error:", error.response?.data || error);
        toast.error("Upload failed. Please try again.", { position: "top-right" });
    } finally {
        setUploading(false);
        setLoadingAction(null); 
    }
};

const exportToCSV = () => {
  setIsExportingCSV(true);

  const visibleFields = Object.entries(visibleColumns)
    .filter(([key, value]) => value)
    .map(([key]) => key);

  const csvData = filteredBookings.map((booking) => {
    const row = {};

    if (visibleFields.includes("reference_number")) row["Reference No."] = booking.reference_number;
    if (visibleFields.includes("product")) row["Product"] = booking.product?.name || "N/A";
    if (visibleFields.includes("sizes")) row["Size"] = booking.sizes;
    if (visibleFields.includes("start_date")) row["Start Date"] = format(new Date(booking.start_date), "dd-MMM-yyyy");
    if (visibleFields.includes("end_date")) row["End Date"] = format(new Date(booking.end_date), "dd-MMM-yyyy");
    if (visibleFields.includes("created_at")) row["Created Date"] = format(new Date(booking.created_at), "dd-MMM-yyyy");
    if (visibleFields.includes("total_price")) row["Total Price"] = Number(booking.total_price || 0);
    if (visibleFields.includes("discounted_price")) row["Discounted Price"] = Number(booking.product?.discounted_price || 0);
    if (visibleFields.includes("added_price")) row["Added Price"] = Number(booking.added_price || 0);
    if (visibleFields.includes("voucher_fee")) row["Voucher Fee"] = Number(booking.voucher_fee || 0);
    if (visibleFields.includes("status")) row["Status"] = booking.status;

    return row;
  });

  // Totals row
  const totalRow = {};
  if (visibleFields.includes("reference_number")) totalRow["Reference No."] = "TOTAL :";

  if (visibleFields.includes("total_price"))
    totalRow["Total Price"] = `₱${csvData.reduce((sum, b) => sum + Number(b["Total Price"] || 0), 0).toLocaleString()}`;

  if (visibleFields.includes("discounted_price"))
    totalRow["Discounted Price"] = `₱${csvData.reduce((sum, b) => sum + Number(b["Discounted Price"] || 0), 0).toLocaleString()}`;

  if (visibleFields.includes("added_price"))
    totalRow["Added Price"] = `₱${csvData.reduce((sum, b) => sum + Number(b["Added Price"] || 0), 0).toLocaleString()}`;

  if (visibleFields.includes("voucher_fee"))
    totalRow["Voucher Fee"] = `₱${csvData.reduce((sum, b) => sum + Number(b["Voucher Fee"] || 0), 0).toLocaleString()}`;

  // Format price fields
  const formattedData = csvData.map((row) => {
    const formattedRow = { ...row };
    ["Total Price", "Discounted Price", "Added Price", "Voucher Fee"].forEach((key) => {
      if (formattedRow[key] !== undefined)
        formattedRow[key] = `₱${Number(formattedRow[key]).toLocaleString()}`;
    });
    return formattedRow;
  });

  formattedData.push(totalRow);

  const csv = Papa.unparse(formattedData);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `My_Booking_History_${format(new Date(), "yyyy-MM-dd")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success("CSV exported with filters!", { position: "top-right" });
  setTimeout(() => setIsExportingCSV(false), 1000);
};


const exportToPDF = () => {
  setIsExportingPDF(true);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const todayDate = format(new Date(), "dd-MMM-yyyy HH:mm:ss");
  const totalPagesExp = "{total_pages_count_string}";
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

  const visibleFields = Object.entries(visibleColumns)
    .filter(([key, value]) => value)
    .map(([key]) => key);

  const headRow = [];
  if (visibleFields.includes("reference_number")) headRow.push("Ref No.");
  if (visibleFields.includes("product")) headRow.push("Product");
  if (visibleFields.includes("sizes")) headRow.push("Size");
  if (visibleFields.includes("start_date")) headRow.push("Start Date");
  if (visibleFields.includes("end_date")) headRow.push("End Date");
  if (visibleFields.includes("total_price")) headRow.push("Total Price");
  if (visibleFields.includes("discounted_price")) headRow.push("Discounted");
  if (visibleFields.includes("added_price")) headRow.push("Added");
  if (visibleFields.includes("voucher_fee")) headRow.push("Voucher");
  if (visibleFields.includes("created_at")) headRow.push("Created Date");
  if (visibleFields.includes("status")) headRow.push("Status");

  const bodyData = filteredBookings.map((b) => {
    const row = [];
    if (visibleFields.includes("reference_number")) row.push(b.reference_number);
    if (visibleFields.includes("product")) row.push(b.product?.name || "N/A");
    if (visibleFields.includes("sizes")) row.push(b.sizes);
    if (visibleFields.includes("start_date")) row.push(format(new Date(b.start_date), "dd-MMM-yyyy"));
    if (visibleFields.includes("end_date")) row.push(format(new Date(b.end_date), "dd-MMM-yyyy"));
    if (visibleFields.includes("total_price")) row.push(`P${Number(b.total_price).toLocaleString()}`);
    if (visibleFields.includes("discounted_price")) row.push(`P${Number(b.product?.discounted_price || 0).toLocaleString()}`);
    if (visibleFields.includes("added_price")) row.push(`P${Number(b.added_price || 0).toLocaleString()}`);
    if (visibleFields.includes("voucher_fee")) row.push(`P${Number(b.voucher_fee || 0).toLocaleString()}`);
    if (visibleFields.includes("created_at")) row.push(format(new Date(b.created_at), "dd-MMM-yyyy"));
    if (visibleFields.includes("status")) row.push(b.status);
    return row;
  });

  const footerRow = [];
  if (visibleFields.includes("reference_number")) footerRow.push("TOTAL :");
  if (visibleFields.includes("product")) footerRow.push("");
  if (visibleFields.includes("sizes")) footerRow.push("");
  if (visibleFields.includes("start_date")) footerRow.push("");
  if (visibleFields.includes("end_date")) footerRow.push("");

  if (visibleFields.includes("total_price"))
    footerRow.push(`P${filteredBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0).toLocaleString()}`);

  if (visibleFields.includes("discounted_price"))
    footerRow.push(`P${filteredBookings.reduce((sum, b) => sum + Number(b.product?.discounted_price || 0), 0).toLocaleString()}`);

  if (visibleFields.includes("added_price"))
    footerRow.push(`P${filteredBookings.reduce((sum, b) => sum + Number(b.added_price || 0), 0).toLocaleString()}`);

  if (visibleFields.includes("voucher_fee"))
    footerRow.push(`P${filteredBookings.reduce((sum, b) => sum + Number(b.voucher_fee || 0), 0).toLocaleString()}`);

  if (visibleFields.includes("created_at")) footerRow.push("");
  if (visibleFields.includes("status")) footerRow.push("");

  bodyData.push(footerRow);

  autoTable(doc, {
    startY: 35,
    head: [headRow],
    body: bodyData,
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: {
      fillColor: [236, 72, 153],
      textColor: [255, 255, 255],
      fontSize: 8,
    },
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

  doc.save(`My_Booking_History_${format(new Date(), "dd-MMM-yyyy")}.pdf`);
  toast.success("PDF exported with filters!", { position: "top-right" });
  setTimeout(() => setIsExportingPDF(false), 1000);
};


const [visibleColumns, setVisibleColumns] = useState({
  reference_number: true,
  product: true,
  sizes: true,
  start_date: true,
  end_date: true,
  price: true,
  discounted_price: true,
  added_price: true,
  voucher_fee: true,
  total_price: true,
  status: true,
  created_at: true,
  actions: true,
});

// On mount, load from localStorage
useEffect(() => {
  const savedCols = localStorage.getItem("visibleColumns");
  if (savedCols) {
    setVisibleColumns(JSON.parse(savedCols));
  }
}, []);

// Save on change
useEffect(() => {
  localStorage.setItem("visibleColumns", JSON.stringify(visibleColumns));
}, [visibleColumns]);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      columnDropdownRef.current &&
      !columnDropdownRef.current.contains(event.target) &&
      columnToggleRef.current &&
      !columnToggleRef.current.contains(event.target)
    ) {
      setShowColumnDropdown(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


useEffect(() => {
    const fetchBookings = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/bookings`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setBookings(response.data.bookings);
                setFilteredBookings(response.data.bookings);

                const pendingReceipts = response.data.bookings.filter(
                    (booking) => !booking.gcash_receipt && booking.status !== "canceled"
                  );
                  setReceiptRequiredBookings(pendingReceipts);
                                 
            }
        } catch (error) {
            console.error("API Error:", error.message);
        }
    };

    fetchBookings();
}, []);

// Handle opening the modal
const handleAttentionModalOpen = () => {
    setShowAttentionModal(true);
};

// Handle closing the modal
const handleAttentionModalClose = () => {
    setShowAttentionModal(false);
};

useEffect(() => {
  let filtered = bookings;

  if (searchTerm) {
    filtered = filtered.filter(
      (booking) =>
        booking.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.product && booking.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  if (filterStatus) {
    filtered = filtered.filter((booking) => booking.status === filterStatus);
  }

  if (startDate) {
    filtered = filtered.filter((booking) => {
      const createdAt = new Date(booking.created_at);
      const localDate = createdAt.toLocaleDateString("en-CA"); // format as yyyy-MM-dd
      return localDate === startDate;
    });
    
  }

  setFilteredBookings(filtered);
}, [searchTerm, filterStatus, startDate, bookings]);


const handleShowProduct = (bookingRow) => {
  if (!bookingRow.product) {
    alert("⚠ Product details not available.");
    return;
  }

  setLoadingAction(bookingRow.product.id);

  setTimeout(() => {
    setSelectedProduct({
      ...bookingRow.product,
      status: bookingRow.status,
      gcash_receipt: bookingRow.gcash_receipt,
      stock: bookingRow.product.stock,
      voucherFee: bookingRow.voucher_fee || 0,
      startDate: bookingRow.start_date,
      endDate: bookingRow.end_date,
    });

    setShowProductModal(true);
    setLoadingAction(null);
  }, 800);
};

    // ✅ Close Product Modal
    const closeProductModal = () => {
        setShowProductModal(false);
        setSelectedProduct(null);
    };

    const handleShowReceipt = (receipt) => {
        if (!receipt) {
            alert("❌ No receipt found!");
            return;
        }
        setReceiptUrl(`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${receipt}`);
        setShowReceiptModal(true);
    };
    

    // ✅ Close Receipt Modal
    const closeReceiptModal = () => {
        setShowReceiptModal(false);
        setReceiptUrl("");
    };

    const customStyles = {
        rows: {
          style: {
            minHeight: "60px", // optional
          },
        },
        cells: {
          style: {
            fontSize: "14px",
          },
        },
        striped: {
          style: {
            backgroundColor: "#F9B3DA", // light pink for striped rows
          },
        },
      };

    const allColumns = [
      {
        name: "Ref #",
        selector: (row) => row.reference_number,
        sortable: true,
        width: "118px",
        key: "reference_number",
      },
      {
        name: "Product",
        selector: (row) => row.product?.name || "N/A",
        sortable: true,
        width: "80px",
        key: "product",
      },
      {
        name: "Size",
        selector: (row) => row.sizes || "N/A",
        sortable: true,
        width: "100px",
        key: "sizes",
      },
      {
        name: "Start Date",
        selector: (row) => format(new Date(row.start_date), "dd-MMM-yyyy"),
        sortable: true,
        width: "115px",
        key: "start_date",
      },
      {
        name: "End Date",
        selector: (row) => format(new Date(row.end_date), "dd-MMM-yyyy"),
        sortable: true,
        width: "115px",
        key: "end_date",
      },
      {
        name: "Price",
        selector: (row) => `₱${Number(row.product?.price).toLocaleString()}`,
        sortable: true,
        width: "90px",
        key: "price",
      },
      {
        name: "Discounted Price",
        selector: (row) => `₱${Number(row.product?.discounted_price).toLocaleString()}`,
        sortable: true,
        width: "90px",
        key: "discounted_price",
      },
      {
        name: "Added Price",
        selector: (row) => `₱${Number(row.added_price).toLocaleString()}`,
        sortable: true,
        width: "80px",
        key: "added_price",
      },
      {
        name: "Voucher Fee",
        selector: (row) => `₱${Number(row.voucher_fee || 0).toLocaleString()}`,
        sortable: true,
        width: "80px",
        key: "voucher_fee",
      },
      {
        name: "Total",
        selector: (row) => `₱${Number(row.total_price).toLocaleString()}`,
        sortable: true,
        width: "100px",
        key: "total_price",
      },
      {
        name: "Status",
        selector: (row) => row.status,
        sortable: true,
        width: "130px",
        key: "status",
        cell: (row) => (
          <span className={`min-w-[100px] inline-block px-4 py-1 text-white font-semibold rounded-full text-sm whitespace-nowrap text-center ${
            row.status === "pending"
              ? "bg-yellow-500"
              : row.status === "canceled"
              ? "bg-red-500"
              : row.status === "returned"
              ? "bg-blue-500"
              : row.status === "picked up"
              ? "bg-purple-500"
              : "bg-green-500"
          }`}>
            {row.status}
          </span>
          
        ),
      },
      {
        name: "Date",
        selector: (row) => format(new Date(row.created_at), "dd-MMM-yyyy"),
        sortable: true,
        width: "115px",
        key: "created_at",
      },
      {
        name: "Actions",
        selector: (row) => row.actions,
        center: true,
        width: "200px",
        key: "actions",
        cell: (row) => (
          <div className="flex flex-col items-center justify-center gap-1 text-sm">
          
                {/* 👁 View Product */}
                <button
                onClick={() => handleShowProduct(row)}
                  disabled={!row.product || loadingAction === row.product?.id}
                  className={`w-32 px-3 py-1 flex items-center gap-1 justify-center rounded-md text-white transition text-sm ${
                    loadingAction === row.product?.id ? "bg-gray-500 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700"
                  }`}
                >
                  {loadingAction === row.product?.id ? "Loading..." : "View Details"}
                </button>
          
                {row.gcash_receipt ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowReceipt(row.gcash_receipt);
                    }}
                    className="w-32 px-3 py-1 flex items-center gap-1 justify-center rounded-md text-white bg-green-600 hover:bg-green-700 transition text-sm"
                  >
                    Receipt
                  </button>
                ) : row.status === "pending" && parseInt(row.product?.stock) > 0 ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`file-upload-${row.id}`}
                      onChange={(event) => handleFileChange(event, row.id)}
                      disabled={row.status === "canceled"}
                    />
                    <label
                      htmlFor={`file-upload-${row.id}`}
                      className={`w-32 px-3 py-1 flex items-center gap-1 justify-center rounded-md text-black bg-gradient-to-b from-white to-orange-600 hover:to-orange-700 cursor-pointer text-sm`}
                    >
                      <Upload size={16} />
                      Upload
                    </label>

                    {selectedFile && selectedBookingId === row.id && (
                      <button
                        onClick={handleUpload}
                        disabled={loadingAction === row.id}
                        className={`w-32 px-3 py-1 flex items-center gap-1 justify-center rounded-md text-white transition text-sm ${
                          loadingAction === row.id ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        <Save size={16} />
                        Save
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    disabled
                    className="w-32 px-3 py-1 flex items-center gap-1 justify-center rounded-md bg-gray-300 text-red-600 font-semibold cursor-not-allowed text-sm text-center"
                  >
                    Out of stock
                  </button>
                )}

                {/* ⭐ Review */}
                {row.status === "returned" ? (
                    row.has_review ? (
                        <button
                        disabled
                        className="w-32 px-3 py-1 flex items-center gap-1 justify-center rounded-md bg-gray-400 text-white text-sm cursor-not-allowed"
                        >
                        <PencilLine size={16} />
                        Reviewed
                        </button>
                    ) : (
                      <button
                      onClick={() => {
                        setLoadingAction(row.id);
                        setTimeout(() => {
                          router.push(`/products/${row.product.id}?scroll=review&booking_ref=${row.reference_number}`);
                        }, 300); // Short delay so the button shows "Loading..." before redirect
                      }}
                      disabled={loadingAction === row.id}
                      className={`w-32 px-3 py-1 flex items-center gap-1 justify-center rounded-md text-white transition text-sm ${
                        loadingAction === row.id ? "bg-gray-500 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"
                      }`}
                    >
                      {loadingAction === row.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-1 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Loading...
                        </>
                      ) : (
                        <>
                          Review
                        </>
                      )}
                    </button>
                                       
                    )
                    ) : (
                    <button
                        className="w-32 px-3 py-1 flex items-center gap-1 justify-center rounded-md bg-gray-300 text-gray-600 cursor-not-allowed text-sm"
                        disabled
                    >
                        <Ban size={16} />
                        No Review
                    </button>
                    )}

              </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
          },          
        
    ];
    
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);
    const visibleColumnKeys = Object.entries(visibleColumns)
    .filter(([, value]) => value)
    .map(([key]) => key);
  
  const isFullView = visibleColumnKeys.length === Object.keys(visibleColumns).length;
  
  const columns = allColumns
    .filter((col) => visibleColumns[col.key])
    .map((col) => {
      // Apply fixed width only if all columns are visible
      if (isFullView) {
        return col;
      } else {
        const { width, ...rest } = col; // remove `width` to allow auto sizing
        return rest;
      }
    });
  

    return (
        <AuthGuard>
            <Head>
                <title>Booking History | Gown Rental</title>
            </Head>

            <div className="min-h-screen bg-pink-50 text-gray-800 font-poppins">
          
                <Navbar />

                
    
    
                {/* Page Header - Adjusted for More Spacing */}
                <section className="relative bg-gradient-to-r from-pink-300 via-pink-200 to-pink-100 text-center py-32 flex flex-col items-center">
                    
                <h1 className="text-5xl font-bold text-white drop-shadow-lg mt-6">
                    Booking <span className="text-pink-700">History</span>
                    </h1>
                    <p className="mt-4 text-lg text-pink-900 max-w-2xl mx-auto [text-shadow:2px_2px_0px_black,-2px_-2px_0px_black,2px_-2px_0px_black,-2px_2px_0px_black]">
                    View past bookings
                    </p>
                </section>

    
                {/* Search & Filter Section */}
                <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-16 mt-6 space-y-4 md:space-y-0">
                     
                    {/* Attention Modal */}
                    {showAttentionModal && (
                    <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 overflow-y-auto pt-10 pb-10">
                        <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <button
                            className="absolute top-2 right-2 text-gray-700 text-xl font-bold hover:text-red-600 transition"
                            onClick={handleAttentionModalClose}
                        >
                            ✖
                        </button>

                        <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <FaExclamationCircle className="text-yellow-500" />
                            Attention
                        </h2>

                        <p className="text-lg mb-4">
                            You have <strong>{receiptRequiredBookings.length}</strong> booking
                            {receiptRequiredBookings.length !== 1 ? "s" : ""} that require a receipt
                            upload. <br />
                            If not uploaded, they may not be approved by the admin.
                        </p>

                        <div className="text-left overflow-y-auto border-t pt-4 mt-4">
                            <h3 className="text-md font-semibold text-gray-700 mb-2">
                            Pending Booking References:
                            </h3>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                            {receiptRequiredBookings.map((booking) => (
                                <li key={booking.id} className="break-words">
                                {booking.reference_number}
                                </li>
                            ))}
                            </ul>
                        </div>
                        </div>
                    </div>
                    )}
                    </div>

                    <div className="px-6 md:px-16 mt-6">
                  {receiptRequiredBookings.length > 0 && (
                    <div className="flex mb-4">
                      <div
                        onClick={handleAttentionModalOpen}
                        className="flex items-center gap-1 bg-yellow-400 text-white rounded-full px-2 py-1 text-xs font-semibold shadow cursor-pointer"
                        title="Click to view pending receipts"
                      >
                        <FaExclamationCircle className="w-7 h-7" />
                        <span className="text-white text-lg flex items-center justify-center font-bold">
                          {receiptRequiredBookings.length}
                        </span>
                        <span className="pl-0">
                          {receiptRequiredBookings.length === 1 ? "pending receipt" : "pending receipts"}
                        </span>
                      </div>
                    </div>
                  )}


                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left side: Date, Export, Search */}
                        
              
                        <div className="flex flex-col gap-4">

                       
                       
                                                {/* Row 1: Date + Export buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="text-sm font-semibold whitespace-nowrap">
                              Booking Creation Date:
                            </label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="p-2 border rounded w-[180px]"
                            />
                            <button
                              onClick={() => setStartDate("")}
                              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              Clear Date
                            </button>
                            {/* <button
                              onClick={exportToCSV}
                              disabled={isExportingCSV}
                              className="bg-pink-800 text-white px-4 py-2 rounded hover:bg-pink-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {isExportingCSV ? "Exporting..." : "Export CSV"}
                            </button>
                            <button
                              onClick={exportToPDF}
                              disabled={isExportingPDF}
                              className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {isExportingPDF ? "Exporting..." : "Export PDF"}
                            </button> */}
                          </div>

                          {/* Row 2: Search (spans full width, below buttons) */}
                          <input
                            type="text"
                            placeholder="🔎 Search Reference # or Product"
                            className="p-2 border rounded w-full md:w-[400px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                      </div>

                      <div className="flex flex-col items-end gap-2 px-6 md:px-16 mt-4 z-3">
                        {/* Filter Columns Button */}
                        <div className="relative">
                        <button
                          ref={columnToggleRef}
                          onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                          className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 flex items-center gap-2"
                        >
                          <Menu size={18} />
                          {showColumnDropdown ? "Hide Filters" : "Filter Columns"}
                        </button>

                          {showColumnDropdown && (
                            <div
                              ref={columnDropdownRef}
                              className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-4 max-h-60 overflow-y-auto z-50"
                            >

                              <div className="flex items-center justify-between mb-3">
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
                                  <span className="capitalize text-sm">
                                    {{
                                      reference_number: "Reference #",
                                      product: "Product",
                                      sizes: "Size",
                                      start_date: "Start Date",
                                      end_date: "End Date",
                                      price: "Price",
                                      discounted_price: "Discounted Price",
                                      added_price: "Added Price",
                                      voucher_fee: "Voucher Fee",
                                      total_price: "Total Price",
                                      status: "Status",
                                      created_at: "Created Date",
                                      actions: "Actions"
                                    }[key] || key.replace(/_/g, " ")}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* All Status Dropdown */}
                        <select
                          className="border p-2 rounded w-[200px]"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                        >
                          <option value="">
                            📌 {startDate ? `All Status (Filtered by ${format(new Date(startDate), "dd-MMM-yyyy")})` : "All Status"}
                          </option>
                          <option value="pending">🟡 Pending</option>
                          <option value="approved">✅ Approved</option>
                          <option value="picked up">🟣 Picked Up</option>
                          <option value="canceled">❌ Canceled</option>
                          <option value="returned">✅ Returned</option>
                        </select>
                      </div>



                      </div>
                    </div>

                

                {/* Booking Table */}
                <section className="py-10 px-6 md:px-16">
                <DataTable
                    title="Your Bookings"
                    columns={columns}
                    data={filteredBookings}
                    pagination
                    highlightOnHover
                    responsive
                    striped
                    customStyles={customStyles}
                    />

                </section>

                {/* 🏷 Product Details Modal */}
                {showProductModal && selectedProduct && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg sm:max-w-xl max-h-[90vh] flex flex-col">
                  <button
                    className="absolute top-2 right-2 text-gray-700 text-lg font-bold hover:text-red-600 transition"
                    onClick={closeProductModal}
                  >
                    ✖
                  </button>

                  <h2 className="text-2xl font-semibold text-gray-800 text-center pt-4">Product Details</h2>

                  {/* ✅ Scrollable content container */}
                  <div className="mt-4 px-6 pb-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>
                    <p className="text-lg mb-2">
                      <strong>Name:</strong> {selectedProduct.name}
                    </p>
                   {/* Product Description with See More / See Less */}
                    {selectedProduct.description && (
                      <div className="mt-2">
                        <p className="text-base whitespace-pre-line">
                          <strong>Description:</strong>{" "}
                          {showFullDescription
                            ? selectedProduct.description
                            : selectedProduct.description.split(" ").slice(0, 40).join(" ") +
                              (selectedProduct.description.split(" ").length > 40 ? "..." : "")}
                        </p>
                        {selectedProduct.description.split(" ").length > 40 && (
                          <button
                            onClick={() => setShowFullDescription((prev) => !prev)}
                            className="mt-1 text-sm text-pink-500 underline hover:text-pink-700"
                          >
                            {showFullDescription ? "See less" : "See more"}
                          </button>
                        )}
                      </div>
                    )}
                      {selectedProduct.status === "pending" && !selectedProduct.gcash_receipt ? (
                        parseInt(selectedProduct.stock) > 0 ? (
                          <div className="mt-6">
                            <AdminPaymentDetails />
                          </div>
                        ) : (
                          <div className="mt-6 text-red-600 text-lg font-medium text-center">
                            This product is <strong>out of stock</strong>. You cannot proceed with payment right now.
                          </div>
                        )
                      ) : null}



                  </div>
                </div>
              </div>
            )}


                    {/* 🖼 Receipt Modal */}
                    {showReceiptModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-auto">
                             <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <button
                                className="absolute top-2 right-2 text-gray-700 text-lg font-bold hover:text-red-600 transition"
                                onClick={closeReceiptModal}
                            >
                                ✖
                            </button>

                            {/* ✅ Centered Image Container */}
                            <div className="flex items-center justify-center w-full h-full">
                                <img
                                src={receiptUrl}
                                alt="Receipt"
                                className="max-w-full max-h-[85vh] object-contain rounded-md"
                                />
                            </div>
                            </div>
                        </div>
                        )}
             <Footer />
            </div>
        </AuthGuard>
    );
}