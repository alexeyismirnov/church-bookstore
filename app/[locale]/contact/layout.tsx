import type { Metadata } from 'next';
import { resolveLocaleFromParams } from '../../lib/locale-server';
import {
  buildAbsoluteUrl,
  buildLanguageAlternates,
  buildOpenGraph,
  buildTwitterCard,
  getMetaString,
} from '../../lib/metadata';

interface ContactLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactLayoutProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocaleFromParams(localeParam);
  const title = getMetaString(locale, 'meta.contact.title');
  const description = getMetaString(locale, 'meta.contact.description');
  const ogTitle = getMetaString(locale, 'meta.contact.ogTitle');
  const ogDescription = getMetaString(locale, 'meta.contact.ogDescription');

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: buildAbsoluteUrl('/contact', locale),
      languages: buildLanguageAlternates('/contact'),
    },
    openGraph: buildOpenGraph(locale, {
      title: ogTitle,
      description: ogDescription,
      path: '/contact',
    }),
    twitter: buildTwitterCard(ogTitle, ogDescription),
  };
}

export default function ContactLayout({ children }: ContactLayoutProps) {
  return children;
}
