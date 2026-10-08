import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useSettings } from "@/hooks/useDatabase";
import { translations, Language } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  t: (key: string) => string;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  t: (key) => key,
  isRTL: false,
  setLanguage: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { data: settings } = useSettings();
  const defaultLang = "en" as Language;
  const [language, setLanguageState] = useState<Language>(() => {
    return defaultLang;
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("visitor_language") as Language | null;
      if (stored && (stored === "en" || stored === "ar")) {
        setLanguageState(stored);
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    try {
      localStorage.setItem("visitor_language", lang);
    } catch {}
    setLanguageState(lang);
  };
  const isRTL = false;

  const t = (key: string): string => {
    return translations[language]?.[key] || translations["en"]?.[key] || key;
  };

  useEffect(() => {
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "en";
  }, []);

  return (
    <LanguageContext.Provider value={{ language, t, isRTL, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
