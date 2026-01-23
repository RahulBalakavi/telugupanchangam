import { useState, useEffect, createContext, useContext } from "react";

type Language = "telugu" | "english";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (telugu: string, english: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguageProvider() {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("panchangam-language");
      return (saved as Language) || "english";
    }
    return "english";
  });

  useEffect(() => {
    localStorage.setItem("panchangam-language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (telugu: string, english: string): string => {
    return language === "telugu" ? telugu : english;
  };

  return { language, setLanguage, t };
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export { LanguageContext };
export type { Language, LanguageContextType };
