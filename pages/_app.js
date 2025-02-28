import '../styles/global.css'; // ✅ Correct path for Next.js

import { BookProvider } from "../context/BookContext";
import { WishlistProvider } from "../context/WishlistContext";
import { FavoritesProvider } from "../context/FavoritesContext";

export default function MyApp({ Component, pageProps }) {
    return (
        <BookProvider>
            <WishlistProvider>
                <FavoritesProvider>
                    <Component {...pageProps} />
                </FavoritesProvider>
            </WishlistProvider>
        </BookProvider>
    );
}
