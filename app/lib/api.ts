// app/lib/api.ts
// API client for interacting with the Oscar backend through the proxy

import { OscarProduct, OscarPaginationResponse, Variant, Book, Category, MyBook, Basket, BasketLine, BasketLinesResponse, ShippingMethod, ShippingAddress, OrderPlacementRequest, OscarAddress, Order, OscarOrder, OscarOrderListResponse, OrderLine } from '../types';

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
export function getApiHeaders(): HeadersInit {
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
 * Search products by query from the Oscar API
 * @param query - Search query string
 * @param page - Page number (1-based)
 * @returns Paginated product response
 */
export async function searchProducts(query: string, page: number = 1): Promise<OscarPaginationResponse<OscarProduct>> {
  const response = await fetch(`${getApiBase()}/search/?q=${encodeURIComponent(query)}&page=${page}`, {
    method: 'GET',
    headers: getApiHeaders(),
    cache: 'no-store', // Ensure fresh data
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${response.statusText}`);
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
// Homepage data helpers
// =============================================================================

/**
 * Fetch newest products from the Oscar API.
 * Assumes the products endpoint returns results in reverse chronological order,
 * so the first page contains the newest books.
 * @param limit - Maximum number of products to return (default 6)
 * @returns Array of Book objects
 */
export async function getNewArrivals(limit: number = 6): Promise<Book[]> {
  try {
    const response = await getProducts(1);
    const locale = getLanguagePreference();
    return response.results.slice(0, limit).map(product => oscarProductToBook(product, locale));
  } catch (err) {
    console.error('Failed to fetch new arrivals:', err);
    return [];
  }
}

// =============================================================================
// Authentication helpers (for API functions that need auth)"
// =============================================================================

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REMEMBER_ME_KEY = 'remember_me';

/**
 * Get stored auth token from localStorage or sessionStorage
 */
export function getStoredToken(): string | null {
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
export function getAuthHeaders(): HeadersInit {
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

// Singleton promise that ensures a Django session is established before
// any basket operations proceed. On the first API call the proxy creates
// a fresh Django session and stores the key in the oscar-session-id cookie.
// Without this guard, concurrent first-visit requests would each create
// separate sessions, and only the last response's cookie would survive —
// potentially orphaning baskets created in the "losing" sessions.
let sessionInitPromise: Promise<void> | null = null;

async function ensureSession(): Promise<void> {
  if (sessionInitPromise) {
    return sessionInitPromise;
  }

  sessionInitPromise = (async () => {
    try {
      // A lightweight GET to the basket endpoint is enough to trigger
      // session creation through the proxy. We use a raw fetch (not
      // getBasket) to avoid recursion.
      await fetch('/api/oscar/basket/', {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      });
    } catch {
      // Best effort — if this fails, the individual API calls will
      // still work; they just might race on the first visit.
    }
  })();

  return sessionInitPromise;
}

/**
 * Reset the session singleton so that the next basket/API call will
 * initialise a fresh Django session. Must be called after logout (where
 * the server-side session is invalidated via DELETE /login/).
 */
export function resetSession(): void {
  sessionInitPromise = null;
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

/**
 * Delete a book from user's bookshelf
 * DELETE /mybooks/{bookId}/ - Removes the book from the user's bookshelf
 * @param bookId - The book_id of the book to remove
 * @throws Error if not authenticated or request fails
 */
export async function deleteMyBook(bookId: number): Promise<void> {
  const response = await fetch(`${getApiBase()}/mybooks/${bookId}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to remove book from bookshelf');
  }
}

// =============================================================================
// Basket API Functions (Oscar API)
// =============================================================================

/**
 * Fetch the current user's basket
 * GET /basket/ - Returns the user's basket
 * @returns Basket object with lines
 */
export async function getBasket(): Promise<Basket> {
  await ensureSession();
  const response = await fetch(`${getApiBase()}/basket/`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 400 || response.status === 404 || response.status === 401) {
      // Bad request (400), no basket exists (404) or session expired (401) - return empty basket structure
      return {
        id: '',
        lines: [],
        owner: null,
        status: 'Open',
        total_excl_tax: '0.00',
        total_incl_tax: '0.00',
        currency: 'USD',
        creation_date: new Date().toISOString(),
        last_modification_date: new Date().toISOString(),
      };
    }
    throw new Error(`Failed to fetch basket: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  // Handle paginated response or direct basket object
  if (Array.isArray(data)) {
    return data[0] || null;
  }
  // Oscar API typically returns the basket directly or in results
  return data.results?.[0] || data;
}

/**
 * Add a product to the basket
 * POST /basket/add-product/
 * @param productId - Product ID to add
 * @param quantity - Quantity to add
 * @returns Updated basket
 */
export async function addToBasket(productId: number, quantity: number): Promise<Basket> {
  await ensureSession();
  // Build the product URL that Oscar API expects
  // Oscar API uses HyperlinkedRelatedField which needs the ACTUAL Oscar API URL,
  // not our proxy URL. The serializer validates against Product.objects.
  // Format: https://orthodoxbookshop.asia/api/products/{id}/
  const oscarApiBase = 'https://orthodoxbookshop.asia/api';
  const productUrl = `${oscarApiBase}/products/${productId}/`;

  const response = await fetch(`${getApiBase()}/basket/add-product/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      url: productUrl,
      quantity: quantity,
    }),
    cache: 'no-store',
    credentials: 'include',
  });

  // Read response body - could be JSON or HTML (error page)
  const responseText = await response.text();
  
  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  if (!response.ok) {
    // Try to parse as JSON, but if it fails, provide a clean error message
    let errorMessage;
    if (isJson) {
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.detail || errorData.message || errorData.reason || `Failed to add to basket: ${response.status}`;
      } catch {
        errorMessage = `Failed to add to basket: ${response.status}`;
      }
    } else {
      // Response is HTML or plain text - don't show HTML in UI
      console.error('[addToBasket] Oscar API returned non-JSON response:', responseText.substring(0, 200));
      errorMessage = `Server error (${response.status}). Please try again later.`;
    }
    throw new Error(errorMessage);
  }

  const data = JSON.parse(responseText);
  return data;
}

/**
 * Update a basket line's quantity
 * PATCH /baskets/{basketId}/lines/{lineId}/
 * @param basketId - Basket ID
 * @param lineId - Line ID to update
 * @param quantity - New quantity
 * @returns Updated basket
 */
export async function updateBasketLine(
  basketId: string,
  lineId: number,
  quantity: number
): Promise<Basket> {
  await ensureSession();
  // Oscar API uses: /baskets/{basketId}/lines/{lineId}/
  const endpoint = `${getApiBase()}/baskets/${basketId}/lines/${lineId}/`;
  
  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      quantity: quantity,
    }),
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorData: { detail?: string; message?: string } = {};
    try {
      errorData = JSON.parse(responseText);
    } catch {
      // Invalid JSON - use empty object
    }
    const errorMessage = errorData.detail || errorData.message || `Failed to update basket: ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * Remove a line from the basket
 * DELETE /baskets/{basketId}/lines/{lineId}/
 * @param basketId - Basket ID
 * @param lineId - Line ID to remove
 * @returns Updated basket
 */
export async function removeBasketLine(basketId: string, lineId: number): Promise<Basket> {
  await ensureSession();
  // Oscar API uses: /baskets/{basketId}/lines/{lineId}/
  const endpoint = `${getApiBase()}/baskets/${basketId}/lines/${lineId}/`;
  
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || errorData.message || `Failed to remove from basket: ${response.status}`;
    throw new Error(errorMessage);
  }

  // DELETE returns empty body on success - refetch basket
  return getBasket();
}

/**
 * Oscar API Basket Line as returned by the actual API
 * Note: Oscar's basket line response has minimal product info - just the URL
 * Some Oscar API versions use 'id' or 'line_id' for the line identifier
 */
interface OscarBasketLine {
  id: number;
  line_id?: number; // Alternative field name some Oscar API versions use
  url: string;
  product: string; // Product URL
  quantity: number;
  price_currency: string;
  price_excl_tax: string;
  price_incl_tax: string;
  price_incl_tax_excl_discounts: string;
  price_excl_tax_excl_discounts: string;
  is_tax_known: boolean;
  warning: string | null;
  basket: string;
  stockrecord: string;
  date_created: string;
  date_updated: string;
  is_shipping_required?: boolean; // Added by custom serializer
  // Note: Oscar doesn't include product_title, product_author, product_image on basket lines
  // We need to fetch product details separately if needed
}

/**
 * Fetch basket lines from a URL (HyperlinkedRelatedField)
 * Oscar API returns lines as a URL that must be fetched separately
 * We must route through our proxy to avoid CORS issues
 */
async function fetchBasketLines(linesUrl: string): Promise<OscarBasketLine[]> {
  await ensureSession();
  // Convert Oscar API URL to our proxy URL
  // e.g., https://orthodoxbookshop.asia/api/baskets/9752442/lines/ -> /api/oscar/baskets/9752442/lines/
  const oscarApiBase = 'https://orthodoxbookshop.asia/api';
  let proxyUrl: string;
  
  if (linesUrl.startsWith(oscarApiBase)) {
    proxyUrl = linesUrl.replace(oscarApiBase, '/api/oscar');
  } else {
    proxyUrl = linesUrl;
  }
  
  const response = await fetch(proxyUrl, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    console.error('[fetchBasketLines] Failed to fetch lines:', response.status);
    return [];
  }

  const data = await response.json();
  
  // Handle paginated response or direct array
  if (Array.isArray(data)) {
    return data;
  }
  return data.results || [];
}

/**
 * Fetch product details by ID to get title, author, image for basket display
 * If the product is a variant (child), fetch the parent instead and include variant info
 */
export async function fetchProductDetails(productId: string): Promise<{
  title: string;
  author: string;
  coverImage: string;
  variantTitle?: string;
  parentId: string; // Parent product ID for navigation (same as productId for parent products)
} | null> {
  try {
    const product = await getProductById(productId);
    
    // If this is a variant (child product), fetch the parent instead
    // Oscar products with variants have is_parent=false on children
    // Children have a parent_id set, parents have is_parent=true
    if (!product.is_parent && product.parent_id) {
      const parentProduct = await getProductById(product.parent_id.toString());
      // Return parent info but also include variant title (e.g., "E-book" or "Printed book")
      return {
        title: parentProduct.title || 'Unknown Product',
        author: parentProduct.author || '',
        coverImage: parentProduct.image_url ? getFullImageUrl(parentProduct.image_url) : '/images/placeholder-book.jpg',
        variantTitle: product.title || undefined, // This is the variant title like "E-book"
        parentId: product.parent_id.toString(), // Use parent ID for navigation
      };
    }
    
    return {
      title: product.title || 'Unknown Product',
      author: product.author || '',
      coverImage: product.image_url ? getFullImageUrl(product.image_url) : '/images/placeholder-book.jpg',
      parentId: productId, // For parent products, use their own ID
    };
  } catch (err) {
    console.error('[fetchProductDetails] Failed to fetch product:', productId, err);
    return null;
  }
}

/**
 * Convert Oscar Basket to CartItem format for UI display
 * Oscar's basket lines only contain product URL and price info, not expanded product details
 */
export async function basketToCartItems(basket: Basket): Promise<Array<{
  id: string;
  basketLineId: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  coverImage: string;
  linePrice: number;
  variantTitle?: string;
  is_shipping_required: boolean;
  parentId: string; // Parent product ID for navigation
}>> {
  let lines: OscarBasketLine[] = [];
  
  // Handle different lines formats
  if (typeof basket.lines === 'string') {
    lines = await fetchBasketLines(basket.lines);
  } else if (Array.isArray(basket.lines)) {
    lines = basket.lines as unknown as OscarBasketLine[];
  } else if (basket.lines && typeof basket.lines === 'object') {
    const linesResponse = basket.lines as unknown as { results?: OscarBasketLine[] };
    lines = linesResponse.results || [];
  }
  
  // Fetch product details for each line
  const cartItems = await Promise.all(
    lines.map(async (line: OscarBasketLine) => {
      // Extract product ID from URL
      const productId = extractProductIdFromUrl(line.product);
      
      // Use line price as both unit price and line price since Oscar doesn't give separate unit price
      const linePrice = parseFloat(line.price_incl_tax) || 0;
      const unitPrice = line.quantity > 0 ? linePrice / line.quantity : 0;
      
      // Fetch product details for title, author, image
      const productDetails = await fetchProductDetails(productId);
      
      // Oscar API basket lines don't have 'id' or 'line_id' fields directly
      // The line ID is embedded in the 'url' field (e.g., /baskets/9752442/lines/1188/)
      const lineId = extractLineIdFromUrl(line.url) || (line as any).id || (line as any).line_id;
      
      return {
        id: productId,
        basketLineId: lineId,
        title: productDetails?.title || 'Unknown Product',
        author: productDetails?.author || '',
        price: unitPrice,
        quantity: line.quantity,
        coverImage: productDetails?.coverImage || '/images/placeholder-book.jpg',
        linePrice: linePrice,
        variantTitle: productDetails?.variantTitle,
        is_shipping_required: line.is_shipping_required ?? true, // Default to true if not provided
        parentId: productDetails?.parentId || productId, // Use parent ID for navigation, fallback to productId
      };
    })
  );
  
  return cartItems;
}

/**
 * Extract product ID from Oscar API product URL
 * e.g., "http://127.0.0.1:8000/api/products/1/" -> "1"
 */
function extractProductIdFromUrl(productUrl: string): string {
  if (!productUrl) return '';
  const match = productUrl.match(/\/products\/(\d+)\/?$/);
  return match ? match[1] : productUrl;
}

/**
 * Extract line ID from Oscar API basket line URL
 * e.g., "https://orthodoxbookshop.asia/api/baskets/9752442/lines/1188/" -> 1188
 */
function extractLineIdFromUrl(lineUrl: string): number {
  if (!lineUrl) return 0;
  const match = lineUrl.match(/\/lines\/(\d+)\/?$/);
  return match ? parseInt(match[1], 10) : 0;
}

// =============================================================================
// Shipping Methods API Functions
// =============================================================================

/**
 * Fetch available shipping methods from the backend
 * - With address (checkout page): POST /api/basket/shipping-methods/ with address body
 * - Without address (cart page): GET /api/basket/shipping-methods/ for default methods
 * @param shippingAddr - Optional full shipping address object
 * @returns Array of available shipping methods
 */
export async function getShippingMethods(shippingAddr?: ShippingAddress): Promise<ShippingMethod[]> {
  const url = `${getApiBase()}/basket/shipping-methods/`;
  const headers = getAuthHeaders();
  
  // Use GET when no address is provided (cart page), POST with address body otherwise
  if (!shippingAddr) {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch shipping methods: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
  
  // Convert country code to URL format expected by Django REST Framework's HyperlinkedRelatedField
  // The backend expects: "country": "https://orthodoxbookshop.asia/api/countries/US/"
  // The frontend sends: "country": "US"
  const OSCAR_API_BASE = 'https://orthodoxbookshop.asia/api';
  const addressWithCountryUrl = {
    ...shippingAddr,
    country: `${OSCAR_API_BASE}/countries/${shippingAddr.country}/`,
  };
  
  // POST with full shipping address for accurate shipping calculation (checkout page)
  const response = await fetch(url, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify(addressWithCountryUrl),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch shipping methods: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// =============================================================================
// Order Placement API Functions
// =============================================================================

/**
 * Place an order via the Oscar checkout API.
 * Called after payment is confirmed to register the order in the backend.
 * On success, the basket status changes from "Open" to "Submitted" and an order is created.
 */
export async function placeOrder(params: {
  basketId: string;
  total: string;
  currency: string;
  shippingMethodCode: string;
  shippingCharge?: {
    currency: string;
    excl_tax: string;
    tax: string;
  };
  shippingAddress?: ShippingAddress;
  guestEmail?: string;
}): Promise<Order> {
  const headers = getAuthHeaders();

  // Build the basket URL - Oscar requires a full URL (HyperlinkedRelatedField)
  // Same pattern as getShippingMethods() which constructs country URLs
  const OSCAR_API_BASE = 'https://orthodoxbookshop.asia/api';
  const basketUrl = `${OSCAR_API_BASE}/baskets/${params.basketId}/`;

  // Build the request payload
  const payload: OrderPlacementRequest = {
    basket: basketUrl,
    total: params.total,
    shipping_method_code: params.shippingMethodCode,
  };

  // Add shipping charge if provided
  if (params.shippingCharge) {
    payload.shipping_charge = params.shippingCharge;
  }

  // Convert ShippingAddress to OscarAddress format (country code → URL)
  if (params.shippingAddress) {
    payload.shipping_address = {
      country: `${OSCAR_API_BASE}/countries/${params.shippingAddress.country}/`,
      first_name: params.shippingAddress.first_name,
      last_name: params.shippingAddress.last_name,
      line1: params.shippingAddress.line1,
      line2: params.shippingAddress.line2 || '',
      line3: params.shippingAddress.line3 || '',
      line4: params.shippingAddress.line4 || '',
      notes: params.shippingAddress.notes || '',
      phone_number: params.shippingAddress.phone_number || '',
      postcode: params.shippingAddress.postcode || '',
      state: params.shippingAddress.state || '',
    };
  }

  // Add guest email for anonymous checkout
  if (params.guestEmail) {
    payload.guest_email = params.guestEmail;
  }

  const response = await fetch(`${getApiBase()}/checkout/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Order placement failed:', response.status, errorData);
    throw new Error(
      errorData.detail ||
      errorData.basket?.[0] ||
      `Order placement failed with status ${response.status}`
    );
  }

  return response.json();
}

// =============================================================================
// Order History API
// =============================================================================

/**
 * Fetch user's orders (paginated)
 */
export async function getOrders(page: number = 1): Promise<OscarOrderListResponse> {
  const response = await fetch(`${getApiBase()}/orders/?page=${page}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch a single order by its database primary key (NOT the order number).
 * django-oscar-api uses `<int:pk>` in the URL, so we must pass the pk here.
 */
export async function getOrderById(pk: string): Promise<OscarOrder> {
  const response = await fetch(`${getApiBase()}/orders/${pk}/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch lines for a specific order by its database primary key (NOT the order number).
 * django-oscar-api uses `<int:pk>` in the URL, so we must pass the pk here.
 */
export async function getOrderLines(pk: string): Promise<OscarPaginationResponse<OrderLine>> {
  const response = await fetch(`${getApiBase()}/orders/${pk}/lines/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch order lines: ${response.status}`);
  }
  return response.json();
}
