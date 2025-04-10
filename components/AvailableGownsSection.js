"use client";

import Image from "next/image";
import Link from "next/link";
import { FaHeart, FaStar, FaSpinner } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { differenceInDays, parseISO } from 'date-fns';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const isNewArrival = (createdAt) => {
  try {
    const createdDate = parseISO(createdAt);
    return differenceInDays(new Date(), createdDate) <= 7;
  } catch (error) {
    console.warn("Invalid date format for New Arrival badge:", createdAt);
    return false;
  }
};

export default function AvailableGownsSection({
  products,
  loadingButton,
  setLoadingButton,
  wishlist,
  favorites,
  loadingWishlist,
  setLoadingWishlist,
  loadingFavorites,
  setLoadingFavorites,
  addToWishlist,
  addToFavorites,
  currentPage,
  totalPages,
  setCurrentPage,
  sortByDate,
  bestSellerRankMap,
  hideIcons = false,
}) {
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userString = localStorage.getItem("user");
      if (userString) {
        try {
          const parsedUser = JSON.parse(userString);
          setUserRole(parsedUser.role);
        } catch (e) {
          console.error("Failed to parse user data:", e);
        }
      }
    }
  }, []);

  // ✅ Filter products if `showNewArrivalsOnly` is true
  const filteredProducts = products;


  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="relative bg-white p-4 rounded-lg shadow-md">
              {isNewArrival(product.created_at) && (
                <div className="absolute top-0 left-0">
                  <div className="new-triangle"></div>
                  <div className="new-triangle-text">NEW</div>
              </div>
            )}
          
              <Link href={`/products/${product.id}`} className="block">
              <div className="relative w-full h-48 md:h-64 flex justify-center items-center">
                {product.image ? (
                  <>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${product.image}`}
                      alt={product.name}
                      width={200}
                      height={400}
                      className="rounded-lg object-cover"
                    />
                    {/* TOP-RIGHT badges */}
                    <div className="absolute top-2 right-2 flex flex-col space-y-2 items-end">
                    {sortByDate === "best-seller" && bestSellerRankMap[product.id] <= 10 && (
                    <div className="top-badge">
                      TOP {bestSellerRankMap[product.id]}
                    </div>
                  )}
                      {product.discounted_price && Number(product.discounted_price) < Number(product.price) && (
                        <div className="burst-badge shadow-md">SALE</div>
                      )}
                    </div>
                  </>
                ) : (
                  <p>No Image Available</p>
                )}
              </div>


              </Link>

              <Link href={`/products/${product.id}`} className="block">
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mt-3">{product.name}</h3>
              </Link>

              <p className="text-gray-500 text-sm">{product.category || "Uncategorized"}</p>

              <div className="mt-2 flex items-center space-x-2">
              {product.discounted_price && Number(product.discounted_price) < Number(product.price) ? (
              <>
                <p className="text-red-500 text-lg font-bold line-through">
                  ₱{Number(product.price).toLocaleString()}
                </p>
                <p className="text-green-600 text-sm font-semibold">
                  ({Math.round(((Number(product.price) - Number(product.discounted_price)) / Number(product.price)) * 100)}% OFF)
                </p>
                <p className="text-pink-600 text-xl font-bold">
                  ₱{Number(product.discounted_price).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-pink-600 text-lg font-bold">
                ₱{Number(product.price).toLocaleString()}
              </p>
            )}

              </div>

              {userRole === "admin" ? (
                <button
                  disabled
                  className="w-full mt-3 md:mt-4 bg-gray-400 text-white text-lg font-semibold py-2 px-4 md:px-6 rounded-lg shadow-md cursor-not-allowed"
                >
                  Admin Cannot Book
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!token) {
                      toast.error("You need to log in to book a gown.", {
                        duration: 3000,
                        position: "top-right",
                      });
                      router.push("/login");
                      return;
                    }

                    toast.success("Redirecting to product page...", {
                      duration: 3000,
                      position: "top-right",
                    });
                    setLoadingButton(`book-${product.id}`);
                    setTimeout(() => {
                      window.location.href = `/products/${product.id}`;
                    }, 1000);
                  }}
                  disabled={!token || loadingButton === `book-${product.id}`}
                  className={`w-full mt-3 md:mt-4 text-white text-lg font-semibold py-2 px-4 md:px-6 rounded-lg shadow-md transition ${
                    !token
                      ? "bg-gray-400 cursor-not-allowed"
                      : loadingButton === `book-${product.id}`
                      ? "bg-pink-600 opacity-50 cursor-not-allowed"
                      : "bg-pink-600 hover:bg-pink-700"
                  }`}
                >
                  {!token
                    ? "Sign In to Book"
                    : loadingButton === `book-${product.id}`
                    ? "Loading..."
                    : "Book"}
                </button>
              )}
          {!hideIcons && token && userRole !== "admin" && (
              <div className="flex justify-center space-x-4 mt-3 md:mt-4">
                {/* Wishlist Icon */}
                <button
                  onClick={async () => {
                    setLoadingWishlist(product.id);
                    await addToWishlist(product.id);
                    setLoadingWishlist(null);
                  }}
                  className="relative group"
                  disabled={loadingWishlist === product.id}
                >
                  {loadingWishlist === product.id ? (
                    <FaSpinner className="text-pink-600 text-2xl animate-spin" />
                  ) : (
                    <>
                     <FaHeart
                      className={`${
                        wishlist && wishlist.includes(product.id) ? "text-red-500" : "text-gray-500"
                      } hover:text-pink-700 text-2xl cursor-pointer transition`}
                    />

                      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition duration-300 z-[9999] whitespace-nowrap">
                      {wishlist && wishlist.includes(product.id)
                    ? "Remove from Wishlist"
                    : "Add to Wishlist"}
                      </div>
                    </>
                  )}
                </button>

                {/* Favorite Icon */}
                <button
                  onClick={async () => {
                    setLoadingFavorites(product.id);
                    await addToFavorites(product.id);
                    setLoadingFavorites(null);
                  }}
                  className="relative group"
                  disabled={loadingFavorites === product.id}
                >
                  {loadingFavorites === product.id ? (
                    <FaSpinner className="text-yellow-500 text-2xl animate-spin" />
                  ) : (
                    <>
                   <FaStar
                      className={`${
                        favorites && favorites.includes(product.id) ? "text-yellow-500" : "text-gray-500"
                      } hover:text-pink-700 text-2xl cursor-pointer transition`}
                    />
                      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition duration-300 z-[9999] whitespace-nowrap">
                      {favorites && favorites.includes(product.id)
                      ? "Remove from Favorites"
                      : "Add to Favorites"}
                      </div>
                    </>
                  )}
                </button>
              </div>
            )}

            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-full">No products available.</p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8 space-x-4">
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${
            currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-pink-600 text-white hover:bg-pink-700"
          }`}
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="text-lg font-semibold text-pink-600">
          {currentPage} / {totalPages}
        </span>
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${
            currentPage === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-pink-600 text-white hover:bg-pink-700"
          }`}
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
