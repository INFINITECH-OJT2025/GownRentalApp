import { useEffect, useRef, useState } from "react";
import Talk from "talkjs";

const getImageUrl = (img) => {
  if (!img) return null;
  return img.startsWith("http")
    ? img
    : `http://127.0.0.1:8000/storage/profile_pictures/${img}`;
};

export default function ChatWidgetNew({ currentUser, customers = [], hasNewMessage, setLoading }) {
  const popupRef = useRef(null);
  const sessionRef = useRef(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [localHasNewMessage, setLocalHasNewMessage] = useState(hasNewMessage || false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileInbox, setShowMobileInbox] = useState(false);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [chatLoaded, setChatLoaded] = useState(false);
  const [showDesktopInbox, setShowDesktopInbox] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    setLocalHasNewMessage(hasNewMessage);
  }, [hasNewMessage]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const initTalk = async (userA, userB = null) => {
    await Talk.ready;
  
    const me = new Talk.User({
      id: String(userA.id),
      name: userA.name,
      email: userA.email,
      photoUrl: getImageUrl(userA.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userA.name)}`,
      role: userA.role,
    });
  
    const session = new Talk.Session({ appId: "t8oVirii", me });
    session.setDesktopNotificationEnabled(true);
    sessionRef.current = session;
  
    session.on("message", (event) => {
      try {
        const msg = event?.message;
        const sender = msg?.sender;
      
        // Safe early exit if anything is missing
        if (!msg || !sender || !sender.id || !msg.body) return;
      
        // Ignore self-sent messages
        if (String(sender.id) === String(currentUser.id)) return;
      
        setLocalHasNewMessage(true);
      
        if (Notification.permission === "granted" && desktopNotifications) {
          new Notification(`💬 New message from ${sender.name}`, {
            body: msg.body,
            icon: getImageUrl(sender.photoUrl) || "/default-avatar.png",
          });
        }
      } catch (err) {
        console.error("💥 TalkJS message error:", err);
      }      
    });
    
  
    if (!isMobile) {
      const inbox = session.createInbox({
        selected: null,
        style: {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          border: "none",
        },
      });
  
      for (const user of customers) {
        if (user.id === currentUser.id) continue;
        const other = new Talk.User({
          id: String(user.id),
          name: user.name,
          email: user.email,
          photoUrl: getImageUrl(user.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
          role: user.role || "customer",
        });
  
        const conversation = session.getOrCreateConversation(Talk.oneOnOneId(me, other));
        conversation.setParticipant(me);
        conversation.setParticipant(other);
      }
  
      await inbox.mount(document.getElementById("talkjs-desktop-inbox-container"));
      popupRef.current = inbox;
      
      const iframe = document.querySelector("#talkjs-desktop-inbox-container iframe");
      if (iframe) {
        iframe.style.position = "relative";
        iframe.style.zIndex = "0";
      }
      setLoading(false);
      
  
      if (userB) {
        const other = new Talk.User({
          id: String(userB.id),
          name: userB.name,
          email: userB.email,
          photoUrl: getImageUrl(userB.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userB.name)}`,
          role: userB.role || 'customer',
        });
      
        const conversation = session.getOrCreateConversation(Talk.oneOnOneId(session.me, other));
        conversation.setParticipant(session.me);
        conversation.setParticipant(other);
        inbox.select(conversation); 
      }
      
    } else {
      const inbox = session.createInbox({
        selected: null,
        showHeader: false,
      });
    
      for (const user of customers) {
        if (user.id === currentUser.id) continue;
        const other = new Talk.User({
          id: String(user.id),
          name: user.name,
          email: user.email,
          photoUrl: getImageUrl(user.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
          role: user.role || "customer",
        });
    
        const conversation = session.getOrCreateConversation(Talk.oneOnOneId(me, other));
        conversation.setParticipant(me);
        conversation.setParticipant(other);
      }
    
      await inbox.mount(document.getElementById("talkjs-container"));
      popupRef.current = inbox;
    }
  };    
  
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        console.log("🖥️ Notification permission status:", permission);
      });
    }
  }, []);

  // 🔧 Call initTalk() when mobile inbox is shown
useEffect(() => {
  if (isMobile && showMobileInbox) {
    setLoading(true);
    setTimeout(async () => {
      try {
        await initTalk(currentUser, isAdmin ? selectedCustomer : customers[0]);
      } catch (err) {
        console.error("❌ Failed to init TalkJS (mobile):", err);
      } finally {
        setLoading(false);
      }
    }, 50);
    
  }
}, [isMobile, showMobileInbox]);


  const handleSelectCustomer = (e) => {
    const id = e.target.value;
    const user = customers.find((u) => u.id == id);
    if (user) setSelectedCustomer(user);
  };

  const handleToggleChat = async () => {
    const shouldShow = !showDesktopInbox;
    setShowDesktopInbox(shouldShow);
    setLocalHasNewMessage(false);
  
    if (shouldShow) {
      setLoading(true); // 👈 Notify parent that it's loading
  
      if (!chatLoaded) {
        setChatLoaded(true);
        initTalk(currentUser);
      }
  
      setTimeout(async () => {
        try {
          await initTalk(currentUser, isAdmin ? selectedCustomer : customers[0]);
        } catch (err) {
          console.error("❌ Failed to init TalkJS (desktop):", err);
        } finally {
          setLoading(false);
        }
      }, 50);      
    } else {
      if (sessionRef.current) {
        sessionRef.current.destroy();
        sessionRef.current = null;
        popupRef.current = null;
      }
    }
  };
  

  return (
    <>
    {/* Desktop: TalkJS Inbox with Combobox on top */}
{!isMobile && chatLoaded && showDesktopInbox && (
  <div
    className="fixed bottom-12 right-5 z-[9999] rounded-xl shadow-lg bg-white border flex flex-col"
    style={{ width: "400px", height: "600px" }}
  >
    {/* 👤 Combobox at the top */}
    <div className="p-2 border-b bg-white relative z-[10]">
      <select
        className="w-full p-2 border rounded text-sm"
        onChange={async (e) => {
          const selectedId = e.target.value;
          const user = customers.find((u) => String(u.id) === selectedId);
          if (!user || !sessionRef.current) return;

          const me = sessionRef.current.me;
          const other = new Talk.User({
            id: String(user.id),
            name: user.name,
            email: user.email,
            photoUrl: getImageUrl(user.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
            role: user.role || (isAdmin ? "customer" : "admin"),
          });

          const conversation = sessionRef.current.getOrCreateConversation(Talk.oneOnOneId(me, other));
          conversation.setParticipant(me);
          conversation.setParticipant(other);
          if (popupRef.current && typeof popupRef.current.select === "function") {
            popupRef.current.select(conversation);
          }
        }}
        defaultValue=""
      >
        <option value="" disabled>
          {isAdmin ? "Select a customer who logged in today" : "Chat with admin"}
        </option>
        {customers
  .filter((u) => u.id !== currentUser.id)
  .map((user) => {
    const isAdminUser = user.role === "admin";
    let label = user.name;

    if (!isAdminUser && user.updated_at) {
      const loginDate = new Date(user.updated_at);
      const formattedDate = loginDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const formattedTime = loginDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });

      label += ` (${formattedDate} @ ${formattedTime})`;
    }

    return (
      <option key={user.id} value={user.id}>
        {label}
      </option>
    );
  })}


      </select>
    </div>

    {/* 💬 TalkJS Inbox mounts here */}
    <div
  id="talkjs-desktop-inbox-container"
  className="flex-1 relative z-0"
  style={{ height: "100%" }}
/></div>

)}

  
    {/* 💬 Floating Toggle Button */}
    <div className="fixed bottom-5 right-5 z-[9999]">
      <button
        onClick={() => {
          if (isMobile) {
            setShowMobileInbox(true);
          } else {
            handleToggleChat();
          }
        }}
        className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full shadow-lg"
      >
        💬
      </button>
      {localHasNewMessage && (
        <span className="absolute -top-1 -right-1 bg-red-600 w-3 h-3 rounded-full animate-ping" />
      )}
    </div>
  
    {/* Mobile Fullscreen Chat */}
{/* Mobile Fullscreen Chat */}
{isMobile && showMobileInbox && (
  <div className="fixed top-12 left-0 right-0 bottom-0 z-[100000] bg-white flex flex-col">
    
    {/* 🧭 Header with Title + ComboBox */}
    <div className="flex flex-col gap-2 px-4 py-2 border-b bg-white z-[1000002]">
    {(isAdmin || !isAdmin) && (
   <select
   className="w-full p-2 border rounded text-sm"
   onChange={async (e) => {
     const selectedId = e.target.value;
     const user = customers.find((u) => String(u.id) === selectedId);
     if (!user || !sessionRef.current) return;

     const me = sessionRef.current.me;
     const other = new Talk.User({
       id: String(user.id),
       name: user.name,
       email: user.email,
       photoUrl: getImageUrl(user.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
       role: user.role || (isAdmin ? "customer" : "admin"),
     });

     const conversation = sessionRef.current.getOrCreateConversation(Talk.oneOnOneId(me, other));
     conversation.setParticipant(me);
     conversation.setParticipant(other);
     if (popupRef.current && typeof popupRef.current.select === "function") {
      popupRef.current.select(conversation);
    }
   }}
   defaultValue=""
 >
   <option value="" disabled>
     {isAdmin ? "Select a customer who logged in today" : "Chat with admin"}
   </option>
   {customers
  .filter((u) => u.id !== currentUser.id)
  .map((user) => {
    const isAdminUser = user.role === "admin";
    let label = user.name;

    if (!isAdminUser && user.updated_at) {
      const loginDate = new Date(user.updated_at);
      const formattedDate = loginDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const formattedTime = loginDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });

      label += ` (${formattedDate} @ ${formattedTime})`;
    }

    return (
      <option key={user.id} value={user.id}>
        {label}
      </option>
    );
  })}


 </select>

)}
    </div>

    {/* 💬 TalkJS chat container */}
    <div
      id="talkjs-container"
      className="w-full flex-1 relative z-[1000001]"
      style={{ position: "relative" }}
    ></div>

    {/* ❌ Close chat button */}
    <button
      onClick={() => {
        const container = document.getElementById("talkjs-container");
        if (container) container.innerHTML = "";

        if (popupRef.current && sessionRef.current) {
          popupRef.current.hide?.();
          sessionRef.current.destroy();
          popupRef.current = null;
          sessionRef.current = null;
        }

        setShowMobileInbox(false);
      }}
      className="absolute bottom-5 left-5 z-[1000002] bg-pink-600 text-white rounded-full px-4 py-2 shadow"
    >
      ✕
    </button>
  </div>
)}


  </>
  
  );
}
