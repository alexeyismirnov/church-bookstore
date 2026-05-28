import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import ProductDetailClient from '../[id]/ProductDetailClient';
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
import { buildProductPath, extractProductIdFromSlug } from '../../../lib/product-slug';

export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function loadProduct(locale: Locale, id: string) {
  const currency = await resolveCurrencyFromParams();
  const book = await getCachedProductById(id, locale, currency);
  return { locale, currency, book, serverFetchKey: `${locale}:${currency}` };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = resolveLocaleFromParams(localeParam);
  const productId = extractProductIdFromSlug(slug);
  const { book } = productId ? await loadProduct(locale, productId) : { book: null };
  const productPath = book ? buildProductPath(book) : `/product/${slug}`;

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
  const { locale: localeParam, slug } = await params;
  const locale = resolveLocaleFromParams(localeParam);
  const productId = extractProductIdFromSlug(slug);
  if (!productId) notFound();

  const { currency, book, serverFetchKey } = await loadProduct(locale, productId);
  if (!book) notFound();

  const canonicalPath = buildProductPath(book);
  const currentPath = `/product/${slug}`;
  if (currentPath !== canonicalPath) {
    permanentRedirect(canonicalPath);
  }

  const [relatedBooks, initialReviews] = await Promise.all([
    getCachedRelatedProducts(productId, locale, currency),
    getCachedProductReviews(productId, locale, currency),
  ]);

  const structuredData = [
    buildProductBookSchema(book, currency, locale),
    buildProductBreadcrumbSchema(book, locale),
  ];

  return (
    <>
      {structuredData.length > 0 && <StructuredData data={structuredData} />}
      <ProductDetailClient
        key={`${productId}-${serverFetchKey}`}
        productId={productId}
        initialBook={book}
        initialReviews={initialReviews}
        serverFetchKey={serverFetchKey}
        relatedBooks={relatedBooks}
      />
    </>
  );
}
