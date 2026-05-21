import type { MetadataRoute } from 'next';
import { getAllProductsForSitemap } from './lib/api';
import { localizedPath } from './i18n/routing';
import { locales, type Locale } from './i18n/settings';
import { SITE_URL } from './lib/seo';

const STATIC_PATHS = ['', '/catalog', '/contact', '/resources', '/faithofsaints'] as const;

function localizedUrl(locale: Locale, path: string): string {
  return `${SITE_URL}${localizedPath(locale, path)}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    STATIC_PATHS.map((path) => ({
      url: localizedUrl(locale, path),
      lastModified: new Date(),
      changeFrequency: path === '' || path === '/catalog' ? ('daily' as const) : ('monthly' as const),
      priority: path === '' ? 1 : path === '/catalog' ? 0.9 : 0.5,
    }))
  );

  let productPages: MetadataRoute.Sitemap = [];

  try {
    const products = await getAllProductsForSitemap();
    productPages = locales.flatMap((locale) =>
      products.map((book) => ({
        url: localizedUrl(locale, `/product/${book.id}`),
        lastModified: book.pubDate ? new Date(book.pubDate) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    );
  } catch (err) {
    console.error('Sitemap: failed to fetch products, serving static pages only:', err);
  }

  return [...staticPages, ...productPages];
}
