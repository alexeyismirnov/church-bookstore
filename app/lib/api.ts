// app/lib/api.ts
// API client for interacting with the Oscar backend through the proxy

import { OscarProduct, OscarPaginationResponse, Variant } from '../types';

const API_BASE = '/api/oscar';
const OSCAR_MEDIA_BASE = 'https://orthodoxbookshop.asia';

/**
 * Fetch paginated products from the Oscar API
 * @param page - Page number (1-based)
 * @returns Paginated product response
 */
export async function getProducts(page: number = 1): Promise<OscarPaginationResponse<OscarProduct>> {
  const response = await fetch(`${API_BASE}/products/?page=${page}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Ensure fresh data
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Fetch a single product by ID
 * @param id - Product ID
 * @returns Product details
 */
export async function getProductById(id: string): Promise<OscarProduct> {
  const response = await fetch(`${API_BASE}/products/${id}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Get the full image URL for a product
 * Oscar returns relative paths like /media/images/products/...
 * This function prepends the base URL
 */
export function getFullImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '/images/placeholder-book.jpg'; // Fallback image
  }
  
  // If it's already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Prepend the base URL for relative paths
  return `${OSCAR_MEDIA_BASE}${imageUrl}`;
}

/**
 * Get the title in the preferred language
 * Falls back to English, then Russian, then Chinese (Simplified), then Chinese (Traditional)
 */
export function getProductTitle(product: OscarProduct, locale: string = 'en'): string {
  // If product has a direct title field, use it
  if (product.title) return product.title;
  
  // Try the requested locale first
  if (locale === 'en' && product.title_en) return product.title_en;
  if (locale === 'ru' && product.title_ru) return product.title_ru;
  if (locale === 'zh-hans' && product.title_zh_hans) return product.title_zh_hans;
  if (locale === 'zh-hant' && product.title_zh_hant) return product.title_zh_hant;
  
  // Fallback chain: en -> ru -> zh_hans -> zh_hant -> 'Untitled'
  return product.title_en 
    || product.title_ru 
    || product.title_zh_hans 
    || product.title_zh_hant 
    || 'Untitled';
}

/**
 * Convert variant price string to number
 */
export function parseVariantPrice(variant: Variant): number {
  return parseFloat(variant.price) || 0;
}

/**
 * Convert Oscar product to the Book interface used by the frontend
 * This allows gradual migration of other pages
 */
export function oscarProductToBook(product: OscarProduct) {
  return {
    id: product.id.toString(),
    title: getProductTitle(product),
    author: product.author || 'Unknown Author',
    price: parseFloat(product.price) || 0,
    rating: 4.5, // Default rating - Oscar doesn't provide this
    reviewCount: 0, // Default - Oscar doesn't provide this
    coverImage: getFullImageUrl(product.image_url),
    category: product.category || 'Uncategorized',
    publisher: product.publisher || '',
    year: product.pub_date ? new Date(product.pub_date).getFullYear() : new Date().getFullYear(),
    pages: 0, // Not provided by Oscar
    description: product.description || '',
    inStock: product.is_available !== false, // Default to true unless explicitly false
    isNew: product.is_new || false,
    isBestseller: product.is_bestseller || false,
    isShippingRequired: product.is_shipping_required,
    isParent: product.is_parent,
    parentId: product.parent_id,
    variants: product.variants,
    downloadUrl: product.download_url,
  };
}
