// app/lib/CartContext.tsx
// Context for sharing cart state between Header and CartPage

'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getBasket, getAuthHeaders } from './api';

interface CartContextType {
  cartCount: number;
  refreshCart: () => Promise<void>;
  isCartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Module-level ref so that AuthProvider (which renders *above* CartProvider)
// can trigger a cart refresh without needing the React context.
let refreshCartRef: (() => void) | null = null;

/** Trigger a cart refresh from outside the CartProvider tree (e.g. AuthProvider). */
export function triggerRefreshCart() {
  if (refreshCartRef) {
    refreshCartRef();
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshCart = useCallback(async () => {
    // Increment trigger to signal all consumers to refresh
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Expose refreshCart via module-level ref so triggerRefreshCart() works
  // even when called from a component that is not inside CartProvider.
  useEffect(() => {
    refreshCartRef = refreshCart;
    return () => { refreshCartRef = null; };
  }, [refreshCart]);

  useEffect(() => {
    async function fetchCartCount() {
      try {
        setIsCartLoading(true);
        const basket = await getBasket();
        // Count total items in basket
        let count = 0;
        if (basket.num_items !== undefined) {
          count = basket.num_items;
        } else {
          // Type assertion because API can return lines as a URL string
          const lines = basket.lines as unknown;
          if (typeof lines === 'string') {
            // lines is a URL - need to fetch
            const linesResponse = await fetch(lines.replace('https://orthodoxbookshop.asia/api', '/api/oscar'), {
              method: 'GET',
              headers: getAuthHeaders(),
              cache: 'no-store',
              credentials: 'include',
            });
            if (linesResponse.ok) {
              const linesData = await linesResponse.json();
              const lineResults = linesData.results || [];
              count = lineResults.reduce((sum: number, line: any) => sum + line.quantity, 0);
            }
          } else if (Array.isArray(lines)) {
            count = (lines as any[]).reduce((sum, line) => sum + (line.quantity || 0), 0);
          } else if (lines && typeof lines === 'object' && 'results' in (lines as any)) {
            // It's a BasketLinesResponse with results array
            count = ((lines as any).results || []).reduce((sum: number, line: any) => sum + line.quantity, 0);
          }
        }
        setCartCount(count);
      } catch (err) {
        console.error('Failed to fetch cart count:', err);
      } finally {
        setIsCartLoading(false);
      }
    }

    fetchCartCount();
  }, [refreshTrigger]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart, isCartLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
