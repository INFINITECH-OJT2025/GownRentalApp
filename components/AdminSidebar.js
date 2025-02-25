"use client";

import Link from "next/link";
import { Home, Package, Users, Moon, Sun, ArrowLeft, ArrowRight } from "lucide-react"; // ✅ Import Icons

export default function AdminSidebar({ isSidebarOpen, toggleSidebar, darkMode, toggleDarkMode }) {
    return (
        <aside
            className={`fixed top-0 left-0 h-full bg-[#1E293B] text-black transition-all duration-300 ${
                isSidebarOpen ? "w-60" : "w-16"
            }`}
        >
            <div className="flex flex-col h-full p-4">
                {/* Sidebar Toggle and Dark Mode Buttons */}
                <div className="flex items-center justify-between">
                    <button onClick={toggleSidebar} className="text-black hover:text-gray-300">
                        {isSidebarOpen ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                    </button>
                    <button onClick={toggleDarkMode} className="text-black hover:text-gray-300">
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="mt-6 flex flex-col space-y-4">
                    <Link 
                        href="/admin/dashboard" 
                        className="flex items-center space-x-3 p-2 hover:bg-pink-300 rounded-md transition-all"
                    >
                        <Home size={20} />
                        {isSidebarOpen && <span>Dashboard</span>}
                    </Link>
                    <Link 
                        href="/admin/products" 
                        className="flex items-center space-x-3 p-2 hover:bg-pink-300 rounded-md transition-all"
                    >
                        <Package size={20} />
                        {isSidebarOpen && <span>Products</span>}
                    </Link>
                    <Link 
                        href="/admin/users" 
                        className="flex items-center space-x-3 p-2 hover:bg-pink-300 rounded-md transition-all"
                    >
                        <Users size={20} />
                        {isSidebarOpen && <span>Users</span>}
                    </Link>
                </nav>
            </div>
        </aside>
    );
}
