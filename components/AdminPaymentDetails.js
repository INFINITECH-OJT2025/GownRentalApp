import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminPaymentDetails() {
    const [adminQRCode, setAdminQRCode] = useState(null);
    const [adminEmail, setAdminEmail] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:8000/api/admin/qrcode");
                if (response.data.success) {
                    setAdminQRCode(response.data.payment_qrcode);
                    setAdminEmail(response.data.email || "admin@gownrental.com"); // ✅ Default email fallback
                }
            } catch (error) {
                console.error("❌ Error fetching admin QR Code:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    return (
        <div className="flex flex-col items-center mt-4">
            <h2 className="text-xl font-semibold text-gray-800">GCash Payment Details</h2>

            {/* ✅ GCash QR Code */}
            <div className="w-48 h-48 flex items-center justify-center bg-white rounded-lg shadow-md p-2 border border-gray-300 mt-4">
                {loading ? (
                    <p className="text-gray-500">Loading QR Code...</p>
                ) : adminQRCode ? (
                    <img src={adminQRCode} alt="Admin GCash QR Code" className="w-full h-full object-contain rounded-md" />
                ) : (
                    <p className="text-gray-500">QR Code not available</p>
                )}
            </div>

            {/* ✅ GCash Details */}
            <div className="mt-4 text-lg text-gray-800 text-center">
            <p><strong>GCash Number:</strong> <span className="text-pink-600">09854031332</span></p>
                <p><strong>Email:</strong> <span className="text-pink-600">{adminEmail}</span></p>
                <p><strong>Contact:</strong> <span className="text-pink-600">+63 917 123 4567</span></p>
            </div>
        </div>
    );
}
