import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import StructuredData from './components/StructuredData';
import { localeToHtmlLang } from './i18n/routing';
import { defaultLocale, locales, type Locale } from './i18n/settings';
import {
  DEFAULT_META_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_SHORT,
  SITE_URL,
} from './lib/seo';
import { buildOrganizationSchema } from './lib/structured-data';

async function getHtmlLang(): Promise<string> {
  const cookieStore = await cookies();
  const value = cookieStore.get('locale')?.value;
  if (value && locales.includes(value as Locale)) {
    return localeToHtmlLang(value as Locale);
  }
  return localeToHtmlLang(defaultLocale);
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME_SHORT}`,
  },
  description: DEFAULT_META_DESCRIPTION,
  publisher: SITE_NAME_SHORT,
  creator: SITE_NAME_SHORT,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_META_DESCRIPTION,
    images: [
      {
        url: '/images/church_logo.png',
        width: 512,
        height: 512,
        alt: SITE_NAME_SHORT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_META_DESCRIPTION,
    images: ['/images/church_logo.png'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/images/church_logo.png', type: 'image/png' },
    ],
    apple: '/images/church_logo.png',
  },
  manifest: '/manifest.json',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getHtmlLang();

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <StructuredData data={buildOrganizationSchema()} />
        {children}
      </body>
    </html>
  );
}
