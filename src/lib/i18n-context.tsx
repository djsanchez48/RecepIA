"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type Lang, t as translate } from "@/lib/i18n";

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Parameters<typeof translate>[1]) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "es",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("recepia-lang") as Lang | null;
    if (stored === "es" || stored === "en") {
      setLangState(stored);
    } else {
      const browserLang = navigator.language?.slice(0, 2);
      setLangState(browserLang === "es" ? "es" : "en");
    }
    setReady(true);
  }, []);

  const handleSetLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("recepia-lang", l);
  };

  if (!ready) {
    return (
      <I18nContext.Provider
        value={{
          lang: "es",
          setLang: handleSetLang,
          t: (k) => translate("es", k),
        }}
      >
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang: handleSetLang,
        t: (k) => translate(lang, k),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
