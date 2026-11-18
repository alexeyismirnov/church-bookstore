import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  currencies,
  defaultCurrencyForLocale,
  defaultLocale,
  locales,
  type Currency,
  type Locale,
} from './app/i18n/settings';

const LOCALE_COOKIE = 'locale';
const CURRENCY_COOKIE = 'currency';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function mapLanguageTagToLocale(tag: string): Locale | null {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return null;

  if (
    normalized === 'zh-hant' ||
    normalized === 'zh-tw' ||
    normalized === 'zh-hk' ||
    normalized.startsWith('zh-hant-') ||
    normalized.startsWith('zh-tw-') ||
    normalized.startsWith('zh-hk-')
  ) {
    return 'zh-hant';
  }

  if (
    normalized === 'zh-hans' ||
    normalized === 'zh-cn' ||
    normalized === 'zh-sg' ||
    normalized.startsWith('zh-hans-') ||
    normalized.startsWith('zh-cn-') ||
    normalized.startsWith('zh-sg-')
  ) {
    return 'zh-hans';
  }

  if (normalized === 'ru' || normalized.startsWith('ru-')) {
    return 'ru';
  }

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  if (normalized === 'zh') {
    // For ambiguous Chinese, default to simplified.
    return 'zh-hans';
  }

  return null;
}

function parseAcceptLanguageHeader(header: string): Locale | null {
  if (!header.trim()) return null;

  const parsed = header
    .split(',')
    .map((item, index) => {
      const [rawTag, ...params] = item.trim().split(';');
      let q = 1;
      for (const param of params) {
        const [key, value] = param.trim().split('=');
        if (key?.toLowerCase() === 'q') {
          const parsedQ = Number.parseFloat(value);
          if (Number.isFinite(parsedQ)) q = parsedQ;
        }
      }
      return { tag: rawTag, q, index };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => (b.q === a.q ? a.index - b.index : b.q - a.q));

  for (const entry of parsed) {
    const locale = mapLanguageTagToLocale(entry.tag);
    if (locale) return locale;
  }

  return null;
}

function detectLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  const acceptLang = request.headers.get('accept-language');
  if (acceptLang) {
    const parsedLocale = parseAcceptLanguageHeader(acceptLang);
    if (parsedLocale) return parsedLocale;
  }

  return defaultLocale;
}

function hasCurrencyCookie(request: NextRequest): boolean {
  const value = request.cookies.get(CURRENCY_COOKIE)?.value;
  return Boolean(value && currencies.includes(value as Currency));
}

/** Persist first-visit currency from locale; never overwrite an existing choice. */
function ensureCurrencyCookie(response: NextResponse, request: NextRequest, locale: Locale): void {
  if (hasCurrencyCookie(request)) return;

  response.cookies.set(CURRENCY_COOKIE, defaultCurrencyForLocale(locale), {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matchedLocale = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (matchedLocale) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, matchedLocale, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    ensureCurrencyCookie(response, request, matchedLocale);
    return response;
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
  const response = NextResponse.redirect(url);
  ensureCurrencyCookie(response, request, locale);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|images|manifest.json|robots.txt|sitemap.xml).*)',
  ],
};
