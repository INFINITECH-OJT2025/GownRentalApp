"use client";

import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminProfilePage() {
    // ✅ State for profile fields
    const [firstName, setFirstName] = useState("Shekinah");
    const [lastName, setLastName] = useState("Valdez");
    const [email, setEmail] = useState("shekinah@example.com");
    const [address, setAddress] = useState("123 Main Street, Manila");
    const [bio, setBio] = useState("Administrator of Gown Rental App");
    const [imagePreview, setImagePreview] = useState("/default-profile.png");
    const [image, setImage] = useState(null);
    
    // ✅ Sidebar & Dark Mode Toggle
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    // ✅ Handle Profile Picture Change (Preview Only)
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file)); // Show preview
        }
    };

    // ✅ Handle Save (No backend, just an alert)
    const handleSaveProfile = () => {
        alert("✅ Profile saved! (No backend, only UI)");
    };

    return (
        <div className={`${darkMode ? "dark" : ""} flex h-screen bg-white dark:bg-[#0F172A]`}>
            {/* ✅ Sidebar */}
            <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* ✅ Main Content */}
            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
                {/* ✅ Header */}
                <header className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
                    <h1 className="text-lg font-bold dark:text-white mr-auto">Gown Rental</h1>
                    <div className="flex items-center space-x-2 md:space-x-4 mr-20">
                        <Image
                            src={imagePreview}
                            alt="Profile"
                            width={32}
                            height={32}
                            className="rounded-full border border-gray-300"
                        />
                        <span className="dark:text-white text-sm md:text-base">{`${firstName} ${lastName}`}</span>
                    </div>
                </header>

                {/* ✅ Main Section */}
                <main className="p-6 mt-16">
                    {/* ✅ Breadcrumb */}
                    <nav className="my-6 flex px-5 py-3 text-gray-700 rounded-lg bg-gray-50 dark:bg-[#1E293B]" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <a href="#" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                    </svg>
                                    Home
                                </a>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <a href="#" className="ml-1 text-sm font-medium text-gray-700 hover:text-gray-900 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                                        Profile
                                    </a>
                                </div>
                            </li>
                        </ol>
                    </nav>

                    {/* ✅ Profile Management UI */}
                    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Admin Profile Management</h2>

                        {/* ✅ Profile Picture Upload */}
                        <div className="flex flex-col items-center mb-6">
                            <Image
                                className="w-32 h-32 rounded-full ring-2 ring-pink-300 object-cover"
                                src={imagePreview}
                                alt="Profile Picture"
                                width={128}
                                height={128}
                            />
                            <div className="mt-4">
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="fileInput" />
                                <label
                                    htmlFor="fileInput"
                                    className="bg-white text-pink-600 border border-pink-600 px-4 py-2 rounded-lg hover:bg-pink-100 cursor-pointer"
                                >
                                    Change Picture
                                </label>
                            </div>
                        </div>

                        {/* ✅ Profile Form */}
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-900">First Name</label>
                                    <input type="text" className="w-full p-2.5 border rounded-lg bg-gray-50" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                </div>
                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-900">Last Name</label>
                                    <input type="text" className="w-full p-2.5 border rounded-lg bg-gray-50" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900">Email</label>
                                <input type="email" className="w-full p-2.5 border rounded-lg bg-gray-200 cursor-not-allowed" value={email} disabled />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900">Address</label>
                                <input type="text" className="w-full p-2.5 border rounded-lg bg-gray-50" value={address} onChange={(e) => setAddress(e.target.value)} />
                            </div>

                            <button onClick={handleSaveProfile} className="w-full px-5 py-3 bg-pink-600 text-white rounded-lg hover:bg-white hover:text-pink-600 border border-pink-600">
                                Save Profile
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
