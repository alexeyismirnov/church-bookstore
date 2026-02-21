// app/i18n/LanguageContext.tsx
// Client-side language context for managing language state

'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Locale, defaultLocale, locales, languageNames, languageFlags } from './settings';

// Import translations from JSON files
import enTranslations from './locales/en.json';
import ruTranslations from './locales/ru.json';
import zhHansTranslations from './locales/zh-hans.json';
import zhHantTranslations from './locales/zh-hant.json';

type TranslationDict = Record<string, any>;

const translations: Record<Locale, TranslationDict> = {
  en: enTranslations,
  ru: ruTranslations,
  'zh-hans': zhHansTranslations,
  'zh-hant': zhHantTranslations,
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to get nested value from object
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Simple interpolation helper
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    if (value === undefined) return match;
    return String(value);
  });
}

interface LanguageProviderProps {
  children: ReactNode;
  // initialLocale is read server-side from the 'locale' cookie in layout.tsx.
  // This allows the server to render in the correct language from the start,
  // eliminating the flash of English content that occurred when locale was only
  // available client-side via localStorage.
  initialLocale?: Locale;
}

export function LanguageProvider({ children, initialLocale }: LanguageProviderProps) {
  // Use the server-provided initialLocale (from cookie) if available,
  // otherwise fall back to defaultLocale.
  // Since the server reads the same cookie that the client writes, the first
  // render already has the correct locale — no visible flash.
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale && locales.includes(initialLocale) ? initialLocale : defaultLocale
  );
  // isLoading is always false because the locale is known from the first render
  // (provided via the initialLocale prop from the server-read cookie).
  const isLoading = false;

  const setLocale = useCallback((newLocale: Locale) => {
    // Write to localStorage BEFORE updating React state.
    // This ensures that when the useEffect in ProductDetailClient fires (triggered by
    // the locale state change), getApiHeaders() reads the correct new locale from
    // localStorage — avoiding a race where the effect fires before localStorage is updated.
    try {
      localStorage.setItem('locale', newLocale);
    } catch (e) {
      console.warn('Could not save language preference to localStorage');
    }
    // Also write to cookie so the server can read it on the next request and
    // render in the correct language from the start (no flash).
    try {
      // Max-age: 1 year; SameSite=Lax; path=/
      document.cookie = `locale=${newLocale}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('Could not save language preference to cookie');
    }
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[locale], key);
    if (!translation) {
      // Fallback to English
      const fallback = getNestedValue(translations.en, key);
      if (!fallback) return key;
      return interpolate(fallback, params);
    }
    return interpolate(translation, params);
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook for using translations in components (simpler API)
export function useTranslations(namespace?: string) {
  const { t, locale } = useLanguage();
  
  return useCallback((key: string, params?: Record<string, string | number>): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return t(fullKey, params);
  }, [t, namespace, locale]);
}

export { languageNames, languageFlags, locales, defaultLocale, type Locale };
