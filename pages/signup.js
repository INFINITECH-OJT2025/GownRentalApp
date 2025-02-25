"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Next.js 13+ navigation
import Image from "next/image";
import axios from "axios";
import "../../resources/css/styles/global.css";

export default function SignupPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: ""
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null); // Success message state
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/register", formData);
            localStorage.setItem("token", response.data.token);

            setSuccess("You have been successfully signed up! Now you may log in.");
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-100 to-pink-300 px-6">
            <div className="bg-white p-12 rounded-3xl shadow-xl w-full max-w-lg flex flex-col items-center">
                <div className="flex items-center space-x-2 mb-6">
                    <Image src="/gownrentalsicon.svg" alt="GownRental Logo" width={45} height={45} />
                    <span className="text-3xl font-bold text-pink-600">GownRental</span>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-lg border border-pink-300 w-full">
                    <h2 className="text-3xl font-bold text-center text-pink-600 mb-4">Create an Account</h2>
                    <p className="text-gray-600 text-center mb-6">Join us and rent the gown of your dreams!</p>

                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    {success && <p className="text-green-600 text-center mb-4">{success}</p>} {/* ✅ Success Message */}

                    <form className="w-full space-y-4" onSubmit={handleSignup}>
                        <div>
                            <label className="block text-pink-600 text-sm font-semibold">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                placeholder="Enter your full name" required />
                        </div>
                        <div>
                            <label className="block text-pink-600 text-sm font-semibold">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                placeholder="Enter your email" required />
                        </div>
                        <div>
                            <label className="block text-pink-600 text-sm font-semibold">Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                placeholder="Create a password" required />
                        </div>
                        <div>
                            <label className="block text-pink-600 text-sm font-semibold">Confirm Password</label>
                            <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                placeholder="Confirm your password" required />
                        </div>
                        <button type="submit"
                            className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition duration-300"
                            disabled={loading}>
                            {loading ? "Signing up..." : "Sign Up"}
                        </button>
                    </form>

                    <p className="text-sm text-center text-gray-600 mt-4">
                        Already have an account? <a href="/login" className="text-pink-500 hover:underline">Login</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
