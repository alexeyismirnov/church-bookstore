// app/lib/api.ts
// API client for interacting with the Oscar backend through the proxy

import { OscarProduct, OscarPaginationResponse, Variant, Book } from '../types';

// Use environment variable or default to relative path for client-side
// For server-side rendering, we need an absolute URL
const getApiBase = () => {
  if (typeof window === 'undefined') {
    // Server-side: need absolute URL
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/oscar';
  }
  // Client-side: relative URL works fine
  return '/api/oscar';
};

const OSCAR_MEDIA_BASE = 'https://orthodoxbookshop.asia';

/**
 * Fetch paginated products from the Oscar API
 * @param page - Page number (1-based)
 * @returns Paginated product response
 */
export async function getProducts(page: number = 1): Promise<OscarPaginationResponse<OscarProduct>> {
  const response = await fetch(`${getApiBase()}/products/?page=${page}`, {
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
  const response = await fetch(`${getApiBase()}/products/${id}/`, {
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
 * Get the author in the preferred language
 * Falls back to English, then Russian, then Chinese (Simplified), then Chinese (Traditional)
 */
export function getProductAuthor(product: OscarProduct, locale: string = 'en'): string {
  // If product has a direct author field, use it
  if (product.author) return product.author;

  // Try the requested locale first
  if (locale === 'en' && product.author_en) return product.author_en;
  if (locale === 'ru' && product.author_ru) return product.author_ru;
  if (locale === 'zh-hans' && product.author_zh_hans) return product.author_zh_hans;
  if (locale === 'zh-hant' && product.author_zh_hant) return product.author_zh_hant;

  // Fallback chain: en -> ru -> zh_hans -> zh_hant -> 'Unknown Author'
  return product.author_en
    || product.author_ru
    || product.author_zh_hans
    || product.author_zh_hant
    || 'Unknown Author';
}

/**
 * Get the description in the preferred language
 * Falls back to English, then Russian, then Chinese (Simplified), then Chinese (Traditional)
 */
export function getProductDescription(product: OscarProduct, locale: string = 'en'): string {
  // If product has a direct description field, use it
  if (product.description) return product.description;

  // Try the requested locale first
  if (locale === 'en' && product.description_en) return product.description_en;
  if (locale === 'ru' && product.description_ru) return product.description_ru;
  if (locale === 'zh-hans' && product.description_zh_hans) return product.description_zh_hans;
  if (locale === 'zh-hant' && product.description_zh_hant) return product.description_zh_hant;

  // Fallback chain: en -> ru -> zh_hans -> zh_hant -> ''
  return product.description_en
    || product.description_ru
    || product.description_zh_hans
    || product.description_zh_hant
    || '';
}

/**
 * Get language name from text_script field
 * The text_script field contains human-readable language descriptions
 * (e.g., "English", "简体中文", "繁體中文", "Русский", etc.)
 */
export function getLanguageFromScript(textScript: string | undefined): string {
  if (!textScript) return 'Unknown';

  // Return the text_script value as-is since it's already a human-readable
  // language description from the database
  return textScript;
}

/**
 * Convert variant price string to number
 */
export function parseVariantPrice(variant: Variant): number {
  return parseFloat(variant.price) || 0;
}

/**
 * Get the variant title in the preferred language
 * Variants have a single title field from the backend (already localized)
 * This is a pass-through for consistency with product title functions
 */
export function getVariantTitle(variant: Variant): string {
  return variant.title || 'Untitled Variant';
}

/**
 * Convert Oscar product to the Book interface used by the frontend
 * This allows gradual migration of other pages
 */
export function oscarProductToBook(product: OscarProduct): Book {
  // Map variants with availability fields
  const mappedVariants: Variant[] | undefined = product.variants?.map((variant: any) => ({
    id: variant.id,
    title: variant.title,
    price: variant.price,
    is_shipping_required: variant.is_shipping_required,
    book_type: variant.book_type,
    isAvailable: variant.is_available ?? true,
    isInStock: variant.is_in_stock ?? true,
    stockCount: variant.stock_count ?? 0,
  }));

  return {
    id: product.id.toString(),
    title: getProductTitle(product),
    author: getProductAuthor(product),
    price: parseFloat(product.price) || 0,
    rating: 4.5, // Default rating - Oscar doesn't provide this
    reviewCount: 0, // Default - Oscar doesn't provide this
    coverImage: getFullImageUrl(product.image_url),
    category: product.category || 'Uncategorized',
    publisher: product.publisher || '',
    year: product.pub_date ? new Date(product.pub_date).getFullYear() : new Date().getFullYear(),
    pages: product.num_pages || 0,
    description: getProductDescription(product),
    inStock: product.is_available !== false, // Default to true unless explicitly false
    isNew: product.is_new || false,
    isBestseller: product.is_bestseller || false,
    isShippingRequired: product.is_shipping_required,
    isParent: product.is_parent,
    parentId: product.parent_id,
    variants: mappedVariants,
    previewUrl: product.preview_url,
    downloadUrl: product.download_url,
    epubUrl: product.epub_url,
    translator: product.translator || undefined,
    pubDate: product.pub_date || undefined,
    language: getLanguageFromScript(product.text_script),
    stockCount: product.stock_count,
    isInStock: product.is_in_stock,
  };
}
