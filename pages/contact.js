"use client";

import { useState , useEffect } from "react";
import AuthGuard from "../components/AuthGuard";
import Navbar from "../components/Navbar";
import Head from "next/head";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import Footer from "../components/Footer";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });
    const [errors, setErrors] = useState({});


    const [loading, setLoading] = useState(false);
    const [responseMessage, setResponseMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    
        if (name === "email") {
            const newErrors = { ...errors };
    
            if (!value) {
                newErrors.email = "Email is required.";
            } else if (!/^[^\s@]+@gmail\.com$/.test(value)) {
                newErrors.email = "Please enter a valid email.";
            } else {
                delete newErrors.email;
            }
    
            setErrors(newErrors);
        }
    };

    const [userRole, setUserRole] = useState(null);

        useEffect(() => {
        if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUserRole(parsedUser?.role || null);
            }
        }
        }, []);

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResponseMessage("");
    
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/contact`, formData, {
                headers: { "Content-Type": "application/json" },
            });
    
            if (res.data.success) {
                toast.success("Message sent successfully! We will contact you soon.");
                setFormData({ name: "", email: "", message: "" }); // Reset form
            }
        } catch (error) {
            if (error.response && error.response.data.errors) {
                // Extract and display first validation error
                const errorMessage = Object.values(error.response.data.errors)[0][0];
                toast.error(errorMessage);
            } else {
                toast.error("Failed to send message. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <AuthGuard>
            <Head>
                <title>Contact | Gown Rental</title>
                <meta name="description" content="Manage your profile and settings on Gown Rental." />
                <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
            </Head>
            <div className="min-h-screen bg-pink-50 text-gray-800 font-poppins">
                <Navbar />

                <section className="relative bg-gradient-to-r from-pink-300 via-pink-200 to-pink-100 text-center py-32 flex flex-col items-center">
                    <h1 className="text-5xl font-bold text-white drop-shadow-lg mt-6">
                        Contact <span className="text-pink-700">Us</span>
                    </h1>
                    <p className="mt-4 text-lg text-pink-900 max-w-2xl mx-auto [text-shadow:2px_2px_0px_black,-2px_-2px_0px_black,2px_-2px_0px_black,-2px_2px_0px_black]">
                        Have a question? Get in touch with us! We’d love to hear from you.
                    </p>
                </section>

                <div className="flex items-center justify-center min-h-screen px-6 md:px-16">
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h2 className="text-3xl font-semibold text-pink-600 mb-6">Send Us a Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-gray-700 font-medium">Your Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring focus:ring-pink-300"
                                    placeholder="Your Name"
                                />
                            </div>

                            <div>
                            <label className="text-gray-700 font-medium">Your Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring focus:ring-pink-300"
                                placeholder="Your Email"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                            )}
                            {formData.email && !errors.email && (
                                <p className="text-green-600 text-sm mt-1">Valid email!</p>
                            )}
                        </div>


                            <div>
                                <label className="text-gray-700 font-medium">Your Message</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring focus:ring-pink-300"
                                    rows="5"
                                    placeholder="Write your message here..."
                                ></textarea>
                            </div>

                            {userRole === "admin" ? (
                                <p className="text-center text-gray-500 font-semibold mt-4">
                                    Admins cannot send messages from this form.
                                </p>
                                ) : (
                                <button
                                    type="submit"
                                    className="w-full bg-pink-600 hover:bg-pink-700 text-white text-lg font-semibold py-3 px-6 rounded-lg shadow-md transition flex items-center justify-center gap-2"
                                    disabled={loading}
                                >
                                    {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        Sending...
                                    </>
                                    ) : (
                                    "Send Message"
                                    )}
                                </button>
                                )}



                            {responseMessage && (
                                <p className="text-center mt-4 text-gray-700">{responseMessage}</p>
                            )}
                        </form>
                    </div>
                </div>

                <Footer />
            </div>
        </AuthGuard>
    );
}
