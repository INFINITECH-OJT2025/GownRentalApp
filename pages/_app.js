import axios from "axios";
import '../styles/global.css';
import { BookProvider } from "../context/BookContext";
import { WishlistProvider } from "../context/WishlistContext";
import { FavoritesProvider } from "../context/FavoritesContext";
// import { ChatProvider } from "../context/ChatContext";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import ChatWidgetNew from "../components/ChatWidgetNew";
import Pusher from 'pusher-js';

import {
    getCurrentUser,
    getAdmin,
    getCustomersLoggedInToday // ✅ New API call
} from "../utils/api";

// ✅ Axios global error handling
axios.interceptors.response.use(
    response => response,
    error => {
        const { response } = error;

        if (!response) {
            alert("⚠ Network Error! Please check your connection.");
        } else if (response.status === 401) {
            alert("⚠ Unauthorized! Please log in again.");
            localStorage.removeItem("token");
            window.location.href = "/login";
        } else if (response.status === 422) {
            alert("⚠ Validation Error. Please check your input.");
        } else {
            alert(`⚠ Error: ${response.data?.message || "Something went wrong."}`);
        }

        return Promise.reject(error);
    }
);

export default function MyApp({ Component, pageProps }) {
    const [user, setUser] = useState(null);
    const [customersToday, setCustomersToday] = useState([]);
    const [showChat, setShowChat] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);


    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const fetchUsers = async () => {
            try {
                const currentUser = await getCurrentUser(token);
                console.log("✅ Logged-in user:", currentUser);

                if (!currentUser?.role) {
                    console.warn("⚠ User role is missing.");
                    return;
                }

                setUser(currentUser);

                if (currentUser.role === "admin") {
                    const customers = await getCustomersLoggedInToday(token);
                    console.log("📥 Customers logged in today:", customers);
                    setCustomersToday(customers);
                } else if (currentUser.role === "customer") {
                    const admin = await getAdmin();
                    console.log("📥 Admin for customer:", admin);
                    setCustomersToday([admin]); // Use admin as chat target
                }

            } catch (err) {
                console.error("❌ Failed to load chat participants:", err);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        if (!user) return;
      
        const pusher = new Pusher('0a411d03b9315833003e', {
          cluster: 'ap1',
          authEndpoint: 'http://localhost:8000/broadcasting/auth', // Laravel route
          auth: {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          },
        });
      
        const channel = pusher.subscribe(`private-chat.${user.id}`);
        channel.bind('App\\Events\\NewChatNotification', (data) => {
          console.log("🔔 Real-time message received:", data.message);
          setHasNewMessage(true); // Trigger red dot badge or any UI update
        });
      
        return () => {
          channel.unbind_all();
          channel.unsubscribe();
        };
      }, [user]);

    const [hasNewMessage, setHasNewMessage] = useState(false);

    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) return;
    
      const fetchUsersAndUnread = async () => {
        try {
          const currentUser = await getCurrentUser(token);
          setUser(currentUser);
    
          if (currentUser.role === "admin") {
            const customers = await getCustomersLoggedInToday(token);
            setCustomersToday(customers);
    
            // 🔔 Unread check
            const res = await fetch("http://localhost:8000/api/customers-with-unread", {
              headers: { Authorization: `Bearer ${token}` },
            });
    
            if (res.ok) {
              const data = await res.json();
              if (data?.customers?.length > 0) setHasNewMessage(true);
            } else {
              console.warn("⚠️ Unread customers check failed", res.status);
            }
    
          } else if (currentUser.role === "customer") {
            const admin = await getAdmin();
            setCustomersToday([admin]);
    
            const res = await fetch("http://localhost:8000/api/admins-with-unread", {
              headers: { Authorization: `Bearer ${token}` },
            });
    
            if (res.ok) {
              const data = await res.json();
              if (data?.admins?.length > 0) setHasNewMessage(true);
            } else {
              console.warn("⚠️ Unread admins check failed", res.status);
            }
          }
    
        } catch (err) {
          console.error("❌ Failed to fetch chat-related data:", err);
          // No need to throw - keep UI stable
        }
      };
    
      fetchUsersAndUnread();
    }, []);
    
    return (
        <BookProvider>
            <WishlistProvider>
                <FavoritesProvider>
                 
                        <Toaster />
                        <Component {...pageProps} />

                        {user && customersToday.length > 0 && (
                            <>
                                {/* Chat toggle button */}
                                {!showChat && (
                                <div className="fixed bottom-5 right-5 z-[9999]">
                                    <button
                                    onClick={() => setShowChat(true)}
                                    className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full shadow-lg"
                                    >
                                    💬
                                    </button>
                                    {hasNewMessage && (
                                    <span className="absolute -top-1 -right-1 bg-red-600 w-3 h-3 rounded-full animate-ping" />
                                    )}
                                </div>
                                )}


                                {/* Chat widget */}
                                {showChat && (
                              <ChatWidgetNew
                              currentUser={user}
                              customers={customersToday}
                              hasNewMessage={hasNewMessage}
                              setShowChat={setShowChat}
                              setLoading={setChatLoading} // ✅ Pass it down
                            />                            
                                )}
                            </>
                            )}


                </FavoritesProvider>
            </WishlistProvider>
        </BookProvider>
    );
}
