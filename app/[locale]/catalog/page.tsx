import type { Metadata, ResolvingMetadata } from 'next';
import { Suspense } from 'react';
import CatalogContent from './CatalogContent';
import StructuredData from '../../components/StructuredData';
import {
  resolveCurrencyFromParams,
  resolveLocaleFromParams,
} from '../../lib/locale-server';
import {
  buildCatalogCanonical,
  buildCatalogPath,
  buildCatalogRequestKey,
  buildLanguageAlternates,
  buildOpenGraph,
  buildPaginationLinkTags,
  buildTwitterCard,
  getCategoryName,
  getMetaString,
  mergeIcons,
  shouldNoindexCatalog,
  type CatalogUrlParams,
} from '../../lib/metadata';
import { getCachedCatalogListing, getCachedCategories } from '../../lib/server-cache';
import {
  buildCatalogBreadcrumbSchema,
  buildItemListSchema,
} from '../../lib/structured-data';
import type { CatalogInitialData } from './types';
import type { Locale } from '../../i18n/settings';
import { getCategoryDescriptionKey } from '../../lib/category-content';

export const revalidate = 1800;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<CatalogUrlParams>;
}

function parsePage(page?: string): number {
  const parsed = parseInt(page || '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

async function loadCatalogContext(locale: Locale, searchParams: CatalogUrlParams) {
  const currency = await resolveCurrencyFromParams();
  const page = parsePage(searchParams.page);
  const inStock = searchParams.in_stock === 'true';

  const listing = await getCachedCatalogListing(
    page,
    searchParams.category,
    searchParams.q,
    inStock,
    locale,
    currency
  );
  const requestKey = buildCatalogRequestKey({
    category: searchParams.category,
    q: searchParams.q,
    page,
    inStock,
    locale,
    currency,
  });

  const initialData: CatalogInitialData = {
    books: listing?.books ?? [],
    totalCount: listing?.totalCount ?? 0,
    hasNextPage: listing?.hasNextPage ?? false,
    hasPrevPage: listing?.hasPrevPage ?? false,
    error: listing ? null : 'Failed to load products',
    requestKey,
  };

  return { currency, page, inStock, listing, initialData, searchParams };
}

export async function generateMetadata(
  props: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale: localeParam } = await props.params;
  const locale = resolveLocaleFromParams(localeParam);
  const searchParams = await props.searchParams;
  const { page, listing } = await loadCatalogContext(locale, searchParams);
  const noindex = shouldNoindexCatalog(searchParams);

  let title = getMetaString(locale, 'meta.catalog.title');
  let description = getMetaString(locale, 'meta.catalog.description');
  let ogTitle = getMetaString(locale, 'meta.catalog.ogTitle');
  let ogDescription = getMetaString(locale, 'meta.catalog.ogDescription');

  if (searchParams.q?.trim()) {
    const query = searchParams.q.trim();
    title = getMetaString(locale, 'meta.catalogSearch.title', { query });
    description = getMetaString(locale, 'meta.catalogSearch.description', { query });
    ogTitle = title;
    ogDescription = description;
  } else if (searchParams.category) {
    const categoryName = getCategoryName(locale, searchParams.category);
    title = getMetaString(locale, 'meta.catalogCategory.title', { category: categoryName });
    description = getMetaString(locale, 'meta.catalogCategory.description', {
      category: categoryName,
    });
    ogTitle = title;
    ogDescription = description;
  }

  if (page > 1) {
    const suffix = getMetaString(locale, 'meta.catalogPage.titleSuffix', {
      page: String(page),
    });
    title = `${title}${suffix}`;
  }

  const catalogPath = buildCatalogPath(searchParams);
  const canonical = buildCatalogCanonical(searchParams, locale);

  let prevUrl: string | undefined;
  let nextUrl: string | undefined;

  if (listing?.hasPrevPage) {
    prevUrl = buildCatalogCanonical(
      { ...searchParams, page: String(Math.max(1, page - 1)), in_stock: undefined },
      locale
    );
  }
  if (listing?.hasNextPage) {
    nextUrl = buildCatalogCanonical(
      { ...searchParams, page: String(page + 1), in_stock: undefined },
      locale
    );
  }

  const paginationIcons = buildPaginationLinkTags(prevUrl, nextUrl);
  const resolvedParent = await parent;

  return {
    title: { absolute: title },
    description,
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    alternates: {
      canonical,
      languages: buildLanguageAlternates(catalogPath),
    },
    openGraph: buildOpenGraph(locale, {
      title: ogTitle,
      description: ogDescription,
      path: catalogPath,
    }),
    twitter: buildTwitterCard(ogTitle, ogDescription),
    icons: mergeIcons(paginationIcons, resolvedParent),
  };
}

export default async function CatalogPage(props: PageProps) {
  const { locale: localeParam } = await props.params;
  const locale = resolveLocaleFromParams(localeParam);
  const searchParams = await props.searchParams;
  const { initialData, currency } = await loadCatalogContext(locale, searchParams);

  // Fetch categories server-side with ISR caching so the client doesn't
  // re-fetch them on every pagination / filter navigation.
  const categories = await getCachedCategories(locale, currency);

  const categoryName = searchParams.category
    ? getCategoryName(locale, searchParams.category)
    : undefined;

  const categoryDescKey = searchParams.category
    ? getCategoryDescriptionKey(searchParams.category)
    : null;
  const categoryIntro =
    categoryDescKey && categoryName
      ? getMetaString(locale, categoryDescKey, { name: categoryName })
      : undefined;

  const listingTitle = searchParams.q?.trim()
    ? getMetaString(locale, 'meta.catalogSearch.title', { query: searchParams.q.trim() })
    : categoryName
      ? categoryName
      : getMetaString(locale, 'catalog.allProducts');

  const catalogPath = buildCatalogPath(searchParams);
  const structuredData = [
    buildCatalogBreadcrumbSchema(
      {
        categoryId: searchParams.category,
        categoryName,
        searchQuery: searchParams.q,
      },
      locale
    ),
    buildItemListSchema(initialData.books, {
      name: categoryName
        ? getMetaString(locale, 'meta.catalogCategory.title', { category: categoryName })
        : searchParams.q?.trim()
          ? getMetaString(locale, 'meta.catalogSearch.title', { query: searchParams.q.trim() })
          : getMetaString(locale, 'meta.catalog.title'),
      path: catalogPath,
      locale,
    }),
  ].filter((schema): schema is Record<string, unknown> => schema !== null);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy"></div>
              <span className="ml-3 text-gray-500">Loading...</span>
            </div>
          </div>
        </div>
      }
    >
      {structuredData.length > 0 && <StructuredData data={structuredData} />}
      <CatalogContent
        key={initialData.requestKey}
        categoryId={searchParams.category}
        initialData={initialData}
        initialCategories={categories}
        listingTitle={listingTitle}
        categoryIntro={categoryIntro}
        categoryName={categoryName}
      />
    </Suspense>
  );
}
