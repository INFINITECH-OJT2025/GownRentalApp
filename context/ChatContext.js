"use client";
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [unreadCounts, setUnreadCounts] = useState({});
    const [messages, setMessages] = useState([]);
    const [newMessageTotal, setNewMessageTotal] = useState(0);
    const [senders, setSenders] = useState([]);
    const [userId, setUserId] = useState(null);

    const fetchChatSenders = async (receiverId) => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            if (!token || !receiverId) return;
    
            const response = await axios.get(`http://127.0.0.1:8000/api/chat/senders/${receiverId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (response.data.success) {
                // ✅ Only update state if there's a change (to prevent infinite re-renders)
                if (response.data.senders.length !== newMessageTotal) {
                    setSenders(response.data.senders);
                    setNewMessageTotal(response.data.senders.length);
    
                    if (typeof window !== "undefined") {
                        localStorage.setItem("newMessageTotal", response.data.senders.length.toString());
                        window.dispatchEvent(new Event("storage")); // ✅ Notify UI to update
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching chat senders:", error);
        }
    };
    

    // ✅ Fetch user details once & start checking for messages
    const fetchUser = async () => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            if (!token) return;

            const response = await axios.get("http://127.0.0.1:8000/api/user", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data?.user?.id) {
                setUserId(response.data.user.id);
                fetchChatSenders(response.data.user.id); 
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    useEffect(() => {
        let lastMessageId = null; // ✅ Track the last known message ID
    
        const checkForNewMessages = async () => {
            if (!userId) return;
    
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                if (!token) return;
    
                const response = await axios.get(`http://127.0.0.1:8000/api/chat/last-message/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
    
                const latestMessageId = response.data?.last_message_id;
    
                // ✅ Only fetch chat senders if a new message exists
                if (latestMessageId && latestMessageId !== lastMessageId) {
                    lastMessageId = latestMessageId;
                    fetchChatSenders(userId);
                }
            } catch (error) {
                console.error("Error checking for new messages:", error);
            }
        };
    
        // ✅ Set an interval to check for updates (only fetch if a new message exists)
        const interval = setInterval(checkForNewMessages, 5000);
    
        return () => clearInterval(interval);
    }, [userId]);
    

    // ✅ Refresh messages manually when sending a new message
    const refreshMessages = () => {
        if (userId) {
            fetchChatSenders(userId);
        }
    };

    // ✅ Mark messages as read & reset notification count
    const clearNotifications = async (receiverId) => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            if (!token) return;

            await axios.post(`http://127.0.0.1:8000/api/mark-messages-read/${receiverId}`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setNewMessageTotal(0);
            setSenders([]);
            if (typeof window !== "undefined") {
                localStorage.setItem("newMessageTotal", "0");
                window.dispatchEvent(new Event("storage"));
            }
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    // ✅ Fetch user once on mount
    useEffect(() => {
        fetchUser();
    }, []);

    // ✅ Update UI in real time with localStorage events
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === "newMessageTotal") {
                setNewMessageTotal(parseInt(localStorage.getItem("newMessageTotal") || "0", 10));
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    return (
        <ChatContext.Provider value={{
            messages,
            setMessages,
            unreadCounts,
            setUnreadCounts,
            newMessageTotal,
            senders,
            fetchChatSenders,
            clearNotifications,
            refreshMessages,
        }}>
            {children}
        </ChatContext.Provider>
    );
};

// ✅ Custom Hook for Using ChatContext
export function useChat() {
    return useContext(ChatContext);
}
