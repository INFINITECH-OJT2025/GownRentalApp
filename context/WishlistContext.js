import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

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
                console.error("Error fetching wishlist:", error);
            }
        };

        fetchWishlist();
    }, []);

    // ✅ Function to Add Item to Wishlist
    const addToWishlist = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠ You must be logged in to add to the wishlist.");
            return;
        }

        if (wishlist.includes(productId)) {
            alert("✅ This item is already in your wishlist.");
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
                alert("✅ Added to wishlist successfully!");
            }
        } catch (error) {
            console.error("Error adding to wishlist:", error);
            alert(error.response?.data?.message || "❌ An error occurred.");
        }
    };

    // ✅ Function to Remove Item from Wishlist
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
        } catch (error) {
            console.error("Error removing from wishlist:", error);
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
                alert("✅ Added to wishlist!");
            }
        } catch (error) {
            console.error("Error modifying wishlist:", error);
            alert("❌ An error occurred.");
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
