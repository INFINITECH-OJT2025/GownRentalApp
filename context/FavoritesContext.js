import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// ✅ Create Favorites Context
const FavoritesContext = createContext();

// ✅ Provide Favorites Context to App
export function FavoritesProvider({ children }) {
    const [favorites, setFavorites] = useState([]);

    // ✅ Fetch Favorites from Database on Load
    useEffect(() => {
        const fetchFavorites = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await axios.get("http://127.0.0.1:8000/api/favorites", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    setFavorites(response.data.data.map(item => item.product_id)); // ✅ Store IDs
                }
            } catch (error) {
                console.error("Error fetching favorites:", error);
            }
        };

        fetchFavorites();
    }, []);

    // ✅ Function to Add Item to Favorites
    const addToFavorites = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠ You must be logged in to add to favorites.");
            return;
        }

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
                setFavorites([...favorites, productId]); // ✅ Update UI instantly
                alert("✅ Added to favorites successfully!");
            }
        } catch (error) {
            console.error("Error adding to favorites:", error);
            alert(error.response?.data?.message || "❌ An error occurred.");
        }
    };

    // ✅ Function to Remove Item from Favorites
    const removeFromFavorites = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠ You must be logged in to modify your favorites.");
            return;
        }

        try {
            await axios.delete(`http://127.0.0.1:8000/api/favorites/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setFavorites(favorites.filter((id) => id !== productId)); // ✅ Remove from state
        } catch (error) {
            console.error("Error removing from favorites:", error);
        }
    };

    const toggleFavorite = async (productId) => {
        if (favorites.includes(productId)) {
            await removeFromFavorites(productId);
        } else {
            await addToFavorites(productId);
        }
    };

    return (
        <FavoritesContext.Provider value={{ favorites, setFavorites, addToFavorites, removeFromFavorites, toggleFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
}

// ✅ Custom Hook to Use Favorites Context
export function useFavorites() {
    return useContext(FavoritesContext);
}
