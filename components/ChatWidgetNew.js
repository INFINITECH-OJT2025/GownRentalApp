import { useEffect, useRef, useState } from "react";

const getImageUrl = (img) => {
  if (!img) return null;
  return img.startsWith("http")
    ? img
    : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/profile_pictures/${img}`;
};

export default function ChatWidgetNew({ currentUser, customers = [], hasNewMessage, setLoading, setChatAllowed, chatLoading }) {
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
  

  useEffect(() => {
    window.onerror = function (message, source, lineno, colno, error) {
      if (source?.includes("talk.js")) {
        console.warn("🛑 TalkJS crashed:", error || message);
        // Reset UI silently
        setChatLoaded(false);
        setShowDesktopInbox(false);
        setShowMobileInbox(false);
        return true; // prevent default logging
      }
    };
  
    return () => {
      window.onerror = null;
    };
  }, []);
  
  const initTalk = async (userA, userB = null) => {
    let Talk;
  
    try {
      Talk = await import("talkjs").then((mod) => mod.default);
      Talk.env = "development";
      await Talk.ready;
    } catch (err) {
      console.warn("❌ TalkJS failed to load (maybe adblock or offline):", err);
  
      const isTalkNetworkError =
        err?.message?.includes("Failed to fetch") ||
        (err?.stack || "").includes("talk.js");
  
      if (isTalkNetworkError) {
        setChatAllowed(false);
        setLoading(false); // 🔴 EARLY EXIT 1
        setShowDesktopInbox(false);
        setShowMobileInbox(false);
        return;
      }
  
      throw err;
    }
  
    if (!window.navigator.onLine) {
      console.warn("⚠️ You're offline.");
      setChatAllowed(false);
      setLoading(false); // 🔴 EARLY EXIT 2
      setShowDesktopInbox(false);
      setShowMobileInbox(false);
      return;
    }
  
    try {
      const me = new Talk.User({
        id: String(userA.id),
        name: userA.name,
        email: userA.email,
        photoUrl: getImageUrl(userA.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userA.name)}`,
        role: userA.role,
      });
  
      let session;
      try {
        session = new Talk.Session({ appId: "t8oVirii", me });
      } catch (err) {
        console.error("❌ Talk.Session init error:", err);
        setChatAllowed(false);
        setLoading(false); // 🔴 EARLY EXIT 3
        setShowDesktopInbox(false);
        setShowMobileInbox(false);
        return;
      }
  
      sessionRef.current = session;
      session.setDesktopNotificationEnabled(true);
  
      session.on("message", (event) => {
        try {
          const msg = event?.message;
          const sender = msg?.sender;
          if (!msg || !sender || !sender.id || !msg.body) return;
          if (String(sender.id) === String(currentUser.id)) return;
  
          setLocalHasNewMessage(true);
  
          if (Notification.permission === "granted" && desktopNotifications) {
            new Notification(`💬 New message from ${sender.name}`, {
              body: msg.body,
              icon: getImageUrl(sender.photoUrl) || "/default-avatar.png",
            });
          }
        } catch (err) {
          console.warn("🔕 Error handling incoming message:", err);
        }
      });
  
      const inbox = session.createInbox({
        selected: null,
        showSendAttachments: true,
        ...(isMobile
          ? { showHeader: false }
          : {
              style: {
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                border: "none",
              },
            }),
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
  
      const containerId = isMobile ? "talkjs-container" : "talkjs-desktop-inbox-container";
      const mountTarget = document.getElementById(containerId);
  
      try {
        const mountPromise = inbox.mount(mountTarget);
        await Promise.race([
          mountPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Mount timeout (possibly blocked)")), 20000)
          ),
        ]);
      } catch (err) {
        console.warn("⚠️ TalkJS inbox mount failed or was blocked:", err.message);
        setChatAllowed(false);
        setLoading(false); // 🔴 EARLY EXIT 4
        setShowDesktopInbox(false);
        setShowMobileInbox(false);
        return;
      }
  
      popupRef.current = inbox;
  
      if (!isMobile) {
        setTimeout(() => {
          const iframe = document.querySelector("#talkjs-desktop-inbox-container iframe");
          if (iframe) {
            iframe.style.zIndex = "10050";
            iframe.style.position = "relative";
          }
        }, 500); // Wait a moment after mount
        
      }
  
      if (userB) {
        const other = new Talk.User({
          id: String(userB.id),
          name: userB.name,
          email: userB.email,
          photoUrl: getImageUrl(userB.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userB.name)}`,
          role: userB.role || "customer",
        });
  
        const conversation = session.getOrCreateConversation(Talk.oneOnOneId(me, other));
        conversation.setParticipant(me);
        conversation.setParticipant(other);
        inbox.select(conversation);
      }
  
      setLoading(false); // ✅ FINAL SUCCESS PATH
    } catch (err) {
      console.error("⚠️ Chat failed to load:", err);
      setChatAllowed(false);
      setLoading(false); // 🔴 FINAL CATCH
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
      setChatLoaded(true); // ✅ ADD THIS for loader to show
  
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
  className="fixed bottom-12 right-5 z-[10010] rounded-xl shadow-lg bg-white border flex flex-col"
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
          {isAdmin ? "Select a customer who logged in today" : "Select to Connect with Admin"}
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
      if (user.is_active === 1) {
        label += " - 🟢 Active";
      } else if (user.is_active === 0) {
        label += " - 🔴 Inactive";
      }
      
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
    {chatLoaded && showDesktopInbox && chatLoading && (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
    <img
      src="/gownrentalsicon.svg"
      alt="Loading..."
      className="w-20 h-20 animate-spin"
    />
  </div>
)}


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
  <div className="fixed top-12 left-0 right-0 bottom-0 z-[10050] bg-white flex flex-col">
    
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
if (user.is_active) {
  label += " - 🟢 Active now";
}

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
    {chatLoaded && showMobileInbox && chatLoading && (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
    <img
      src="/gownrentalsicon.svg"
      alt="Loading..."
      className="w-20 h-20 animate-spin"
    />
  </div>
)}


    <div
  id="talkjs-container"
  className="w-full flex-1 relative z-[10051]"
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
