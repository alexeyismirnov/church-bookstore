import type { Metadata } from 'next';
import FaithOfSaintsContent from './FaithOfSaintsContent';
import { resolveLocaleFromParams } from '../../lib/locale-server';
import {
  buildAbsoluteUrl,
  buildLanguageAlternates,
  buildOpenGraph,
  buildTwitterCard,
  getMetaString,
} from '../../lib/metadata';

interface FaithOfSaintsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FaithOfSaintsPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocaleFromParams(localeParam);
  const title = getMetaString(locale, 'meta.faithofsaints.title');
  const description = getMetaString(locale, 'meta.faithofsaints.description');
  const ogTitle = getMetaString(locale, 'meta.faithofsaints.ogTitle');
  const ogDescription = getMetaString(locale, 'meta.faithofsaints.ogDescription');

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: buildAbsoluteUrl('/faithofsaints', locale),
      languages: buildLanguageAlternates('/faithofsaints'),
    },
    openGraph: buildOpenGraph(locale, {
      title: ogTitle,
      description: ogDescription,
      path: '/faithofsaints',
    }),
    twitter: buildTwitterCard(ogTitle, ogDescription),
  };
}

export default function FaithOfSaintsPage() {
  return <FaithOfSaintsContent />;
}
