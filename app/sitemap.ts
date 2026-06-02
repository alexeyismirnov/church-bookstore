import type { MetadataRoute } from 'next';
import { getAllProductsForSitemap } from './lib/api';
import { localizedPath } from './i18n/routing';
import { locales, type Locale } from './i18n/settings';
import { SITE_URL } from './lib/seo';

/** Regenerate sitemap periodically (ISR). */
export const revalidate = 3600;

const STATIC_PATHS = ['', '/catalog', '/contact', '/resources', '/faithofsaints'] as const;

function localizedUrl(locale: Locale, path: string): string {
  return `${SITE_URL}${localizedPath(locale, path)}`;
}

function sitemapLastModified(pubDate?: string): Date {
  if (!pubDate) {
    return new Date();
  }
  const parsed = new Date(pubDate);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function buildStaticPages(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    STATIC_PATHS.map((path) => ({
      url: localizedUrl(locale, path),
      lastModified: new Date(),
      changeFrequency: path === '' || path === '/catalog' ? ('daily' as const) : ('monthly' as const),
      priority: path === '' ? 1 : path === '/catalog' ? 0.9 : 0.5,
    }))
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = buildStaticPages();

  try {
    const products = await getAllProductsForSitemap();
    const productPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
      products.map((book) => ({
        url: localizedUrl(locale, `/product/${book.slug}`),
        lastModified: sitemapLastModified(book.pubDate),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    );
    return [...staticPages, ...productPages];
  } catch (err) {
    console.error('Sitemap: failed to fetch products, serving static pages only:', err);
    return staticPages;
  }
}
