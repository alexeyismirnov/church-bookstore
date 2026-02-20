// app/lib/api.ts
// API client for interacting with the Oscar backend through the proxy

import { OscarProduct, OscarPaginationResponse, Variant, Book, Category, MyBook } from '../types';

// Use environment variable or default to relative path for client-side
// For server-side rendering, we need an absolute URL
const getApiBase = () => {
  if (typeof window === 'undefined') {
    // Server-side: need absolute URL
    // Priority: NEXT_PUBLIC_API_URL > NEXT_PUBLIC_VERCEL_URL > localhost fallback
    if (process.env.NEXT_PUBLIC_API_URL) {
      return `${process.env.NEXT_PUBLIC_API_URL}/api/oscar`;
    }
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/oscar`;
    }
    // Local development fallback
    return 'http://localhost:3000/api/oscar';
  }
  // Client-side: relative URL works fine
  return '/api/oscar';
};

const OSCAR_MEDIA_BASE = 'https://orthodoxbookshop.asia';

// Get language from localStorage (set by LanguageContext)
function getLanguagePreference(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('locale') || 'en';
}

// Get currency from localStorage (set by CurrencyContext)
function getCurrencyPreference(): string {
  if (typeof window === 'undefined') return 'USD';
  return localStorage.getItem('currency') || 'USD';
}

// Get common headers for API requests
function getApiHeaders(): HeadersInit {
  const lang = getLanguagePreference();
  const currency = getCurrencyPreference();
  return {
    'Content-Type': 'application/json',
    'Accept-Language': lang,
    'X-Currency': currency,
  };
}

/**
 * Fetch products by category from the API
 * @param categoryId - Category ID
 * @param page - Page number (1-based)
 * @returns Paginated product response
 */
export async function getProductsByCategory(categoryId: string, page: number = 1): Promise<OscarPaginationResponse<OscarProduct>> {
  const response = await fetch(`${getApiBase()}/prodcat/${categoryId}/?page=${page}`, {
    method: 'GET',
    headers: getApiHeaders(),
    cache: 'no-store', // Ensure fresh data
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products by category: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Fetch paginated products from the Oscar API
 * @param page - Page number (1-based)
 * @returns Paginated product response
 */
export async function getProducts(page: number = 1): Promise<OscarPaginationResponse<OscarProduct>> {
  const response = await fetch(`${getApiBase()}/products/?page=${page}`, {
    method: 'GET',
    headers: getApiHeaders(),
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
export async function getProductById(id: string, signal?: AbortSignal): Promise<OscarProduct> {
  const response = await fetch(`${getApiBase()}/products/${id}/`, {
    method: 'GET',
    headers: getApiHeaders(),
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * API response for categories from /api/categories/
 * Backend returns: { id, name, slug, num_products, children }
 */
interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  num_products: number;
  children?: ApiCategory[];
}

/**
 * Fetch categories from the API
 * @returns Array of categories with product counts (hierarchical)
 */
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${getApiBase()}/categories/`, {
    method: 'GET',
    headers: getApiHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
  }

  const data: any = await response.json();
  
  // Handle paginated response (DRF default) or direct array
  const categories: ApiCategory[] = Array.isArray(data) ? data : (data.results || []);
  
  // Map API response to Category interface with hierarchical children
  return mapApiCategoriesToCategories(categories);
}

/**
 * Map API category response to Category interface, including children
 */
function mapApiCategoriesToCategories(categories: ApiCategory[]): Category[] {
  return categories.map((category) => {
    const mapped: Category = {
      id: category.id.toString(),
      name: category.name,
      slug: category.slug,
      count: category.num_products,
    };
    
    // Map children if present
    if (category.children && category.children.length > 0) {
      mapped.children = category.children.map((child) => ({
        id: child.id.toString(),
        name: child.name,
        slug: child.slug,
        count: child.num_products,
        children: child.children ? child.children.map((gc) => ({
          id: gc.id.toString(),
          name: gc.name,
          slug: gc.slug,
          count: gc.num_products,
        })) : undefined,
      }));
    }
    
    return mapped;
  });
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
 * The API now returns the resolved title based on request.LANGUAGE_CODE
 */
export function getProductTitle(product: OscarProduct, locale: string = 'en'): string {
  // The API returns the title already localized based on Accept-Language header
  // Just return the resolved title field from the API
  return product.title || 'Untitled';
}

/**
 * Get the author in the preferred language
 * The API now returns the resolved author based on request.LANGUAGE_CODE
 */
export function getProductAuthor(product: OscarProduct, locale: string = 'en'): string {
  // The API returns the author already localized based on Accept-Language header
  // Just return the resolved author field from the API
  return product.author || '';
}

/**
 * Get the description in the preferred language
 * The API now returns the resolved description based on request.LANGUAGE_CODE
 */
export function getProductDescription(product: OscarProduct, locale: string = 'en'): string {
  // The API returns the description already localized based on Accept-Language header
  // Just return the resolved description field from the API
  return product.description || '';
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
export function oscarProductToBook(product: OscarProduct, locale: string = 'en'): Book {
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
    title: getProductTitle(product, locale),
    author: getProductAuthor(product, locale),
    price: parseFloat(product.price) || 0,
    rating: 4.5, // Default rating - Oscar doesn't provide this
    reviewCount: 0, // Default - Oscar doesn't provide this
    coverImage: getFullImageUrl(product.image_url),
    category: product.category || 'Uncategorized',
    publisher: product.publisher || '',
    year: product.pub_date ? new Date(product.pub_date).getFullYear() : new Date().getFullYear(),
    pages: product.num_pages || 0,
    description: getProductDescription(product, locale),
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

// =============================================================================
// Authentication helpers (for API functions that need auth)
// =============================================================================

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REMEMBER_ME_KEY = 'remember_me';

/**
 * Get stored auth token from localStorage or sessionStorage
 */
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  
  if (rememberMe) {
    return localStorage.getItem(TOKEN_KEY);
  }
  
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user data from localStorage or sessionStorage
 */
function getStoredUser(): { email: string } | null {
  if (typeof window === 'undefined') return null;
  
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  const storage = rememberMe ? localStorage : sessionStorage;
  
  const userData = storage.getItem(USER_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * Get headers with authentication token
 */
function getAuthHeaders(): HeadersInit {
  const lang = getLanguagePreference();
  const currency = getCurrencyPreference();
  const token = getStoredToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept-Language': lang,
    'X-Currency': currency,
  };
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  
  return headers;
}

/**
 * Fetch user's purchased books (mybooks) from the API
 * @returns Array of MyBook objects
 * @throws Error if not authenticated or request fails
 */
export async function getMyBooks(): Promise<MyBook[]> {
  const user = getStoredUser();
  
  if (!user || !user.email) {
    throw new Error('User not authenticated. Please log in to view your books.');
  }
  
  const response = await fetch(`${getApiBase()}/mybooks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email: user.email }),
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(`Failed to fetch mybooks: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // Handle paginated response (DRF default) or direct array
  if (Array.isArray(data)) {
    return data;
  }
  return data.results || [];
}
