"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "axios";
import Head from "next/head";
import { toast } from "react-hot-toast";


export default function AdminProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSaving, setIsSaving] = useState(false); 

    // ✅ Profile Fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [bio, setBio] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("/default-profile.png");

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
            const response = await axios.get("http://127.0.0.1:8000/api/user", {
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
                        : `http://127.0.0.1:8000/storage/profile_pictures/${user.image}`
                );
            }

            setLoading(false);
        } catch (err) {
            console.error("Error fetching admin profile:", err);
            setError("Failed to load profile.");
            setLoading(false);
        }
    };

  // ✅ Fetch Payment QR Code
const fetchPaymentQRCode = async () => {
    try {
        const response = await axios.get("http://127.0.0.1:8000/api/admin/qrcode");
        if (response.data.success && response.data.payment_qrcode) {
            setPaymentQRCode(`${response.data.payment_qrcode}`);
            setAdminEmail(response.data.email);
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
        
                if (image) {
                    formData.append("image", image);
                }
        
                if (paymentQRCodeFile) {
                    formData.append("payment_qrcode", paymentQRCodeFile);
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
        
                if (response.data.user.payment_qrcode) {
                    setPaymentQRCode(`${response.data.user.payment_qrcode}`);
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

            <div className="flex h-screen bg-white dark:bg-[#0F172A]">
                {/* ✅ Sidebar */}
                <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                {/* ✅ Main Content */}
                <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
                    {/* ✅ Header */}
                    <header className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
                        <h1 className="text-lg font-bold dark:text-white mr-auto">Admin Profile</h1>
                    </header>

                    {/* ✅ Profile Management UI */}
                    <main className="p-6 mt-16">
                        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Admin Profile Management</h2>

                            {/* ✅ Profile Picture Upload */}
                            <div className="flex flex-col items-center mb-6">
                            {imagePreview && imagePreview !== "/default-profile.png" ? (
                                <Image
                                    className="w-32 h-32 rounded-full ring-2 ring-pink-300 object-cover"
                                    src={imagePreview}
                                    alt="Profile Picture"
                                    width={128}
                                    height={128}
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

                               
                            {/* ✅ Payment QR Code Section */}
                            {paymentQRCode && (
                                <div className="mt-6 text-center">
                                      <div className="mt-6 text-center">
                                <label className="block text-sm font-medium text-gray-900">Payment QR Code</label>
                                {paymentQRCode && <Image src={paymentQRCode} alt="Payment QR Code" width={200} height={200} className="mx-auto my-4" />}
                                <input type="file" accept="image/*" onChange={handleQRCodeChange} className="w-full p-2.5 border rounded-lg bg-gray-50" />
                            </div>


                                </div>
                            )}
                           <button 
                                onClick={handleUpdateProfile} 
                                disabled={isSaving} // ✅ Disable while saving
                                className={`w-full px-5 py-3 rounded-lg border border-pink-600 transition-all flex items-center justify-center space-x-2 ${
                                    isSaving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-pink-600 text-black hover:bg-white hover:text-pink-600"
                                }`}
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-pink-600" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save Profile</span>
                                )}
                            </button>

                            </div>

                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
