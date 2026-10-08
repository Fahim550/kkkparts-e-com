import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Globe, Loader2, X } from "lucide-react";

const LanguagePopup = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const location = useLocation();

  // Never show language popup on admin, staff, or dealer portals
  const isAdminOrPortal =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/salesman") ||
    location.pathname.startsWith("/dealer");

  useEffect(() => {
    if (isAdminOrPortal) return;

    try {
      const hasSelected = localStorage.getItem("language_selected");
      if (!hasSelected) {
        const timer = setTimeout(() => setShow(true), 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // Safe fallback if localStorage is unavailable
    }
  }, [isAdminOrPortal]);

  const closePopup = () => {
    try {
      localStorage.setItem("language_selected", "true");
    } catch {}
    setShow(false);
    setLoading(null);
  };

  const selectLanguage = (lang: "en" | "ar") => {
    try {
      localStorage.setItem("language_selected", "true");
      localStorage.setItem("visitor_language", lang);
    } catch {}

    if (lang === "en") {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
      setShow(false);
      setLoading(null);
      return;
    }

    setLoading(lang);

    // Try to trigger Google Translate without reload
    const select = document.querySelector(
      ".goog-te-combo",
    ) as HTMLSelectElement;

    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));

      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";

      setTimeout(() => {
        setShow(false);
        setLoading(null);
      }, 500);
    } else {
      // Set cookies for translation widget when it arrives
      try {
        document.cookie = `googtrans=/en/ar; path=/`;
        document.cookie = `googtrans=/en/ar; domain=${window.location.hostname}; path=/`;
      } catch {}
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";

      // Poll briefly for Google Translate combo without forcing full reload
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement;
        if (combo) {
          combo.value = "ar";
          combo.dispatchEvent(new Event("change"));
          clearInterval(interval);
          setShow(false);
          setLoading(null);
        } else if (attempts >= 8) {
          clearInterval(interval);
          setShow(false);
          setLoading(null);
        }
      }, 250);
    }
  };

  if (!show || isAdminOrPortal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-300">
        <button
          onClick={closePopup}
          className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
          aria-label="Close language selector"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4 text-neon">
            <Globe className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-extrabold mb-2 uppercase tracking-wide">
            Select Language
          </h2>
          <p className="text-muted-foreground text-sm mb-8 font-body">
            Please select your preferred language to continue browsing.
          </p>

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={() => selectLanguage("en")}
              disabled={loading !== null}
              className="w-full py-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 font-bold transition-all flex items-center justify-center gap-2 text-lg hover:shadow-lg disabled:opacity-70"
            >
              {loading === "en" && <Loader2 className="w-5 h-5 animate-spin" />}
              English
            </button>
            <button
              onClick={() => selectLanguage("ar")}
              disabled={loading !== null}
              className="w-full py-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 font-bold transition-all flex items-center justify-center gap-2 text-lg hover:shadow-lg disabled:opacity-70"
              dir="rtl"
            >
              {loading === "ar" && <Loader2 className="w-5 h-5 animate-spin" />}
              العربية (Arabic)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguagePopup;
