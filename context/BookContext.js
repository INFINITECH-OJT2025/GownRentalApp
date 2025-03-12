import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const BookContext = createContext();

export function BookProvider({ children }) {
    const [bookingCount, setBookingCount] = useState(0);

    const fetchBookings = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
    
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/user/bookings", {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (response.data.success) {
                setBookingCount(response.data.bookings.length);
            }
        } catch (error) {
            if (!error.response) {
                alert("⚠ Network Error! Please check your connection.");
            } else {
                alert(`⚠ Error fetching bookings: ${error.response.data.message || "Unknown error."}`);
            }
        }
    };
    

    // ✅ Fetch when component loads
    useEffect(() => {
        fetchBookings();

        // ✅ Listen for updates via localStorage events
        const handleStorageChange = (event) => {
            if (event.key === "bookingUpdated") {
                fetchBookings(); // ✅ Refresh from API
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // ✅ **Force Update Booking Count in Real-Time**
    const updateBookingCount = () => {
        fetchBookings(); // ✅ Re-fetch from API
        setTimeout(() => {
            localStorage.setItem("bookingUpdated", Date.now()); // ✅ Broadcast update
            window.dispatchEvent(new Event("storage")); // ✅ Notify other components
        }, 100); // ✅ Add slight delay to ensure updates propagate
    };

    return (
        <BookContext.Provider value={{ bookingCount, updateBookingCount }}>
            {children}
        </BookContext.Provider>
    );
}

// ✅ Custom Hook to Use Book Context
export function useBook() {
    return useContext(BookContext);
}
