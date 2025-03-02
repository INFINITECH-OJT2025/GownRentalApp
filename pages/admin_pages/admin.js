"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [stats, setStats] = useState({ users: 0, products: 0, visitors: 0 });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "admin") {
            router.push("/");
        } else {
            setUser(storedUser);
        }

        // Check for dark mode preference
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            setDarkMode(true);
            document.documentElement.classList.add("dark");
        }

        // Fetch statistics
        fetchStats();
    }, [router]);

    const fetchStats = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/dashboard/stats", {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`, // Ensure token is included
                    "Accept": "application/json"
                }
            });
    
            // Check if the response is actually JSON
            const text = await response.text();
            console.log("API Response:", text);
    
            const data = JSON.parse(text);
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };
    

    return (
        <div className={`${darkMode ? "dark" : ""} flex h-screen bg-white dark:bg-[#0F172A]`}>
            <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
                <header className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
                    <h1 className="text-lg font-bold dark:text-white mr-auto">Gown Rental</h1>
                    <div className="flex items-center space-x-2 md:space-x-4 mr-20">
                        {user?.image ? (
                            <Image
                                src={`http://127.0.0.1:8000/storage/profile_pictures/${user.image}`}
                                alt="Profile"
                                width={32}
                                height={32}
                                className="rounded-full border border-gray-300"
                            />
                        ) : (
                            <Image
                                src="/images/default_avatar.png"
                                alt="Default Profile"
                                width={32}
                                height={32}
                                className="rounded-full border border-gray-300"
                            />
                        )}
                        <span className="dark:text-white text-sm md:text-base">{user?.name || "Admin"}</span>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="p-6 mt-16">
                    <nav className="my-6 flex px-5 py-3 text-gray-700 rounded-lg bg-gray-50 dark:bg-[#1E293B]" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <a href="#" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                    </svg>
                                    Home
                                </a>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <a href="#" className="ml-1 text-sm font-medium text-gray-700 hover:text-gray-900 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                                        Dashboard
                                    </a>
                                </div>
                            </li>
                        </ol>
                    </nav>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
                            <h2 className="text-xl font-bold">Total Users</h2>
                            <p>{stats.users}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
                            <h2 className="text-xl font-bold">Total Products</h2>
                            <p>{stats.products}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
                            <h2 className="text-xl font-bold">Total Revenue</h2>
                            <p>₱{Number(stats.totalRevenue || 0).toLocaleString("en-PH")}</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
