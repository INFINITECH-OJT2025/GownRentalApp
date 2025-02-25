import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const BookContext = createContext();

export function BookProvider({ children }) {
    const [bookingCount, setBookingCount] = useState(0);

    // ✅ Fetch Booking Count from API
    const fetchBookings = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await axios.get("http://127.0.0.1:8000/api/user/bookings", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setBookingCount(response.data.bookings.length); // ✅ Count all bookings for the logged-in user
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
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

    // ✅ Function to Update Booking Count
    const updateBookingCount = () => {
        fetchBookings(); // ✅ Refresh from API
        localStorage.setItem("bookingUpdated", Date.now()); // ✅ Broadcast update to all tabs
        window.dispatchEvent(new Event("storage")); // ✅ Notify all components
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
