import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminPaymentDetails() {
    const [adminQRCode, setAdminQRCode] = useState(null);
    const [adminEmail, setAdminEmail] = useState(null);
    const [adminContact, setAdminContact] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/qrcode`);
                if (response.data.success) {
                    setAdminQRCode(response.data.payment_qrcode);
                    setAdminEmail(response.data.email || "admin@gownrental.com"); 
                    setAdminContact(response.data.contact_number || "N/A");
                    
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
            <div className="w-64 h-96 flex items-center justify-center bg-white rounded-lg shadow-lg p-4 border-2 border-gray-400 mt-4">
                {loading ? (
                    <p className="text-gray-500">Loading QR Code...</p>
                ) : adminQRCode ? (
                    <img src={adminQRCode} alt="Admin GCash QR Code" className="w-full h-full object-cover rounded-lg" />
                ) : (
                    <p className="text-gray-500">QR Code not available</p>
                )}
            </div>


            {/* ✅ GCash Details */}
            <div className="mt-4 text-lg text-gray-800 text-center">
            <p><strong>Payment Number:</strong> <span className="text-pink-600">{adminContact}</span></p>
            <p><strong>Email:</strong> <span className="text-pink-600">{adminEmail}</span></p>
        </div>
        </div>
    );
}
