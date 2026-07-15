import { useEffect, useState } from "react";
import { Globe, Loader2 } from "lucide-react";

const LanguagePopup = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const hasSelected = localStorage.getItem("language_selected");
    if (!hasSelected) {
      // Small delay for better UX
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const selectLanguage = (lang: "en" | "ar") => {
    setLoading(lang);
    localStorage.setItem("language_selected", "true");

    // Try to trigger Google Translate without reload
    const select = document.querySelector(
      ".goog-te-combo",
    ) as HTMLSelectElement;
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));

      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = lang;

      // Allow translation to apply before closing popup
      setTimeout(() => {
        setShow(false);
        setLoading(null);
      }, 600);
    } else {
      // Fallback: set cookies and reload if the widget isn't fully loaded
      if (lang === "ar") {
        document.cookie = `googtrans=/en/ar; path=/`;
        document.cookie = `googtrans=/en/ar; domain=${window.location.hostname}; path=/`;
      } else {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
        document.cookie = `googtrans=/en/en; path=/`;
        document.cookie = `googtrans=/en/en; domain=${window.location.hostname}; path=/`;
      }
      window.location.reload();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-300">
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
