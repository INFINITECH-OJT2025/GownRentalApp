"use client";

import { useState } from "react";
import AuthGuard from "../components/AuthGuard";
import "../../resources/css/styles/global.css";
import Navbar from "../components/Navbar"; // Ensure you have a Navbar component
import Head from "next/head";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Message Sent! We will get back to you soon.");
        setFormData({ name: "", email: "", message: "" }); // Reset form after submission
    };

    return (
        <AuthGuard>
            <Head>
                <title>Contact | Gown Rental</title> {/* ✅ Dynamic Title */}
                <meta name="description" content="Manage your profile and settings on Gown Rental." />
                <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
            </Head>
        <div className="min-h-screen bg-pink-50 text-gray-800 font-poppins">
            <Navbar /> {/* Import the Navbar component */}

            {/* Hero Section - Contact Us Banner */}
            <section className="relative bg-gradient-to-r from-pink-300 via-pink-200 to-pink-100 text-center py-32 flex flex-col items-center">
            <h1 className="text-5xl font-bold text-white drop-shadow-lg mt-6">
                    Contact <span className="text-pink-700">Us</span>
                </h1>
                <p className="mt-4 text-lg text-white max-w-2xl mx-auto">
                    Have a question? Get in touch with us! We’d love to hear from you.
                </p>
            </section>

            {/* Contact Section */}
            <div className="container mx-auto px-6 md:px-16 py-16 grid md:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-3xl font-semibold text-pink-600 mb-6">Send Us a Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-gray-700 font-medium">Full Name</label>
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
                            <label className="text-gray-700 font-medium">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring focus:ring-pink-300"
                                placeholder="Your Email"
                            />
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

                        <button
                            type="submit"
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white text-lg font-semibold py-3 px-6 rounded-lg shadow-md transition"
                        >
                            Send Message
                        </button>
                    </form>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col justify-center space-y-6">
                    <h2 className="text-3xl font-semibold text-pink-600">Contact Information</h2>
                    <p className="text-gray-700">
                        Reach out to us directly via email, phone, or visit our store.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-pink-600 text-2xl">📧</span>
                            <p className="text-gray-700">
                                Email: <a href="mailto:contact@gownrental.com" className="text-pink-600">contact@gownrental.com</a>
                            </p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <span className="text-pink-600 text-2xl">📞</span>
                            <p className="text-gray-700">Phone: +63 912 345 6789</p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <span className="text-pink-600 text-2xl">📍</span>
                            <p className="text-gray-700">
                                Address: 123 Elegance St., Makati City, Philippines
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-pink-700 text-white text-center py-6 mt-10">
                <p>&copy; {new Date().getFullYear()} Gown Rental System. All Rights Reserved.</p>
            </footer>
        </div>
        </AuthGuard>
    );
}
