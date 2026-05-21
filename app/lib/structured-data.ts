import { localizedPath } from '../i18n/routing';
import type { Currency, Locale } from '../i18n/settings';
import type { Book } from '../types';
import { buildAbsoluteUrl, stripHtml } from './metadata';
import {
  DEFAULT_META_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_SHORT,
  SITE_URL,
} from './seo';

const SCHEMA_CONTEXT = 'https://schema.org';

const LOCALE_TO_LANGUAGE: Record<string, string> = {
  en: 'en',
  ru: 'ru',
  'zh-hans': 'zh-Hans',
  'zh-hant': 'zh-Hant',
};

function productAvailability(book: Book): string {
  const available = book.inStock !== false && book.isInStock !== false;
  return available ? `${SCHEMA_CONTEXT}/InStock` : `${SCHEMA_CONTEXT}/OutOfStock`;
}

function bookFormat(book: Book): string {
  return book.isShippingRequired === false
    ? `${SCHEMA_CONTEXT}/EBook`
    : `${SCHEMA_CONTEXT}/Paperback`;
}

function productUrl(bookId: string, locale: Locale = 'en'): string {
  return buildAbsoluteUrl(`/product/${bookId}`, locale);
}

function buildOffer(book: Book, currency: Currency, locale: Locale): Record<string, unknown> {
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    price: book.price.toFixed(2),
    priceCurrency: currency,
    availability: productAvailability(book),
    url: productUrl(book.id, locale),
  };

  if (book.price === 0) {
    offer.price = '0';
  }

  return offer;
}

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: SITE_NAME_SHORT,
    url: SITE_URL,
    logo: buildAbsoluteUrl('/images/church_logo.png'),
    foundingDate: '2014',
    description: DEFAULT_META_DESCRIPTION,
  };
}

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: SITE_NAME_SHORT,
    url: SITE_URL,
    description: DEFAULT_META_DESCRIPTION,
    inLanguage: ['en', 'ru', 'zh-Hans', 'zh-Hant'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/catalog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; path: string }[],
  locale: Locale = 'en'
): Record<string, unknown> {
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path, locale),
    })),
  };
}

export function buildItemListSchema(
  books: Book[],
  options: { name: string; path: string; locale?: Locale }
): Record<string, unknown> | null {
  if (books.length === 0) return null;
  const locale = options.locale ?? 'en';

  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'ItemList',
    name: options.name,
    url: buildAbsoluteUrl(options.path, locale),
    numberOfItems: books.length,
    itemListElement: books.map((book, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: productUrl(book.id, locale),
      name: book.title,
    })),
  };
}

export function buildProductBookSchema(
  book: Book,
  currency: Currency,
  locale: string
): Record<string, unknown> {
  const plainDescription = book.description ? stripHtml(book.description) : undefined;
  const isFree =
    book.price === 0 ||
    !!book.downloadUrl?.includes('orthodoxbookshop') ||
    !!book.epubUrl?.includes('orthodoxbookshop');

  const schema: Record<string, unknown> = {
    '@context': SCHEMA_CONTEXT,
    '@type': ['Product', 'Book'],
    name: book.title,
    image: book.coverImage,
    description: plainDescription,
    url: productUrl(book.id, locale as Locale),
    inLanguage: LOCALE_TO_LANGUAGE[locale] ?? locale,
    bookFormat: bookFormat(book),
    offers: buildOffer(book, currency, locale as Locale),
  };

  if (book.author) {
    schema.author = { '@type': 'Person', name: book.author };
  }

  if (book.publisher) {
    schema.publisher = { '@type': 'Organization', name: book.publisher };
  }

  if (book.pubDate) {
    schema.datePublished = book.pubDate;
  }

  if (book.pages > 0) {
    schema.numberOfPages = book.pages;
  }

  if (isFree) {
    schema.isAccessibleForFree = true;
  }

  return schema;
}

export function buildCatalogBreadcrumbSchema(
  options: {
    categoryId?: string;
    categoryName?: string;
    searchQuery?: string;
  },
  locale: Locale = 'en'
): Record<string, unknown> {
  const items = [
    { name: 'Home', path: '/' },
    { name: 'Catalog', path: '/catalog' },
  ];

  if (options.searchQuery?.trim()) {
    items.push({
      name: `Search: ${options.searchQuery.trim()}`,
      path: `/catalog?q=${encodeURIComponent(options.searchQuery.trim())}`,
    });
  } else if (options.categoryName && options.categoryId) {
    items.push({
      name: options.categoryName,
      path: `/catalog?category=${options.categoryId}`,
    });
  }

  return buildBreadcrumbSchema(items, locale);
}

export function buildProductBreadcrumbSchema(
  bookTitle: string,
  productId: string,
  locale: Locale = 'en'
): Record<string, unknown> {
  return buildBreadcrumbSchema(
    [
      { name: 'Home', path: '/' },
      { name: 'Catalog', path: '/catalog' },
      { name: bookTitle, path: `/product/${productId}` },
    ],
    locale
  );
}
