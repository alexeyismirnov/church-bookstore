// app/lib/localCart.ts
// localStorage-based cart context — Sprint 1 foundation
// Runs alongside the existing API-based CartContext during migration.

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

import { getAuthHeaders, getProductById, getFullImageUrl } from './api';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface LocalCartItem {
  productId: number;          // Oscar product/variant ID
  parentProductId: number;    // Parent product ID for navigation
  quantity: number;           // Item count
  title: string;              // Product title (cached at add-to-cart time)
  author: string;             // Author name (cached)
  coverImage: string;         // Cover image URL (cached)
  variantTitle?: string;      // e.g. "E-book" or "Printed book"
  price: number;              // Price at add-to-cart time (display only)
  currency: string;           // Currency when item was added
  isShippingRequired: boolean;// Determines shipping needs
  addedAt: string;            // ISO timestamp
}

export interface LocalCart {
  items: LocalCartItem[];
  lastUpdated: string;        // ISO timestamp
  currency: string;           // Current cart currency
}

// ---------------------------------------------------------------------------
// Sync result — returned by syncToBackend()
// ---------------------------------------------------------------------------

export interface SyncResult {
  basketId: number;
  basketData: any; // full basket response from backend
  skippedItems: Array<{ product_id: number; reason: string }>;
  /** Local cart items that were synced (for display data) */
  localItems: LocalCartItem[];
  /** Basket lines fetched from the backend (for building display items) */
  lines: Array<{
    id: number;
    url: string;
    product: string;
    quantity: number;
    price_incl_tax: string;
    price_excl_tax: string;
    price_currency: string;
    is_shipping_required?: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// Context value type
// ---------------------------------------------------------------------------

export interface LocalCartContextType {
  /** Current cart items */
  items: LocalCartItem[];
  /** Sum of all item quantities */
  totalItems: number;
  /** Sum of (item.price * item.quantity) */
  totalPrice: number;
  /** Whether the cart has been hydrated from localStorage. */
  isHydrated: boolean;
  /** Add an item. If productId already exists, increment quantity. */
  addItem: (item: LocalCartItem) => void;
  /** Update quantity. If quantity <= 0, remove the item. */
  updateQuantity: (productId: number, quantity: number) => void;
  /** Remove item by productId. */
  removeItem: (productId: number) => void;
  /** Remove all items. */
  clearCart: () => void;
  /** Sync local cart items to the Oscar backend basket. */
  syncToBackend: (currencyOverride?: string) => Promise<SyncResult>;
  /** Re-fetch prices for all cart items in the given currency. */
  refreshPrices: (newCurrency: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'church_cart';

/** In-memory fallback used when localStorage is unavailable. */
let memoryCart: LocalCart | null = null;

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__church_cart_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function createEmptyCart(): LocalCart {
  return {
    items: [],
    lastUpdated: new Date().toISOString(),
    currency: '',
  };
}

export function getStoredCart(): LocalCart {
  // 1. Try localStorage first
  if (isLocalStorageAvailable()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        // Basic shape validation
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          Array.isArray((parsed as LocalCart).items)
        ) {
          return parsed as LocalCart;
        }
        // Corrupted JSON — reset
        console.warn('[localCart] Stored cart data is corrupted, resetting.');
      }
    } catch (err) {
      console.warn('[localCart] Failed to read localStorage:', err);
    }
  }

  // 2. Fall back to in-memory store
  if (memoryCart) {
    return memoryCart;
  }

  // 3. Fresh empty cart
  return createEmptyCart();
}

function saveCart(cart: LocalCart): void {
  const json = JSON.stringify(cart);

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY, json);
    } catch (err) {
      // Quota exceeded or other write error — fall back to memory
      console.warn('[localCart] localStorage write failed, using memory:', err);
      memoryCart = cart;
    }
  } else {
    memoryCart = cart;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const LocalCartContext = createContext<LocalCartContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function LocalCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<LocalCart>(createEmptyCart);
  const [isHydrated, setIsHydrated] = useState(false);

  // Ref so async callbacks (syncToBackend) always read the latest cart
  const cartRef = useRef(cart);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  // Hydrate from localStorage after first mount (avoids SSR mismatch)
  useEffect(() => {
    setCart(getStoredCart());
    setIsHydrated(true);
  }, []);

  // Persist every state change — ONLY after hydration to avoid overwriting
  // localStorage with the empty initial cart (critical in React Strict Mode
  // where effects run twice and the first pass would wipe stored data)
  useEffect(() => {
    if (isHydrated) {
      saveCart(cart);
    }
  }, [cart, isHydrated]);

  // ---- Cart operations (all synchronous) ----

  const addItem = useCallback((item: LocalCartItem) => {
    setCart((prev) => {
      const existing = prev.items.find((i) => i.productId === item.productId);
      let newItems: LocalCartItem[];

      if (existing) {
        // Increment quantity of existing item
        newItems = prev.items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        newItems = [...prev.items, item];
      }

      return {
        ...prev,
        items: newItems,
        lastUpdated: new Date().toISOString(),
        currency: item.currency || prev.currency,
      };
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        // Remove item when quantity drops to zero or below
        return {
          ...prev,
          items: prev.items.filter((i) => i.productId !== productId),
          lastUpdated: new Date().toISOString(),
        };
      }

      return {
        ...prev,
        items: prev.items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        ),
        lastUpdated: new Date().toISOString(),
      };
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.productId !== productId),
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart((prev) => ({
      ...prev,
      items: [],
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  // ---- Sprint 3b: sync local cart → Oscar backend basket ----

  const syncToBackend = useCallback(async (currencyOverride?: string): Promise<SyncResult> => {
    // Read directly from storage to avoid React hydration timing issues
    // (the provider's useEffect may not have fired yet when checkout calls this)
    const currentCart = getStoredCart();

    if (currentCart.items.length === 0) {
      throw new Error('Cart is empty — nothing to sync');
    }

    const currency = currencyOverride || currentCart.currency;

    // 1. POST local items to the backend "from-cart" endpoint
    const response = await fetch('/api/oscar/basket/from-cart/', {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        items: currentCart.items.map(i => ({ product_id: i.productId, quantity: i.quantity })),
        currency,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Sync failed with status ${response.status}`);
    }

    const basketData = await response.json();
    const basketId: number = basketData.id;
    const skippedItems: SyncResult['skippedItems'] = basketData.skipped_items || [];

    // 2. Fetch basket lines so the caller can build display items & detect price changes
    let lines: SyncResult['lines'] = [];
    try {
      let linesUrl = basketData.lines;
      if (typeof linesUrl === 'string') {
        // Convert any backend absolute URL to a relative proxy URL.
        // e.g. https://orthodoxbookshop.asia/api/baskets/123/lines/ → /api/oscar/baskets/123/lines/
        try {
          const url = new URL(linesUrl);
          const apiPath = url.pathname.replace(/^\/api\/?/, '');
          if (apiPath) {
            linesUrl = `/api/oscar/${apiPath}`;
          }
        } catch {
          // Not a valid absolute URL — might already be relative, use as-is
        }

        const linesResponse = await fetch(linesUrl, {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (linesResponse.ok) {
          const linesData = await linesResponse.json();
          lines = Array.isArray(linesData) ? linesData : (linesData.results || []);
        }
      }
    } catch (err) {
      console.warn('[syncToBackend] Failed to fetch basket lines:', err);
    }

    return { basketId, basketData, skippedItems, lines, localItems: currentCart.items };
  }, []);

  // ---- Sprint 3c: refresh cart prices when currency changes ----

  const refreshPrices = useCallback(async (newCurrency: string): Promise<void> => {
    const currentCart = getStoredCart();
    if (currentCart.items.length === 0) return;

    // Fetch updated data for all items in parallel.
    // The API returns localized title/author based on Accept-Language header,
    // so this also serves as a locale refresh when the language has changed.
    //
    // For variant products (where parentProductId !== productId):
    //   - title, author, coverImage come from the PARENT product
    //   - price and variantTitle come from the VARIANT (child) product
    // For non-variant products, everything comes from the single product fetch.
    const updatesMap = new Map<number, { price?: number; title?: string; author?: string; coverImage?: string; variantTitle?: string }>();

    await Promise.allSettled(
      currentCart.items.map(async (item) => {
        const isVariant = item.parentProductId && item.parentProductId !== item.productId;
        const update: { price?: number; title?: string; author?: string; coverImage?: string; variantTitle?: string } = {};

        if (isVariant) {
          // Fetch both parent (for display info) and variant (for price)
          const [parentProduct, variantProduct] = await Promise.allSettled([
            getProductById(item.parentProductId.toString()),
            getProductById(item.productId.toString()),
          ]);

          // Price from variant
          if (variantProduct.status === 'fulfilled') {
            const vp = variantProduct.value;
            const newPrice = parseFloat(vp.price);
            if (!isNaN(newPrice) && newPrice > 0) {
              update.price = newPrice;
            }
            if (vp.title) {
              update.variantTitle = vp.title;
            }
          }

          // Title, author, coverImage from parent
          if (parentProduct.status === 'fulfilled') {
            const pp = parentProduct.value;
            if (pp.title) {
              update.title = pp.title;
            }
            if (pp.author) {
              update.author = pp.author;
            }
            const fullImageUrl = getFullImageUrl(pp.image_url);
            if (fullImageUrl) {
              update.coverImage = fullImageUrl;
            }
          }
        } else {
          // Non-variant: everything from the single product
          const product = await getProductById(item.productId.toString());
          const newPrice = parseFloat(product.price);
          if (!isNaN(newPrice) && newPrice > 0) {
            update.price = newPrice;
          }
          if (product.title) {
            update.title = product.title;
          }
          if (product.author) {
            update.author = product.author;
          }
          const fullImageUrl = getFullImageUrl(product.image_url);
          if (fullImageUrl) {
            update.coverImage = fullImageUrl;
          }
        }

        if (update.price || update.title || update.author || update.coverImage || update.variantTitle) {
          updatesMap.set(item.productId, update);
        }
      })
    );

    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        ...(updatesMap.has(item.productId) ? updatesMap.get(item.productId)! : {}),
        currency: newCurrency,
      })),
      lastUpdated: new Date().toISOString(),
      currency: newCurrency,
    }));
  }, []);

  // ---- Computed values ----

  const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <LocalCartContext.Provider
      value={{
        items: cart.items,
        totalItems,
        totalPrice,
        isHydrated,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        syncToBackend,
        refreshPrices,
      }}
    >
      {children}
    </LocalCartContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLocalCart(): LocalCartContextType {
  const context = useContext(LocalCartContext);
  if (!context) {
    throw new Error('useLocalCart must be used within a LocalCartProvider');
  }
  return context;
}
