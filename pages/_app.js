import Head from "next/head";
import { WishlistFavoritesProvider } from "../context/WishlistFavoritesContext";
import "../../resources/css/styles/global.css";

export default function MyApp({ Component, pageProps }) {
    return (
        <WishlistFavoritesProvider>
            {/* ✅ Global Head (Title & Favicon) */}
            <Head>
                <title>Gown Rental</title> {/* Default Title */}
                <meta name="description" content="Find and rent beautiful gowns effortlessly." />
                <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" /> {/* ✅ Favicon added */}
            </Head>

            <Component {...pageProps} />
        </WishlistFavoritesProvider>
    );
}
