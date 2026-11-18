"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, errorCodeKey, type Locale, type TranslationKey } from "@/lib/i18n/dictionaries";

type Values = Record<string, string | number>;
type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey, values?: Values) => string;
  tError: (code: string | undefined, fallback: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const STORAGE_KEY = "beginning-locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initial: Locale = saved === "en" || saved === "zh" ? saved : "zh";
    const timer = window.setTimeout(() => setLocaleState(initial), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-Hans" : "en";
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale(nextLocale) {
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
      setLocaleState(nextLocale);
    },
    toggleLocale() {
      const nextLocale = locale === "zh" ? "en" : "zh";
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
      setLocaleState(nextLocale);
    },
    t(key, values) {
      let text = dictionaries[locale][key];
      if (!values) return text;
      for (const [name, replacement] of Object.entries(values)) text = text.replaceAll(`{${name}}`, String(replacement));
      return text;
    },
    tError(code, fallback) {
      const key = (code && errorCodeKey[code]) || fallback;
      return dictionaries[locale][key];
    },
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function LanguageSwitch({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const { locale, toggleLocale, t } = useI18n();
  return <button type="button" className={`language-switch ${className}`.trim()} style={style} onClick={toggleLocale} aria-label={t("common.language")}><span>{locale === "zh" ? "EN" : "中"}</span></button>;
}
