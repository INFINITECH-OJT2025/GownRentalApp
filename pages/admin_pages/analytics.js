"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import { Bar } from "react-chartjs-2";
import Image from "next/image";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AnalyticsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Unauthorized: Please log in.");
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get("http://127.0.0.1:8000/api/dashboard/stats", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.success) {
                    setStats(response.data.stats);
                } else {
                    setError("Failed to load analytics.");
                }
            } catch (error) {
                setError("Error fetching analytics.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const chartData = {
        labels: stats?.monthlyBookings?.map((item) => `Month ${item.month}`) || [],
        datasets: [
            {
                label: "Bookings per Month",
                data: stats?.monthlyBookings?.map((item) => item.count) || [],
                backgroundColor: "#007C3D",
                borderColor: "#004D1A",
                borderWidth: 1,
            },
        ],
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
                                        Analytics
                                    </a>
                                </div>
                            </li>
                        </ol>
                    </nav>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {stats && [
                            { title: "Total Users", value: stats.users },
                            { title: "Total Products", value: stats.products },
                            { title: "Total Bookings", value: stats.bookings },
                            { title: "Total Revenue", value: `₱${Number(stats.totalRevenue || 0).toLocaleString("en-PH")}` },
                            { title: "Pending Bookings", value: stats.pendingBookings },
                            { title: "Completed Bookings", value: stats.completedBookings },
                        ].map((item, index) => (
                            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                                <h2 className="text-lg font-semibold text-gray-700">{item.title}</h2>
                                <p className="text-2xl font-bold">{item.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Bookings Per Month</h2>
                        <Bar data={chartData} />
                    </div>
                </main>
            </div>
        </div>
    );
}
