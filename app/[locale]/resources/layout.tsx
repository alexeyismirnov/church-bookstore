import type { Metadata } from 'next';
import { resolveLocaleFromParams } from '../../lib/locale-server';
import {
  buildAbsoluteUrl,
  buildLanguageAlternates,
  buildOpenGraph,
  buildTwitterCard,
  getMetaString,
} from '../../lib/metadata';

interface ResourcesLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ResourcesLayoutProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocaleFromParams(localeParam);
  const title = getMetaString(locale, 'meta.resources.title');
  const description = getMetaString(locale, 'meta.resources.description');
  const ogTitle = getMetaString(locale, 'meta.resources.ogTitle');
  const ogDescription = getMetaString(locale, 'meta.resources.ogDescription');

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: buildAbsoluteUrl('/resources', locale),
      languages: buildLanguageAlternates('/resources'),
    },
    openGraph: buildOpenGraph(locale, {
      title: ogTitle,
      description: ogDescription,
      path: '/resources',
    }),
    twitter: buildTwitterCard(ogTitle, ogDescription),
  };
}

export default function ResourcesLayout({ children }: ResourcesLayoutProps) {
  return children;
}
