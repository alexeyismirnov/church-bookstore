import { notFound } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Providers from '../components/Providers';
import LocaleHandler from '../components/LocaleHandler';
import type { Currency } from '../i18n/settings';
import { isValidLocale, resolveLocaleParam } from '../i18n/routing';
import { resolveCurrencyFromCookies } from '../lib/locale-server';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = resolveLocaleParam(localeParam);
  const initialCurrency: Currency = await resolveCurrencyFromCookies();

  return (
    <Providers initialLocale={locale} initialCurrency={initialCurrency}>
      <LocaleHandler />
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </Providers>
  );
}
