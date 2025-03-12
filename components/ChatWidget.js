"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, X } from "lucide-react";
import Pusher from "pusher-js";
import { toast, Toaster } from "react-hot-toast";
import { useChat } from "../context/ChatContext"; 

export default function ChatWidget() {
    const [message, setMessage] = useState("");
    const [chatOpen, setChatOpen] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [userId, setUserId] = useState(null);
    const [token, setToken] = useState(null);
    const [showAdminList, setShowAdminList] = useState(false);
    const { messages, setMessages, unreadCounts, setUnreadCounts } = useChat(); 
    const [newMessageFromAdmin, setNewMessageFromAdmin] = useState(null);
    const refreshInterval = useRef(null);

    // ✅ Fetch token once when the component loads
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedToken = localStorage.getItem("token");
            if (!storedToken) {
                alert("Error: Missing user token. Please log in again.");
                return;
            }
            setToken(storedToken);
            fetchUser(storedToken);
        }
    }, []);

  // ✅ Fetch user details and initialize chat
  const fetchUser = async (storedToken) => {
    try {
        const response = await fetch("http://127.0.0.1:8000/api/user", {
            method: "GET",
            headers: { Authorization: `Bearer ${storedToken}`, "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();
        if (data?.user?.id) {
            setUserId(data.user.id);
            fetchAdmins(storedToken);
            initializePusher(data.user.id);
        } else {
            alert("Error: Unable to retrieve user data.");
        }
    } catch (error) {
        console.error("Error fetching user:", error);
    }
};
   // ✅ Fetch admins
const fetchAdmins = async (storedToken) => {
    try {
        const response = await fetch("http://127.0.0.1:8000/api/admins", {
            headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!response.ok) throw new Error("Failed to fetch admins");

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            setAdmins(data);
            setSelectedAdmin(data[0]);
        } else {
            setAdmins([]);
            setSelectedAdmin(null);
        }
    } catch (error) {
        console.error("Error fetching admins:", error);
    }
};

    // ✅ Fetch messages only when chat is open
useEffect(() => {
    if (!userId || !selectedAdmin || !chatOpen) return;
    fetchMessages();
}, [userId, selectedAdmin, chatOpen]);

const fetchMessages = async () => {
    if (!userId || !selectedAdmin || !chatOpen) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/messages/customer/${userId}/${selectedAdmin.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch messages");

        const data = await response.json();

        // ✅ Check if there are new messages before updating the state
        setMessages((prevMessages) => {
            const latestMessageId = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1].id : null;
            
            // ✅ Filter out already existing messages
            const newMessages = data.filter((msg) => !prevMessages.some((prev) => prev.id === msg.id));

            if (newMessages.length > 0) {
                setTimeout(() => {
                    const chatContainer = document.getElementById("chat-messages-container");
                    if (chatContainer) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                }, 100);
            }

            return [...prevMessages, ...newMessages]; // ✅ Append new messages instead of replacing all
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages. Please try again!");
    }
};


useEffect(() => {
    if (chatOpen) {
        console.log("✅ Starting message and unread message fetching...");
        fetchUnreadCounts();
        fetchMessages();
        
        refreshInterval.current = setInterval(() => {
            fetchUnreadCounts();
            fetchMessages();
        }, 5000);
    } else {
        console.log("🛑 Stopping message and unread message fetching...");
        if (refreshInterval.current) {
            clearInterval(refreshInterval.current);
            refreshInterval.current = null;
        }
    }

    return () => {
        if (refreshInterval.current) {
            clearInterval(refreshInterval.current);
            refreshInterval.current = null;
        }
    };
}, [chatOpen]);

const fetchUnreadCounts = async () => {
    if (!chatOpen) return; // ✅ Skip fetching if chat is closed

    try {
        const response = await fetch("http://127.0.0.1:8000/api/admins-with-unread", {
            method: "GET",
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) throw new Error("Failed to fetch unread counts");

        const data = await response.json();
        let unreadCountsData = {};
        data.admins.forEach((admin) => {
            unreadCountsData[admin.id] = admin.unread_status === "New message" ? "New message" : "";
        });
        setUnreadCounts(unreadCountsData);
    } catch (error) {
        console.error("Error fetching unread counts:", error);
    }
};

// ✅ Open/Close Chat Function
const toggleChat = () => {
    setChatOpen((prev) => !prev);
};


    const sendMessage = async () => {
        if (!message.trim() || !selectedAdmin || !userId) return; // Ensure valid inputs
    
        try {
            const response = await fetch("http://127.0.0.1:8000/api/chat/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message, recipient_id: selectedAdmin.id, user_id: userId }),
            });
    
            if (!response.ok) throw new Error("Failed to send message");
    
            const newMessage = await response.json();
    
            // ✅ Update chat messages instantly
            setMessages((prev) => [...prev, newMessage.data]);
    
            // ✅ Clear input field
            setMessage("");
    
            // ✅ Notify Admin using Pusher
            const pusher = new Pusher("0a411d03b9315833003e", { cluster: "ap1", encrypted: true });
            const channel = pusher.subscribe(`private-chat-${selectedAdmin.id}`);
            channel.trigger("client-message-sent", {
                sender_id: userId,
                receiver_id: selectedAdmin.id,
                message: newMessage.data.message,
            });
    
            toast.success("Message sent!", { duration: 3000, position: "top-right" });
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message!", { duration: 4000, position: "top-center" });
        }
    };

    const handleAdminSelect = (admin) => {
        if (selectedAdmin?.id !== admin.id) {
            setMessages([]); // ✅ Clear previous messages when switching admins
            setSelectedAdmin(admin);  
            setShowAdminList(false);  
            fetchMessages(); // ✅ Fetch messages for the newly selected admin
        }
    };
    

    // ✅ Initialize Pusher Correctly
    const initializePusher = (userId) => {
        if (!userId) return;

        const pusher = new Pusher("0a411d03b9315833003e", { cluster: "ap1", encrypted: true });
        const channel = pusher.subscribe(`private-chat-${userId}`);

        channel.bind("message-sent", (data) => {
            if (data.receiver_id === userId) {
                if (!chatOpen) {
                    setUnreadCounts((prev) => ({
                        ...prev,
                        [data.sender_id]: "New message",
                    }));
                    setNewMessageFromAdmin(`A new message from ${data.sender_name}`);
                    setTimeout(() => setNewMessageFromAdmin(null), 5000);
                } else {
                    setMessages((prevMessages) => [...prevMessages, data.message]);
                    setTimeout(() => {
                        const chatContainer = document.getElementById("chat-messages-container");
                        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
                    }, 100);
                }
            }
        });

        return () => {
            pusher.unsubscribe(`private-chat-${userId}`);
        };
    };
    
    return (
        <>
            <Toaster />
            <div className="fixed bottom-6 right-6 z-50">
            <button
                className="bg-pink-500 text-white p-3 rounded-full shadow-lg hover:bg-pink-600 transition"
                onClick={toggleChat} // ✅ Now it uses toggleChat
            > 
                <MessageCircle size={24} />
            </button>

            </div>

            {chatOpen && (
                <div className="fixed bottom-16 right-6 w-80 bg-white rounded-lg shadow-lg border">
                   {/* Chat Header */}
                    <div className="bg-pink-500 text-white p-3 flex justify-between items-center">
                        <h3 className="font-bold">
                            Chat with {selectedAdmin ? selectedAdmin.name : "Admin"}
                            {newMessageFromAdmin && (
                                <span className="ml-2 text-yellow-300 text-sm animate-pulse">
                                    ({newMessageFromAdmin})
                                </span>
                            )}
                        </h3>

                        {/* ✅ Fix: Prevent Unnecessary Page Refresh */}
                        <button onClick={(e) => {
                            e.preventDefault(); // ✅ Stop any accidental form submission or refresh
                            setChatOpen(false); // ✅ Just close the chat without affecting state
                        }}>
                            <X size={20} />
                        </button>
                    </div>



                  {/* Admin Selection with Unread Badge */}
                <div className="relative p-3">
                    <button
                        className="relative bg-pink-200 text-pink-900 px-4 py-2 rounded-md w-full flex justify-between items-center"
                        onClick={() => setShowAdminList(!showAdminList)}
                        disabled={admins.length === 0}
                    >
                        {selectedAdmin ? selectedAdmin.name : "Select Admin"}

                        {/* 🔴 Badge for Unread Messages */}
                        {unreadCounts[selectedAdmin?.id] && unreadCounts[selectedAdmin.id] === "New message" && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                New message
                            </span>
                        )}

                    </button>
                    {showAdminList && admins.length > 0 && (
                    <div className="absolute left-0 w-full bg-white shadow-md mt-2 rounded-md border">
                        {/* 🔴 Show "New message" Instead of a Count */}
                        {admins.map((admin) => (
                        <button
                            key={admin.id}
                            onClick={() => handleAdminSelect(admin)}
                            className="w-full text-left px-4 py-2 hover:bg-pink-100 text-pink-900 flex justify-between items-center"
                        >
                            <span>{admin.name}</span>
                            {unreadCounts[admin.id] === "New message" && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    New message
                                </span>
                            )}
                        </button>
                    ))}


                    </div>
                )}
                </div>

    
                  {/* ✅ Chat Messages List (Auto-scroll Fix) */}
                    <div id="chat-messages-container" className="p-3 h-64 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div key={index} className={`mb-3 flex ${msg.user_id == userId ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`p-2 rounded-lg max-w-xs break-words ${
                                        msg.user_id == userId ? "bg-pink-500 text-white" : "bg-gray-300 text-black"
                                    }`}
                                >
                                    <span className="text-xs font-semibold">
                                        {msg.user_id == userId ? "You" : selectedAdmin?.name}
                                    </span>
                                    <br />
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ✅ Chat Input */}
                    <div className="p-3 border-t flex">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="flex-1 border rounded p-2 text-black placeholder-gray-500"
                            placeholder="Type a message..."
                        />
                        <button onClick={sendMessage} className="bg-pink-500 text-white px-4 py-2 rounded ml-2">
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
