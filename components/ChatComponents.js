// import { useEffect, useState } from "react";
// import ably from "../utils/ably";

// const ChatComponent = () => {
//     const [messages, setMessages] = useState([]);
//     const [message, setMessage] = useState("");

//     useEffect(() => {
//         const channel = ably.channels.get("chat-channel");

//         // ✅ Correct way to subscribe to messages
//         channel.subscribe("message", (msg) => {
//             setMessages((prev) => [...prev, msg.data]);
//         });

//         return () => {
//             channel.unsubscribe(); // ✅ Clean up listener on unmount
//         };
//     }, []);

//     const sendMessage = async () => {
//         if (!message.trim()) return; // ✅ Prevent empty messages
    
//         try {
//             const response = await fetch("http://127.0.0.1:8000/api/chat/sends", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer YOUR_LARAVEL_SANCTUM_TOKEN`
//                 },
//                 body: JSON.stringify({ message }),
//             });
    
//             const data = await response.json();
    
//             if (response.ok) {
//                 console.log("✅ Message Sent:", data); // ✅ Log success response
//             } else {
//                 console.error("❌ Message Failed:", data);
//             }
//         } catch (error) {
//             console.error("❌ Error sending message:", error);
//         }
    
//         setMessage(""); // ✅ Clear input field after sending
//     };
    

//     return (
//         <div>
//             <div>
//                 {messages.map((msg, index) => (
//                     <p key={index}>{msg.sender_id}: {msg.message}</p>
//                 ))}
//             </div>
//             <input
//                 type="text"
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 placeholder="Type a message..."
//             />
//             <button onClick={sendMessage}>Send</button>
//         </div>
//     );
// };

// export default ChatComponent;
