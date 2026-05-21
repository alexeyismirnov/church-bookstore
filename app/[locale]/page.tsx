import type { Metadata } from 'next';
import HomePageClient from '../components/HomePageClient';
import StructuredData from '../components/StructuredData';
import { getNewArrivalsForServer } from '../lib/api';
import { resolveCurrencyFromParams, resolveLocaleFromParams } from '../lib/locale-server';
import {
  buildAbsoluteUrl,
  buildLanguageAlternates,
  buildOpenGraph,
  buildTwitterCard,
  getMetaString,
} from '../lib/metadata';
import {
  buildItemListSchema,
  buildWebSiteSchema,
} from '../lib/structured-data';
import { Book } from '../types';
import type { Locale } from '../i18n/settings';

export const revalidate = 1800;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

function splitHeroAndArrivals(arrivals: Book[]): { heroBook: Book | null; newArrivals: Book[] } {
  if (arrivals.length === 0) {
    return { heroBook: null, newArrivals: [] };
  }

  const [heroBook, ...rest] = arrivals;
  return { heroBook, newArrivals: rest };
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocaleFromParams(localeParam);
  const title = getMetaString(locale, 'meta.homepage.title');
  const description = getMetaString(locale, 'meta.homepage.description');
  const ogTitle = getMetaString(locale, 'meta.homepage.ogTitle');
  const ogDescription = getMetaString(locale, 'meta.homepage.ogDescription');

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: buildAbsoluteUrl('/', locale),
      languages: buildLanguageAlternates('/'),
    },
    openGraph: buildOpenGraph(locale, {
      title: ogTitle,
      description: ogDescription,
      path: '/',
    }),
    twitter: buildTwitterCard(ogTitle, ogDescription),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  const locale: Locale = resolveLocaleFromParams(localeParam);
  const currency = await resolveCurrencyFromParams();

  const arrivals = await getNewArrivalsForServer(5, locale, currency);
  const { heroBook, newArrivals } = splitHeroAndArrivals(arrivals);

  const structuredData = [
    buildWebSiteSchema(),
    buildItemListSchema(arrivals, {
      name: getMetaString(locale, 'homepage.featured.newArrivals'),
      path: '/',
      locale,
    }),
  ].filter((schema): schema is Record<string, unknown> => schema !== null);

  return (
    <>
      <StructuredData data={structuredData} />
      <HomePageClient heroBook={heroBook} newArrivals={newArrivals} />
    </>
  );
}
