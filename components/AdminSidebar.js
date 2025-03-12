"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
    Star,
    MessageCircle,
    LogOut,
    Loader2, // ✅ Import Loader Icon
} from "lucide-react";
import axios from "axios"; 
import Cookies from "js-cookie"; // ✅ Import Cookies

export default function AdminSidebar({ isSidebarOpen, toggleSidebar, darkMode, toggleDarkMode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false); // ✅ Logout loading state


    // ✅ Track loading state for links
    const [loadingLink, setLoadingLink] = useState(null);

    const handleLogout = async () => {
        setIsLoggingOut(true); // ✅ Start loading
    
        try {
            const token = localStorage.getItem("token");
    
            if (!token) {
                console.error("No token found.");
                return;
            }
    
            await axios.post("http://127.0.0.1:8000/api/logout", {}, {
                headers: { "Authorization": `Bearer ${token}` },
            });
    
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("remember_me");
    
            Cookies.remove("auth_token");
            Cookies.remove("user_role");
    
            await router.replace("/login"); 
    
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoggingOut(false); // ✅ Stop loading
        }
    };
    
    // ✅ Sidebar Menu Items
    const menuItems = [
        { href: "/admin_pages/admin", icon: <Home size={20} />, label: "Dashboard" },
        { href: "/admin_pages/analytics", icon: <BarChart3 size={20} />, label: "Analytics" },
        { href: "/admin_pages/reports", icon: <FileText size={20} />, label: "Reports" },
        { href: "/admin_pages/products", icon: <Package size={20} />, label: "Products" },
        { href: "/admin_pages/inventory", icon: <Warehouse size={20} />, label: "Inventory" },
        { href: "/admin_pages/orders", icon: <ClipboardCheck size={20} />, label: "Order Management" },
        { href: "/admin_pages/reviews", icon: <Star size={20} />, label: "Customer Reviews" },
        { href: "/admin_pages/promotional", icon: <MessageSquare size={20} />, label: "Promotional Tool" },
        { href: "/admin_pages/users", icon: <Users size={20} />, label: "Admin Profile" },
    ];

    return (
        <aside
            className={`fixed top-0 left-0 h-full bg-[#1E293B] text-black transition-all duration-300 flex flex-col justify-between ${
                isSidebarOpen ? "w-60" : "w-16"
            }`}
        >
            <div className="flex flex-col p-4 flex-grow">
                <div className="flex items-center justify-between">
                    <button onClick={toggleSidebar} className="text-black hover:text-gray-300">
                        {isSidebarOpen ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                    </button>
                </div>

                <nav className="mt-6 flex flex-col space-y-2 flex-grow">
                    {menuItems.map((item) => (
                        <button 
                            key={item.href}
                            onClick={() => {
                                setLoadingLink(item.href); // ✅ Set Loading State
                                router.push(item.href);
                            }}
                            disabled={loadingLink === item.href} // ✅ Disable while loading
                            className={`flex items-center space-x-3 p-2 rounded-md transition-all w-full text-left ${
                                pathname === item.href ? "bg-pink-500 text-white" : "hover:bg-pink-300"
                            } ${loadingLink === item.href ? "opacity-50 cursor-not-allowed" : ""}`} // ✅ Show loading effect
                        >
                            {loadingLink === item.href ? <Loader2 size={20} className="animate-spin" /> : item.icon}
                            {isSidebarOpen && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>
            </div>

            {/* ✅ Logout Button (Only on Dashboard) */}
            {pathname === "/admin_pages/admin" && (
                <div className="w-full px-4 pb-4">
                <button 
                    onClick={handleLogout} 
                    disabled={isLoggingOut} // ✅ Disable while logging out
                    className={`w-full flex items-center justify-center space-x-3 p-3 transition-all rounded-lg
                        ${isLoggingOut ? "bg-gray-500 cursor-not-allowed opacity-70" : "bg-red-600 text-white hover:bg-red-700"}`}
                >
                    {isLoggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
                    {isSidebarOpen && <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>}
                </button>
            </div>
            
            )}
        </aside>
    );
}
