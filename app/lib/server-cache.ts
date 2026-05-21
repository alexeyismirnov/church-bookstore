import { cache } from 'react';
import {
  getCatalogListingBooksForServer,
  getCategoriesForServer,
  getProductByIdForServer,
  oscarProductToBook,
} from './api';

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

/** Related titles from the first catalog page (excludes current product). */
export const getCachedRelatedProducts = cache(
  (excludeProductId: string, locale: string, currency: string, limit = 4) =>
    getCatalogListingBooksForServer({ page: 1, locale, currency }).then((result) => {
      if (!result) return [];
      return result.books.filter((book) => book.id !== excludeProductId).slice(0, limit);
    })
);
