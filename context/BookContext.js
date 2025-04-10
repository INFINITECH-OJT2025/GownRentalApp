import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const BookContext = createContext();

export function BookProvider({ children }) {
    const [bookingCount, setBookingCount] = useState(0);

    const fetchBookings = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/bookings`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setBookingCount(response.data.bookings.length);
            }
        } catch (error) {
            console.warn("Booking fetch failed", error);
        }
    };

    useEffect(() => {
        fetchBookings(); // initial
    
        let debounceTimer;
        const handleStorageChange = (event) => {
            if (event.key === "bookingUpdated") {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    fetchBookings();
                }, 300);
            }
        };
    
        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            clearTimeout(debounceTimer);
        };
    }, []);
    

    const updateBookingCount = () => {
        fetchBookings();
        setTimeout(() => {
            localStorage.setItem("bookingUpdated", Date.now().toString());
        }, 100);
    };

    return (
        <BookContext.Provider value={{ bookingCount, updateBookingCount }}>
            {children}
        </BookContext.Provider>
    );
}

export function useBook() {
    return useContext(BookContext);
}
