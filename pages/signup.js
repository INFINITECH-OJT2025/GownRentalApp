"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Next.js 13+ navigation
import Image from "next/image";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import GuestNavbar from "../components/GuestNavbar";
import Head from "next/head";

let emailTimeout;
let contactTimeout;

export default function SignupPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        contact_number: "",
        termsAccepted: false
    });
    
    const [showTermsModal, setShowTermsModal] = useState(false);
    
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    
    
    
    const validateField = (name, value) => {
        const newErrors = { ...errors };
    
        switch (name) {
            case "name":
                if (!value.trim()) newErrors.name = "Full name is required.";
                else delete newErrors.name;
                break;
            case "email":
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) newErrors.email = "Email is required.";
                else if (!emailRegex.test(value)) newErrors.email = "Invalid email format.";
                else delete newErrors.email;
                break;
            case "contact_number":
                if (!value) newErrors.contact_number = "Contact number is required.";
                else if (!/^09\d{9}$/.test(value))
                    newErrors.contact_number = "Contact number must start with 09 and contain exactly 11 digits.";
                else delete newErrors.contact_number;
                break;
            case "password":
                if (!value) newErrors.password = "Password is required.";
                else if (value.length < 6) newErrors.password = "Password must be at least 6 characters.";
                else delete newErrors.password;
                break;
            case "password_confirmation":
                if (!value) newErrors.password_confirmation = "Please confirm your password.";
                else if (value !== formData.password) newErrors.password_confirmation = "Passwords do not match.";
                else delete newErrors.password_confirmation;
                break;
        }
    
        setErrors(newErrors);
    };
    

    const handleChange = async (e) => {
        const { name, value } = e.target;

         // ✅ Restrict contact_number to max 11 digits of only numbers
            if (name === "contact_number" && !/^\d{0,11}$/.test(value)) {
                return; // don't update state or validate
            }
    
            setFormData((prev) => ({ ...prev, [name]: value }));
            validateField(name, value);

        // Realtime uniqueness check for email
        if (name === "email") {
            clearTimeout(emailTimeout);
            emailTimeout = setTimeout(async () => {
                if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    try {
                        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check-email`, {
                            email: value,
                        });
                        if (res.data.exists) {
                            setErrors((prev) => ({
                                ...prev,
                                email: "This email is already in use.",
                            }));
                        } else {
                            setErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.email;
                                return newErrors;
                            });
                        }
                    } catch (err) {
                        console.error("Email check error:", err);
                    }
                }
            }, 500);
        }
       
        if (name === "contact_number") {
            clearTimeout(contactTimeout);
            contactTimeout = setTimeout(async () => {
              if (/^09\d{9}$/.test(value)) {
                try {
                  const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/check-contact`, {
                    contact_number: value,
                  });
                  if (res.data.exists) {
                    setErrors((prev) => ({
                      ...prev,
                      contact_number: "This contact number is already in use.",
                    }));
                  } else {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.contact_number;
                      return newErrors;
                    });
                  }
                } catch (err) {
                  console.error("Contact number check error:", err);
                }
              }
            }, 500);
          }
    };
    

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        // Collect validation errors locally
        const newErrors = {};
        Object.entries(formData).forEach(([key, value]) => {
            const tempErrors = { ...newErrors };
            switch (key) {
                case "name":
                    if (!value.trim()) tempErrors.name = "Full name is required.";
                    break;
                case "email":
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!value) tempErrors.email = "Email is required.";
                    else if (!emailRegex.test(value)) tempErrors.email = "Invalid email format.";
                    break;
                 case "contact_number":
                    if (!value) tempErrors.contact_number = "Contact number is required.";
                    else if (!/^09\d{9}$/.test(value))
                    tempErrors.contact_number = "Must start with 09 and be 11 digits.";
                    break;  
                case "password":
                    if (!value) tempErrors.password = "Password is required.";
                    else if (value.length < 6) tempErrors.password = "Password must be at least 6 characters.";
                    break;
                case "password_confirmation":
                    if (!value) tempErrors.password_confirmation = "Please confirm your password.";
                    else if (value !== formData.password) tempErrors.password_confirmation = "Passwords do not match.";
                    break;
            }
            Object.assign(newErrors, tempErrors);
        });
    
        setErrors(newErrors); // apply to UI

        if (!formData.termsAccepted) {
            toast.error("Please accept the Terms and Conditions.", {
                duration: 3000,
                position: "top-right",
            });
            setLoading(false);
            return;
        }
        
    
        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fix the errors before submitting.", {
                duration: 3000,
                position: "top-right",
            });
            setLoading(false);
            return;
        }
    
        try {
            console.log("🚀 Submitting formData:", formData);
        
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/register`, formData, {
                headers: {
                    "Content-Type": "application/json", // ✅ Explicitly set
                },
            });
        
            // ✅ This runs AFTER axios returns successfully
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user)); // Should include contact_number
        
            toast.success("You have been successfully signed up! Now you may log in.", {
                duration: 3000,
                position: "top-right",
            });
        
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err) {
            const res = err.response?.data;
        
            if (res?.errors) {
                const newServerErrors = {};
                for (const key in res.errors) {
                    if (res.errors[key]?.[0]) {
                        newServerErrors[key] = res.errors[key][0];
                    }
                }
                setErrors((prev) => ({ ...prev, ...newServerErrors }));
            } else if (res?.message) {
                toast.error(res.message);
            } else {
                toast.error("Something went wrong.", {
                    duration: 3000,
                    position: "top-right",
                });
            }
        } finally {
            setLoading(false);
        }
    }        
    
    const contactIsValid =
    formData.contact_number &&
    /^09\d{9}$/.test(formData.contact_number) &&
    !errors.contact_number &&
    !Object.values(errors).includes("This contact number is already in use.");

    return (
        <>
        <Head>
          <title>Sign Up Now | Gown Rental</title>
          <meta name="description" content="Explore beautiful gowns for rent on Gown Rental." />
          <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
        </Head>
        <div className="min-h-screen pt-[100px] flex items-center justify-center bg-gradient-to-r from-pink-200 to-pink-400 px-6">
              <GuestNavbar />
              <div className="bg-transparent p-12 w-full max-w-lg flex flex-col items-center">

                <div className="bg-white p-8 rounded-2xl shadow-lg border border-pink-300 w-full">
                    <h2 className="text-3xl font-bold text-center text-pink-600 mb-4">Create an Account</h2>
                    <p className="text-gray-600 text-center mb-6">Join us and rent the gown of your dreams!</p>

                    <form className="w-full space-y-4" onSubmit={handleSignup}>
                        <div>
                            <label className="block text-pink-600 text-sm font-semibold">Full Name</label>
                            <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                            placeholder="Enter your full name"
                            required
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            {!errors.name && formData.name && (
                            <p className="text-green-600 text-sm mt-1">Looks good!</p>
                            )}

                        </div>
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
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        {formData.email && !errors.email && (
                            <p className="text-green-600 text-sm mt-1">Valid email!</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-pink-600 text-sm font-semibold">Contact Number</label>
                        <input
                        type="text"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange} // ✅ This will re-enable the uniqueness check
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        placeholder="e.g. 09123456789"
                        required
                        />


                        {/* ✅ Inside your render form */}
                        {errors.contact_number && (
                            <p className="text-red-500 text-sm mt-1">{errors.contact_number}</p>
                        )}
                        {contactIsValid && (
                            <p className="text-green-600 text-sm mt-1">Contact number is valid and available!</p>
                        )}


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
                            placeholder="Create a password"
                            required
                            />
                            <span
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                            >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </span>
                        </div>
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                        {!errors.password && formData.password && (
                            <p className="text-green-600 text-sm mt-1">Strong enough!</p>
                        )}
                        </div>

                        <div>
                            <label className="block text-pink-600 text-sm font-semibold">Confirm Password</label>
                            <div className="relative">
                                <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="password_confirmation"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                placeholder="Confirm your password"
                                required
                                />
                                <span
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                 className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                                >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </span>
                            </div>
                            {errors.password_confirmation && (
                                <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>
                            )}
                            {!errors.password_confirmation &&
                                formData.password_confirmation &&
                                formData.password_confirmation === formData.password && (
                                <p className="text-green-600 text-sm mt-1">Passwords match!</p>
                            )}
                            </div>

                        <button type="submit"
                            className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition duration-300"
                            disabled={loading}>
                            {loading ? "Signing up..." : "Sign Up"}
                        </button>
                        <div className="flex flex-col items-center justify-center text-sm text-gray-600 mt-3">
                    <label className="flex items-center space-x-2">
                        <input
                        type="checkbox"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, termsAccepted: e.target.checked }))
                        }
                        className="mt-0.5"
                        />
                        <span>
                        I agree to the{" "}
                        <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-pink-500 hover:underline"
                        >
                            Terms and Conditions
                        </button>
                        </span>
                    </label>
                    </div>

                      
                    </form>

                    <p className="text-sm text-center text-gray-600 mt-4">
                        Already have an account? <a href="/login" className="text-pink-500 hover:underline">Login</a>
                    </p>

                    {showTermsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-2xl p-6 rounded-xl shadow-lg relative">
                    <h2 className="text-xl font-bold mb-4 text-pink-600">Terms and Conditions</h2>
                    <div className="h-60 overflow-y-auto text-sm text-gray-700 space-y-2 pr-2">
                        <p>Welcome to GownRental!</p>
                        <p>By creating an account, you agree to abide by our terms and conditions, which include:</p>
                        <ul className="list-disc pl-5 space-y-1">
                        <li>You are responsible for maintaining the security of your account.</li>
                        <li>Do not share your login credentials with others.</li>
                        <li>Gowns must be returned in good condition and on time.</li>
                        <li>Fees may apply for damages or late returns.</li>
                        <li>Your data is handled securely in accordance with our privacy policy.</li>
                        </ul>
                        <p>These terms may change over time. Please review them periodically.</p>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                        onClick={() => setShowTermsModal(false)}
                        className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition"
                        >
                        Close
                        </button>
                    </div>
                    </div>
                </div>
                )}

                </div>
            </div>
        </div>
        </>
    );
}
