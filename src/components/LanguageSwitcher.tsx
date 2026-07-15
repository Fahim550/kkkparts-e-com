import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const [currentLang, setCurrentLang] = useState<"en" | "ar">("en");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(new RegExp("(^| )googtrans=([^;]+)"));
    if (match) {
      const val = match[2];
      if (val.includes("/ar")) {
        setCurrentLang("ar");
        document.documentElement.dir = "rtl";
        document.documentElement.lang = "ar";
      } else {
        setCurrentLang("en");
        document.documentElement.dir = "ltr";
        document.documentElement.lang = "en";
      }
    } else {
      setCurrentLang("en");
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
    }
  }, []);

  const switchLanguage = (lang: "en" | "ar") => {
    setIsOpen(false);
    localStorage.setItem("language_selected", "true");
    if (lang === currentLang) return;

    // Try to trigger Google Translate without reload
    const select = document.querySelector(
      ".goog-te-combo",
    ) as HTMLSelectElement;
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));

      setCurrentLang(lang);
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    } else {
      // Fallback: use cookies and reload if the widget isn't fully initialized
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

  return (
    <div
      className="relative flex items-center cursor-pointer notranslate"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Mobile/Desktop Icon Style */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/50 text-foreground transition-all duration-300 hover:text-neon hover:bg-secondary"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="w-[18px] h-[18px]" />
      </div>

      {/* Text (Hidden on mobile) */}
      <span
        className="hidden sm:inline-block ml-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-neon transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentLang === "en" ? "EN" : "عربي"}
      </span>

      {/* Dropdown */}
      <div
        className={`absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-32 bg-background border border-border shadow-xl rounded-xl transition-all duration-300 flex flex-col py-2 z-[60] ${isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            switchLanguage("en");
          }}
          className={`px-4 py-2.5 text-left text-sm hover:bg-secondary/50 hover:text-neon transition-colors ${currentLang === "en" ? "text-neon font-bold" : "text-foreground"}`}
        >
          English
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            switchLanguage("ar");
          }}
          className={`px-4 py-2.5 text-left text-sm hover:bg-secondary/50 hover:text-neon transition-colors ${currentLang === "ar" ? "text-neon font-bold" : "text-foreground"}`}
          dir="rtl"
        >
          العربية
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
