import type { Metadata, ResolvedMetadata } from 'next';
import type { Icons } from 'next/dist/lib/metadata/types/metadata-types';

type PaginationIcons = { other: { rel: string; url: string }[] };
import { localeToHrefLang, localizedPath } from '../i18n/routing';
import { locales, type Locale } from '../i18n/settings';
import { STATIC_CATEGORIES } from './data';
import { SITE_NAME, SITE_NAME_SHORT, SITE_URL } from './seo';
import en from '../i18n/locales/en.json';
import ru from '../i18n/locales/ru.json';
import zhHans from '../i18n/locales/zh-hans.json';
import zhHant from '../i18n/locales/zh-hant.json';

type Messages = typeof en;

const MESSAGES: Record<Locale, Messages> = {
  en,
  ru: ru as Messages,
  'zh-hans': zhHans as Messages,
  'zh-hant': zhHant as Messages,
};

const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  ru: 'ru_RU',
  'zh-hans': 'zh_CN',
  'zh-hant': 'zh_TW',
};

const CATEGORY_ID_TO_NAME_KEY: Record<string, string> = {};
for (const category of STATIC_CATEGORIES) {
  CATEGORY_ID_TO_NAME_KEY[category.id] = category.nameKey;
  for (const child of category.children) {
    CATEGORY_ID_TO_NAME_KEY[child.id] = child.nameKey;
  }
}

function getMessages(locale: Locale): Messages {
  return MESSAGES[locale] ?? MESSAGES.en;
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

export function getMetaString(
  locale: Locale,
  path: string,
  vars?: Record<string, string>
): string {
  const value = getByPath(getMessages(locale) as Record<string, unknown>, path);
  if (typeof value !== 'string') {
    const fallback = getByPath(MESSAGES.en as Record<string, unknown>, path);
    if (typeof fallback !== 'string') return '';
    return vars ? interpolate(fallback, vars) : fallback;
  }
  return vars ? interpolate(value, vars) : value;
}

export function getCategoryName(locale: Locale, categoryId: string): string {
  const nameKey = CATEGORY_ID_TO_NAME_KEY[categoryId];
  if (!nameKey) return getMetaString(locale, 'meta.catalog.ogTitle');
  return getMetaString(locale, nameKey);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

export const DEFAULT_OG_IMAGE = '/images/church_logo.png';

export function buildAbsoluteUrl(path: string, locale?: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const localized = locale ? localizedPath(locale, normalized) : normalized;
  return `${SITE_URL}${localized}`;
}

/** hreflang alternates for a path without locale prefix (e.g. `/catalog`). */
export function buildLanguageAlternates(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const languages: Record<string, string> = {
    'x-default': buildAbsoluteUrl(normalized, 'en'),
  };

  for (const locale of locales) {
    languages[localeToHrefLang(locale)] = buildAbsoluteUrl(normalized, locale);
  }

  return languages;
}

export interface CatalogUrlParams {
  category?: string;
  page?: string;
  q?: string;
  in_stock?: string;
}

/** Normalized catalog URL for canonical and pagination links (excludes in_stock). */
export function buildCatalogPath(params: CatalogUrlParams): string {
  const search = new URLSearchParams();

  if (params.category) search.set('category', params.category);
  if (params.q) search.set('q', params.q);

  const pageNum = parseInt(params.page || '1', 10);
  if (pageNum > 1) search.set('page', String(pageNum));

  const query = search.toString();
  return query ? `/catalog?${query}` : '/catalog';
}

export function buildCatalogCanonical(params: CatalogUrlParams, locale?: Locale): string {
  const canonicalParams: CatalogUrlParams = { ...params };
  delete canonicalParams.in_stock;
  return buildAbsoluteUrl(buildCatalogPath(canonicalParams), locale);
}

export function shouldNoindexCatalog(params: CatalogUrlParams): boolean {
  return params.in_stock === 'true';
}

/** Stable key for matching SSR catalog data with client refetch params. */
export function buildCatalogRequestKey(options: {
  category?: string;
  q?: string;
  page: number;
  inStock: boolean;
  locale: string;
  currency: string;
}): string {
  return [
    options.category ?? '',
    options.q ?? '',
    String(options.page),
    options.inStock ? '1' : '0',
    options.locale,
    options.currency,
  ].join('|');
}

export function buildOpenGraph(
  locale: Locale,
  options: {
    title: string;
    description: string;
    path: string;
    images?: NonNullable<Metadata['openGraph']>['images'];
    type?: 'website' | 'book';
  }
): Metadata['openGraph'] {
  return {
    type: options.type ?? 'website',
    locale: OG_LOCALE[locale],
    url: buildAbsoluteUrl(options.path, locale),
    siteName: SITE_NAME,
    title: options.title,
    description: options.description,
    images: options.images ?? [
      {
        url: DEFAULT_OG_IMAGE,
        width: 512,
        height: 512,
        alt: SITE_NAME_SHORT,
      },
    ],
  };
}

export function buildTwitterCard(
  title: string,
  description: string,
  images?: string | string[]
): Metadata['twitter'] {
  return {
    card: 'summary_large_image',
    title,
    description,
    images: images ?? [DEFAULT_OG_IMAGE],
  };
}

export function buildPaginationLinkTags(prev?: string, next?: string): PaginationIcons | undefined {
  const other: { rel: string; url: string }[] = [];
  if (prev) other.push({ rel: 'prev', url: prev });
  if (next) other.push({ rel: 'next', url: next });
  if (other.length === 0) return undefined;
  return { other };
}

export function mergeIcons(
  pagination?: PaginationIcons,
  parent?: ResolvedMetadata
): Metadata['icons'] | undefined {
  if (!pagination?.other) return undefined;
  const parentOther = parent?.icons?.other ?? [];
  const parentList = Array.isArray(parentOther) ? parentOther : parentOther ? [parentOther] : [];
  const pageOther = pagination.other;
  return { other: [...parentList, ...pageOther] } as Icons;
}
