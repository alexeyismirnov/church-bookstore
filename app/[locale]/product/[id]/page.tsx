import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import StructuredData from '../../../components/StructuredData';
import { resolveCurrencyFromParams, resolveLocaleFromParams } from '../../../lib/locale-server';
import {
  buildAbsoluteUrl,
  buildLanguageAlternates,
  buildOpenGraph,
  buildTwitterCard,
  getMetaString,
  stripHtml,
  truncate,
} from '../../../lib/metadata';
import { getCachedProductById, getCachedProductReviews, getCachedRelatedProducts } from '../../../lib/server-cache';
import { buildProductBookSchema, buildProductBreadcrumbSchema } from '../../../lib/structured-data';
import type { Locale } from '../../../i18n/settings';

export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{ locale: string; id: string }>;
}

async function loadProduct(locale: Locale, id: string) {
  const currency = await resolveCurrencyFromParams();
  const book = await getCachedProductById(id, locale, currency);
  return { locale, currency, book, serverFetchKey: `${locale}:${currency}` };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale: localeParam, id } = await params;
  const locale = resolveLocaleFromParams(localeParam);
  const { book } = await loadProduct(locale, id);
  const productPath = `/product/${id}`;

  if (!book) {
    const title = getMetaString(locale, 'meta.product.notFoundTitle');
    const description = getMetaString(locale, 'meta.product.notFoundDescription');
    return {
      title: { absolute: title },
      description,
      robots: { index: false, follow: true },
      alternates: {
        canonical: buildAbsoluteUrl(productPath, locale),
        languages: buildLanguageAlternates(productPath),
      },
    };
  }

  const title = getMetaString(locale, 'meta.product.titleTemplate', { title: book.title });
  const plainDescription = book.description
    ? truncate(stripHtml(book.description), 160)
    : getMetaString(locale, 'meta.product.descriptionFallback', {
        title: book.title,
        author: book.author,
      });

  const coverImage = book.coverImage;

  return {
    title: { absolute: title },
    description: plainDescription,
    alternates: {
      canonical: buildAbsoluteUrl(productPath, locale),
      languages: buildLanguageAlternates(productPath),
    },
    openGraph: buildOpenGraph(locale, {
      title: book.title,
      description: plainDescription,
      path: productPath,
      type: 'book',
      images: coverImage
        ? [
            {
              url: coverImage,
              width: 400,
              height: 600,
              alt: book.title,
            },
          ]
        : undefined,
    }),
    twitter: buildTwitterCard(book.title, plainDescription, coverImage ? [coverImage] : undefined),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: localeParam, id } = await params;
  const locale = resolveLocaleFromParams(localeParam);
  const { currency, book, serverFetchKey } = await loadProduct(locale, id);
  const [relatedBooks, initialReviews] = book
    ? await Promise.all([
        getCachedRelatedProducts(id, locale, currency),
        getCachedProductReviews(id, locale, currency),
      ])
    : [[], []];

  const structuredData = book
    ? [
        buildProductBookSchema(book, currency, locale),
        buildProductBreadcrumbSchema(book.title, id, locale),
      ]
    : [];

  return (
    <>
      {structuredData.length > 0 && <StructuredData data={structuredData} />}
      <ProductDetailClient
        key={`${id}-${serverFetchKey}`}
        productId={id}
        initialBook={book}
        initialReviews={initialReviews}
        serverFetchKey={serverFetchKey}
        relatedBooks={relatedBooks}
      />
    </>
  );
}
