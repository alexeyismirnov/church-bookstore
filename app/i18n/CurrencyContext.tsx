// app/i18n/CurrencyContext.tsx
// Client-side currency context for managing currency state

'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Currency, defaultCurrency, currencies, currencySymbols, currencyNames } from './settings';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  symbol: string;
  name: string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(defaultCurrency);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load currency from localStorage
    // Wrap in try-catch to handle Safari private browsing or disabled storage
    try {
      const savedCurrency = localStorage.getItem('currency') as Currency;
      if (savedCurrency && currencies.includes(savedCurrency)) {
        setCurrencyState(savedCurrency);
      }
    } catch (e) {
      // localStorage not available, use default currency
      console.warn('localStorage not available, using default currency');
    }
    setIsLoading(false);
  }, []);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    // Wrap in try-catch to handle Safari private browsing or disabled storage
    try {
      localStorage.setItem('currency', newCurrency);
    } catch (e) {
      console.warn('Could not save currency preference to localStorage');
    }
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
