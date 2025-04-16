"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import GuestNavbar from "../components/GuestNavbar";
import Head from "next/head";

export default function LoginPage() {
    const router = useRouter();
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);


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

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
    
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/login`,
                formData,
                { headers: { "Content-Type": "application/json" } }
            );
    
            if (response.data.token) {
                // ✅ Store token & user role in localStorage
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
    
                // ✅ Store token & role in Cookies (IMPORTANT for middleware)
                Cookies.set("auth_token", response.data.token, { expires: 7, secure: true, sameSite: "Strict" });
                Cookies.set("user_role", response.data.user.role, { expires: 7, secure: true, sameSite: "Strict" });
    
                toast.success("Login successful! Redirecting...", {
                    duration: 3000,
                    position: "top-right",
                });
                
                setTimeout(() => {
                    if (response.data.user.role === "admin") {
                        window.location.href = "/admin_pages/admin"; // 🔁 Full reload for admin
                    } else {
                        window.location.href = "/"; // 🔁 Full reload for customer
                    }
                }, 2000);                
                
            } else {
                toast.error("Login failed! Invalid credentials.", {
                    duration: 3000,
                    position: "top-right",
                });
                
            }
        } catch (err) {
            setError(""); // ✅ Clear error state to prevent UI rendering issue
            toast.error(err.response?.data?.message || "Invalid email or password.", {
                duration: 3000,
                position: "top-right",
            });

        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <Head>
          <title>Login Now | Gown Rental</title>
          <meta name="description" content="Explore beautiful gowns for rent on Gown Rental." />
          <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-200 to-pink-400 px-6">
              <GuestNavbar />
            {/* ✅ Outer White Rounded Background */}
            <div className="bg-transparent px-4 sm:px-8 py-12 w-full max-w-md sm:max-w-lg flex flex-col items-center">
                {/* ✅ Logo and GownRental Text */}
                  {/* ✅ GIF Logo */}
                  <div className="flex justify-center mb-0 bottom-0">
                <Image
                    src="/images/new-gif.gif"
                    alt="Login Animation"
                    width={80}
                    height={80}
                    className="rounded-full"
                    priority
                />
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-pink-300 w-full">

                    <h2 className="text-3xl font-bold text-center text-pink-600 mb-4">
                        Welcome Back
                    </h2>
                    <p className="text-gray-600 text-center mb-6">
                        Sign in to continue renting your dream gowns.
                    </p>

                    {/* ✅ Error Message */}

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
                        <div className="relative">
                            <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                            placeholder="Enter your password"
                            required
                            />
                            <span
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                            >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </span>
                        </div>
                        </div>

                        <div className="flex justify-between items-center w-full">
                        <label className="flex items-center text-sm text-gray-600">
                        <input 
                            type="checkbox" 
                            className="mr-2" 
                            checked={rememberMe} 
                            onChange={() => setRememberMe(!rememberMe)} 
                        />
                        Remember Me
                    </label>

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
        </>
    );
}
