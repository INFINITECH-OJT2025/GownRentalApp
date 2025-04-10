import { useEffect, useState } from "react";
import axios from "axios";

export default function TawkChat() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return; // No token, don't load chat

        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
            setUser(res.data.user);
        })
        .catch((err) => console.error("Error fetching user", err));
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && !window.Tawk_API) {
            const script = document.createElement("script");
            script.async = true;
            script.src = "https://embed.tawk.to/67d43371da58351909de0b08/1imaehtn1"; // ✅ Your Tawk.to Widget ID
            script.charset = "UTF-8";
            script.setAttribute("crossorigin", "*");

            script.onload = () => {
                console.log("✅ Tawk.to script loaded successfully!");

                if (window.Tawk_API && user) {
                    window.Tawk_API.onLoad = function () {
                        console.log("✅ Tawk.to Loaded!");

                        // ✅ Assign user attributes for chat routing
                        window.Tawk_API.setAttributes({
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            department: user.role === "admin" ? "admin" : "customer"
                        }, function(error) {
                            if (error) console.log("Tawk.to Error:", error);
                        });

                        // ✅ Show all customer messages if admin
                        if (user.role === "admin") {
                            window.Tawk_API.getChats(function(chats) {
                                console.log("✅ All Customer Chats Fetched:", chats);
                            });
                        }

                        // ✅ Ensure widget starts minimized (small bubble)
                        window.Tawk_API.hideWidget();
                    };
                }
            };

            document.body.appendChild(script);
        }
    }, [user]);

    return null;
}
