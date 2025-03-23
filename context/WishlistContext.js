import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";


// ✅ Create Wishlist Context
const WishlistContext = createContext();

// ✅ Provide Wishlist Context to App
export function WishlistProvider({ children }) {
    const [wishlist, setWishlist] = useState([]);
    
    useEffect(() => {
        const fetchWishlist = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;
        
            try {
                const response = await axios.get("http://127.0.0.1:8000/api/wishlist", {
                    headers: { Authorization: `Bearer ${token}` },
                });
        
                if (response.data.success) {
                    setWishlist(response.data.data.map((item) => item.product_id));
                }
            } catch (error) {
                handleApiError(error, "fetching wishlist");
            }
        };
        

        fetchWishlist();
    }, []);

    const addToWishlist = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠ You must be logged in to add to the wishlist.");
            return;
        }
    
        if (wishlist.includes(productId)) {
            toast.error("This item is already in wishlist.", {
                duration: 3000,
                position: "top-right",
            });
            
            return;
        }
    
        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/api/wishlist",
                { product_id: productId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                setWishlist([...wishlist, productId]); // ✅ Update UI instantly
                toast.success("Added to wishlist!", {
                    duration: 3000,
                    position: "top-right",
                });
                
            }
        } catch (error) {
            handleApiError(error, "adding to wishlist");
        }
    };
    

    const removeFromWishlist = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠ You must be logged in to modify your wishlist.");
            return;
        }
    
        try {
            await axios.delete(`http://127.0.0.1:8000/api/wishlist/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            setWishlist(wishlist.filter((id) => id !== productId)); // ✅ Remove from state
            alert("❌ Removed from wishlist!");
        } catch (error) {
            handleApiError(error, "removing from wishlist");
        }
    };
    

    const toggleWishlist = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠ You must be logged in to modify your wishlist.");
            return;
        }
    
        const isAlreadyInWishlist = wishlist.includes(productId);
    
        try {
            if (isAlreadyInWishlist) {
                await axios.delete(`http://127.0.0.1:8000/api/wishlist/${productId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
    
                setWishlist(wishlist.filter((id) => id !== productId));
                alert("❌ Removed from wishlist!");
            } else {
                await axios.post(
                    "http://127.0.0.1:8000/api/wishlist",
                    { product_id: productId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
    
                setWishlist([...wishlist, productId]);
                toast.success("Added to wishlist!", {
                    duration: 3000,
                    position: "top-right",
                });
                
            }
        } catch (error) {
            handleApiError(error, "modifying wishlist");
        }
    };
    
    const handleApiError = (error, action) => {
        if (!error.response) {
            toast.error(`⚠ Network Error! Please check your internet connection before ${action}.`, { position: "top-right" });
        } else if (error.response.status === 401) {
            toast.error("⚠ Unauthorized! Please log in again.", { position: "top-right" });
            localStorage.removeItem("token");
            window.location.href = "/login"; // ✅ Redirect to login page
        } else if (error.response.status === 422) {
            toast.error(`⚠ Validation error while ${action}. Please check your input.`, { position: "top-right" });
        } else {
            toast.error(`⚠ Error ${action}: ${error.response.data.message || "An unexpected error occurred."}`, { position: "top-right" });
        }
    };    
    

    return (
        <WishlistContext.Provider value={{ wishlist, setWishlist, addToWishlist, removeFromWishlist, toggleWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

// ✅ Custom Hook to Use Wishlist Context
export function useWishlist() {
    return useContext(WishlistContext);
}
