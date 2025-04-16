// pages/index.js or app/page.js
import GuestNavbar from "../components/GuestNavbar"; // adjust path if needed


import { useState, useEffect } from "react";
import Image from "next/image";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Link from "next/link";
import axios from "axios";
import Head from "next/head";
import AvailableGownsSection from "../components/AvailableGownsSection";
import { parseISO, differenceInDays } from 'date-fns';
import SidebarFilter from "../components/SidebarFilter";
import OutOfStockGownsSection from "../components/OutOfStockGownsSection";
import { PartyPopper } from "lucide-react";
import { groupProductsByDetails } from "../utils/groupProducts";

import FooterNew from "../components/Footer_new";

export default function LandingPage() {
    const [discountGroups, setDiscountGroups] = useState({});
       const [isOpen, setIsOpen] = useState(false);
       const [loadingButton, setLoadingButton] = useState(null); 
       const [sortByDate, setSortByDate] = useState("newest"); // 'newest' or 'oldest'
   
   
       // State to control the calendar visibility for each gown
       const [calendarOpen, setCalendarOpen] = useState({});
       const [showNewArrivalsOnly, setShowNewArrivalsOnly] = useState(false);
       const [products, setProducts] = useState([]);
   
       const [categories, setCategories] = useState([]);
   
   
       const [priceRange, setPriceRange] = useState(50000); // Default max price
       const [rentalDetails, setRentalDetails] = useState({});
   
   
       const [selectedCategories, setSelectedCategories] = useState([]); // Tracks selected categories
   
       const [searchQuery, setSearchQuery] = useState("");
   
       const [currentPage, setCurrentPage] = useState(1); // For Available Gowns
       const [currentOutOfStockPage, setCurrentOutOfStockPage] = useState(1); 
   
       const sortedProducts = [...products].sort((a, b) => {
           const createdA = a.created_at ? parseISO(a.created_at) : null;
           const createdB = b.created_at ? parseISO(b.created_at) : null;
         
           const isNewA = createdA ? differenceInDays(new Date(), createdA) <= 7 : false;
           const isNewB = createdB ? differenceInDays(new Date(), createdB) <= 7 : false;
         
           const hasDiscountA = a.discounted_price && a.discounted_price !== "null";
           const hasDiscountB = b.discounted_price && b.discounted_price !== "null";
         
           const getPriority = (isNew, hasDiscount) => {
             if (isNew && hasDiscount) return 1;
             if (isNew && !hasDiscount) return 2;
             if (!isNew && hasDiscount) return 3;
             return 4;
           };
         
           const priorityA = getPriority(isNewA, hasDiscountA);
           const priorityB = getPriority(isNewB, hasDiscountB);
         
           // 🔄 Apply date sorting logic first
           if (sortByDate === "newest" && createdA && createdB) {
               return createdB - createdA;
           } else if (sortByDate === "best-seller") {
               return (b.returned_count || 0) - (a.returned_count || 0); // Highest returned first          
           } else if (sortByDate === "best-deals") {
               const discountA = hasDiscountA
               ? ((Number(a.price) - Number(a.discounted_price)) / Number(a.price)) * 100
               : 0;
               const discountB = hasDiscountB
               ? ((Number(b.price) - Number(b.discounted_price)) / Number(b.price)) * 100
               : 0;
               return discountB - discountA; // Higher discount first
           }
           
         
           // 👇 Fallback to priority-based sorting
           if (priorityA !== priorityB) return priorityA - priorityB;
         
           const priceA = hasDiscountA ? Number(a.discounted_price) : Number(a.price);
           const priceB = hasDiscountB ? Number(b.discounted_price) : Number(b.price);
         
           return priceB - priceA;
         });
   

       
       useEffect(() => {
           const fetchProducts = async () => {
               try {
                   const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products`);
                   const allProducts = response.data.data;
       
                   const groupedProducts = groupProductsByDetails(allProducts);
                   setProducts(groupedProducts);
       
                   // ⬇️ Compute discount groups from grouped products
                   const newDiscountGroups = {};
                   groupedProducts.forEach((group) => {
                       const hasDiscount = group.discounted_price && group.discounted_price !== "null";
                       const originalPrice = parseFloat(group.price);
                       const discountedPrice = parseFloat(group.discounted_price);
       
                       if (hasDiscount && originalPrice > 0) {
                           const discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
                           if (discount > 0) {
                               if (!newDiscountGroups[discount]) {
                                   newDiscountGroups[discount] = [];
                               }
                               newDiscountGroups[discount].push(group);
                           }
                       }
                   });
                   setDiscountGroups(newDiscountGroups);
               } catch (error) {
                   console.error("Error fetching products:", error);
               }
           };
       
           fetchProducts();
       }, []);
       
       
       
           // Array of banner background colors
           const bannerColors = [
               "bg-red-500",
               "bg-pink-500",
               "bg-purple-500",
               "bg-green-500",
               "bg-yellow-500",
               "bg-blue-500",
           ];
   
   
   
       // Toggle calendar visibility for each gown
       const toggleCalendar = (gownId) => {
           setCalendarOpen((prev) => ({
               ...prev,
               [gownId]: !prev[gownId]
           }));
       };
   
       const handleCategoryChange = (category) => {
           setSelectedCategories((prev) => 
               prev.includes(category)
                   ? prev.filter((cat) => cat !== category) // Remove if already selected
                   : [...prev, category] // Add if not selected
           );
       };
   
       useEffect(() => {
           axios.get(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
               .then((response) => {
                   if (response.data.success && Array.isArray(response.data.categories)) {
                       setCategories(response.data.categories);
                   } else {
                       setCategories([]);
                   }
               })
               .catch((error) => {
                   console.error("Error fetching categories:", error);
                   setCategories([]);
               });
       }, []);
       
   
       const handleDateChange = (productId, productPrice, type, value) => {
           setRentalDetails((prev) => {
               const updatedDetails = { 
                   ...prev, 
                   [productId]: { 
                       ...prev[productId], 
                       [type]: value 
                   } 
               };
       
               if (updatedDetails[productId].startDate && updatedDetails[productId].endDate) {
                   updatedDetails[productId].totalPrice = calculatePrice(
                       productPrice, 
                       updatedDetails[productId].startDate,
                       updatedDetails[productId].endDate
                   );
               }
       
               return updatedDetails;
           });
       };

       const isNewArrival = (createdAt) => {
               try {
                 const date = parseISO(createdAt);
                 return differenceInDays(new Date(), date) <= 7;
               } catch {
                 return false;
               }
             };
             
             const filteredProducts = sortedProducts
             .filter((product) => {
               if (sortByDate === "best-seller") {
                 return product.returned_count > 0;
               }
               if (sortByDate === "best-deals") {
                 return product.discounted_price && Number(product.discounted_price) < Number(product.price);
               }
               if (sortByDate === "new-arrivals") {
                 return isNewArrival(product.created_at);
               }
               return true;
             })
         .filter((product) =>
             (selectedCategories.length === 0 || selectedCategories.includes(product.category)) &&
             product.price <= priceRange &&
             (product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             product.category?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             product.description?.toLowerCase().includes(searchQuery.toLowerCase()))
         );
         const bestSellerRankMap =
         sortByDate === "best-seller"
           ? filteredProducts
               .filter(product => product.returned_count > 0)
               .sort((a, b) => b.returned_count - a.returned_count)
               .reduce((acc, product, i) => {
                 acc[product.id] = i + 1; // Global Top N
                 return acc;
               }, {})
           : {};
       
           
           const inStockItemsPerPage = 6;
           const outOfStockItemsPerPage = 3;
          
     
         // STEP 2: Separate into in-stock and out-of-stock groups
         const inStockProducts = filteredProducts.filter(p => p.totalStock > 0);
         const outOfStockProducts = filteredProducts.filter(p => p.totalStock <= 0);
     
         // STEP 3: Paginate the filtered in-stock and out-of-stock products
         const paginatedProducts = inStockProducts.slice(
             (currentPage - 1) * inStockItemsPerPage,
             currentPage * inStockItemsPerPage
           );
           const outOfStockPaginated = outOfStockProducts.slice(
             (currentOutOfStockPage - 1) * outOfStockItemsPerPage,
             currentOutOfStockPage * outOfStockItemsPerPage
           );
           
           const totalPages = Math.ceil(inStockProducts.length / inStockItemsPerPage);
           const outOfStockTotalPages = Math.ceil(outOfStockProducts.length / outOfStockItemsPerPage);
           
           useEffect(() => {
               setCurrentPage(1);
               setCurrentOutOfStockPage(1);
             }, [searchQuery, selectedCategories, priceRange, sortByDate, showNewArrivalsOnly]);

    return (
        
        <>
          <Head>
            <title>Rent Now | Gown Rental</title>
            <meta name="description" content="Explore beautiful gowns for rent on Gown Rental." />
            <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
          </Head>
      
          <div className="min-h-screen bg-gray-100 text-gray-800 font-poppins">
            <GuestNavbar />
      
            {/* Hero Section */}
            <section className="bg-gray-100 pt-3 md:pt-5 pb-10 md:pb-12 mt-20 md:mt-20">
            <div className="px-3 md:px-10">
          <div className="bg-white rounded-none md:rounded-3xl overflow-hidden shadow-lg w-full max-w-[1600px] mx-auto h-[50px] md:h-auto">

          <img
          src="/images/ael-amari.svg"
          alt="Gown Rental Hero"
          className="w-full h-full md:h-auto md:max-h-[300px] object-contain"
        />


                </div>
            </div>
            </section>

            <section className="relative bg-[url('/gown-hero.jpg')] bg-cover bg-center bg-no-repeat min-h-[60vh] flex items-center">
            
              <div className="container mx-auto px-6 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-pink-600 drop-shadow-lg">
                  Find Your Dream Gown for Any Occasion
                </h1>
                <p className="mt-4 text-lg md:text-xl text-gray-800 drop-shadow-md">
                  Elegant styles, premium fabrics, and hassle-free gown rentals.
                </p>
                <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">


                <Link href="/browse">
                  <button
                    onClick={() => setLoadingButton("browse")}
                    disabled={loadingButton === "browse"}
                    className={`bg-pink-600 hover:bg-pink-700 text-white text-lg font-semibold py-3 px-6 rounded-lg shadow-md transition
                      ${loadingButton === "browse" ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {loadingButton === "browse" ? "Loading..." : "Browse Gowns"}
                  </button>
                </Link>

                <Link href="/about_new">
                  <button
                    onClick={() => setLoadingButton("learn")}
                    disabled={loadingButton === "learn"}
                    className={`border-2 border-pink-600 text-pink-600 hover:bg-white hover:text-pink-600 text-lg font-semibold py-3 px-6 rounded-lg shadow-md transition
                      ${loadingButton === "learn" ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {loadingButton === "learn" ? "Loading..." : "Learn More"}
                  </button>
                </Link>

                </div>
              </div>
            </section>
      
            {/* Main Gown Display Section */}
            <div className="container mx-auto px-4 md:px-6 mt-10 flex flex-col md:flex-row items-start gap-8">
              {/* Sidebar Filters */}
              <SidebarFilter
                categories={categories}
                selectedCategories={selectedCategories}
                handleCategoryChange={handleCategoryChange}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                sortByDate={sortByDate}
                setSortByDate={setSortByDate}
                discountGroups={discountGroups}
                bannerColors={bannerColors}
                showNewArrivalsOnly={showNewArrivalsOnly}
                setShowNewArrivalsOnly={setShowNewArrivalsOnly}
                />
              {/* Gown Sections */}
              <div className="w-full md:w-3/4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Available Gowns</h2>

                    <div className="relative flex items-center w-full sm:w-80">
                        <input
                        type="text"
                        placeholder="Search Gowns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-5 pr-12 py-2 rounded-full border border-pink-200 focus:ring-2 focus:ring-pink-300 text-sm shadow-sm"
                        />
                        <button
                        className="absolute right-1 top-1 bottom-1 bg-pink-700 hover:bg-pink-800 text-white rounded-full p-2 transition"
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


                <AvailableGownsSection
                    products={paginatedProducts}
                    loadingButton={loadingButton}
                    setLoadingButton={setLoadingButton}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                    sortByDate={sortByDate}
                    bestSellerRankMap={bestSellerRankMap}
                    hideIcons={true}
                    
                    />

                        
                 <OutOfStockGownsSection
                products={outOfStockPaginated}
                currentPage={currentOutOfStockPage}
                totalPages={outOfStockTotalPages}
                setCurrentPage={setCurrentOutOfStockPage}
                sortByDate={sortByDate} 
                bestSellerRankMap={bestSellerRankMap}
                />
                
                
              </div>
            </div>
      {/* Footer */}
      <FooterNew />
          </div>
        </>
      );      
}
