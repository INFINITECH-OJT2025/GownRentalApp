"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Head from "next/head";
import Image from "next/image";
import AuthGuard from "../components/AuthGuard";
import Navbar from "../components/Navbar";
import Sidebar from "../components/sidebar";
import axios from "axios";
import DataTable from "react-data-table-component"; // ✅ Import react-data-table-component
import { toast } from "react-hot-toast";

export default function ProfilePage() {
    const [loyaltyHistory, setLoyaltyHistory] = useState([]);
    const [filterText, setFilterText] = useState(""); // ✅ Defined filterText
    const searchParams = useSearchParams();
    const router = useRouter();
    const section = searchParams.get("section") || "public";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [bio, setBio] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("/default-profile.png");
    const [totalBookings, setTotalBookings] = useState(0);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [saving, setSaving] = useState(false); // ✅ New state for saving

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const [userResponse, historyResponse] = await Promise.all([
                    axios.get("http://127.0.0.1:8000/api/user", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get("http://127.0.0.1:8000/api/user/loyalty-history", {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                ]);

                const user = userResponse.data.user;
                setTotalBookings(user.total_bookings || 0);
                setLoyaltyPoints(user.loyalty_points || 0);
                setFirstName(user.name.split(" ")[0]);
                setLastName(user.name.split(" ")[1] || "");
                setEmail(user.email);
                setAddress(user.address || ""); 
                setBio(user.bio || "");

                if (user.image) {
                    setImagePreview(user.image.startsWith("http") 
                        ? user.image 
                        : `http://127.0.0.1:8000/storage/profile_pictures/${user.image}`);
                } else {
                    setImagePreview("/default-profile.png");
                }

                setLoyaltyHistory(historyResponse.data.loyalty_history);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load user data.");
                setLoading(false);
            }
        };

        fetchUserData();
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
    
        if (!firstName || !lastName || !email) {
            alert("⚠ Please fill in all required fields (First Name, Last Name, and Email).");
            return;
        }
    
        setSaving(true); // ✅ Start loading state
    
        try {
            const formData = new FormData();
            formData.append("name", `${firstName} ${lastName}`);
            formData.append("email", email);
            formData.append("address", address || "");
            formData.append("bio", bio || "");
    
            if (image) {
                const allowedExtensions = ["jpg", "jpeg", "png"];
                const fileExtension = image.name.split(".").pop().toLowerCase();
    
                if (!allowedExtensions.includes(fileExtension)) {
                    alert("⚠ Invalid file type! Only JPG, JPEG, and PNG images are allowed.");
                    setSaving(false);
                    return;
                }
    
                if (image.size > 2 * 1024 * 1024) {
                    alert("⚠ File is too large! Please upload an image smaller than 2MB.");
                    setSaving(false);
                    return;
                }
    
                formData.append("image", image);
            }
    
            const response = await axios.post("http://127.0.0.1:8000/api/user/update", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
    
            toast.success("Profile updated successfully!", { position: "top-right" });
    
            if (response.data.user.image) {
                setImagePreview(response.data.user.image);
            }
    
        } catch (err) {
            console.error("❌ Error updating profile:", err);
    
            if (err.response) {
                console.error("⚠ Backend Response:", err.response.data);
    
                if (err.response.status === 422) {
                    const errorMessages = err.response.data.errors;
                    let errorText = "❌ Profile update failed:\n";
                    for (const key in errorMessages) {
                        errorText += `• ${errorMessages[key][0]}\n`;
                    }
                    toast.error(errorText, { position: "top-right" });
                } else {
                    toast.error(`Server Error: ${err.response.data.message || "Unexpected error occurred."}`, { position: "top-right" });
                }
            } else {
                toast.error("Network Error! Please check your internet connection.", { position: "top-right" });
            }
        } finally {
            setSaving(false); // ✅ Stop loading state
        }
    };
    
    

    const columns = [
        {
            name: "Date",
            selector: (row) => new Date(row.created_at).toLocaleDateString(),
            sortable: true,
        },
        {
            name: "Product",
            selector: (row) => row.product?.name || "Unknown Product",
            sortable: true,
        },
        {
            name: "Loyalty Points Used",
            selector: (row) => row.voucher_fee,
            sortable: true,
            cell: (row) => <span className="text-green-600 font-bold">{row.voucher_fee} Points</span>,
        },
    ];

    const filteredData = loyaltyHistory.filter(
        (row) =>
            (row.product?.name || "Unknown Product").toLowerCase().includes(filterText.toLowerCase()) ||
            new Date(row.created_at).toLocaleDateString().includes(filterText) ||
            row.voucher_fee.toString().includes(filterText)
    );

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

                    <main className="w-full md:w-3/4 lg:w-4/5 bg-white p-6 md:p-20 rounded-lg shadow-md">

                        {/* ✅ Section Switch Buttons (Only Visible on Mobile & Slightly Lower) */}
                    <div className="md:hidden flex flex-col items-start gap-2 mt-8">
                        <button
                            onClick={() => router.push("?section=public")}
                            className={`px-4 py-2 rounded-lg w-full text-left ${
                                section === "public" ? "bg-pink-600 text-white" : "bg-gray-300 text-gray-700"
                            }`}
                        >
                            Public Profile
                        </button>

                        <button
                            onClick={() => router.push("?section=loyalty")}
                            className={`px-4 py-2 rounded-lg w-full text-left ${
                                section === "loyalty" ? "bg-pink-600 text-white" : "bg-gray-300 text-gray-700"
                            }`}
                        >
                            Loyalty & Rewards
                        </button>
                    </div>
                    
                        {section === "loyalty" && (
                            <div className="p-6 bg-white shadow-lg rounded-lg">
                                <h3 className="text-2xl font-bold text-pink-900">Loyalty & Rewards</h3>
                                <p className="text-gray-700 mt-2">Earn 100 loyalty points for every 3 approved bookings!</p>

                                <div className="mt-4 p-4 border rounded-lg bg-pink-100">
                                    <h4 className="text-xl font-semibold text-pink-900">Total Approved Bookings</h4>
                                    <p className="text-3xl font-bold text-pink-600">{totalBookings} Bookings</p>
                                </div>

                                <div className="mt-4 p-4 border rounded-lg bg-green-100">
                                    <h4 className="text-xl font-semibold text-green-900">Your Loyalty Points</h4>
                                    <p className="text-3xl font-bold text-green-600">{loyaltyPoints} Points</p>
                                </div>

                                <h3 className="mt-5 text-2xl font-bold text-pink-900">Loyalty & Rewards History</h3>

                                <p className="text-gray-600 mt-2">Keep booking to unlock more rewards!</p>

                                <input
                                    type="text"
                                    className="w-full p-2.5 border rounded-lg bg-pink-50 my-4"
                                    placeholder="🔍 Search rewards history..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                />

                                <DataTable
                                    columns={columns}
                                    data={filteredData}
                                    pagination
                                    highlightOnHover
                                    striped
                                    responsive
                                    noDataComponent="No loyalty rewards have been redeemed yet."
                                />
                            </div>
                        )}

                         {/* ✅ Show Public Profile Section */}
                         {section === "public" && (
                            <div>
                              <p className="text-gray-700 mt-6 text-center">Manage your personal information.</p>

                               {/* ✅ Profile Picture Section */}
                               <div className="flex flex-col sm:flex-row items-center mt-8 space-y-4 sm:space-y-0 sm:space-x-6">
                                {imagePreview && imagePreview !== "/default-profile.png" ? (
                                    <Image
                                        className="w-32 h-32 rounded-full ring-2 ring-pink-300 object-cover"
                                        src={imagePreview}
                                        alt="User avatar"
                                        width={128}
                                        height={128}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div className="w-32 h-32 flex items-center justify-center rounded-full ring-2 ring-pink-300 bg-pink-100">
                                       <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-16 h-16 text-pink-600"
                                    >
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4-6c0 2.21-1.79 4-4 4s-4-1.79-4-4h2c0 1.1.9 2 2 2s2-.9 2-2h2zm-6-4c-.83 0-1.5-.67-1.5-1.5S9.17 7 10 7s1.5.67 1.5 1.5S10.83 10 10 10zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 7 14 7s1.5.67 1.5 1.5S14.83 10 14 10z" />
                                    </svg>

                                    </div>
                                )}

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
                                    className={`px-5 py-2 rounded-lg border border-pink-600 transition ${
                                        saving ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-pink-600 text-white hover:bg-pink hover:text-pink-600"
                                    }`}
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Picture"}
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
                                    className={`px-5 py-2.5 rounded-lg border border-pink-600 transition ${
                                        saving ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-pink-600 text-white hover:bg-pink hover:text-pink-600"
                                    }`}
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save"}
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
