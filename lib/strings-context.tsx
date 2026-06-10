"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { localeStrings, type Locale, type UIStrings } from "./strings";

const StringsContext = createContext<UIStrings>(localeStrings.zh);
const LocaleContext = createContext<Locale>("zh");
const SetLocaleContext = createContext<(locale: Locale) => void>(() => {});

const LOCALE_STORAGE_KEY = "omnistack-locale";

function detectLocale(): Locale {
  return "zh";
}

export function StringsProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    // localStorage preference takes priority over browser language
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (saved === "en" || saved === "zh") {
      setLocaleState(saved);
    } else {
      setLocaleState(detectLocale());
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    setLocaleState(newLocale);
  }, []);

  return (
    <SetLocaleContext.Provider value={setLocale}>
      <LocaleContext.Provider value={locale}>
        <StringsContext.Provider value={localeStrings[locale]}>
          {children}
        </StringsContext.Provider>
      </LocaleContext.Provider>
    </SetLocaleContext.Provider>
  );
}

export function useStrings(): UIStrings {
  return useContext(StringsContext);
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useSetLocale(): (locale: Locale) => void {
  return useContext(SetLocaleContext);
}
