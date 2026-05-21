import { cookies } from 'next/headers';
import { resolveLocaleParam } from '../i18n/routing';
import {
  currencies,
  defaultCurrency,
  defaultLocale,
  locales,
  type Currency,
  type Locale,
} from '../i18n/settings';

export function resolveLocaleFromParams(localeParam?: string): Locale {
  return resolveLocaleParam(localeParam);
}

/** Currency still follows cookie/profile preference; locale comes from the URL. */
export async function resolveCurrencyFromParams(): Promise<Currency> {
  return resolveCurrencyFromCookies();
}

export async function resolveLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies();
  const profileLocale = cookieStore.get('profile_locale')?.value as Locale | undefined;
  const localeCookie = cookieStore.get('locale')?.value as Locale | undefined;

  if (profileLocale && locales.includes(profileLocale)) return profileLocale;
  if (localeCookie && locales.includes(localeCookie)) return localeCookie;
  return defaultLocale;
}

export async function resolveCurrencyFromCookies(): Promise<Currency> {
  const cookieStore = await cookies();
  const profileCurrency = cookieStore.get('profile_currency')?.value as Currency | undefined;
  const currencyCookie = cookieStore.get('currency')?.value as Currency | undefined;

  if (profileCurrency && currencies.includes(profileCurrency)) return profileCurrency;
  if (currencyCookie && currencies.includes(currencyCookie)) return currencyCookie;
  return defaultCurrency;
}
