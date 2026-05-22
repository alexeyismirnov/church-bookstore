import { cache } from 'react';
import type { Book } from '../types';
import {
  getCatalogListingBooksForServer,
  getCatalogListingForServer,
  getCategoriesForServer,
  getProductByIdForServer,
  oscarProductToBook,
} from './api';
import { getRecommendedProductIds } from './recommendations';

export const getCachedCatalogListing = cache(
  (
    page: number,
    categoryId: string | undefined,
    query: string | undefined,
    inStock: boolean,
    locale: string,
    currency: string
  ) =>
    getCatalogListingBooksForServer({
      page,
      categoryId,
      query,
      inStock,
      locale,
      currency,
    })
);

export const getCachedProductById = cache((id: string, locale: string, currency: string) =>
  getProductByIdForServer(id, locale, currency).then((product) =>
    product ? oscarProductToBook(product, locale) : null
  )
);

export const getCachedCategories = cache(
  (locale: string, currency: string) =>
    getCategoriesForServer(locale, currency)
);

/** Related titles via 3-tier fallback: pre-computed → category → catalog page 1. */
export const getCachedRelatedProducts = cache(
  async (productId: string, locale: string, currency: string, limit = 4): Promise<Book[]> => {
    // Tier 1: Pre-computed recommendations from recommendations.json
    const recommendedIds = getRecommendedProductIds(productId, limit);
    if (recommendedIds.length > 0) {
      const books = await Promise.all(
        recommendedIds.map(id =>
          getProductByIdForServer(String(id), locale, currency)
            .then(p => p ? oscarProductToBook(p, locale) : null)
        )
      );
      const validBooks = books.filter((b): b is Book => b !== null);
      if (validBooks.length >= Math.min(limit, 2)) {
        return validBooks.slice(0, limit);
      }
    }

    // Tier 2: Category-based fallback
    try {
      const currentProduct = await getProductByIdForServer(productId, locale, currency);
      if (currentProduct?.categories?.length) {
        const catSlug = currentProduct.categories[0].slug;
        if (catSlug) {
          const catResult = await getCatalogListingForServer({
            categoryId: catSlug, locale, currency, page: 1,
          });
          if (catResult && catResult.results.length > 0) {
            const books = catResult.results
              .filter(p => String(p.id) !== productId)
              .slice(0, limit)
              .map(p => oscarProductToBook(p, locale));
            if (books.length >= Math.min(limit, 2)) {
              return books;
            }
          }
        }
      }
    } catch (err) {
      console.error('Tier 2 fallback failed:', err);
    }

    // Tier 3: Catalog page 1 (original behavior)
    const result = await getCatalogListingBooksForServer({ page: 1, locale, currency });
    if (!result) return [];
    return result.books.filter(b => b.id !== productId).slice(0, limit);
  }
);
