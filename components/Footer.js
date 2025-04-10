"use client";
import { useState } from "react";

export default function Footer() {
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <>
      <footer className="bg-pink-600 text-white text-center py-6 mt-10">
        <p>&copy; {new Date().getFullYear()} Gown Rental System. All Rights Reserved.</p>
        <button
          onClick={() => setShowTermsModal(true)}
          className="mt-2 text-sm underline hover:text-pink-200"
        >
          Terms and Conditions
        </button>
      </footer>

      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl p-6 rounded-xl shadow-lg relative">
            <h2 className="text-xl font-bold mb-4 text-pink-600">Terms and Conditions</h2>
            <div className="h-60 overflow-y-auto text-sm text-gray-700 space-y-2 pr-2">
              <p>Welcome to GownRental!</p>
              <p>By using our services, you agree to the following:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Keep your account secure and personal.</li>
                <li>Return gowns on time and in good condition.</li>
                <li>Fees may apply for late or damaged returns.</li>
                <li>We protect your data under our privacy policy.</li>
                <li>Terms may change—check back periodically.</li>
              </ul>
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
    </>
  );
}
