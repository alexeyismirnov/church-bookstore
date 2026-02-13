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
