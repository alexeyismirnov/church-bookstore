import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale, locales, type Locale } from './app/i18n/settings';

const LOCALE_COOKIE = 'locale';

function detectLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  const acceptLang = request.headers.get('accept-language') ?? '';
  const lower = acceptLang.toLowerCase();
  if (lower.includes('zh-hant') || lower.includes('zh-tw') || lower.includes('zh-hk')) {
    return 'zh-hant';
  }
  if (lower.includes('zh-hans') || lower.includes('zh-cn')) {
    return 'zh-hans';
  }
  if (lower.includes('ru')) {
    return 'ru';
  }

  return defaultLocale;
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
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return response;
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|images|manifest.json|robots.txt|sitemap.xml).*)',
  ],
};
