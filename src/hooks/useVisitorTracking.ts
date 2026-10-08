import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

let trackingSupported: boolean | null = null;

const getVisitorId = () => {
  try {
    let vid = localStorage.getItem("v_id");
    if (!vid) {
      vid = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("v_id", vid);
    }
    return vid;
  } catch {
    return `v_${Date.now()}`;
  }
};

const getSessionId = () => {
  try {
    let sid = sessionStorage.getItem("v_session");
    if (!sid) {
      sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem("v_session", sid);
    }
    return sid;
  } catch {
    return `s_${Date.now()}`;
  }
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
    if (trackingSupported === false) return;

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
        const { error } = await (supabase.from("visitor_sessions") as any).upsert(payload, {
          onConflict: "session_id",
        });
        if (error) {
          trackingSupported = false;
          return;
        }
        trackingSupported = true;
      } catch {
        trackingSupported = false;
        return;
      }

      // Heartbeat every 60s to keep online status if supported
      heartbeatRef.current = setInterval(async () => {
        if (!trackingSupported) return;
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
      if (!trackingSupported) return;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/visitor_sessions?session_id=eq.${sessionId}`;
      navigator.sendBeacon?.(url);
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (trackingSupported === false) return;
    if (location.pathname.startsWith("/admin")) return;

    const sessionId = getSessionId();
    const visitorId = getVisitorId();

    const trackPage = async () => {
      try {
        const { error } = await (supabase.from("page_views") as any).insert({
          session_id: sessionId,
          visitor_id: visitorId,
          page_url: location.pathname,
          page_title: document.title,
        });
        if (error) {
          trackingSupported = false;
          return;
        }

        await (supabase.from("visitor_sessions") as any)
          .update({
            exit_page: location.pathname,
            last_active_at: new Date().toISOString(),
            is_online: true,
          })
          .eq("session_id", sessionId);
      } catch {
        trackingSupported = false;
      }
    };

    trackPage();
  }, [location.pathname]);
};
