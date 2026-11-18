// app/i18n/settings.ts
// Internationalization settings - matches Oscar backend languages

export const locales = ['en', 'ru', 'zh-hans', 'zh-hant'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Language metadata for UI display
export const languageNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  'zh-hans': '简体中文',
  'zh-hant': '繁體中文',
};

// Flag emoji mapping (matching Django template approach)
export const languageFlags: Record<Locale, string> = {
  en: '🇬🇧',
  ru: '🇷🇺',
  'zh-hans': '🇨🇳',
  'zh-hant': '🇭🇰',
};

// Currency settings - matches Oscar-3.1 backend X-Currency header
export const currencies = ['USD', 'HKD', 'TWD', 'CNY'] as const;
export type Currency = (typeof currencies)[number];

export const defaultCurrency: Currency = 'USD';

/** First-visit currency from browser/locale: zh-hans→CNY, zh-hant→HKD, else USD. */
export function defaultCurrencyForLocale(locale: Locale): Currency {
  if (locale === 'zh-hans') return 'CNY';
  if (locale === 'zh-hant') return 'HKD';
  return defaultCurrency;
}

// Currency symbols for UI display
export const currencySymbols: Record<Currency, string> = {
  USD: '$',
  HKD: 'HK$',
  TWD: 'NT$',
  CNY: '¥',
};

// Currency full names
export const currencyNames: Record<Currency, string> = {
  USD: 'US Dollar',
  HKD: 'Hong Kong Dollar',
  TWD: 'Taiwan Dollar',
  CNY: 'Chinese Yuan',
};
