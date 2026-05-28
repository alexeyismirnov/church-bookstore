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
import { DEFAULT_OG_IMAGE } from './lib/metadata';
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
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME_SHORT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_META_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
