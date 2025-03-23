// "use client";

// import { useEffect, useState } from "react";
// import Pusher from "pusher-js";
// import { UserCircle } from "lucide-react";
// import AdminSidebar from "../../components/AdminSidebar";
// import Head from "next/head";

// export default function ChatPage() {
//     const [messages, setMessages] = useState([]);
//     const [message, setMessage] = useState("");
//     const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//     const [customers, setCustomers] = useState([]);
//     const [selectedCustomer, setSelectedCustomer] = useState(null);
//     const [adminId, setAdminId] = useState(null);
//     const [token, setToken] = useState(null);

//     useEffect(() => {
//         if (typeof window !== "undefined") {
//             const storedToken = localStorage.getItem("token");

//             if (!storedToken) {
//                 alert("Error: Missing admin token. Please log in again.");
//                 return;
//             }

//             setToken(storedToken);
//             fetchAdmin(storedToken);
//         }
//     }, []);

//     const fetchAdmin = async (storedToken) => {
//         try {
//             const response = await fetch("http://127.0.0.1:8000/api/user", {
//                 method: "GET",
//                 headers: {
//                     Authorization: `Bearer ${storedToken}`,
//                     "Content-Type": "application/json",
//                 },
//             });

//             if (!response.ok) throw new Error("Failed to fetch admin data");

//             const data = await response.json();
//             if (data?.user?.id) {
//                 setAdminId(data.user.id);
//                 fetchCustomers(storedToken);
//             } else {
//                 alert("Error: Unable to retrieve admin data.");
//             }
//         } catch (error) {
//             console.error("Error fetching admin:", error);
//         }
//     };

//     const fetchCustomers = async (storedToken) => {
//         try {
//             const response = await fetch("http://127.0.0.1:8000/api/customers", {
//                 headers: { Authorization: `Bearer ${storedToken}` },
//             });

//             if (!response.ok) throw new Error("Failed to fetch customers");

//             const data = await response.json();
//             if (data.success) {
//                 setCustomers(data.customers);
//                 setSelectedCustomer(data.customers[0] || null);
//             }
//         } catch (error) {
//             console.error("Error fetching customers:", error);
//         }
//     };

//     useEffect(() => {
//         if (selectedCustomer && adminId) {
//             fetchMessages();
//             initializePusher();
//         }
//     }, [selectedCustomer, adminId]);

//     const fetchMessages = async () => {
//         if (!adminId || !selectedCustomer) return;
//         try {
//             const response = await fetch(`http://127.0.0.1:8000/api/messages/customer/${selectedCustomer.id}/${adminId}`, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });

//             if (!response.ok) throw new Error("Failed to fetch messages");

//             const data = await response.json();
//             setMessages(data);
//         } catch (error) {
//             console.error("Error fetching messages:", error);
//         }
//     };

//     const sendMessage = async () => {
//         if (!message.trim() || !selectedCustomer || !adminId) return;

//         try {
//             const response = await fetch("http://127.0.0.1:8000/api/chat/send", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({ message, recipient_id: selectedCustomer.id, user_id: adminId }),
//             });

//             if (response.ok) {
//                 const newMessage = await response.json();
            
//                 // Instantly add the sent message to the state
//                 setMessages((prev) => [
//                     ...prev,
//                     {
//                         id: newMessage.data.id,
//                         user_id: adminId,  // Ensure admin is sender
//                         receiver_id: selectedCustomer.id,
//                         message: message,
//                     }
//                 ]);
            
//                 setMessage("");
//             }
            
//         } catch (error) {
//             console.error("Error sending message:", error);
//         }
//     };

//     const initializePusher = () => {
//         if (!adminId || !selectedCustomer) return;

//         Pusher.logToConsole = true;
        
//         const pusher = new Pusher("0a411d03b9315833003e", { 
//             cluster: "ap1", 
//             encrypted: true 
//         });

//         const channel = pusher.subscribe(`private-chat-${selectedCustomer.id}-${adminId}`);

//         channel.bind("message-sent", (data) => {
//             setMessages((prevMessages) => {
//                 // Avoid duplicate messages
//                 if (!prevMessages.some(msg => msg.id === data.id)) {
//                     return [...prevMessages, data];
//                 }
//                 return prevMessages;
//             });
//         });
        

//         return () => {
//             pusher.unsubscribe(`private-chat-${selectedCustomer.id}-${adminId}`);
//         };
//     };

//     return (
//         <>
//         <Head>
//         <title>Chat with Customer | Gown Rental</title> {/* ✅ Dynamic Title */}
//         <meta name="description" content="Manage your profile and settings on Gown Rental." />
//         <link rel="icon" type="image/svg+xml" href="/gownrentalsicon.svg" />
//     </Head>

//         <div className="flex h-screen bg-white">
//             <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

//            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-60" : "ml-16"}`}>
//                           <header className="fixed top-0 w-full flex items-center justify-end bg-white dark:bg-[#0F172A] p-4 shadow-md z-10">
//                               <h1 className="text-lg font-bold dark:text-white mr-auto">Gown Rental</h1>
//                           </header>
//                           <main className="p-6 mt-16">
                         
//                     <div className="flex h-[70vh] border rounded-lg shadow-lg bg-white overflow-hidden"> 
                        
//                         <div className="w-1/4 bg-pink-100 border-r border-pink-300 p-4 overflow-y-auto">
//                             <h2 className="text-xl font-bold text-pink-800 mb-4">Customers</h2> 
//                             {customers.map((customer) => (
//                                 <div 
//                                     key={customer.id} 
//                                     className={`flex items-center justify-between p-3 mb-3 cursor-pointer rounded-lg transition 
//                                         ${selectedCustomer?.id === customer.id ? "bg-pink-300" : "hover:bg-pink-200"}`}
//                                     onClick={() => setSelectedCustomer(customer)}
//                                 >
//                                     <div className="flex items-center">
//                                         <UserCircle size={40} className="mr-3 text-pink-600" />
//                                         <h2 className="text-lg font-semibold text-pink-900">{customer.name}</h2>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>

//                         <div className="flex-1 flex flex-col bg-white">
//                             <div className="flex-1 overflow-y-auto p-6">
//                                 {messages.map((msg, index) => (
//                                     <div key={index} className={`mb-3 flex ${msg.user_id === adminId ? "justify-end" : "justify-start"}`}>
//                                         <div className={`p-3 rounded-lg max-w-xs break-words shadow-md 
//                                             ${msg.user_id === adminId ? "bg-blue-500 text-white" : "bg-pink-300 text-black"}`}>
//                                             <span className="text-sm font-semibold block mb-1">
//                                                 {msg.user_id === adminId ? "You" : selectedCustomer.name}
//                                             </span>
//                                             {msg.message}
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>

//                             <div className="p-4 border-t flex bg-pink-200">
//                                 <input 
//                                     type="text" 
//                                     value={message} 
//                                     onChange={(e) => setMessage(e.target.value)} 
//                                     className="flex-1 border rounded-lg p-3 text-pink-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
//                                     placeholder="Type a message..."
//                                 />
//                                 <button 
//                                     onClick={sendMessage} 
//                                     className="bg-blue-500 text-white px-6 py-2 rounded-lg ml-3 font-semibold shadow-md hover:bg-blue-600 transition"
//                                 >
//                                     Send
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </main>
//             </div>
//         </div>
//         </>
//     );
// }
