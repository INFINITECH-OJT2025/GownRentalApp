"use client";

import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import { MessageCircle, X, ChevronDown, Send, UserCircle } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useChat } from "../context/ChatContext";

export default function ChatWidgetPage() {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [adminId, setAdminId] = useState(null);
    const [token, setToken] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { unreadCounts, setUnreadCounts } = useChat();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedToken = localStorage.getItem("token");
    
            if (!storedToken) {
                alert("Error: Missing admin token. Please log in again.");
                return;
            }
    
            setToken(storedToken);
            fetchAdmin(storedToken);
        }
    }, []);
    
    // ✅ Fetch unread messages only when the chat is closed
    useEffect(() => {
        if (!token || isChatOpen) return;
    
        fetchCustomers(token);
    }, [token, isChatOpen]); // ✅ Runs when token changes but not when chat is open
    
    const fetchAdmin = async (storedToken) => {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/user", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) throw new Error("Failed to fetch admin data");
    
            const data = await response.json();
            if (data?.user?.id) {
                setAdminId(data.user.id);
                fetchCustomers(storedToken);
            } else {
                alert("⚠ Error: Unable to retrieve admin data.");
            }
        } catch (error) {
            alert("⚠ Network error! Unable to fetch admin details. Please check your connection.");
            console.error("Error fetching admin:", error);
        }
    };
    
    const fetchCustomers = async (storedToken) => {
        try {
            // ✅ Fetch all customers
            const customersResponse = await fetch("http://127.0.0.1:8000/api/customers", {
                headers: { Authorization: `Bearer ${storedToken}` },
            });
    
            if (!customersResponse.ok) {
                throw new Error(`HTTP error! Status: ${customersResponse.status}`);
            }
    
            const customersData = await customersResponse.json();
            const allCustomers = customersData.success ? customersData.customers : [];
    
            // ✅ Fetch customers with unread messages
            const unreadResponse = await fetch("http://127.0.0.1:8000/api/customers-with-unread", {
                headers: { Authorization: `Bearer ${storedToken}` },
            });
    
            if (!unreadResponse.ok) {
                throw new Error(`HTTP error! Status: ${unreadResponse.status}`);
            }
    
            const unreadData = await unreadResponse.json();
            const unreadCountsData = unreadData.success
                ? unreadData.customers.reduce((acc, customer) => {
                    acc[customer.id] = "New Message"; // ✅ Set unread status
                    return acc;
                }, {})
                : {};
    
            // ✅ Merge unread status into customer list
            setCustomers(allCustomers);
    
            // ✅ Set unread counts dynamically
            setUnreadCounts(unreadCountsData);
    
            // ✅ Select the first customer by default
            if (allCustomers.length > 0) {
                setSelectedCustomer(allCustomers[0]);
            }
        } catch (error) {
            console.error("❌ Error fetching customers or unread messages:", error);
            
            // ✅ Show a user-friendly Windows-style alert
            alert("⚠ Unable to fetch customers. Please check your internet connection or try again later.");
        }
    };
    

    useEffect(() => {
        if (!adminId || !selectedCustomer) return;
    
        // ✅ Fetch messages every 5 seconds
        const interval = setInterval(() => {
            fetchMessages();
        }, 5000);
    
        return () => clearInterval(interval); // ✅ Cleanup interval when component unmounts
    }, [adminId, selectedCustomer]);
    
    
    const initializePusher = (adminId) => {
        if (!adminId) return;
    
        Pusher.logToConsole = true;
    
        const pusher = new Pusher("0a411d03b9315833003e", { cluster: "ap1", encrypted: true });
    
        const channel = pusher.subscribe(`private-chat-${adminId}`);
    
        // ✅ Listen for new messages
        channel.bind("message-sent", (data) => {
            if (data.receiver_id === adminId) {
                setMessages((prevMessages) => [...prevMessages, data.message]);
    
                // ✅ Update unread badge count
                setUnreadCounts((prev) => ({
                    ...prev,
                    [data.sender_id]: data.unread_count,
                }));
    
                if (isChatOpen) {
                    setTimeout(() => {
                        const chatContainer = document.getElementById("chat-messages-container");
                        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
                    }, 100);
                } else {
                    toast.success(`New message from Customer: ${data.message.message}`, {
                        duration: 5000,
                        position: "top-right",
                    });
                }
            }
        });    
        
        return () => {
            pusher.unsubscribe(`private-chat-${adminId}`);
        };
    };
    
    const fetchMessages = async () => {
        if (!adminId || !selectedCustomer || !isChatOpen) return;
    
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/api/messages/customer/${selectedCustomer.id}/${adminId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
            setMessages(data);
    
            // ✅ Reset unread count when admin opens the chat
            setUnreadCounts((prev) => ({
                ...prev,
                [selectedCustomer.id]: 0,
            }));
        } catch (error) {
            console.error("❌ Error fetching messages:", error);
            alert("⚠ Unable to fetch messages. Please check your connection and try again.");
        }
    };
    
    
    const sendMessage = async () => {
        if (!message.trim() || !selectedCustomer || !adminId) return;
    
        try {
            const response = await fetch("http://127.0.0.1:8000/api/chat/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message, recipient_id: selectedCustomer.id, user_id: adminId }),
            });
    
            if (response.ok) {
                const newMessage = await response.json();
    
                // ✅ Update messages instantly
                setMessages((prev) => [...prev, newMessage.data]);
    
                setMessage("");
    
                // ✅ Notify Customer using Pusher
                const pusher = new Pusher("0a411d03b9315833003e", { cluster: "ap1", encrypted: true });
                const channel = pusher.subscribe(`private-chat-${selectedCustomer.id}`);
                channel.trigger("client-message-sent", {
                    sender_id: adminId,
                    receiver_id: selectedCustomer.id,
                    message: newMessage.data.message,
                });
    
                toast.success("Message sent!", { duration: 3000, position: "top-right" });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message!", { duration: 4000, position: "top-center" });
        }
    };
    

    useEffect(() => {
        if (!adminId) return;
    
        const pusher = new Pusher("0a411d03b9315833003e", { cluster: "ap1", encrypted: true });
        const channel = pusher.subscribe(`private-chat-${adminId}`);
    
        // ✅ Listen for new messages
        channel.bind("message-sent", (data) => {
            if (data.receiver_id === adminId) {
                if (!isChatOpen) {
                    // ✅ Update unread count but don't reload messages
                    setUnreadCounts((prev) => ({
                        ...prev,
                        [data.sender_id]: "New Message",
                    }));
    
                    // ✅ Show toast notification
                    toast.success(`New message from ${data.sender_name}: ${data.message.message}`, {
                        duration: 5000,
                        position: "top-right",
                    });
                } else {
                    // ✅ If chat is open, fetch the new message
                    setMessages((prevMessages) => [...prevMessages, data.message]);
    
                    setTimeout(() => {
                        const chatContainer = document.getElementById("chat-messages-container");
                        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
                    }, 100);
                }
            }
        });
    
        return () => {
            pusher.unsubscribe(`private-chat-${adminId}`);
        };
    }, [adminId, isChatOpen]); // ✅ Runs when `adminId` or `isChatOpen` changes
    

    useEffect(() => {
        const chatContainer = document.getElementById("chat-messages-container");
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }, [messages]); // ✅ Auto-scroll when messages update
    
    return (
        <>
           <Toaster /> 
            {/* Floating Chat Button */}
            <button
                className="fixed bottom-6 right-6 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 transition duration-300"
                onClick={() => setIsChatOpen(!isChatOpen)}>
                <MessageCircle size={28} />
            </button>

            {/* Chat Widget */}
            {isChatOpen && (
                <div className="fixed bottom-16 right-6 w-80 bg-white shadow-lg rounded-lg border border-gray-300">
                    {/* Header */}
                    <div className="bg-pink-500 text-white p-3 flex justify-between items-center rounded-t-lg">
                        <span className="font-semibold">Chat with {selectedCustomer?.name || "Customer"}</span>
                        <X className="cursor-pointer" onClick={() => setIsChatOpen(false)} />
                    </div>

                   {/* Customer Selector with Unread Badge */}
                    <div className="bg-pink-100 p-2 text-pink-800 font-semibold text-center flex justify-between items-center relative">
                    <div className="relative w-full">
                    <select
                        className="bg-pink-100 w-full p-2 rounded-md text-center cursor-pointer 
                                appearance-none truncate max-h-40 overflow-y-auto block"
                        onChange={(e) => {
                            const customer = customers.find(c => c.id == e.target.value);
                            setSelectedCustomer(customer);
                            fetchMessages();
                        }}
                        value={selectedCustomer?.id || ""}
                    >
                        {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name} {unreadCounts[customer.id] > 0 ? `(New Message: ${unreadCounts[customer.id]})` : ""}
                            </option>
                        ))}
                    </select>


                        {/* 🔴 Show "New Message" badge outside the select */}
                        {unreadCounts[selectedCustomer?.id] && (
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-red-500 text-white 
                                            text-xs font-bold px-2 py-1 rounded-full">
                                New Message
                            </span>
                        )}
                    </div>


                        <ChevronDown className="absolute right-3 cursor-pointer" />
                    </div>

                    {/* Chat Messages */}
                    <div className="p-3 h-64 overflow-y-auto bg-gray-100">
                        {messages.map((msg, index) => (
                            <div key={index} className={`mb-2 flex ${msg.user_id === adminId ? "justify-end" : "justify-start"}`}>
                                <div className={`p-2 rounded-lg max-w-xs break-words shadow-md 
                                    ${msg.user_id === adminId ? "bg-blue-500 text-white" : "bg-pink-300 text-black"}`}>
                                    <span className="text-sm font-semibold block mb-1">
                                        {msg.user_id === adminId ? "You" : selectedCustomer?.name || "Customer"}
                                    </span>
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Message Input */}
                    <div className="p-2 border-t bg-white flex items-center">
                        <input
                            type="text"
                            className="flex-1 p-2 border rounded-lg outline-none"
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-pink-500 text-white px-3 py-2 rounded-lg ml-2 shadow-md hover:bg-pink-600 transition"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
