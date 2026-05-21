import { defaultLocale, locales, type Locale } from './settings';

/** Path without leading locale segment, e.g. `/catalog` or `/`. */
export type PathWithoutLocale = string;

export function localizedPath(locale: Locale, path: PathWithoutLocale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/') {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

export function stripLocaleFromPathname(pathname: string): {
  locale: Locale | null;
  pathname: PathWithoutLocale;
} {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
    const locale = segments[0] as Locale;
    const rest = segments.slice(1).join('/');
    return { locale, pathname: rest ? `/${rest}` : '/' };
  }

  return { locale: null, pathname: pathname || '/' };
}

export function replaceLocaleInPathname(pathname: string, newLocale: Locale): string {
  const { pathname: pathWithoutLocale } = stripLocaleFromPathname(pathname);
  return localizedPath(newLocale, pathWithoutLocale);
}

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveLocaleParam(localeParam?: string): Locale {
  if (localeParam && isValidLocale(localeParam)) {
    return localeParam;
  }
  return defaultLocale;
}

/** BCP 47 language tag for `<html lang>` */
export function localeToHtmlLang(locale: Locale): string {
  const map: Record<Locale, string> = {
    en: 'en',
    ru: 'ru',
    'zh-hans': 'zh-Hans',
    'zh-hant': 'zh-Hant',
  };
  return map[locale];
}

/** hreflang code for metadata alternates */
export function localeToHrefLang(locale: Locale): string {
  const map: Record<Locale, string> = {
    en: 'en',
    ru: 'ru',
    'zh-hans': 'zh-Hans',
    'zh-hant': 'zh-Hant',
  };
  return map[locale];
}
