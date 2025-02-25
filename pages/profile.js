"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // ✅ Use search params for section tracking
import Head from "next/head";
import Image from "next/image";
import AuthGuard from "../components/AuthGuard";
import "../../resources/css/styles/global.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/sidebar"; // ✅ Correct import
import axios from "axios";

export default function ProfilePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const section = searchParams.get("section") || "public"; // ✅ Get section from URL query params

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [bio, setBio] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("/default-profile.png");

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await axios.get("http://127.0.0.1:8000/api/user", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const user = response.data.user;
                setFirstName(user.name.split(" ")[0]);
                setLastName(user.name.split(" ")[1] || "");
                setEmail(user.email);
                setAddress(user.address || ""); // ✅ Load Address
                setBio(user.bio || ""); // ✅ Load Bio
                setImagePreview(user.image ? user.image : "/default-profile.png");
                setLoading(false);
            } catch (err) {
                console.error("Error fetching user:", err);
                setError("Failed to load user data.");
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async () => {
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) return;
    
        // ✅ Check for required fields before sending the request
        if (!firstName || !lastName || !email) {
            alert("⚠ Please fill in all required fields (First Name, Last Name, and Email).");
            return;
        }
    
        try {
            const formData = new FormData();
            formData.append("name", `${firstName} ${lastName}`);
            formData.append("email", email);
            formData.append("address", address || ""); // ✅ Ensure address is always sent
            formData.append("bio", bio || ""); // ✅ Ensure bio is always sent
    
            if (image) {
                formData.append("image", image); // ✅ Add only if an image is selected
            }
    
            // ✅ Make API request
            const response = await axios.post("http://127.0.0.1:8000/api/user/update", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
    
            alert("✅ Profile updated successfully!");
            setImagePreview(response.data.user.image);
            setImage(null);
        } catch (err) {
            console.error("Error updating profile:", err);
    
            // ✅ Handle validation errors from Laravel
            if (err.response && err.response.status === 422) {
                const errorMessages = err.response.data.errors;
                let errorText = "❌ Profile update failed:\n";
                for (const key in errorMessages) {
                    errorText += `• ${errorMessages[key][0]}\n`; // Show each error
                }
                alert(errorText);
            } else {
                setError("Failed to update profile. Please try again.");
            }
        }
    };
    

    if (loading) return <p className="text-center mt-10">Loading profile...</p>;

    return (
        <AuthGuard>
            <Head>
                <title>Profile | Gown Rental</title>
                <meta name="description" content="Manage your profile and settings on Gown Rental." />
                <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
            </Head>
            <div className="bg-white min-h-screen flex flex-col">
                <Navbar />

                <div className="flex flex-col md:flex-row container mx-auto px-4 md:px-3 lg:px-10 py-8">
                    <Sidebar />

                    {/* Main Content */}
                    <main className="w-full md:w-3/4 lg:w-4/5 bg-white p-6 md:p-20 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {section === "public" ? "Public Profile" : "Loyalty & Rewards"}
                        </h2>

                        {/* ✅ Show Public Profile Section */}
                        {section === "public" && (
                            <div>
                                <p className="text-gray-700">Manage your personal information.</p>

                                {/* ✅ Profile Picture Section */}
                                <div className="flex flex-col sm:flex-row items-center mt-8 space-y-4 sm:space-y-0 sm:space-x-6">
                                    <Image
                                        className="w-32 h-32 rounded-full ring-2 ring-pink-300 object-cover"
                                        src={imagePreview}
                                        alt="User avatar"
                                        width={128}
                                        height={128}
                                    />
                                    <div className="flex flex-col space-y-3">
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="fileInput" />
                                        <label
                                            htmlFor="fileInput"
                                            className="bg-white text-pink-600 border border-pink-600 px-5 py-2 rounded-lg hover:bg-pink-100 cursor-pointer"
                                        >
                                            Change Picture
                                        </label>

                                        {/* ✅ Save Picture Button */}
                                        <button
                                            onClick={handleUpdateProfile}
                                            className="bg-pink-600 text-lightgray border border-pink-600 px-5 py-2 rounded-lg hover:bg-white hover:text-pink-600"
                                        >
                                            Save Picture
                                        </button>
                                    </div>
                                </div>

                                {/* ✅ Form Section */}
                                <div className="mt-6 space-y-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="w-full">
                                            <label className="block text-sm font-medium text-gray-900">First Name</label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 border rounded-lg bg-pink-50"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                            />
                                        </div>
                                        <div className="w-full">
                                            <label className="block text-sm font-medium text-gray-900">Last Name</label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 border rounded-lg bg-pink-50"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* ✅ Email Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900">Email</label>
                                        <input
                                            type="email"
                                            className="w-full p-2.5 border rounded-lg bg-gray-200 cursor-not-allowed"
                                            value={email}
                                            disabled
                                        />
                                    </div>

                                    {/* ✅ Address Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900">Address</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border rounded-lg bg-pink-50"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Enter your address..."
                                        />
                                    </div>

                                    {/* ✅ Bio Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900">Bio</label>
                                        <textarea
                                            className="w-full p-2.5 border rounded-lg bg-pink-50"
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            rows={3}
                                            placeholder="Write something about yourself..."
                                        />
                                    </div>

                                    {/* ✅ Save Profile Button */}
                                    <button
                                        onClick={handleUpdateProfile}
                                        className="px-5 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-white hover:text-pink-600 border border-pink-600"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
