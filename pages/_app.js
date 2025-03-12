import axios from "axios";
import '../styles/global.css';
import { BookProvider } from "../context/BookContext";
import { WishlistProvider } from "../context/WishlistContext";
import { FavoritesProvider } from "../context/FavoritesContext";
import { ChatProvider } from "../context/ChatContext";

// ✅ Global Axios Error Interceptor
axios.interceptors.response.use(
    response => response, // ✅ Allow successful responses
    error => {
        if (!error.response) {
            alert("⚠ Network Error! Please check your internet connection.");
        } else if (error.response.status === 401) {
            alert("⚠ Unauthorized! Please log in again.");
            localStorage.removeItem("token");
            window.location.href = "/login"; // ✅ Redirect to login
        } else if (error.response.status === 422) {
            alert("⚠ Validation error! Please check your input.");
        } else {
            alert(`⚠ Error: ${error.response.data.message || "An unexpected error occurred."}`);
        }
        return Promise.reject(error);
    }
);

export default function MyApp({ Component, pageProps }) {
    return (
        <BookProvider>
            <WishlistProvider>
                <FavoritesProvider>
                    <ChatProvider>
                        <Component {...pageProps} />
                    </ChatProvider>
                </FavoritesProvider>
            </WishlistProvider>
        </BookProvider>
    );
}
