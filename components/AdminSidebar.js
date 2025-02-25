"use client";

import Link from "next/link";
import {
    Home,
    Package,
    Users,
    Moon,
    Sun,
    ArrowLeft,
    ArrowRight,
    BarChart3,
    FileText,
    Warehouse,
    ClipboardCheck,
} from "lucide-react";

export default function AdminSidebar({ isSidebarOpen, toggleSidebar, darkMode, toggleDarkMode }) {
    return (
        <aside
            className={`fixed top-0 left-0 h-full bg-[#1E293B] text-black transition-all duration-300 ${
                isSidebarOpen ? "w-60" : "w-16"
            }`}
        >
            <div className="flex flex-col h-full p-4">
                <div className="flex items-center justify-between">
                    <button onClick={toggleSidebar} className="text-black hover:text-gray-300">
                        {isSidebarOpen ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                    </button>
                    <button onClick={toggleDarkMode} className="text-black hover:text-gray-300">
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                <nav className="mt-6 flex flex-col space-y-4">
                    <Link 
                        href="/admin_pages/admin" 
                        className="flex items-center space-x-3 p-2 hover:bg-pink-300 rounded-md transition-all"
                    >
                        <Home size={20} />
                        {isSidebarOpen && <span>Dashboard</span>}
                    </Link>

                    <Link 
                        href="/admin_pages/analytics" 
                        className="flex items-center space-x-3 p-2 hover:bg-pink-300 rounded-md transition-all"
                    >
                        <BarChart3 size={20} />
                        {isSidebarOpen && <span>Analytics</span>}
                    </Link>

                    <Link 
                        href="/admin_pages/reports" 
                        className="flex items-center space-x-3 p-2 hover:bg-pink-300 rounded-md transition-all"
                    >
                        <FileText size={20} />
                        {isSidebarOpen && <span>Reports</span>}
                    </Link>

                    <Link 
                        href="/admin_pages/products" 
                        className="flex items-center space-x-3 p-2 hover:bg-pink-300 rounded-md transition-all"
                    >
                        <Package size={20} />
                        {isSidebarOpen && <span>Products</span>}
                    </Link>

                    <Link 
                        href="/admin_pages/inventory" 
                        className="flex items-center space-x-3 p-2 hover:bg-pink-300 rounded-md transition-all"
                    >
                        <Warehouse size={20} />
                        {isSidebarOpen && <span>Inventory</span>}
                    </Link>

                    <Link 
                        href="/admin_pages/orders" 
                        className="flex items-center space-x-3 p-2 hover:bg-pink-300 rounded-md transition-all"
                    >
                        <ClipboardCheck size={20} />
                        {isSidebarOpen && <span>Order Management</span>}
                    </Link>

                    <Link 
                        href="/admin_pages/users" 
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
