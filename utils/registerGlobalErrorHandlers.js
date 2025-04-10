// utils/registerGlobalErrorHandlers.js

if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (e) => {
      const isTalkJSError =
        e?.reason?.message?.includes("Failed to fetch") ||
        (e?.reason?.stack || "").includes("talk.js");
  
      if (isTalkJSError) {
        e.preventDefault();
        console.warn("🧱 Silenced TalkJS error:", e.reason);
      }
    });
  
    window.onerror = function (msg, src) {
      if (src?.includes("talk.js")) {
        console.warn("🧱 TalkJS global error silenced:", msg);
        return true;
      }
    };
  }
  