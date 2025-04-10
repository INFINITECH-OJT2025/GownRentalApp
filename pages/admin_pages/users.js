"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "axios";
import Head from "next/head";
import { toast } from "react-hot-toast";
import Header from "../../components/Header";

export default function AdminProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSaving, setIsSaving] = useState(false); 

    // ✅ Profile Fields
     const [darkMode, setDarkMode] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [bio, setBio] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("/images/default-profile.svg");
    const [contactNumber, setContactNumber] = useState("");

    // ✅ Payment QR Code
    const [paymentQRCode, setPaymentQRCode] = useState(null);
    const [paymentQRCodeFile, setPaymentQRCodeFile] = useState(null); // Stores new file
    const [adminEmail, setAdminEmail] = useState("");

    useEffect(() => {
        fetchAdminProfile();
        fetchPaymentQRCode(); // ✅ Fetch QR code when component mounts
    }, []);

    // ✅ Fetch Admin Profile from Backend
    const fetchAdminProfile = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const user = response.data.user;
            setFirstName(user.name.split(" ")[0] || "");
            setLastName(user.name.split(" ")[1] || "");
            setEmail(user.email);
            setAddress(user.address || "");
            setBio(user.bio || "");

            if (user.image) {
                setImagePreview(
                    user.image.startsWith("http")
                        ? user.image
                        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/profile_pictures/${user.image}`
                );
            }

            setLoading(false);
        } catch (err) {
            console.error("Error fetching admin profile:", err);
            setError("Failed to load profile.");
            setLoading(false);
        }
    };

    const fetchPaymentQRCode = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/qrcode`);
            if (response.data.success && response.data.payment_qrcode) {
                setPaymentQRCode(`${response.data.payment_qrcode}`);
                setAdminEmail(response.data.email);
                setContactNumber(response.data.contact_number || ""); 
            }
        } catch (err) {
            console.error("Error fetching payment QR code:", err);
        }
    };
    

// ✅ Handle Profile Picture Preview with Validation (File Type & Size)
const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
        const maxSize = 2 * 1024 * 1024; // 2MB limit

        if (!allowedTypes.includes(file.type)) {
            alert("⚠ Invalid file type! Please upload a PNG, JPG, or JPEG image.");
            e.target.value = ""; // Clear file input
            return;
        }

        if (file.size > maxSize) {
            alert("⚠ File is too large! Maximum allowed size is 2MB.");
            e.target.value = ""; // Clear file input
            return;
        }

        setImage(file);
        setImagePreview(URL.createObjectURL(file)); // Preview the valid image
    }
};


        // ✅ Handle Payment QR Code Preview with Validation (File Type & Size)
        const handleQRCodeChange = (e) => {
            const file = e.target.files[0];

            if (file) {
                const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
                const maxSize = 2 * 1024 * 1024; // 2MB limit

                if (!allowedTypes.includes(file.type)) {
                    alert("⚠ Invalid file type! Please upload a PNG, JPG, or JPEG image.");
                    e.target.value = ""; // Clear file input
                    return;
                }

                if (file.size > maxSize) {
                    alert("⚠ File is too large! Maximum allowed size is 2MB.");
                    e.target.value = ""; // Clear file input
                    return;
                }

                setPaymentQRCodeFile(file);
                setPaymentQRCode(URL.createObjectURL(file)); // Preview image
            }
        };


        const handleUpdateProfile = async () => {
            setError(null);
            setIsSaving(true); // ✅ Start loading state
        
            const token = localStorage.getItem("token");
            if (!token) return;
        
            if (!firstName || !lastName) {
                toast.error("Please fill in First Name and Last Name.", { position: "top-right" });
                setIsSaving(false); // ✅ Stop loading
                return;
            }
        
            try {
                const formData = new FormData();
                formData.append("name", `${firstName} ${lastName}`);
                formData.append("email", email);
                formData.append("address", address);
                formData.append("bio", bio);
                formData.append("contact_number", contactNumber);

        
                if (image) {
                    formData.append("image", image);
                }
        
                if (paymentQRCodeFile) {
                    formData.append("payment_qrcode", paymentQRCodeFile);
                }
        
                const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/user/update`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
        
                toast.success("Profile updated successfully!", { position: "top-right" });
        
                if (response.data.user.image) {
                    setImagePreview(response.data.user.image);
                }
        
                if (response.data.user.payment_qrcode) {
                    setPaymentQRCode(`${response.data.user.payment_qrcode}`);
                }

                if (response.data.user.contact_number) {
                    setContactNumber(response.data.user.contact_number);
                }
                
            } catch (err) {
                if (err.response && err.response.status === 422) {
                    const errors = err.response.data.errors;
                    let errorMessage = "Failed to update profile:\n";
                    Object.values(errors).forEach((error) => {
                        errorMessage += `• ${error[0]}\n`;
                    });
                    toast.error(errorMessage, { position: "top-right" });
                } else {
                    console.error("Error updating profile:", err);
                    toast.error("Failed to update profile. Please try again.", { position: "top-right" });
                }
            } finally {
                setIsSaving(false); 
            }
        };
        
    if (loading) return <p className="text-center mt-10">Loading profile...</p>;

    return (
        <>
            <Head>
                <title>Admin Profile | Gown Rental</title>
                <meta name="description" content="Manage your profile and settings on Gown Rental." />
                <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
            </Head>

            <div className={`${darkMode ? "dark" : ""} flex h-screen bg-white dark:bg-[#0F172A]`}>
                {/* ✅ Sidebar */}
                {/* Floating burger (mobile only) */}
                               {!isSidebarOpen && (
                                   <button
                                       onClick={() => setIsSidebarOpen(true)}
                                       className={`fixed top-2 left-4 z-50 bg-pink-600 text-white p-3 rounded-full shadow-lg ${
                                       isSidebarOpen ? "hidden" : "block"
                                       } md:hidden`}
                                   >
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                               </svg>
                           </button>
                           )}
               
                           {/* ✅ Dark overlay for mobile when sidebar is open */}
                           {isSidebarOpen && (
                           <div
                               className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
                               onClick={() => setIsSidebarOpen(false)}
                           />
                           )}
               
               
                               <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
               
                       <div className={`flex-1 transition-all duration-300 md:${isSidebarOpen ? "ml-60" : "ml-16"} min-w-0`}>
                    {/* ✅ Header */}
                    <Header isSidebarOpen={isSidebarOpen} />

                    {/* ✅ Profile Management UI */}
                    <main className="p-6 mt-16">
                        
                    <div className="bg-white rounded-lg w-full max-w-6xl mx-auto p-8 mt-0" style={{ boxShadow: "0px -4px 6px rgba(0, 0, 0, 0.1)" }}>

                        {/* Left-Aligned Title */}
                       

                        <div className="flex flex-col lg:flex-row gap-10">
                            {/* Left: Profile Image Upload */}
                            <div className="flex flex-col items-center w-full lg:w-1/3 border-r border-gray-300 pr-6">
                        <h2 className="text-3xl font-bold text-gray-900">Admin Profile</h2>

                        {/* Apply margin-top here */}
                        <div className="mt-10">
                            {imagePreview && imagePreview !== "/images/default-profile.svg" ? (
                                <Image
                                    className="w-40 h-40 rounded-full ring-4 ring-pink-300 object-cover"
                                    src={imagePreview}
                                    alt="Profile Picture"
                                    width={160}
                                    height={160}
                                />
                            ) : (
                                <div className="w-40 h-40 flex items-center justify-center rounded-full ring-4 ring-pink-300 bg-pink-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-pink-600">
                                        <path d="..." />
                                    </svg>
                                </div>
                            )}
                        </div>

                        <label htmlFor="fileInput" className="mt-4 bg-white text-pink-600 border border-pink-600 px-4 py-2 rounded-lg hover:bg-pink-100 cursor-pointer">
                            Change Image
                        </label>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="fileInput" />
                    </div>

                    <div className="w-full lg:w-2/3 space-y-4">
                    <div className="flex gap-4">
                        <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-900">First Name</label>
                        <input type="text" className="w-full p-2.5 border rounded-lg bg-pink-100" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-900">Last Name</label>
                        <input type="text" className="w-full p-2.5 border rounded-lg bg-pink-100" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900">Admin Email</label>
                        <input type="text" className="w-full p-2.5 border rounded-lg bg-gray-100 cursor-not-allowed" value={adminEmail} disabled />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900">Payment Number</label>
                        <input
                        type="text"
                        maxLength={11}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className="w-full p-2.5 border rounded-lg bg-pink-100"
                        value={contactNumber}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                            setContactNumber(value);
                            }
                        }}
                        />
                    </div>

                    {/* ✅ Centered QR Section */}
                    <div className="flex flex-col items-center">
                        <label className="block text-sm font-medium text-gray-900 mb-2">Payment QR Code</label>
                        {paymentQRCode && (
                        <Image
                            src={paymentQRCode}
                            alt="Payment QR Code"
                            width={220}
                            height={220}
                            className="mb-4 rounded-lg shadow"
                        />
                        )}
                        <input type="file" accept="image/*" onChange={handleQRCodeChange} className="w-[220px] p-2.5 border rounded-lg bg-gray-50" />
                    </div>

                    {/* ✅ Right-aligned Save Button */}
                    <div className="flex justify-center mt-6">
                    <button
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                        className={`w-full px-6 py-3 rounded-lg border border-pink-600 transition-all flex items-center justify-center space-x-2 ${
                            isSaving
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-pink-600 text-white hover:text-pink-600 hover:bg-gray-300"
                        }`}
                    >
                        {isSaving ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-pink-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Saving...</span>
                        </>
                        ) : (
                        <span>Save Profile</span>
                        )}
                    </button>
                    </div>

                    </div>

                          
                        </div>

                        {/* Save Button */}
                       
                    </div>
                </main>

                </div>
            </div>
        </>
    );
}
