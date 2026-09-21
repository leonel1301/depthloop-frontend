"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyLocale, isLocale, readStoredLocale, type Locale } from "./locale";
import { translate, type MessageKey } from "./messages";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  sessionLocale,
}: {
  children: ReactNode;
  sessionLocale?: string | null;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    const next = isLocale(sessionLocale) ? sessionLocale : readStoredLocale();
    applyLocale(next);
    setLocaleState(next);
  }, [sessionLocale]);

  const setLocale = useCallback((next: Locale) => {
    applyLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useI18n requires LocaleProvider");
  return value;
}

export function useI18nOptional() {
  return useContext(LocaleContext);
}
