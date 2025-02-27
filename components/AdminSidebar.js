"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // ✅ Get current route
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
    MessageSquare,
} from "lucide-react";

export default function AdminSidebar({ isSidebarOpen, toggleSidebar, darkMode, toggleDarkMode }) {
    const pathname = usePathname(); // ✅ Get current route

    const menuItems = [
        { href: "/admin_pages/admin", icon: <Home size={20} />, label: "Dashboard" },
        { href: "/admin_pages/analytics", icon: <BarChart3 size={20} />, label: "Analytics" },
        { href: "/admin_pages/reports", icon: <FileText size={20} />, label: "Reports" },
        { href: "/admin_pages/products", icon: <Package size={20} />, label: "Products" },
        { href: "/admin_pages/inventory", icon: <Warehouse size={20} />, label: "Inventory" },
        { href: "/admin_pages/orders", icon: <ClipboardCheck size={20} />, label: "Order Management" },
        { href: "/admin_pages/users", icon: <Users size={20} />, label: "Admin Profile" },
        { href: "/admin_pages/chat", icon: <MessageSquare size={20} />, label: "Chat with Customer" },
    ];

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

                <nav className="mt-6 flex flex-col space-y-2">
                    {menuItems.map((item) => (
                        <Link 
                            key={item.href} 
                            href={item.href} 
                            className={`flex items-center space-x-3 p-2 rounded-md transition-all ${
                                pathname === item.href ? "bg-pink-500 text-white" : "hover:bg-pink-300"
                            }`}
                        >
                            {item.icon}
                            {isSidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
