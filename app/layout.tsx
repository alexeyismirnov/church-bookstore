// app/layout.tsx
// Updated to include LanguageProvider and dynamic locale handling

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Providers from './components/Providers';
import LocaleHandler from './components/LocaleHandler';
import { locales, defaultLocale, type Locale, currencies, defaultCurrency, type Currency } from './i18n/settings';

export const metadata: Metadata = {
  title: 'Orthodox Church Bookstore',
  description: 'Your source for Orthodox Christian books, prayer books, and spiritual resources',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read locale and currency cookies server-side so the first render already uses
  // the correct language and currency — eliminating the flash of default values
  // that occurred when these were only available client-side via localStorage.
  //
  // Priority for locale:
  //   'profile_locale' (set by AuthContext after fetchProfile/updateProfile, authoritative)
  //   > 'locale' (set by LanguageContext.setLocale on every language change)
  //   > defaultLocale fallback
  //
  // Priority for currency:
  //   'profile_currency' (set by AuthContext after fetchProfile/updateProfile, authoritative)
  //   > 'currency' (set by CurrencyContext.setCurrency on every currency change)
  //   > defaultCurrency fallback
  const cookieStore = await cookies();

  const profileLocaleCookie = cookieStore.get('profile_locale')?.value as Locale | undefined;
  const localeCookie = cookieStore.get('locale')?.value as Locale | undefined;
  const initialLocale: Locale = (profileLocaleCookie && locales.includes(profileLocaleCookie))
    ? profileLocaleCookie
    : (localeCookie && locales.includes(localeCookie))
      ? localeCookie
      : defaultLocale;

  const profileCurrencyCookie = cookieStore.get('profile_currency')?.value as Currency | undefined;
  const currencyCookie = cookieStore.get('currency')?.value as Currency | undefined;
  const initialCurrency: Currency = (profileCurrencyCookie && currencies.includes(profileCurrencyCookie))
    ? profileCurrencyCookie
    : (currencyCookie && currencies.includes(currencyCookie))
      ? currencyCookie
      : defaultCurrency;

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Providers initialLocale={initialLocale} initialCurrency={initialCurrency}>
          <LocaleHandler />
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
