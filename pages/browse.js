"use client";

import { useState, useEffect } from "react";
import AuthGuard from "../components/AuthGuard";
import Image from "next/image";
import "../../resources/css/styles/global.css";
import Link from "next/link";
import { FaHeart, FaStar } from "react-icons/fa";
import axios from "axios";
import Navbar from "../components/Navbar"; 
import Head from "next/head";


export default function BrowsePage() {
    const [isOpen, setIsOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [priceRange, setPriceRange] = useState(15000); 
    const [rentalDetails, setRentalDetails] = useState({});
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [wishlist, setWishlist] = useState([]); 

    const itemsPerPage = 6;
    const [favorites, setFavorites] = useState([]); // State to store favorited items

    // ✅ Fetch existing favorites when component loads
    useEffect(() => {
        const fetchFavorites = async () => {
            const token = localStorage.getItem("token");
            if (!token) return; // ✅ Skip if user isn't logged in
    
            try {
                const response = await axios.get("http://127.0.0.1:8000/api/favorites", {
                    headers: { Authorization: `Bearer ${token}` }
                });
    
                if (response.data.success) {
                    setFavorites(response.data.data.map(item => item.product_id)); // ✅ Store favorite product IDs
                }
            } catch (error) {
                console.error("Error fetching favorites:", error);
            }
        };
    
        fetchFavorites();
    }, []);
    
    // ✅ Add product to favorites
    const addToFavorites = async (productId) => {
        const token = localStorage.getItem("token");
    
        if (!token) {
            alert("⚠ You must be logged in to add favorites.");
            return;
        }
    
        // ✅ Check if already in favorites
        if (favorites.includes(productId)) {
            alert("✅ This item is already in your favorites.");
            return;
        }
    
        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/api/favorites",
                { product_id: productId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                setFavorites([...favorites, productId]); // ✅ Update UI dynamically
                alert("✅ Added to favorites successfully!");
            }
        } catch (error) {
            console.error("Error adding to favorites:", error);
    
            if (error.response) {
                if (error.response.status === 409) {
                    alert("⚠ This item is already in your favorites.");
                    setFavorites([...favorites, productId]); // ✅ Ensure UI updates
                } else if (error.response.status === 401) {
                    alert("⚠ You must be logged in to add items to favorites.");
                } else {
                    alert(error.response.data.message || "❌ An error occurred.");
                }
            } else {
                alert("❌ Network error. Check your connection.");
            }
        }
    };
    

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/products")
            .then((response) => {
                const formattedProducts = response.data.data.map(product => ({
                    ...product,
                    price: parseFloat(product.price) || 0,
                }));
                setProducts(formattedProducts);

                const uniqueCategories = [...new Set(formattedProducts.map(product => product.category))];
                setCategories(uniqueCategories);
            })
            .catch((error) => console.error("Error fetching data:", error));
    }, []);

    const addToWishlist = async (productId) => {
        const token = localStorage.getItem("token");
    
        if (!token) {
            alert("You must be logged in to add items to your wishlist.");
            return;
        }
    
        // ✅ Check if the product is already in the wishlist
        if (wishlist.includes(productId)) {
            alert("This item is already in your wishlist.");
            return; // 🔴 STOP HERE! No request is sent.
        }
    
        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/api/wishlist",
                { product_id: productId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                setWishlist([...wishlist, productId]); // ✅ Update state
                alert("Added to wishlist successfully!");
            }
        } catch (error) {
            console.error("Error adding to wishlist:", error);
    
            if (error.response) {
                if (error.response.status === 409) {
                    alert("This item is already in your wishlist.");
                    setWishlist([...wishlist, productId]); // ✅ Ensure UI updates
                } else if (error.response.status === 401) {
                    alert("You must be logged in to add items to your wishlist.");
                } else {
                    alert(error.response.data.message || "An error occurred.");
                }
            } else {
                alert("Network error. Check your connection.");
            }
        }
    };
    
    // ✅ Fetch wishlist items when the component mounts
    useEffect(() => {
        const fetchWishlist = async () => {
            const token = localStorage.getItem("token");
    
            if (!token) return;
    
            try {
                const response = await axios.get("http://127.0.0.1:8000/api/wishlist", {
                    headers: { Authorization: `Bearer ${token}` }
                });
    
                if (response.data.success) {
                    setWishlist(response.data.data.map(item => item.product_id)); // ✅ Store wishlist product IDs
                }
            } catch (error) {
                console.error("Error fetching wishlist:", error);
            }
        };
    
        fetchWishlist();
    }, []);
    
    const handleCategoryChange = (category) => {
        setSelectedCategories((prev) => 
            prev.includes(category)
                ? prev.filter((cat) => cat !== category)
                : [...prev, category]
        );
    };

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

    const filteredProducts = products.filter((product) =>
        (selectedCategories.length === 0 || selectedCategories.includes(product.category)) &&
        product.price <= priceRange &&
        (product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (product.category ? product.category.toLowerCase().includes(searchQuery.toLowerCase()) : false) || 
        (product.description ? product.description.toLowerCase().includes(searchQuery.toLowerCase()) : false))
    );

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    return (
        <AuthGuard>
           
            <Head>
                <title>Browser | Gown Rental</title> {/* ✅ Dynamic Title */}
                <meta name="description" content="Manage your profile and settings on Gown Rental." />
                <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
            </Head>
            <div className="min-h-screen bg-gray-100 text-gray-800 font-poppins">
                <Navbar /> 

                {/* Hero Section */}
                <section className="relative bg-[url('/gown-hero.jpg')] bg-cover bg-center bg-no-repeat min-h-[60vh] flex items-center">
                    <div className="container mx-auto px-6 text-center md:text-left pt-24">
                        <div className="mt-6 flex flex-wrap justify-center md:justify-start">
                            <Link href="/browse">
                                <button className="bg-pink-600 hover:bg-pink-700 text-white text-lg font-semibold py-3 px-6 rounded-lg shadow-md transition">
                                    Gowns
                                </button>
                            </Link>
                            <Link href="/about">
                                <button className="ml-4 border-2 border-white text-gray hover:bg-white hover:text-pink-600 text-lg font-semibold py-3 px-6 rounded-lg shadow-md transition">
                                    Learn More
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Main Content - Sidebar & Products */}
                <div className="container mx-auto px-4 md:px-6 mt-10 flex flex-col md:flex-row gap-8">
                    {/* Sidebar - Filters */}
                    <aside className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
                        <ul className="mt-2 space-y-2 text-gray-600">
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <li key={category}>
                                        <input
                                            type="checkbox"
                                            className="mr-2"
                                            checked={selectedCategories.includes(category)}
                                            onChange={() => handleCategoryChange(category)}
                                        />
                                        {category}
                                    </li>
                                ))
                            ) : (
                                <p>Loading categories...</p>
                            )}
                        </ul>

                        {/* Price Range */}
                        <div className="mt-6">
                            <h3 className="text-lg font-medium text-pink-600">Price Range</h3>
                            <input 
                                type="range"
                                min="0"
                                max="15000"
                                value={priceRange}
                                onChange={(e) => setPriceRange(Number(e.target.value))}
                                className="w-full mt-2 appearance-none bg-pink-300 h-2 rounded-lg outline-none cursor-pointer"
                            />
                            <p className="text-pink-600 text-sm">Up to ₱{priceRange}</p>
                        </div>
                    </aside>

                    {/* Product Section */}
                    <div className="w-full md:w-3/4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-semibold text-gray-800">Available Gowns</h2>
                            <input
                                type="text"
                                placeholder="Search gowns..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:ring focus:ring-pink-300"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                                {paginatedProducts.length > 0 ? (
                                    paginatedProducts.map((product) => (
                                    <div key={product.id} className="bg-white p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition">
                                        
                                        {/* Product Image (Click redirects to product page) */}
                                        <Link href={`/products/${product.id}`} className="block">
                                        <div className="relative w-full h-48 md:h-64 flex justify-center items-center">
                                            {product.image ? (
                                            <Image 
                                                src={product.image} 
                                                alt={product.name}
                                                width={200}
                                                height={400}
                                                className="rounded-lg object-cover"
                                            />
                                            ) : (
                                            <p>No Image Available</p>
                                            )}
                                        </div>
                                        </Link>

                                        {/* Product Name (Click redirects to product page) */}
                                        <Link href={`/products/${product.id}`} className="block">
                                        <h3 className="text-lg md:text-xl font-semibold text-gray-700 mt-3">{product.name}</h3>
                                        </Link>

                                        <p className="text-gray-500 text-sm">{product.category || "Uncategorized"}</p>
                                        <p className="text-pink-600 text-lg font-bold"> ₱{Number(product.price).toLocaleString()}</p>

                                        {/* Book Button (Click redirects to product page) */}
                                        <Link href={`/products/${product.id}`} className="block">
                                        <button className="w-full mt-3 md:mt-4 bg-pink-600 hover:bg-pink-700 text-white text-lg font-semibold py-2 px-4 md:px-6 rounded-lg shadow-md transition">
                                            Book
                                        </button>
                                        </Link>

                                        {/* Wishlist & Favorite Icons (No Redirect) */}
                                        <div className="flex justify-center space-x-4 mt-3 md:mt-4">
                                        
                                             
                                      {/* Wishlist Icon */}
                                        <button 
                                            onClick={() => addToWishlist(product.id)} 
                                            className="relative group"
                                        >
                                            {/* Change heart color if already in wishlist */}
                                            <FaHeart 
                                                className={`${wishlist.includes(product.id) ? "text-red-500" : "text-gray-500"} hover:text-pink-700 text-2xl cursor-pointer transition`} 
                                            />
                                            
                                            {/* Tooltip for Wishlist */}
                                            <div
                                                className="absolute z-10 left-1/2 transform -translate-x-1/2 bottom-8 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-md"
                                            >
                                                {wishlist.includes(product.id) ? "Already in Wishlist" : "Add to Wishlist"}
                                                <div className="tooltip-arrow absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-x-transparent border-b-8 border-t-0 border-b-gray-800"></div>
                                            </div>
                                        </button>


                                       {/* Favorite Icon */} 
                                        <button 
                                            onClick={() => addToFavorites(product.id)} 
                                            className="relative group"
                                        >
                                            {/* Change star color if already in favorites */}
                                            <FaStar className={`${favorites.includes(product.id) ? "text-yellow-500" : "text-gray-500"} hover:text-pink-700 text-2xl cursor-pointer transition`} />
                                            
                                            {/* Tooltip for Favorites */}
                                            <div className="absolute z-10 left-1/2 transform -translate-x-1/2 bottom-8 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-md">
                                                {favorites.includes(product.id) ? "Already in Favorites" : "Add to Favorites"}
                                                <div className="tooltip-arrow absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-x-transparent border-b-8 border-t-0 border-b-gray-800"></div>
                                            </div>
                                        </button>

                                        
                                        </div>
                                    </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-600">No products available.</p>
                                )}
                                </div>


                        {/* Pagination Controls */}
                        <div className="flex justify-center mt-8 space-x-4">
                            <button
                                className={`px-4 py-2 rounded-lg font-semibold ${currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-pink-600 text-white hover:bg-pink-700"}`}
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span className="text-lg font-semibold text-pink-600">{currentPage} / {totalPages}</span>
                            <button
                                className={`px-4 py-2 rounded-lg font-semibold ${currentPage === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-pink-600 text-white hover:bg-pink-700"}`}
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-pink-600 text-white text-center py-6 mt-10">
                    <p>&copy; {new Date().getFullYear()} Gown Rental System. All Rights Reserved.</p>
                </footer>
            </div>
        </AuthGuard>
    );
}
