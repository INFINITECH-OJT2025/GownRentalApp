import { createContext, useContext, useState, useEffect } from "react";
import Pusher from "pusher-js";
import axios from "axios";

const ChatContext = createContext();

export function ChatProvider({ children }) {
    const [unreadCounts, setUnreadCounts] = useState({}); // ✅ Track unread messages per user/admin
    const [messages, setMessages] = useState([]); // ✅ Store messages globally
    const [userId, setUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false); // ✅ Track if user is admin

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) fetchUser(storedToken);
    }, []);

    const fetchUser = async (storedToken) => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/user", {
                headers: { Authorization: `Bearer ${storedToken}` },
            });

            if (response.data?.user?.id) {
                setUserId(response.data.user.id);
                setIsAdmin(response.data.user.role === "admin"); // ✅ Check if the user is an admin
                initializePusher(response.data.user.id, response.data.user.role);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };


   const initializePusher = (userId) => {
    if (!userId) return;

    const pusher = new Pusher("0a411d03b9315833003e", {
        cluster: "ap1",
        encrypted: true,
    });

    const channel = pusher.subscribe(`private-chat-${userId}`);

    // ✅ Listen for new messages (customer -> admin OR admin -> customer)
    channel.bind("message-sent", (data) => {
        if (data.receiver_id === userId) {
            setMessages((prevMessages) => [...prevMessages, data]);

            // ✅ Increase unread count for the specific sender
            setUnreadCounts((prev) => ({
                ...prev,
                [data.sender_id]: (prev[data.sender_id] || 0) + 1,
            }));
        }
    });

    return () => {
        pusher.unsubscribe(`private-chat-${userId}`);
    };
};


    return (
        <ChatContext.Provider value={{ messages, setMessages, unreadCounts, setUnreadCounts, isAdmin }}>
            {children}
        </ChatContext.Provider>
    );

    
}

export function useChat() {
    return useContext(ChatContext);
}


