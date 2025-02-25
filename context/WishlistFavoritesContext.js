"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
const WishlistFavoritesContext = createContext(null);

export function WishlistFavoritesProvider({ children }) {
    const [wishlistCount, setWishlistCount] = useState(0);
    const [favoritesCount, setFavoritesCount] = useState(0);

    // ✅ Fetch Wishlist & Favorites Count
    const fetchCounts = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const wishlistResponse = await axios.get("http://127.0.0.1:8000/api/wishlist", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const favoritesResponse = await axios.get("http://127.0.0.1:8000/api/favorites", {
                headers: { Authorization: `Bearer ${token}` }
            });

            setWishlistCount(wishlistResponse.data.data.length || 0);
            setFavoritesCount(favoritesResponse.data.data.length || 0);
        } catch (error) {
            console.error("Error fetching wishlist/favorites counts:", error);
            setWishlistCount(0);
            setFavoritesCount(0);
        }
    };

    // ✅ Fetch counts initially
    useEffect(() => {
        fetchCounts();
    }, []);

    return (
        <WishlistFavoritesContext.Provider value={{ 
            wishlistCount, 
            favoritesCount, 
            setWishlistCount, 
            setFavoritesCount, 
            fetchCounts 
        }}>
            {children}
        </WishlistFavoritesContext.Provider>
    );
}

// ✅ Make sure context is only used inside components
export function useWishlistFavorites() {
    const context = useContext(WishlistFavoritesContext);
    if (!context) {
        throw new Error("useWishlistFavorites must be used within a WishlistFavoritesProvider");
    }
    return context;
}
