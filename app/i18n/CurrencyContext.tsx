// app/i18n/CurrencyContext.tsx
// Client-side currency context for managing currency state

'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Currency, defaultCurrency, currencies, currencySymbols, currencyNames } from './settings';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  symbol: string;
  name: string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
  // initialCurrency is read server-side from the 'currency' cookie in layout.tsx.
  // This allows the server to render with the correct currency from the start,
  // eliminating the flash that occurred when currency was only available
  // client-side via localStorage.
  initialCurrency?: Currency;
}

export function CurrencyProvider({ children, initialCurrency }: CurrencyProviderProps) {
  // Use the server-provided initialCurrency (from cookie) if available,
  // otherwise fall back to defaultCurrency.
  const [currency, setCurrencyState] = useState<Currency>(
    initialCurrency && currencies.includes(initialCurrency) ? initialCurrency : defaultCurrency
  );
  // isLoading is always false because the currency is known from the first render
  // (provided via the initialCurrency prop from the server-read cookie).
  const isLoading = false;

  const setCurrency = useCallback((newCurrency: Currency) => {
    // Write to localStorage BEFORE updating React state.
    // This ensures that when the useEffect in ProductDetailClient fires (triggered by
    // the currency state change), getApiHeaders() reads the correct new currency from
    // localStorage — avoiding a race where the effect fires before localStorage is updated.
    try {
      localStorage.setItem('currency', newCurrency);
    } catch (e) {
      console.warn('Could not save currency preference to localStorage');
    }
    // Also write to cookie so the server can read it on the next request and
    // render with the correct currency from the start (no flash).
    try {
      document.cookie = `currency=${newCurrency}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('Could not save currency preference to cookie');
    }
    setCurrencyState(newCurrency);
  }, []);

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    symbol: currencySymbols[currency],
    name: currencyNames[currency],
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Export for use in other components
// Note: Import currencies, currencyNames, Currency directly from './settings'
