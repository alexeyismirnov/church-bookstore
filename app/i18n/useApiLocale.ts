// app/i18n/useApiLocale.ts
// Hook for getting the current locale for API calls

'use client';

import { useLanguage, type Locale } from './LanguageContext';

/**
 * Hook to get the current locale for use in API calls
 * This ensures that API requests to Oscar backend use the correct language
 */
export function useApiLocale(): Locale {
  const { locale } = useLanguage();
  return locale;
}

/**
 * Convert locale to the format expected by Oscar API
 * Oscar uses: en, ru, zh-hans, zh-hant
 */
export function getOscarLocale(locale: Locale): string {
  return locale;
}

/**
 * Convert locale to the format used in Oscar API response fields
 * Oscar API uses: title_en, title_ru, title_zh_hans, title_zh_hant
 */
export function getOscarFieldSuffix(locale: Locale): string {
  const suffixMap: Record<Locale, string> = {
    en: 'en',
    ru: 'ru',
    'zh-hans': 'zh_hans',
    'zh-hant': 'zh_hant',
  };
  return suffixMap[locale];
}
