"use client";
import { useState } from "react";

export default function FooterNew() {
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <>
      <footer className="bg-pink-600 text-white text-center py-6 mt-10">
        <p>&copy; {new Date().getFullYear()} Gown Rental System. All Rights Reserved.</p>
      </footer>
    </>
  );
}
