"use client";

import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import Image from "next/image";
import AdminSidebar from "../../components/AdminSidebar";

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    // Sample User Data
    const [firstName, setFirstName] = useState("Shekinah");
    const [lastName, setLastName] = useState("Valdez");
    const [imagePreview, setImagePreview] = useState("/images/default_avatar.png");

    const [contacts, setContacts] = useState([
        { id: 1, name: "Alice", avatar: "https://placehold.co/200x/ffa8e4/ffffff.svg?text=A" },
        { id: 2, name: "Martin", avatar: "https://placehold.co/200x/ad922e/ffffff.svg?text=M" },
        { id: 3, name: "Charlie", avatar: "https://placehold.co/200x/2e83ad/ffffff.svg?text=C" },
    ]);
    const [selectedChat, setSelectedChat] = useState(contacts[0]);

    useEffect(() => {
        // Initialize Pusher
        const pusher = new Pusher("0a411d03b9315833003e", { cluster: "ap1" });
        const channel = pusher.subscribe("chat-channel");

        channel.bind("message-sent", (data) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, []);

    const sendMessage = async () => {
        if (!message.trim()) return;

        try {
            await fetch("http://127.0.0.1:8000/api/chat/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ message, user: selectedChat.name }),
            });

            setMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className={`${darkMode ? "dark" : ""} flex h-screen bg-white dark:bg-[#0F172A]`}>
            {/* ✅ Sidebar */}
            <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* ✅ Main Content */}
            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
                {/* ✅ Header */}
                <header className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
                    <h1 className="text-lg font-bold dark:text-white mr-auto">Gown Rental</h1>
                    <div className="flex items-center space-x-2 md:space-x-4 mr-20">
                        <Image src={imagePreview} alt="Profile" width={32} height={32} className="rounded-full border border-gray-300" />
                        <span className="dark:text-white text-sm md:text-base">{`${firstName} ${lastName}`}</span>
                    </div>
                </header>

                {/* ✅ Main Section */}
                <main className="p-6 mt-16">
                    {/* ✅ Breadcrumb */}
                    <nav className="my-6 flex px-5 py-3 text-gray-700 rounded-lg bg-gray-50 dark:bg-[#1E293B]" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                            <li className="inline-flex items-center">
                                <a href="#" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                    </svg>
                                    Home
                                </a>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <a href="#" className="ml-1 text-sm font-medium text-gray-700 hover:text-gray-900 md:ml-2 dark:text-gray-400 dark:hover:text-white">
                                        Chat
                                    </a>
                                </div>
                            </li>
                        </ol>
                    </nav>

                    {/* ✅ Chat Section */}
                    <div className="flex h-[70vh] overflow-hidden border rounded-lg shadow-md">
                        {/* Chat Sidebar */}
                        <div className="w-1/4 bg-white border-r border-gray-300">
                            <div className="overflow-y-auto h-full p-3">
                                {contacts.map((contact) => (
                                    <div
                                        key={contact.id}
                                        className={`flex items-center mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md ${
                                            selectedChat.id === contact.id ? "bg-gray-200" : ""
                                        }`}
                                        onClick={() => setSelectedChat(contact)}
                                    >
                                        <Image src={contact.avatar} alt={contact.name} width={48} height={48} className="w-12 h-12 rounded-full mr-3" />
                                        <div className="flex-1">
                                            <h2 className="text-lg font-semibold">{contact.name}</h2>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 flex flex-col bg-gray-50">
                            <div className="flex-1 overflow-y-auto p-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex items-center mb-4 ${msg.sender === "admin" ? "justify-end" : ""}`}>
                                        <div className={`flex max-w-96 p-3 rounded-lg ${msg.sender === "admin" ? "bg-indigo-500 text-white" : "bg-white text-gray-700"}`}>
                                            <p>{msg.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ✅ Chat Input Aligned to Last Message */}
                            <div className={`p-4 bg-white border-t flex ${messages.length && messages[messages.length - 1].sender === "admin" ? "justify-end" : ""}`}>
                                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-2 border rounded-md" placeholder="Type a message..." />
                                <button onClick={sendMessage} className="bg-indigo-500 text-white px-4 py-2 rounded-md ml-2">Send</button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
