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

const DEFAULT_LOCALE: Locale = "zh-TW";
const SUPPORTED_LOCALES: Locale[] = ["zh-TW", "zh", "en", "ja", "ko"];
const HTML_LANG: Record<Locale, string> = {
  "zh-TW": "zh-Hant",
  zh: "zh-Hans",
  en: "en",
  ja: "ja",
  ko: "ko",
};

const StringsContext = createContext<UIStrings>(localeStrings[DEFAULT_LOCALE]);
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);
const SetLocaleContext = createContext<(locale: Locale) => void>(() => {});

const LOCALE_STORAGE_KEY = "omnistack-locale";

function detectLocale(): Locale {
  return DEFAULT_LOCALE;
}

export function StringsProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    // localStorage preference takes priority over browser language
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (saved && SUPPORTED_LOCALES.includes(saved)) {
      setLocaleState(saved);
    } else {
      setLocaleState(detectLocale());
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = HTML_LANG[newLocale];
    setLocaleState(newLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

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
