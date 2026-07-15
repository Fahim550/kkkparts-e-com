// Facebook Pixel dynamic loader and event tracker
// All settings come from the database via useTrackingSettings hook

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

let pixelInitialized = false;
let currentPixelId = "";

export function initFacebookPixel(pixelId: string) {
  if (!pixelId || (pixelInitialized && currentPixelId === pixelId)) return;

  // Remove existing pixel script if pixel ID changed
  if (pixelInitialized && currentPixelId !== pixelId) {
    const existingScript = document.getElementById("fb-pixel-script");
    if (existingScript) existingScript.remove();
    pixelInitialized = false;
    window.fbq = undefined;
    window._fbq = undefined;
  }

  // Facebook Pixel base code
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    t.id = "fb-pixel-script";
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js",
  );

  window.fbq("init", pixelId);
  pixelInitialized = true;
  currentPixelId = pixelId;
}

export function removeFacebookPixel() {
  const script = document.getElementById("fb-pixel-script");
  if (script) script.remove();
  // Remove noscript pixel img
  const noscript = document.getElementById("fb-pixel-noscript");
  if (noscript) noscript.remove();
  window.fbq = undefined;
  window._fbq = undefined;
  pixelInitialized = false;
  currentPixelId = "";
}

function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface TrackEventOptions {
  eventName: string;
  data?: Record<string, any>;
  eventId?: string;
}

export function trackPixelEvent({
  eventName,
  data,
  eventId,
}: TrackEventOptions): string {
  const eid = eventId || generateEventId();
  if (window.fbq) {
    if (eventName === "PageView") {
      window.fbq("track", "PageView", undefined, { eventID: eid });
    } else {
      window.fbq("track", eventName, data, { eventID: eid });
    }
  }
  return eid;
}

// Standard event helpers
export function trackPageView() {
  return trackPixelEvent({ eventName: "PageView" });
}

export function trackViewContent(params: {
  content_ids: string[];
  content_name: string;
  content_category: string;
  value: number;
  currency: string;
  content_type?: string;
}) {
  return trackPixelEvent({
    eventName: "ViewContent",
    data: { ...params, content_type: params.content_type || "product" },
  });
}

export function trackAddToCart(params: {
  content_ids: string[];
  content_name: string;
  value: number;
  currency: string;
  content_type?: string;
  num_items?: number;
}) {
  return trackPixelEvent({
    eventName: "AddToCart",
    data: { ...params, content_type: params.content_type || "product" },
  });
}

export function trackInitiateCheckout(params: {
  content_ids: string[];
  value: number;
  currency: string;
  num_items: number;
  content_type?: string;
}) {
  return trackPixelEvent({
    eventName: "InitiateCheckout",
    data: { ...params, content_type: params.content_type || "product" },
  });
}

export function trackPurchase(params: {
  content_ids: string[];
  value: number;
  currency: string;
  num_items: number;
  order_id?: string;
  content_type?: string;
}) {
  return trackPixelEvent({
    eventName: "Purchase",
    data: { ...params, content_type: params.content_type || "product" },
  });
}

export function trackLead(params?: { value?: number; currency?: string }) {
  return trackPixelEvent({ eventName: "Lead", data: params });
}

export function trackCompleteRegistration(params?: {
  value?: number;
  currency?: string;
  status?: string;
}) {
  return trackPixelEvent({ eventName: "CompleteRegistration", data: params });
}
