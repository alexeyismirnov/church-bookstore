export interface Variant {
  id: number;
  title: string;
  price: string;
  is_shipping_required: boolean;
  book_type: "printed" | "ebook";
  isAvailable: boolean;
  isInStock: boolean;
  stockCount: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  coverImage: string;
  category: string;
  publisher: string;
  year: number;
  pages: number;
  description: string;
  inStock: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  isShippingRequired?: boolean;
  isParent?: boolean;
  parentId?: number | null;
  variants?: Variant[];
  previewUrl?: string | null;
  downloadUrl?: string | null;
  epubUrl?: string | null;
  translator?: string;
  pubDate?: string;
  language?: string;
  stockCount?: number;
  isInStock?: boolean;
}

export interface CartItem extends Book {
  quantity: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  children?: Category[];
}

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  inStock: boolean;
  sortBy: 'newest' | 'price-asc' | 'price-desc' | 'popular';
}

// ============================================================================
// Oscar API Types
// ============================================================================

/**
 * Oscar API Product response
 * Based on the Django Oscar oscarapi product serializer
 */
export interface OscarProduct {
  id: number;
  upc: string;
  url?: string;
  title: string;
  price: string;
  currency?: string;
  availability?: string;
  is_available: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  image_url: string | null;
  images?: Array<{
    original: string;
    caption?: string;
  }>;
  
  // Multi-language titles (optional, for detailed views)
  title_en?: string;
  title_ru?: string;
  title_zh_hans?: string;
  title_zh_hant?: string;

  // Multi-language authors (optional, for detailed views)
  author_en?: string;
  author_ru?: string;
  author_zh_hans?: string;
  author_zh_hant?: string;

  // Multi-language descriptions (optional, for detailed views)
  description_en?: string;
  description_ru?: string;
  description_zh_hans?: string;
  description_zh_hant?: string;

  // Additional fields that may be present
  description?: string;
  author?: string;
  publisher?: string;
  pub_date?: string;
  text_script?: string;
  translator?: string;
  num_pages?: number;
  category?: string;
  categories?: Array<{
    name: string;
    slug: string;
  }>;
  
  // Stock and pricing
  stockrecords?: Array<{
    partner: string;
    partner_sku: string;
    price_currency: string;
    price_excl_tax: string;
    price_incl_tax: string;
    num_in_stock: number | null;
    num_allocated: number;
    low_stock_threshold: number | null;
  }>;

  // Product type indicator (true for paper books, false for e-books)
  is_shipping_required?: boolean;

  // Parent/child product variant structure
  is_parent?: boolean;
  parent_id?: number | null;
  variants?: Variant[];

  // Download URLs for e-book versions
  preview_url?: string | null;
  download_url?: string | null;
  epub_url?: string | null;

  // Stock information
  stock_count?: number;
  is_in_stock?: boolean;
}

/**
 * Oscar API Paginated Response
 * Standard Django REST Framework pagination format
 */
export interface OscarPaginationResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Oscar API Product List Response
 */
export type OscarProductListResponse = OscarPaginationResponse<OscarProduct>;

/**
 * Oscar API Error Response
 */
export interface OscarApiError {
  detail?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * MyBook - Purchased book from the backend
 * Based on MyBooksSerializer in apps/api/serializers.py
 */
export interface MyBook {
  book_id: number;
  purchased: boolean;
  title: string;
  author_name: string;
  cover_image: string | null;
  num_pages: number | null;
  description: string;
  download_url: string | null;
  epub_url: string | null;
}

// ============================================================================
// Oscar Basket API Types
// ============================================================================

/**
 * Oscar API Basket Line (individual item in basket)
 * Based on oscarapi/basketserializer.py
 */
export interface BasketLine {
  id: number;
  product: string; // Product URL, e.g., "http://127.0.0.1:8000/api/products/1/"
  product_title: string;
  product_author?: string;
  product_image?: string;
  quantity: number;
  unit_price_excl_tax: string;
  unit_price_incl_tax: string;
  line_price_excl_tax: string;
  line_price_incl_tax: string;
  is_shipping_required: boolean;
  stock_record?: {
    partner: string;
    partner_sku: string;
    num_in_stock: number | null;
  };
  warning?: string;
  options?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Oscar API Basket Lines response (paginated)
 */
export interface BasketLinesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BasketLine[];
}

/**
 * Oscar API Basket response
 * Based on oscarapi/basketserializer.py
 */
export interface Basket {
  id: string;
  lines: BasketLine[] | BasketLinesResponse; // Can be direct array or paginated response
  owner: number | null; // User ID or null for anonymous
  status: string; // e.g., "Open", "Frozen", "Submitted"
  total_excl_tax: string;
  total_incl_tax: string;
  currency: string;
  creation_date: string;
  last_modification_date: string;
  // Anonymous basket support
  anonymous_id?: string;
  num_items?: number;
  num_items_without_gifting?: number;
}

/**
 * Oscar API Add to Basket Request
 */
export interface AddToBasketRequest {
  product: number; // Product ID
  quantity: number;
  optional?: {
    options?: Array<{
      name: string;
      value: string;
    }>;
  };
}

/**
 * Oscar API Update Basket Line Request
 */
export interface UpdateBasketLineRequest {
  quantity: number;
}

// ============================================================================
// Checkout Types
// ============================================================================

/**
 * Country type for dropdown selection
 * Used in shipping address form countries dropdown
 */
export interface Country {
  code: string; // 2-letter ISO country code
  name: string; // Country display name
}

/**
 * Shipping address form data
 * Based on django-oscar's AbstractAddress model
 */
export interface ShippingAddress {
  first_name: string;       // First name (required)
  last_name: string;        // Last name (required)
  line1: string;            // Street address line 1 (required)
  line2?: string;           // Street address line 2 (optional)
  line3?: string;           // e.g., building name, floor (optional)
  line4?: string;           // City (optional)
  state?: string;           // State/province/region (optional)
  postcode?: string;        // ZIP/postal code (optional)
  country: string;          // 2-letter ISO country code (required)
  phone_number?: string;    // Phone number (optional)
  notes?: string;           // Delivery instructions (optional)
}

/**
 * Shipping Method from the backend API
 * Represents available shipping options with their prices
 */
export interface ShippingMethod {
  code: string;
  name: string;
  price: {
    currency: string;
    excl_tax: string;
    incl_tax: string;
    tax: string;
  };
}
