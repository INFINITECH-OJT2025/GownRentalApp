import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";


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
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
    
                if (response.data.success) {
                    setFavorites(response.data.data.map(item => item.product_id)); // ✅ Store IDs
                }
            } catch (error) {
                if (!error.response) {
                    toast.error("⚠ Network Error! Please check your internet connection.", { position: "top-right" });
                } else if (error.response.status === 401) {
                    toast.error("⚠ Unauthorized! Please log in again.", { position: "top-right" });
                } else {
                    toast.error(`⚠ Error fetching favorites: ${error.response.data.message || "Unknown error."}`, { position: "top-right" });
                }
            }
        };
    
        fetchFavorites(); // ✅ Initial load
    
        let debounceTimer;
    
        const handleStorageChange = (event) => {
            if (event.key === "favoritesUpdated") {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    fetchFavorites(); // ✅ Refresh from localStorage update
                }, 300);
            }
        };
    
        window.addEventListener("storage", handleStorageChange);
    
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            clearTimeout(debounceTimer);
        };
    }, []);
    

    const addToFavorites = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("⚠ You must be logged in to add favorites.", { position: "top-right" });
            return;
        }
    
        if (favorites.includes(productId)) {
            toast.error("⚠ This item is already in favorites.", { position: "top-right" });
            return;
        }
    
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/favorites`,
                { product_id: productId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (response.data.success) {
                setFavorites([...favorites, productId]); // ✅ Update local state
                toast.success("Added to favorites!", { position: "top-right" });
                localStorage.setItem("favoritesUpdated", Date.now().toString()); // ✅ Notify other tabs
            }
        } catch (error) {
            if (error.response?.status === 409) {
                toast.error("⚠ This item is already in favorites.", { position: "top-right" });
            } else {
                console.error("Error adding to favorites:", error);
                toast.error("An error occurred while adding to favorites.", { position: "top-right" });
            }
        }
    };
    
    

    const removeFromFavorites = async (productId) => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠ You must be logged in to modify your favorites.");
            return;
        }
    
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/favorites/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            setFavorites(favorites.filter((id) => id !== productId)); // ✅ Remove from state
            toast.success("Removed to favorites!", { position: "top-right" });
            localStorage.setItem("favoritesUpdated", Date.now().toString()); // ✅ Notify other tabs
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
