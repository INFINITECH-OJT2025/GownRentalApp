import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";

const getImageUrl = (img) => {
  if (!img || img.trim() === "") return null;
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

  const [dropdownOpen, setDropdownOpen] = useState(false);

const handleSelect = async (user) => {
  setSelectedCustomer(user);
  setDropdownOpen(false);

  if (!sessionRef.current) return;
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
};


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
      
        if (isAdmin) {
          const today = new Date().toISOString().split("T")[0];
          const welcomeKey = `welcomed_${user.id}_session`;
          
          if (!localStorage.getItem(welcomeKey)) {
            conversation.sendMessage("Hello! 👋 I’m the Admin of Gown Rental. Welcome to our service! Let me know if you need any help.");
            localStorage.setItem(welcomeKey, "1");
          }
        }
        

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
            iframe.style.zIndex = "10070";
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
      className="fixed bottom-12 right-5 z-[101000] rounded-xl shadow-lg bg-white border flex flex-col"
      style={{ width: "400px", height: "600px" }}
    >

    {/* 👤 Combobox at the top */}
    <div className="p-2 border-b bg-white relative z-[10]">
    <div className="relative">
  <div
    className="w-full p-2 border rounded text-sm bg-white cursor-pointer flex justify-between items-center"
    onClick={(e) => {
      e.stopPropagation();
      setDropdownOpen((prev) => !prev);
    }}
  >
    {selectedCustomer ? (
  <div className="flex items-center gap-2 w-full justify-between">
    <div className="flex items-center gap-2">
      <img
        src={getImageUrl(selectedCustomer.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.name)}`}
        className="w-6 h-6 rounded-full"
        alt="Selected"
      />
      <span>{selectedCustomer.name}</span>
      <span className={selectedCustomer.is_active ? "text-green-500" : "text-red-500"}>
        {selectedCustomer.is_active ? "🟢 Active" : "🔴 Inactive"}
      </span>
    </div>
    <button
      className="text-gray-400 hover:text-red-600 ml-2 text-sm"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedCustomer(null);
        if (popupRef.current && typeof popupRef.current.select === "function") {
          popupRef.current.select(null); // Go back to inbox
        }
      }}
      
    >
      ❌
    </button>
  </div>
) : (
  <span className="text-gray-500 italic">
    {isAdmin ? "Select a customer who logged in today" : "Select to Connect with Admin"}
  </span>
)}

  </div>

  {dropdownOpen && (
    <div className="absolute mt-1 w-full border bg-white shadow-lg z-50 max-h-60 overflow-y-auto">
      {customers
        .filter((u) => u.id !== currentUser.id)
        .map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => handleSelect(user)}
          >
            <img
              src={getImageUrl(user.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
              className="w-6 h-6 rounded-full"
              alt=""
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-gray-500">{user.is_active ? "🟢 Active" : "🔴 Inactive"}</span>
            </div>
          </div>
        ))}
    </div>
  )}
</div>

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
          <MessageSquare className="w-8 h-8" />
      </button>
      {localHasNewMessage && (
        <span className="absolute -top-1 -right-1 bg-red-600 w-3 h-3 rounded-full animate-ping" />
      )}
    </div>
  
    {/* Mobile Fullscreen Chat */}
{/* Mobile Fullscreen Chat */}
{isMobile && showMobileInbox && (
  <div className="fixed top-20 left-0 right-0 bottom-0 z-[10050] bg-white flex flex-col">
    
    {/* 🧭 Header with Title + ComboBox */}
    <div className="flex flex-col gap-2 px-4 py-2 border-b bg-white z-[1000002]">
    <div className="relative">
  <div
    className="w-full p-2 border rounded text-sm bg-white cursor-pointer flex justify-between items-center"
    onClick={(e) => {
      e.stopPropagation();
      setDropdownOpen((prev) => !prev);
    }}
  >
   {selectedCustomer ? (
  <div className="flex items-center justify-between gap-2 w-full">
    <div className="flex items-center gap-2">
      <img
        src={getImageUrl(selectedCustomer.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.name)}`}
        className="w-6 h-6 rounded-full"
        alt="Profile"
      />
      <span className="text-sm">{selectedCustomer.name}</span>
      <span className={`text-xs ${selectedCustomer.is_active ? "text-green-500" : "text-red-500"}`}>
        {selectedCustomer.is_active ? "🟢 Active" : "🔴 Inactive"}
      </span>
    </div>
    <button
      className="text-gray-400 hover:text-red-600 text-sm"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedCustomer(null);
        if (popupRef.current && typeof popupRef.current.select === "function") {
          popupRef.current.select(null); // Go back to inbox
        }
      }}
      
    >
      ❌
    </button>
  </div>
) : (
  <span className="text-gray-500 text-sm">
    {isAdmin ? "Select a customer who logged in today" : "Select to Connect with Admin"}
  </span>
)}

  </div>

  {dropdownOpen && (
    <div className="absolute mt-1 w-full border bg-white shadow-lg z-50 max-h-60 overflow-y-auto">
      {customers
        .filter((u) => u.id !== currentUser.id)
        .map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => handleSelect(user)}
          >
            <img
              src={getImageUrl(user.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
              className="w-6 h-6 rounded-full"
              alt="Profile"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-gray-500">{user.is_active ? "🟢 Active now" : "🔴 Inactive"}</span>
            </div>
          </div>
        ))}
    </div>
  )}
</div>

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
