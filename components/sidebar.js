"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation"; // ✅ Import search params

export default function Sidebar() {
    const searchParams = useSearchParams();
    const section = searchParams.get("section") || "public"; // ✅ Get section from URL

    return (
        <aside className="w-full md:w-1/4 lg:w-1/5 hidden md:block">
            <div className="sticky top-40 flex flex-col space-y-3 border-r pr-6 text-gray-700">
                <h2 className="text-xl font-semibold text-gray-900">Settings</h2>

                {/* ✅ Sidebar Links with Proper Styling */}
                <Link
                    href="/profile?section=public"
                    className={`px-4 py-2 rounded-lg border transition duration-300 ${
                        section === "public"
                            ? "bg-pink-200 text-pink-900 font-semibold border-transparent"
                            : "bg-white border-pink-300 text-gray-700 hover:bg-pink-100"
                    }`}
                >
                    Public Profile
                </Link>
                <Link
                    href="/profile?section=loyalty"
                    className={`px-4 py-2 rounded-lg border transition duration-300 ${
                        section === "loyalty"
                            ? "bg-pink-200 text-pink-900 font-semibold border-transparent"
                            : "bg-white border-pink-300 text-gray-700 hover:bg-pink-100"
                    }`}
                >
                    Loyalty & Rewards
                </Link>
            </div>
        </aside>
    );
}
