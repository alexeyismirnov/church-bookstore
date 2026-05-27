// app/i18n/useApiLocale.ts
// Hook for getting the current locale for API calls

'use client';

import { usePathname } from 'next/navigation';
import { useLanguage, type Locale } from './LanguageContext';
import { stripLocaleFromPathname } from './routing';

/**
 * Locale for API calls — prefer the URL segment so language switches apply
 * immediately on client navigation, before LanguageContext catches up.
 */
export function useApiLocale(): Locale {
  const pathname = usePathname();
  const { locale: contextLocale } = useLanguage();
  const { locale: pathLocale } = stripLocaleFromPathname(pathname);
  return pathLocale ?? contextLocale;
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
