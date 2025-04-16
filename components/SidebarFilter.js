// components/SidebarFilter.js
"use client";
import { useState } from "react";
import { PartyPopper } from "lucide-react";

export default function SidebarFilter({
  categories = [],
  selectedCategories = [],
  handleCategoryChange = () => {},
  priceRange,
  setPriceRange,
  sortByDate,
  setSortByDate,
  discountGroups = {},
  bannerColors = [],
  showNewArrivalsOnly,
  setShowNewArrivalsOnly,
}) {

  // Create a sorted copy of categories
  const sortedCategories = [...categories].sort((a, b) => a.localeCompare(b));
  const [showAllDiscounts, setShowAllDiscounts] = useState(false);

  return (
    <aside className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800">Filters</h2>

      {/* Category Filters */}
      <ul className="mt-2 space-y-2 text-gray-600">
        {sortedCategories.length > 0 ? (
          sortedCategories.map((category) => (
            <li key={category}>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                />
                <span>{category}</span>
              </label>
            </li>
          ))
        ) : (
          <p>Loading categories...</p>
        )}
      </ul>


      {/* Price Range */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-pink-600">Price Range</h3>
        <input
          type="range"
          min="0"
          max="50000"
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full mt-2 appearance-none bg-pink-300 h-2 rounded-lg outline-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:bg-pink-600
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <p className="text-pink-600 text-sm">
          Up to ₱{priceRange.toLocaleString()}
        </p>
      </div>

      {/* Sort Options */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-pink-600">Sort by</h3>
        <div className="mt-2 space-y-1 text-sm text-gray-800">
        {["newest", "new-arrivals","best-seller", "best-deals"].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="sortByDate"
              value={option}
              checked={sortByDate === option}
              onChange={() => setSortByDate(option)}
              className="mr-2"
            />
            {option === "newest" && "Default (All)"}
            {option === "new-arrivals" && "Latest Products"}
            {option === "best-seller" && "Most Rented"}
            {option === "best-deals" && "Best Deals"}
            
          </label>
        ))}
      </div>


      </div>

      {/* Promotions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <PartyPopper className="w-5 h-5 text-pink-600" />
          Promotions
        </h3>

        {Object.keys(discountGroups).length > 0 ? (
          <>
            {Object.keys(discountGroups)
              .sort((a, b) => Number(b) - Number(a))
              .slice(0, showAllDiscounts ? undefined : 7) // Only show 7 if collapsed
              .map((discount, idx) => (
                <div
                  key={idx}
                  className="relative bg-pink-200 text-pink-800 shadow-sm p-5 my-4 overflow-hidden rounded-xl"
                >
                  <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md z-2" />
                  <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md z-2" />

                  <div className="flex items-center justify-center mb-2">
                    <PartyPopper className="w-6 h-6 mr-2 text-pink-800" />
                    <span className="text-lg font-bold">{discount}% OFF</span>
                  </div>

                  <div className="text-xs text-black font-semibold text-center">Product/s:</div>
                  <ul className="flex flex-wrap justify-center gap-1 mt-1 text-xs">
                    {discountGroups[discount].map((product) => (
                      <li
                        key={product.id}
                        className="bg-pink-600 text-white font-semibold px-2 py-0.5 rounded-full"
                      >
                        {product.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

            {Object.keys(discountGroups).length > 7 && (
              <button
                onClick={() => setShowAllDiscounts(!showAllDiscounts)}
                className="text-sm text-pink-600 font-medium hover:underline mx-auto block text-center"
              >
                {showAllDiscounts ? "See less..." : "See more..."}
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-sm">No promotions available.</p>
        )}
      </div>
    </aside>
  );
}
