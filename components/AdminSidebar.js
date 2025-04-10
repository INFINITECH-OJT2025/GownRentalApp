"use client";

import { useContext, useState, useEffect } from "react";
// import { ChatContext } from "../context/ChatContext";
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
    PencilLine,
    Loader2,
    Bell,
} from "lucide-react";
import moment from "moment";
import Image from "next/image";
import axios from "axios"; 
import Cookies from "js-cookie"; // ✅ Import Cookies
import { getCurrentUser } from "../utils/api";

export default function AdminSidebar({ isSidebarOpen, toggleSidebar, darkMode, toggleDarkMode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [loadingLink, setLoadingLink] = useState(null);
    const [user, setUser] = useState(null);
    const [chatHasNotification, setChatHasNotification] = useState(false);

    
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser)); // ✅ Store user in state
        }
    }, []);

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
    
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {}, {
                headers: { "Authorization": `Bearer ${token}` },
            });
    
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("remember_me");
    
            Cookies.remove("auth_token");
            Cookies.remove("user_role");
    
            window.location.href = "/login";
    
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setIsLoggingOut(false); // ✅ Stop loading
        }
    };
    
    // ✅ Sidebar Menu Items
    const menuItems = [
        { href: "/admin_pages/admin", icon: <Home size={20} />, label: "Dashboard" },
        { href: "/admin_pages/reports", icon: <FileText size={20} />, label: "Reports" },
        { href: "/admin_pages/products", icon: <Package size={20} />, label: "Products" },
        { href: "/admin_pages/inventory", icon: <Warehouse size={20} />, label: "Inventory" },
        { href: "/admin_pages/orders", icon: <ClipboardCheck size={20} />, label: "Order Management" },
        { href: "/admin_pages/reviews", icon: <MessageSquare size={20} />, label: "Customer Reviews" },
        { href: "/admin_pages/promotional", icon: <PencilLine size={20} />, label: "Promotional Tool" },
        { href: "/admin_pages/users", icon: <Users size={20} />, label: "Admin Profile" },
    ];

    return (
        <>
          {/* 🟣 Desktop sidebar */}
          <aside
      className={`hidden md:flex flex-col justify-between bg-[#1E293B] h-full w-${isSidebarOpen ? '60' : '16'} 
      transition-all duration-300 fixed top-0 left-0 z-40`}
    >
      <div className="flex flex-col p-4 flex-grow">
        {/* Desktop toggle */}
        <div className="flex items-center mb-4 space-x-2">
      <button onClick={toggleSidebar} className="text-black hover:text-gray-300">
        {isSidebarOpen ? <ArrowLeft /> : <ArrowRight />}
      </button>
      {isSidebarOpen && (
        <div className="flex items-center">
          <Image
            src="/gownrentalsicon.svg"
            alt="GownRental Logo"
            width={32}
            height={32}
            className="mr-2"
          />
          <h1 className="text-pink-600 font-bold text-lg">Gown Rental</h1>
        </div>
      )}
    </div>

        <nav className="mt-6 flex flex-col space-y-2 flex-grow">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              disabled={loadingLink === item.href}
              className={`flex items-center ${
                isSidebarOpen ? "space-x-3 justify-start" : "justify-center"
              } p-2 rounded-md transition-all w-full text-left
                ${pathname === item.href
                  ? "bg-pink-500 text-white"
                  : "text-white/70 hover:bg-pink-300 hover:text-white"}
                ${loadingLink === item.href ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loadingLink === item.href ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                item.icon
              )}
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {pathname === "/admin_pages/admin" && (
        <div className="w-full px-4 pb-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full flex items-center justify-center space-x-3 p-3 transition-all rounded-lg
              ${isLoggingOut ? "bg-gray-500 cursor-not-allowed opacity-70" : "bg-red-600 text-white hover:bg-red-700"}`}
          >
            {isLoggingOut ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <LogOut size={20} />
            )}
            {isSidebarOpen && <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>}
          </button>
        </div>
      )}
    </aside>

          {/* 🔵 Mobile sidebar overlay */}
          {isSidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
                onClick={toggleSidebar}
              />
              <aside className="fixed top-0 left-0 h-full w-60 bg-white text-black z-50 shadow-lg rounded-r-xl flex flex-col justify-between md:hidden">
                <div className="flex flex-col p-4 flex-grow">
                  {/* Close button (mobile only) */}
                  {/* Logo + Close button row for mobile */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Image
                        src="/gownrentalsicon.svg"
                        alt="GownRental Logo"
                        width={32}
                        height={32}
                        className="mr-2"
                      />
                      <h1 className="text-pink-600 font-bold text-lg">Gown Rental</h1>
                    </div>
                    <button
                      onClick={toggleSidebar}
                      className="text-black hover:text-gray-500 bg-gray-200 rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>

      
                  <nav className="mt-6 flex flex-col space-y-2 flex-grow">
                  {isSidebarOpen ? (
                    // Show full menu with icons and labels when sidebar is open
                    menuItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        disabled={loadingLink === item.href}
                        className={`flex items-center space-x-3 p-2 rounded-md transition-all w-full text-left
                          ${pathname === item.href
                            ? "bg-pink-500 text-white"
                            : "text-white/70 hover:bg-pink-300 hover:text-white"}
                          ${loadingLink === item.href ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        {loadingLink === item.href ? <Loader2 size={20} className="animate-spin" /> : item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))
                  ) : (
                    // When collapsed, hide all menu items (show only toggle arrow above)
                    <div className="flex-grow" />
                  )}
                </nav>

                </div>
      
                {pathname === "/admin_pages/admin" && (
                  <div className="w-full px-4 pb-4">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className={`w-full flex items-center justify-center space-x-3 p-3 transition-all rounded-lg
                        ${isLoggingOut ? "bg-gray-500 cursor-not-allowed opacity-70" : "bg-red-600 text-white hover:bg-red-700"}`}
                    >
                      {isLoggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
                      <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                    </button>
                  </div>
                )}
              </aside>
            </>
          )}
        </>
      );
    }      