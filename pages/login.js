"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import "../../resources/css/styles/global.css";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));
        
        if (token && user) {
            if (user.role === "admin") {
                router.push("/admin_pages/admin"); // ✅ Redirect to admin page
            } else {
                router.push("/"); // ✅ Redirect to customer homepage
            }
        }
    }, [router]);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/login", formData);

            // ✅ Store token & user data
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            // ✅ Redirect based on role
            if (response.data.user.role === "admin") {
                router.push("/admin_pages/admin"); // ✅ Redirect to Admin Dashboard
            } else {
                router.push("/"); // ✅ Redirect to Customer Homepage
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid email or password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-200 to-pink-400 px-6">
            {/* ✅ Outer White Rounded Background */}
            <div className="bg-white p-12 rounded-3xl shadow-xl w-full max-w-lg flex flex-col items-center">
                {/* ✅ Logo and GownRental Text */}
                <div className="flex items-center space-x-2 mb-6">
                    <Image src="/gownrentalsicon.svg" alt="GownRental Logo" width={45} height={45} />
                    <span className="text-3xl font-bold text-pink-600">GownRental</span>
                </div>

                {/* ✅ Inner Login Card */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-pink-300 w-full">
                    <h2 className="text-3xl font-bold text-center text-pink-600 mb-4">
                        Welcome Back
                    </h2>
                    <p className="text-gray-600 text-center mb-6">
                        Sign in to continue renting your dream gowns.
                    </p>

                    {/* ✅ Error Message */}
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                    <form className="w-full space-y-4" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-pink-600 text-sm font-semibold">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-pink-600 text-sm font-semibold">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <div className="flex justify-between items-center w-full">
                            <label className="flex items-center text-sm text-gray-600">
                                <input type="checkbox" className="mr-2" />
                                Remember Me
                            </label>
                            <a href="#" className="text-pink-500 text-sm hover:underline">
                                Forgot Password?
                            </a>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition duration-300"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p className="text-sm text-center text-gray-600 mt-4">
                        Don't have an account? <a href="/signup" className="text-pink-500 hover:underline">Sign up</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
