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
