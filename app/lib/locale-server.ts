import { cookies } from 'next/headers';
import { resolveLocaleParam } from '../i18n/routing';
import {
  currencies,
  defaultCurrency,
  defaultCurrencyForLocale,
  defaultLocale,
  locales,
  type Currency,
  type Locale,
} from '../i18n/settings';

export function resolveLocaleFromParams(localeParam?: string): Locale {
  return resolveLocaleParam(localeParam);
}

/**
 * Currency follows cookie/profile preference; on first visit (no cookie)
 * falls back to a locale-based default (zh-hans→CNY, zh-hant→HKD, else USD).
 */
export async function resolveCurrencyFromParams(locale?: Locale): Promise<Currency> {
  return resolveCurrencyFromCookies(locale);
}

export async function resolveLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies();
  const profileLocale = cookieStore.get('profile_locale')?.value as Locale | undefined;
  const localeCookie = cookieStore.get('locale')?.value as Locale | undefined;

  if (profileLocale && locales.includes(profileLocale)) return profileLocale;
  if (localeCookie && locales.includes(localeCookie)) return localeCookie;
  return defaultLocale;
}

export async function resolveCurrencyFromCookies(fallbackLocale?: Locale): Promise<Currency> {
  const cookieStore = await cookies();
  const profileCurrency = cookieStore.get('profile_currency')?.value as Currency | undefined;
  const currencyCookie = cookieStore.get('currency')?.value as Currency | undefined;

  if (profileCurrency && currencies.includes(profileCurrency)) return profileCurrency;
  if (currencyCookie && currencies.includes(currencyCookie)) return currencyCookie;
  if (fallbackLocale) return defaultCurrencyForLocale(fallbackLocale);
  return defaultCurrency;
}
