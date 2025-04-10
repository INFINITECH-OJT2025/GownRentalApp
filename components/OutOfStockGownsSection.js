"use client";

import Image from "next/image";
import Link from "next/link";
import { differenceInDays, parseISO } from 'date-fns';

const isNewArrival = (createdAt) => {
  try {
    const createdDate = parseISO(createdAt);
    return differenceInDays(new Date(), createdDate) <= 7;
  } catch (error) {
    console.warn("Invalid date format:", createdAt);
    return false;
  }
};

export default function OutOfStockGownsSection({ products, currentPage, totalPages, setCurrentPage, bestSellerRankMap = {}, sortByDate }) { // Destructure sortByDate

  const outOfStock = products.filter(p => p.totalStock <= 0);

  if (outOfStock.length === 0) return null;

  const sortedOutOfStock = outOfStock.sort((a, b) => {
    // Ensure bestSellerRankMap is not undefined, use fallback to Infinity if a rank is not found
    const rankA = bestSellerRankMap[a.id] || Infinity;
    const rankB = bestSellerRankMap[b.id] || Infinity;
    return rankA - rankB;
  });
  
  return (
    <div className="mt-16">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Out of Stock Gowns</h2>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedOutOfStock.map((product, index) => (
            <div key={product.id} className="relative bg-white p-4 rounded-lg shadow-md opacity-70 cursor-not-allowed">
  
              {/* 🔺 New Triangle - placed at the card level instead of image */}
              {isNewArrival(product.created_at) && (
                <div className="absolute top-0 left-0">
                  <div className="new-triangle"></div>
                  <div className="new-triangle-text">NEW</div>
                </div>
              )}

              {/* Top 1 Ranking Badge */}
              {sortByDate === "best-seller" && index === 0 && (
                <div className="absolute top-5 right-5 bg-pink-600 text-white py-1 px-3 rounded-full text-sm font-semibold shadow-md">
                  TOP 1
                </div>
              )}


              <Link href={`/products/${product.id}`} className="block">
                <div className="relative w-full h-48 md:h-64 flex justify-center items-center">
                  {product.image ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${product.image}`}
                      alt={product.name}
                      width={200}
                      height={400}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <p>No Image Available</p>
                  )}
                </div>
            
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mt-3">{product.name}</h3>
                <p className="text-gray-500 text-sm">{product.category || "Uncategorized"}</p>
                <p className="text-red-500 text-sm font-bold mt-1">Currently Unavailable</p>
              </Link>
            </div>
          ))}
        </div>

        {/* ✅ Pagination for Out of Stock */}
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
    </div>
  );
}
