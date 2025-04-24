"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import DataTable from "react-data-table-component";
import { Pencil, Trash2, PlusCircle, XCircle,EyeOff, Eye, Tag, Loader2, Boxes } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Head from "next/head";
import { toast } from "react-hot-toast";
import Header from "../../components/Header";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { format } from "date-fns";


export default function ProductsPage() {
    let hideUnhideCooldown = false;

     const [darkMode, setDarkMode] = useState(false);
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
    const [isAddingProduct, setIsAddingProduct] = useState(false); 
    const [isSavingChanges, setIsSavingChanges] = useState(false); 
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);
    const [selectedProductGroup, setSelectedProductGroup] = useState([]);
    const hiddenGroupedCount = filteredProducts.filter(p => p.is_hidden).length;
    const [groupedAllProducts, setGroupedAllProducts] = useState([]); // ✅ Declare first
    const groupedProductsCount = groupedAllProducts.filter(p => !p.is_hidden).length; // ✅ Use after
    const [showSizeToggleModal, setShowSizeToggleModal] = useState(false);
    const [selectedGroupToToggle, setSelectedGroupToToggle] = useState(null);


    const [showCategoryFilters, setShowCategoryFilters] = useState(false);
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    
    const getAvailabilityNote = (startDate, endDate) => {
        const today = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
      
        if (end < today) return "Expired";
        if (start > today) return "Upcoming";
        return "Available";
      };

      
    const [selectedSize, setSelectedsizes] = useState("Medium");

    const [searchQuery, setSearchQuery] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "",
        description: "",
        start_date: "",
        end_date: "",
        image: null,
        previewImage: null,
        sizesWithStock: {},  // ✅ Include this
        showCustomCategory: false,
      });
      
      const hasEmptyStock = Object.values(formData.sizesWithStock || {}).some(v => !v || isNaN(v));
      const sizeCount = Object.keys(formData.sizesWithStock || {}).length;
      

    const handleSizeChange = (sizes) => {
        setSelectedSize(sizes);
    };
    
    const formatCurrency = (value) => {
        return `P${Number(value || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })}`;
    };
    
    const handleSelectiveHide = async () => {
        const token = localStorage.getItem("token");
        if (!token || !selectedGroupToToggle) return;
      
        const shouldHide = selectedGroupToToggle.is_hidden === 0;
      
        const selectedVariants = selectedGroupToToggle.groupedItems.filter((item) => item._selected !== false); // default selected = true
      
        try {
          await Promise.all(
            selectedVariants.map((item) =>
              fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${item.id}/toggle-visibility`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ hide: shouldHide }),
              }).then((res) => {
                if (!res.ok) throw new Error(`Failed to toggle product ID ${item.id}`);
              })
            )
          );
      
          toast.success(`Successfully ${shouldHide ? "hidden" : "unhidden"} selected sizes!`, {
            position: "top-right",
          });
      
          setShowSizeToggleModal(false);
          setSelectedGroupToToggle(null);
          fetchProducts(); // refresh after change
        } catch (err) {
          toast.error("❌ Something went wrong. Check console.", { position: "top-right" });
          console.error(err);
        }
      };
      

    const exportToCSV = () => {
        setIsExportingCSV(true);
      
        try {
          const csvData = filteredProducts.flatMap(productGroup =>
            (productGroup.groupedItems || [productGroup]).map(item => ({
              "Product Name": item.name,
              "Category": item.category,
              "Size": item.sizes,
              "Price": formatCurrency(item.price),
              "Stock": item.stock,
              "Start Date": format(new Date(item.start_date), "dd-MMM-yyyy"),
              "End Date": format(new Date(item.end_date), "dd-MMM-yyyy"),
            }))
          );
      
          const csv = Papa.unparse(csvData);
          const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
      
          link.href = url;
          link.setAttribute("download", `Products_${format(new Date(), "dd-MMM-yyyy")}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      
          toast.success("CSV exported!", { position: "top-right" });
        } catch (error) {
          toast.error("Failed to export CSV", { position: "top-right" });
        } finally {
          setTimeout(() => setIsExportingCSV(false), 1000);
        }
      };
      
      const exportToPDF = () => {
        setIsExportingPDF(true);
      
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const today = format(new Date(), "dd-MMM-yyyy HH:mm:ss");
        const totalPagesExp = "{total_pages_count_string}";
        const logoBase64 = process.env.NEXT_PUBLIC_LOGO_BASE64 || "";
      
        if (logoBase64) {
          doc.addImage(logoBase64, "PNG", 10, 10, 20, 20);
        }
      
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Product Inventory", 35, 20);
      
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Created Date: ${today}`, 35, 28);
      
        autoTable(doc, {
          startY: 35,
          head: [["Name", "Category", "Size", "Price", "Stock", "Start Date", "End Date"]],
          body: filteredProducts.flatMap(productGroup =>
            (productGroup.groupedItems || [productGroup]).map(item => [
              item.name,
              item.category,
              item.sizes,
              formatCurrency(item.price),
              item.stock,
              format(new Date(item.start_date), "dd-MMM-yyyy"),
              format(new Date(item.end_date), "dd-MMM-yyyy"),
            ])
          ),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [255, 105, 180], textColor: 255 },
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
      
        doc.save(`Products_${format(new Date(), "dd-MMM-yyyy")}.pdf`);
        toast.success("PDF exported!", { position: "top-right" });
      
        setTimeout(() => setIsExportingPDF(false), 1000);
      };
      
      
    useEffect(() => {
        fetchProducts();
    }, []);

    const getCategoryCounts = (groupedProducts) => {
        const counts = {};
        groupedProducts.forEach((product) => {
            if (!product.is_hidden) {
                counts[product.category] = (counts[product.category] || 0) + 1;
            }
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

useEffect(() => {
    let filtered = [...products];

    if (selectedCategory === "Hidden Products") {
        filtered = products.filter((product) => product.is_hidden === 1);
    } else if (selectedCategory) {
        filtered = products.filter(
            (product) => product.category === selectedCategory && product.is_hidden === 0
        );
    } else {
        // 🛠️ Fix: Filter only visible products for "All"
        filtered = products.filter((product) => product.is_hidden === 0);
    }
    
    if (searchQuery.trim() !== "") {
        filtered = filtered.filter((product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // Grouping logic (always applied)
    const grouped = [];
    const seen = new Set();

    filtered.forEach((product) => {
        const key = `${product.name}-${product.price}-${product.category}-${product.description}-${product.image_url}-${product.start_date}-${product.end_date}`;
        if (!seen.has(key)) {
            const groupItems = filtered.filter((p) =>
                p.name === product.name &&
                p.price === product.price &&
                p.category === product.category &&
                p.description === product.description &&
                p.image_url === product.image_url &&
                p.start_date === product.start_date &&
                p.end_date === product.end_date
            );

            const totalStock = groupItems.reduce((sum, item) => sum + Number(item.stock), 0);

            const allHidden = groupItems.every((item) => item.is_hidden === 1); // 👈 check if all variants are hidden

            grouped.push({
            ...product,
            stock: totalStock,
            groupedItems: groupItems,
            is_hidden: allHidden ? 1 : 0, // ✅ assign group is_hidden based on all items
            });


            seen.add(key);
        }
    });

    setFilteredProducts(grouped); // ✅ final grouped data regardless of category
}, [products, selectedCategory, searchQuery]);


const filterByCategory = (category) => {
    setIsCategoryLoading(true);
    setSelectedCategory(category);

    let filtered = [...products];

    if (category === "Hidden Products") {
        filtered = groupedAllProducts.filter((group) => group.is_hidden === 1);
    } else if (category !== null) {
        filtered = groupedAllProducts.filter(
            (group) => group.category === category && group.is_hidden === 0
        );
    } else {
        filtered = groupedAllProducts.filter((group) => group.is_hidden === 0);
    }
    

    // ✅ Apply grouping logic here
    const grouped = [];
    const seen = new Set();

    filtered.forEach((product) => {
        const key = `${product.name}-${product.price}-${product.category}-${product.description}-${product.image_url}-${product.start_date}-${product.end_date}`;
        if (!seen.has(key)) {
            const groupItems = filtered.filter((p) =>
                p.name === product.name &&
                p.price === product.price &&
                p.category === product.category &&
                p.description === product.description &&
                p.image_url === product.image_url &&
                p.start_date === product.start_date &&
                p.end_date === product.end_date
            );

            const totalStock = groupItems.reduce((sum, item) => sum + Number(item.stock), 0);

            const allHidden = groupItems.every((item) => item.is_hidden === 1); // 👈 check if all variants are hidden

            grouped.push({
            ...product,
            stock: totalStock,
            groupedItems: groupItems,
            is_hidden: allHidden ? 1 : 0, // ✅ assign group is_hidden based on all items
            });


            seen.add(key);
        }
    });

    setTimeout(() => {
        setFilteredProducts(grouped); // ✅ Use grouped
        setIsCategoryLoading(false);
    }, 300);
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
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log("✅ API Response (Admin):", response.data);
    
            if (response.data.success && Array.isArray(response.data.data)) {
                const grouped = [];
                const seen = new Set();

                response.data.data.forEach((product) => {
                    const key = `${product.name}-${product.price}-${product.category}-${product.description}-${product.image_url}-${product.start_date}-${product.end_date}`;
                    if (!seen.has(key)) {
                        const groupItems = response.data.data.filter((p) =>
                            p.name === product.name &&
                            p.price === product.price &&
                            p.category === product.category &&
                            p.description === product.description &&
                            p.image_url === product.image_url &&
                            p.start_date === product.start_date &&
                            p.end_date === product.end_date
                        );

                        const totalStock = groupItems.reduce((sum, item) => sum + Number(item.stock), 0);

                        const allHidden = groupItems.every((item) => item.is_hidden === 1); // 👈 check if all variants are hidden

                        grouped.push({
                        ...product,
                        stock: totalStock,
                        groupedItems: groupItems,
                        is_hidden: allHidden ? 1 : 0, // ✅ assign group is_hidden based on all items
                        });


                        seen.add(key);
                    }
                });

                setProducts(response.data.data); // full original list
                setFilteredProducts(grouped); // for currently selected category
                setGroupedAllProducts(grouped); // ✅ for total "All" count                

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
    
        const matchingGroup = product.groupedItems || [product];
    
        const groupedSizes = {};
        matchingGroup.forEach((item) => {
            if (groupedSizes[item.sizes]) {
                groupedSizes[item.sizes] += Number(item.stock); 
            } else {
                groupedSizes[item.sizes] = Number(item.stock); 
            }
        });
        
        setFormData({
            name: product.name,
            price: product.price,
            category: product.category,
            description: product.description,
            start_date: product.start_date,
            end_date: product.end_date,
            image: null,
            previewImage: product.image_url || null,
            sizesWithStock: groupedSizes,
            showCustomCategory: false,
            isJpg: product.image_url?.toLowerCase().endsWith(".jpg"),
            hasTransparentBackground: true,
            noBackgroundDetected: false,
        });
    
        setSelectedProduct(product);
        setSelectedProductGroup(matchingGroup);
        setIsEditModalOpen(true);
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
    
        const fileExtension = file.name.split(".").pop().toLowerCase();
        if (!["jpg", "jpeg", "png"].includes(fileExtension)) {
            alert("⚠️ Invalid file type. Only JPG or PNG allowed.");
            return;
        }
    
        setIsProcessingImage(true);
    
        const reader = new FileReader();
        reader.readAsDataURL(file);
    
        reader.onload = async () => {
            try {
                const base64Image = reader.result.split(",")[1];
    
                if (fileExtension === "png") {
                    // ✅ Resize PNG before processing
                    const resizedDataUrl = await resizeImageToFixedSize(file, 1070, 1152);
                    const resizedBase64 = resizedDataUrl.split(",")[1];
    
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process-image`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image: resizedBase64 }),
                    });
    
                    const result = await response.json();
    
                    if (result.success && result.processed_image) {
                        const isTransparent = await checkIfBackgroundRemoved(file);
    
                        setFormData((prev) => ({
                            ...prev,
                            image: result.processed_image,
                            previewImage: `/storage/${result.processed_image.replace("storage/", "")}`,
                            isJpg: false,
                            hasTransparentBackground: isTransparent,
                            noBackgroundDetected: !isTransparent,
                        }));
                    } else {
                        alert(`Image processing failed: ${result.message || "Unknown error"}`);
                    }
                } else {
                    // ✅ JPG - no resizing needed, just upload
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process-image`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image: base64Image }),
                    });
    
                    const result = await response.json();
    
                    if (result.success && result.processed_image) {
                        setFormData((prev) => ({
                            ...prev,
                            image: result.processed_image,
                            previewImage: `/storage/${result.processed_image.replace("storage/", "")}`,
                            isJpg: true,
                            hasTransparentBackground: false,
                            noBackgroundDetected: false,
                        }));
                    } else {
                        alert(`Image processing failed: ${result.message || "Unknown error"}`);
                    }
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

    const resizeImageToFixedSize = (file, width = 1070, height = 1152) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
    
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
    
                // Maintain aspect ratio
                const aspectRatio = img.width / img.height;
                let drawWidth = width;
                let drawHeight = height;
    
                if (aspectRatio > width / height) {
                    drawHeight = width / aspectRatio;
                } else {
                    drawWidth = height * aspectRatio;
                }
    
                const offsetX = (width - drawWidth) / 2;
                const offsetY = (height - drawHeight) / 2;
    
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                resolve(canvas.toDataURL("image/png"));
            };
            img.src = URL.createObjectURL(file);
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
    
        // ✅ Define shared fields (finally!)
        const sharedFields = {
            name: formData.name,
            price: formData.price,
            category: formData.category,
            description: formData.description,
            start_date: formData.start_date
                ? new Date(formData.start_date).toISOString().split("T")[0]
                : "",
            end_date: formData.end_date
                ? new Date(formData.end_date).toISOString().split("T")[0]
                : "",
            image_url: formData.image,
        };
    
        try {
            for (const [sizes, stock] of Object.entries(formData.sizesWithStock)) {
                const form = new FormData();
                form.append("name", sharedFields.name);
                form.append("price", sharedFields.price);
                form.append("category", sharedFields.category);
                form.append("description", sharedFields.description);
                form.append("start_date", sharedFields.start_date);
                form.append("end_date", sharedFields.end_date);
                form.append("stock", stock);
                form.append("sizes", sizes);
                form.append("image_url", sharedFields.image_url);
    
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/products`, form, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
            }
    
            toast.success("Products added successfully!", { position: "top-right" });
            setIsAddModalOpen(false);
            fetchProducts(); // Refresh product list
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
        const baseURL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/`;
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
    
    const handleHideProduct = async (productGroup) => {
        const token = localStorage.getItem("token");
        if (!token) return;
    
        // ✅ Cooldown: prevent spamming
        if (hideUnhideCooldown) {
            toast.error("Please wait a few seconds before trying again.");
            return;
        }
    
        const confirmToggle = window.confirm(
            `Are you sure you want to ${productGroup.is_hidden ? "unhide" : "hide"} this product?`
        );
        if (!confirmToggle) return;
    
        hideUnhideCooldown = true;
        setTimeout(() => {
            hideUnhideCooldown = false;
        }, 3000); // cooldown for 3 seconds
    
        const groupKey = `${productGroup.name}-${productGroup.price}-${productGroup.category}-${productGroup.description}-${productGroup.image_url}-${productGroup.start_date}-${productGroup.end_date}`;
    
        const groupVariants = products.filter((p) => {
            const key = `${p.name}-${p.price}-${p.category}-${p.description}-${p.image_url}-${p.start_date}-${p.end_date}`;
            return key === groupKey;
        });
    
        const shouldHide = productGroup.is_hidden === 0;
    
        try {
            await Promise.all(
                groupVariants.map((item) =>
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${item.id}/toggle-visibility`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ hide: shouldHide }),
                    }).then((res) => {
                        if (!res.ok) throw new Error(`Failed to toggle product ID ${item.id}`);
                    })
                )
            );
    
            toast.success(`Product "${productGroup.name}" ${shouldHide ? "hidden" : "unhidden"}!`, {
                position: "top-right",
            });
    
            fetchProducts();
        } catch (error) {
            console.error("Toggle visibility error:", error);
            toast.error("❌ Failed to update group visibility.");
        }
    };
    
    
    const handleUpdateProduct = async () => {
        if (!selectedProductGroup || selectedProductGroup.length === 0) return;
    
        const hasEmptyStock = Object.entries(formData.sizesWithStock).some(
            ([sizes, stock]) => stock === "" || stock === null || isNaN(Number(stock))
        );
    
        if (hasEmptyStock) {
            toast.error("❌ Please fill in valid stock values for all selected sizes.", {
                position: "top-right",
            });
            return;
        }
    
        setIsSavingChanges(true);
        const token = localStorage.getItem("token");
        if (!token) return;
    
        const existingSizes = selectedProductGroup.map((item) => item.sizes);
        const sharedFields = {
            name: formData.name,
            price: formData.price,
            category: formData.category,
            description: formData.description,
            start_date: formData.start_date
                ? new Date(formData.start_date).toISOString().split("T")[0]
                : "",
            end_date: formData.end_date
                ? new Date(formData.end_date).toISOString().split("T")[0]
                : "",
            image_url: formData.previewImage.replace(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/`,
                ""
            ),
        };
    
        try {
                const sizeGroups = {};
                for (const item of selectedProductGroup) {
                const size = item.sizes;
                if (!sizeGroups[size]) sizeGroups[size] = [];
                sizeGroups[size].push(item);
                }

                for (const [size, items] of Object.entries(sizeGroups)) {
                    const updatedStock = Number(formData.sizesWithStock[size] || 0);
                    const perItemStock = Math.floor(updatedStock / items.length); // Divide equally
                  
                    let remainder = updatedStock % items.length;
                  
                    for (const item of items) {
                      const newStock = perItemStock + (remainder > 0 ? 1 : 0); // Give extra 1 if remainder exists
                      remainder--;
                  
                      const oldStock = Number(item.stock);
                      await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/products/${item.id}/update`,
                        {
                          ...sharedFields,
                          stock: newStock,
                          stock_changed: newStock - oldStock,
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                    }
                  }
                  

            // ➕ Insert new sizes
            for (const [sizes, stock] of Object.entries(formData.sizesWithStock)) {
                if (!existingSizes.includes(sizes)) {
                    await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/products`,
                        { ...sharedFields, sizes: sizes, stock: Number(stock) },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }
            }
    
            toast.success(`Product "${formData.name}" updated successfully!`, {
                position: "top-right",
            });
            setIsEditModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error("Update error:", error);
            toast.error("❌ Failed to update product", { position: "top-right" });
        } finally {
            setIsSavingChanges(false);
        }
    };
    
    useEffect(() => {
        const invalidStock = Object.values(formData.sizesWithStock || {}).some(
            (v) => v === "" || isNaN(Number(v))
        );
        if (invalidStock && Object.keys(formData.sizesWithStock).length > 0) {
            toast.error("⚠️ Please fill in all stock fields correctly.", {
                id: "edit-stock-warning",
                position: "top-right",
            });
        } else {
            toast.dismiss("edit-stock-warning");
        }
    }, [formData.sizesWithStock]);
    
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
            name: "Discounted Price",
            selector: (row) =>
              row.discounted_price && row.discounted_price < row.price
                ? `₱${parseFloat(row.discounted_price).toLocaleString()}`
                : "-",
            sortable: true,
          },
          {
            name: "Discount %",
            selector: (row) =>
              row.discounted_price && row.discounted_price < row.price
                ? `${Math.round(((row.price - row.discounted_price) / row.price) * 100)}%`
                : "0%",
            sortable: true,
          },                    
        {
            name: "Category",
            selector: (row) => row.category || "Uncategorized",
            sortable: true,
        },
        {
            name: "Total Stock",
            selector: (row) => row.stock,
            sortable: true,
        },
        {
            name: "Actions",
            cell: (row) => (
              <div className="flex space-x-2">
                {row.is_hidden !== 1 && (
                  <button
                    onClick={() => handleEdit(row)}
                    className="text-pink-500 hover:text-pink-700"
                  >
                    <Pencil size={20} />
                  </button>
                )}
          
                <button
                  onClick={() => handleHideProduct(row)} // ✅ Call directly here
                  className={`hover:text-gray-700 ${
                    row.is_hidden ? "text-red-500" : "text-green-500"
                  }`}
                  title={row.is_hidden ? "Click to Unhide" : "Click to Hide"}
                >
                  {row.is_hidden ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            ),
          },          
          {
            name: "Availability",
            selector: (row) => {
              const status = getAvailabilityNote(row.start_date, row.end_date);
              let bgColor = "";
              let textColor = "text-white";
          
              if (status === "Available") bgColor = "bg-green-600";
              else if (status === "Upcoming") bgColor = "bg-yellow-400 text-black";
              else if (status.includes("Expired")) bgColor = "bg-red-500";
          
              return (
                <div className="inline-block max-w-[160px] text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold leading-snug break-words ${bgColor} ${textColor}`}
                  >
                    {status}
                  </span>
                </div>
              );
            },
            sortable: false,
            wrap: true,
          },                 
    ];
    
    return (
        <>
        <Head>
        <title>Product Management | Gown Rental</title> {/* ✅ Dynamic Title */}
        <meta name="description" content="Manage your profile and settings on Gown Rental." />
        <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
    </Head>
    <div className={`${darkMode ? "dark" : ""} flex h-screen bg-white dark:bg-[#0F172A]`}>
            {/* Sidebar */}
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
                {/* Header */}
                  <Header isSidebarOpen={isSidebarOpen} />

                {/* Page Content */}
                <main className="p-6 mt-16">
                <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-6">
                    {/* Breadcrumb */}


                {/* Title Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-800">Products</h1>

                {/* Buttons Row */}
                <div className="flex flex-wrap items-center gap-2">

                {/* <button
                        onClick={exportToCSV}
                        disabled={isExportingCSV}
                        className="flex items-center gap-2 bg-pink-800 text-white px-4 py-2 rounded hover:bg-pink-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                        {isExportingCSV ? (
                            <>
                            <Loader2 className="animate-spin w-4 h-4" />
                            Exporting...
                            </>
                        ) : (
                            "Export CSV"
                        )}
                        </button>


                        <button
                            onClick={exportToPDF}
                            disabled={isExportingPDF}
                            className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                            {isExportingPDF ? (
                                <>
                                <Loader2 className="animate-spin w-4 h-4" />
                                Exporting...
                                </>
                            ) : (
                                "Export PDF"
                            )}
                            </button> */}


                </div>
                </div>


                {/* Category Buttons & Add Product */}
                <div className="flex flex-wrap justify-between items-center gap-2 p-3 bg-white shadow-md">
                    {/* Burger Button */}
                    <button
                        onClick={() => setShowCategoryFilters(!showCategoryFilters)}
                        className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-pink-600 text-white shadow-md hover:bg-pink-700 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span>{showCategoryFilters ? "Hide Categories" : "Filter Categories"}</span>
                    </button>

                    <div className="flex justify-center">
                        <button
                            onClick={() => {
                                setSelectedProduct(null);
                                setIsEditModalOpen(false);
                                setIsAddModalOpen(true);
                                setFormData({
                                  name: "",
                                  price: "0",
                                  category: "",
                                  description: "",
                                  start_date: "",
                                  end_date: "",
                                  image: null,
                                  previewImage: null,
                                  sizesWithStock: {}, // ✅ Add this
                                  showCustomCategory: false,
                                });
                              }}
                              
                            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 shadow-md transition"
                        >
                            <PlusCircle size={20} /> Add Product
                        </button>
                    </div>


                    {/* Collapsible Category Buttons */}
                    {showCategoryFilters && (
                        <div className="flex flex-wrap items-center gap-3 mt-4 px-2 py-2 bg-gray-100 shadow-md mx-auto rounded-md">
                            {[
                              
                                {
                                  label: "All",
                                  icon: <Boxes size={16} />,
                                  value: null,
                                  count: groupedAllProducts.filter(p => !p.is_hidden).length, // ✅ always full
                                },
                                {
                                    label: "Hidden",
                                    icon: <EyeOff size={16} />,
                                    value: "Hidden Products",
                                    count: groupedAllProducts.filter((p) => p.is_hidden === 1).length, // ✅ not products
                                  },                                  
                                                                            
                            ].map(({ label, icon, value, count }) => {
                                const isActive = selectedCategory === value;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => filterByCategory(value)}
                                        className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full transition font-medium ${
                                            isActive
                                                ? "bg-pink-500 text-white shadow-md"
                                                : "text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        {icon}
                                        <span>{label} ({count})</span>
                                    </button>
                                );
                            })}

                            {/* Dynamic Category Buttons */}
                            {categories.map((category) => {
                                const isActive = selectedCategory === category;

                                // ✅ Fix: Use groupedAllProducts instead of filteredProducts
                                const count = getCategoryCounts(groupedAllProducts)[category] || 0;

                                return (
                                    <button
                                    key={category}
                                    onClick={() => filterByCategory(category)}
                                    className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full transition font-medium ${
                                        isActive
                                        ? "bg-pink-500 text-white shadow-md"
                                        : "text-gray-600 hover:bg-gray-200"
                                    }`}
                                    disabled={isCategoryLoading}
                                    >
                                    {isCategoryLoading && isActive ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Tag size={16} />
                                    )}
                                    <span>{category} ({count})</span>
                                    </button>
                                );
                                })}

                        </div>
                    )}
                </div>

                    {/* Table Container */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="overflow-x-auto"> {/* ✅ Ensures horizontal scroll only when needed */}
                            {/* Search Bar */}
                            <div className="flex justify-end mb-4">
                            <div className="relative flex items-center w-full sm:w-80">
                                <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-5 pr-12 py-2 rounded-full border border-pink-200 focus:ring-2 focus:ring-pink-300 text-sm shadow-sm"
                                />
                                <button
                                type="button"
                                className="absolute right-1 top-1 bottom-1 bg-pink-600 hover:bg-pink-700 text-white rounded-full p-2 transition"
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
                                columns={columns} 
                                data={filteredProducts} 
                                pagination 
                                highlightOnHover 
                                className="w-full min-w-[600px]" // ✅ Ensures proper width
                            />
                        </div>
                    </div>
                    </div>
                </main>
            </div>

        {isAddModalOpen && (
        <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 overflow-y-auto pt-10 pb-10">
        <div className="relative bg-white p-4 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                
            {/* Close Button */}
            <button 
                className="absolute top-2 right-2 text-gray-700 hover:text-red-600"
                onClick={() => setIsAddModalOpen(false)}
            >
                <XCircle size={20} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">Add Product</h2>
            
            <div className="mt-4 px-6 pb-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>
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
                <div className="flex items-center gap-2 w-full">
                <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Price:</label>
                <input 
                    type="number" 
                    name="price" 
                    placeholder="0" 
                    value={formData.price} 
                    onChange={handleChange} 
                    className="border p-1 rounded-md w-full text-xs"
                    required
                />
                <span className="text-sm text-gray-700 font-semibold whitespace-nowrap">
                    ₱{Number(formData.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                </div>

                <p className="text-xs text-gray-600 mt-1">
                Total Stock: <strong>{Object.values(formData.sizesWithStock).reduce((sum, val) => sum + Number(val || 0), 0)}</strong>
                </p>

               {/* ✅ Category Combobox + Add New Toggle */}
                <div className="flex flex-col gap-1">
                    {!formData.showCustomCategory ? (
                        <>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="border p-1 rounded-md w-full text-xs"
                                required
                            >
                                <option value="">-- Select Category --</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, showCustomCategory: true, category: "" }))}
                                className="text-xs text-blue-600 hover:underline mt-1"
                            >
                                + Add New Category
                            </button>
                        </>
                    ) : (
                        <>
                            <label className="text-xs font-semibold">New Category *</label>
                            <input 
                                type="text" 
                                name="category" 
                                placeholder="Enter new category" 
                                value={formData.category} 
                                onChange={handleChange} 
                                className="border p-1 rounded-md w-full text-xs"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, showCustomCategory: false, category: "" }))}
                                className="text-xs text-red-600 hover:underline mt-1"
                            >
                                Cancel New Category
                            </button>
                        </>
                    )}
                </div>

                <textarea 
                    name="description" 
                    placeholder="Description * Style * Neckline * Back * Length * Fabric * Fit * Rental Includes *" 
                    value={formData.description} 
                    onChange={handleChange} 
                    className="border p-1 rounded-md w-full text-xs"
                    required
                ></textarea>

                {/* ✅ Size Selection (Checkboxes) */}
                <div className="flex flex-wrap gap-2 w-full">
                    {["Small", "Medium", "Large", "Extra Large", "Extra Extra Large"].map((sizes) => (
                        <label
                        key={sizes}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-gray-100 px-3 py-2 rounded-md shadow-md cursor-pointer w-full"
                        >
                        <div className="flex items-center gap-2">
                            <input
                            type="checkbox"
                            className="w-5 h-5 accent-indigo-500"
                            checked={formData.sizesWithStock?.[sizes] !== undefined}
                            onChange={(e) => {
                                const updated = { ...formData.sizesWithStock };
                                if (e.target.checked) {
                                updated[sizes] = "";
                                } else {
                                delete updated[sizes];
                                }
                                setFormData((prev) => ({ ...prev, sizesWithStock: updated }));
                            }}
                            />
                            <span className="text-sm">{sizes}</span>
                        </div>

                        {formData.sizesWithStock?.[sizes] !== undefined && (
                            <input
                            type="number"
                            placeholder="Stock"
                            value={formData.sizesWithStock[sizes]}
                            onChange={(e) => {
                                const updated = {
                                ...formData.sizesWithStock,
                                [sizes]: e.target.value,
                                };
                                setFormData((prev) => ({ ...prev, sizesWithStock: updated }));
                            }}
                            className="w-24 p-1 text-xs border rounded"
                            min="0"
                            />
                        )}
                        </label>
                    ))}
                    </div>


                {/* ✅ Date Pickers */}
                <label className="text-xs font-semibold">Availability : </label>
                <DatePicker 
                    selected={formData.start_date ? new Date(formData.start_date) : null}
                    onChange={(date) => handleDateChange(date, "start_date")}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Start Date *"
                    className="border p-1 rounded-md w-full text-xs relative"
                    required
                    minDate={new Date()} // ⬅️ This disables all past dates
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
                    className="border p-1 rounded-md w-full text-xs relative"
                    required
                    minDate={
                        formData.start_date
                        ? (() => {
                            const min = new Date(formData.start_date);
                            min.setDate(min.getDate() + 2); // ✅ At least 2 days after start
                            return min;
                            })()
                        : new Date()
                    }
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
                        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${formData.previewImage}` 
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
                        !formData.description || 
                        !formData.start_date || 
                        !formData.end_date || 
                        !formData.image || 
                        sizeCount === 0 || 
                        hasEmptyStock || 
                        !formData.hasTransparentBackground ||
                        !validateDates().endDateValid
                    }             
                    className={`mt-2 px-2 py-1 rounded-md w-full text-xs flex items-center justify-center space-x-2 transition-all ${
                        isAddingProduct || 
                        isProcessingImage || 
                        !formData.name || 
                        !formData.price || 
                        !formData.category || 
                        !formData.description || 
                        !formData.start_date || 
                        !formData.end_date || 
                        !formData.image || 
                        sizeCount === 0 || 
                        hasEmptyStock || 
                        !formData.hasTransparentBackground || 
                        !validateDates().endDateValid
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
    <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 overflow-y-auto pt-10 pb-10">
<div className="relative bg-white p-4 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">

            {/* Close Button */}
            <button 
                className="absolute top-3 right-3 text-gray-700 hover:text-red-600"
                onClick={() => setIsEditModalOpen(false)}
            >
                <XCircle size={24} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">Edit Product</h2>
            <div className="mt-4 px-6 pb-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>
            {/* ✅ Edit Product Form */}
            <div className="flex flex-col gap-1">
            <input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} className="border p-2 rounded-md w-full text-sm" />
            <div className="flex items-center gap-2 w-full">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Price:</label>
                <input 
                    type="number" 
                    name="price" 
                    placeholder="Price" 
                    value={formData.price} 
                    onChange={handleChange} 
                    className="border p-2 rounded-md w-1/2 text-sm" 
                />
                <span className="text-sm text-gray-700 font-semibold">
                    {formData.price ? `₱${Number(formData.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ""}
                </span>
            </div>

          {/* ✅ Category Combobox + Add New Toggle (Edit Modal) */}
            {/* ✅ Category Combobox + Add New Toggle (Edit Modal) */}
            <div className="flex flex-col gap-1 mb-2">
                {!formData.showCustomCategory ? (
                    <>
                      
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="border p-2 rounded-md w-full text-sm"
                            required
                        >
                            <option value="">-- Select Category --</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, showCustomCategory: true, category: "" }))}
                            className="text-xs text-blue-600 hover:underline mt-1"
                        >
                            + Add New Category
                        </button>
                    </>
                ) : (
                    <>
                        <label className="text-xs font-semibold">New Category *</label>
                        <input 
                            type="text" 
                            name="category" 
                            placeholder="Enter new category" 
                            value={formData.category} 
                            onChange={handleChange} 
                            className="border p-2 rounded-md w-full text-sm"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, showCustomCategory: false, category: "" }))}
                            className="text-xs text-red-600 hover:underline mt-1"
                        >
                            Cancel New Category
                        </button>
                    </>
                )}
            </div>


            <input 
            type="text" 
            placeholder="Total Stock"
            value={`Total Stock: ${selectedProductGroup?.reduce((sum, item) => sum + Number(item.stock), 0) || 0}`}
            disabled
            title="This is the total stock of all size variants in this group"
            className="border p-2 rounded-md w-full text-sm cursor-not-allowed bg-gray-200 text-gray-600 font-semibold"
            />


            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="border p-2 rounded-md w-full text-sm"></textarea>
            <label className="text-xs font-semibold">Availability : </label>
            <DatePicker  
                selected={formData.start_date ? new Date(formData.start_date) : null}
                onChange={(date) => handleDateChange(date, "start_date")}
                dateFormat="yyyy-MM-dd"
                placeholderText="Start Date"
                className="border p-2 rounded-md w-full text-xs"
                minDate={
                    formData.start_date
                        ? new Date(new Date(formData.start_date).getFullYear(), new Date(formData.start_date).getMonth(), 1)
                        : new Date() // fallback to today
                }
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
                        minDate={
                            formData.start_date
                                ? (() => {
                                    const min = new Date(formData.start_date);
                                    min.setDate(min.getDate() + 2); // ✅ Enforce 2 days after start
                                    return min;
                                })()
                                : new Date()
                        }
                    />


                {/* ✅ Size Selection (Checkboxes) */}
                <div className="flex flex-wrap gap-2">
                    {["Small", "Medium", "Large", "Extra Large", "Extra Extra Large"].map((sizes) => (
                        <label key={sizes} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-gray-100 px-3 py-2 rounded-md shadow-md cursor-pointer w-full">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                             className="w-5 h-5 accent-indigo-500"
                            checked={formData.sizesWithStock?.[sizes] !== undefined}
                            onChange={(e) => {
                              const updated = { ...formData.sizesWithStock };
                              if (e.target.checked) {
                                updated[sizes] = ""; // default stock value
                              } else {
                                delete updated[sizes];
                              }
                              setFormData((prev) => ({ ...prev, sizesWithStock: updated }));
                            }}
                          />
                          <span className="text-sm">{sizes}</span>
                        </div>
                      
                        {formData.sizesWithStock?.[sizes] !== undefined && (
                         <input
                         type="number"
                         placeholder="Stock"
                         value={formData.sizesWithStock[sizes] ?? ""}
                         onChange={(e) => {
                           const updated = {
                             ...formData.sizesWithStock,
                             [sizes]: e.target.value,
                           };
                       
                           // ✅ Trigger toast if zero is typed
                           if (Number(e.target.value) === 0) {
                             toast.error("Stock cannot be set to 0 here. Please go to Inventory to deactivate this size.", {
                               id: "zero-stock-warning",
                               position: "top-right",
                             });
                           } else {
                             toast.dismiss("zero-stock-warning");
                           }
                       
                           setFormData((prev) => ({ ...prev, sizesWithStock: updated }));
                         }}
                         className="w-24 p-1 text-xs border rounded"
                         min="0"
                       />
                       
                        )}
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
                                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${formData.previewImage}`  
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
                        !validateDates().endDateValid || 
                        Object.values(formData.sizesWithStock).some(v => v === "" || isNaN(Number(v)))
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
    </div>
)}


        </div>
         </>
    );
}
