import { BookProvider } from "../context/BookContext"; // ✅ Import BookContext
import { WishlistProvider } from "../context/WishlistContext";
import { FavoritesProvider } from "../context/FavoritesContext";

export default function MyApp({ Component, pageProps }) {
    return (
        <BookProvider> {/* ✅ Wrap BookProvider */}
            <WishlistProvider>
                <FavoritesProvider>
                    <Component {...pageProps} />
                </FavoritesProvider>
            </WishlistProvider>
        </BookProvider>
    );
}
