"use client";

import "../../resources/css/styles/global.css";
import Head from "next/head";
import AuthGuard from "../components/AuthGuard";
import Link from "next/link";
import Navbar from "../components/Navbar"; // Ensure Navbar is in the components folder

export default function AboutPage() {
    return (
        <AuthGuard>
             <Head>
                <title>About Us | Gown Rental</title> {/* ✅ Dynamic Title */}
                <meta name="description" content="Manage your profile and settings on Gown Rental." />
                <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
            </Head>
        <div className="min-h-screen bg-pink-50 text-gray-800 font-poppins">
            <Navbar /> {/* Import the Navbar component */}

                {/* Hero Section - Soft Feminine Banner */}
                <section className="relative bg-gradient-to-r from-pink-300 via-pink-200 to-pink-100 text-center py-32 flex flex-col items-center">
                    <h1 className="text-5xl font-bold text-white drop-shadow-lg mt-6">
                        About <span className="text-pink-700">GownRental</span>
                    </h1>
                    <p className="mt-4 text-lg text-white max-w-2xl mx-auto">
                        We offer luxurious gowns for all occasions, ensuring style and comfort at affordable prices.
                    </p>
                </section>


            {/* About Content Section */}
            <section className="py-16 px-6 md:px-16 text-center">
                <h2 className="text-4xl font-semibold text-pink-600">Our Story</h2>
                <p className="text-gray-700 mt-4 max-w-3xl mx-auto leading-relaxed">
                    GownRental was founded with a vision to make elegant and stylish gowns accessible to everyone. 
                    Our team carefully curates the finest selections, ensuring you always have the best options for your special events.
                </p>
            </section>

            {/* Features Section */}
            <div className="grid md:grid-cols-3 gap-8 mt-8 px-6 md:px-16">
                {[
                    { title: 'Exclusive Collection', desc: 'Handpicked designs to make you stand out.', icon: '👗' },
                    { title: 'Affordable Pricing', desc: 'Luxury at a fraction of the cost.', icon: '💰' },
                    { title: 'Easy Booking', desc: 'Seamless online reservation system.', icon: '📅' },
                ].map((feature, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition transform hover:scale-105 flex flex-col items-center">
                        <span className="text-4xl">{feature.icon}</span>
                        <h3 className="text-xl font-semibold text-pink-600 mt-3">{feature.title}</h3>
                        <p className="text-gray-700 mt-2 text-center">{feature.desc}</p>
                    </div>
                ))}
            </div>

            {/* Call-to-Action Section */}
            <section className="text-center my-16 px-6">
                <h2 className="text-3xl font-semibold text-pink-600">Ready to Find Your Dream Gown?</h2>
                <p className="text-gray-700 mt-2">Explore our collection and rent the perfect gown for your occasion.</p>
                <Link href="/browse">
                    <button className="mt-6 bg-pink-600 hover:bg-pink-700 text-white text-lg font-semibold py-3 px-6 rounded-lg shadow-md transition">
                        Browse Gowns
                    </button>
                </Link>
            </section>

            {/* Footer */}
            <footer className="bg-pink-700 text-white text-center py-6 mt-10">
                <p>&copy; {new Date().getFullYear()} Gown Rental System. All Rights Reserved.</p>
            </footer>
        </div>
        </AuthGuard>
    );
}
