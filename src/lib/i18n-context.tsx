"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type Lang } from "@/lib/i18n";
import { translations } from "@/lib/i18n";

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "es",
  setLang: () => {},
  t: (key) => key,
});

function getLang(): Lang {
  if (typeof window === "undefined") return "es";
  const stored = localStorage.getItem("recepia-lang") as Lang | null;
  if (stored === "es" || stored === "en") return stored;
  const browserLang = navigator.language?.slice(0, 2);
  return browserLang === "es" ? "es" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getLang);

  useEffect(() => {
    const actual = getLang();
    if (actual !== lang) setLangState(actual);
  }, []);

  const handleSetLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("recepia-lang", l);
  };

  const t = (key: string): string => {
    const dict = translations[lang] as Record<string, string> | undefined;
    const esDict = translations["es"] as Record<string, string>;
    return dict?.[key] ?? esDict[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
