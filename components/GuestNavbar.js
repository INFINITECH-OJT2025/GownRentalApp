"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function GuestNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [loadingLink, setLoadingLink] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigation = (href) => {
    if (loadingLink === href) return;
    setLoadingLink(href);
    router.push(href);
    setTimeout(() => setLoadingLink(null), 2000);
  };

  const isLogin = pathname === "/login";
  const isSignup = pathname === "/signup";
  const isBrowse = pathname === "/rent_now";

  return (
    <nav className="bg-white shadow-md fixed top-0 w-full z-50">
      <div className="container mx-auto px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image src="/gownrentalsicon.svg" alt="GownRental Logo" width={40} height={40} />
          <span className="text-2xl font-bold text-pink-600 ml-1">GownRental</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link href="/rent_now">
            <button
              className={`px-4 py-2 rounded border ${
                isBrowse
                  ? "bg-pink-600 text-white border-pink-600"
                  : "text-pink-600 border-pink-600 hover:bg-pink-50"
              }`}
            >
              Browse
            </button>
          </Link>

          <Link href="/login">
            <button
              className={`px-4 py-2 rounded border ${
                isLogin
                  ? "bg-pink-600 text-white border-pink-600"
                  : "text-pink-600 border-pink-600 hover:bg-pink-50"
              }`}
            >
              Sign In
            </button>
          </Link>

          <Link href="/signup">
            <button
              className={`px-4 py-2 rounded border ${
                isSignup
                  ? "bg-pink-600 text-white border-pink-600"
                  : "text-pink-600 border-pink-600 hover:bg-pink-50"
              }`}
            >
              Sign Up
            </button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-gray-700" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden flex flex-col bg-white shadow-md p-4 space-y-3">
          <Link href="/rent_now">
            <button
              className={`w-full py-3 rounded border ${
                isBrowse
                  ? "bg-pink-600 text-white border-pink-600"
                  : "text-pink-600 border-pink-600 hover:bg-pink-50"
              }`}
            >
              Browse
            </button>
          </Link>

          <Link href="/login">
            <button
              className={`w-full py-3 rounded border ${
                isLogin
                  ? "bg-pink-600 text-white border-pink-600"
                  : "text-pink-600 border-pink-600 hover:bg-pink-50"
              }`}
            >
              Sign In
            </button>
          </Link>

          <Link href="/signup">
            <button
              className={`w-full py-3 rounded border ${
                isSignup
                  ? "bg-pink-600 text-white border-pink-600"
                  : "text-pink-600 border-pink-600 hover:bg-pink-50"
              }`}
            >
              Sign Up
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}
