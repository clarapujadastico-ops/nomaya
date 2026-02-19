import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations } from "@/locales/translations";
import { useProfile } from "@/hooks/useProfile";

type Lang = "en" | "es";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile();
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("nomaya_lang");
    return (saved === "es" || saved === "en") ? saved : "en";
  });

  // Sync with profile language
  useEffect(() => {
    if (profile?.language === "es" || profile?.language === "en") {
      setLangState(profile.language as Lang);
    }
  }, [profile?.language]);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("nomaya_lang", l);
  }

  function t(key: string): string {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? entry["en"] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
