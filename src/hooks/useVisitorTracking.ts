import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const getVisitorId = () => {
  let vid = localStorage.getItem("v_id");
  if (!vid) {
    vid = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("v_id", vid);
  }
  return vid;
};

const getSessionId = () => {
  let sid = sessionStorage.getItem("v_session");
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("v_session", sid);
  }
  return sid;
};

const getDeviceType = () => {
  const w = window.innerWidth;
  if (w < 768) return "Mobile";
  if (w < 1024) return "Tablet";
  return "Desktop";
};

const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("SamsungBrowser")) return "Samsung Browser";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
};

const getOS = () => {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Linux")) return "Linux";
  return "Other";
};

export const useVisitorTracking = () => {
  const location = useLocation();
  const initialized = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sessionId = getSessionId();
    const visitorId = getVisitorId();

    const initSession = async () => {
      if (initialized.current) return;
      initialized.current = true;

      const payload = {
        session_id: sessionId,
        visitor_id: visitorId,
        device_type: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        referrer: document.referrer || "Direct",
        entry_page: location.pathname,
        exit_page: location.pathname,
        is_online: true,
        last_active_at: new Date().toISOString(),
      };

      try {
        await (supabase.from("visitor_sessions") as any).upsert(payload, {
          onConflict: "session_id",
        });
      } catch {}

      // Heartbeat every 60s to keep online status
      heartbeatRef.current = setInterval(async () => {
        try {
          await (supabase.from("visitor_sessions") as any)
            .update({
              is_online: true,
              last_active_at: new Date().toISOString(),
            })
            .eq("session_id", sessionId);
        } catch {}
      }, 60_000);
    };

    initSession();

    // Mark offline on page unload
    const handleUnload = () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/visitor_sessions?session_id=eq.${sessionId}`;
      navigator.sendBeacon?.(url); // best effort
      // Also try fetch with keepalive
      try {
        fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            is_online: false,
            exit_page: location.pathname,
          }),
          keepalive: true,
        });
      } catch {}
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  // Track page views on route change
  useEffect(() => {
    const sessionId = getSessionId();
    const visitorId = getVisitorId();

    // Skip admin pages
    if (location.pathname.startsWith("/admin")) return;

    const trackPage = async () => {
      try {
        await (supabase.from("page_views") as any).insert({
          session_id: sessionId,
          visitor_id: visitorId,
          page_url: location.pathname,
          page_title: document.title,
        });

        // Update exit page & last_active
        await (supabase.from("visitor_sessions") as any)
          .update({
            exit_page: location.pathname,
            last_active_at: new Date().toISOString(),
            is_online: true,
          })
          .eq("session_id", sessionId);
      } catch {}
    };

    trackPage();
  }, [location.pathname]);
};
