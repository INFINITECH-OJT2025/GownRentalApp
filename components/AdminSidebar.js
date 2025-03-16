"use client";

import { useContext, useState, useEffect } from "react";
import { ChatContext } from "../context/ChatContext";
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
    Loader2,
    Bell,
} from "lucide-react";
import moment from "moment";
import Image from "next/image";
import axios from "axios"; 
import Cookies from "js-cookie"; // ✅ Import Cookies

export default function AdminSidebar({ isSidebarOpen, toggleSidebar, darkMode, toggleDarkMode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false); // ✅ Logout loading state
    const { newMessageTotal, senders, fetchChatSenders, clearNotifications } = useContext(ChatContext);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loadingLink, setLoadingLink] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser)); // ✅ Store user in state
        }
    }, []);

    // ✅ Handle clicking the notification bell
    const handleNotificationClick = async () => {
        if (showNotifications) {
            // ✅ If clicked twice, clear the messages
            clearNotifications(user?.id);
        }
        setShowNotifications((prev) => !prev);
    };
    
    // ✅ Handle navigation inside the sidebar
    const handleNavigation = (href) => {
        setLoadingLink(href); // ✅ Set loading state for the clicked link
        router.push(href);
    };

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
                      {/* 🔔 Chat Notifications (Admin) */}
                      <div className="relative p-4">
                      <button className="relative text-black hover:text-pink-500 right-3" onClick={handleNotificationClick}>
                        <Bell className="h-6 w-6" />
                        {newMessageTotal > 0 && (
                            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center justify-center">
                                !
                            </span>
                        )}
                    </button>

                        {/* 📩 Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute left-0 mt-2 w-64 bg-white shadow-lg rounded-md z-50 border border-gray-300 overflow-hidden">
                                <div className="p-3 border-b text-gray-700 font-semibold">
                                    New Messages ({newMessageTotal})
                                </div>
                                <div className="max-h-64 overflow-y-auto"> {/* ✅ Scrollable */}
                                    {senders.length > 0 ? (
                                        <ul className="p-3 text-gray-500 text-sm">
                                            {senders.map((sender) => (
                                                <li key={sender.id} className="flex items-center space-x-2 border-b py-2">
                                                    <div>
                                                        <span className="font-semibold">{sender.name}</span> sent you a message!
                                                        <br />
                                                        <span className="text-xs text-gray-400">{moment(sender.created_at).calendar()}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-3 text-gray-500 text-sm">No new messages</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                {menuItems.map((item) => (
                    <button 
                        key={item.href}
                        onClick={() => handleNavigation(item.href)} // ✅ Use the function here
                        disabled={loadingLink === item.href} // ✅ Prevents multiple clicks
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
