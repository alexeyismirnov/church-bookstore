// app/components/CurrencySelector.tsx
// Currency selector component - similar to LanguageSwitcher

'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../i18n/CurrencyContext';
import { currencies, currencyNames, type Currency } from '../i18n/settings';
import { ChevronDown } from 'lucide-react';

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencySelect = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-dark hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Select currency"
      >
        <span className="text-lg font-medium">{currency}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          <div className="px-4 py-2 text-xs text-gray-500 uppercase font-semibold border-b">
            Select Currency
          </div>
          {currencies.map((curr) => (
            <button
              key={curr}
              onClick={() => handleCurrencySelect(curr)}
              className={`w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                currency === curr ? 'bg-gray-50 text-primary font-medium' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">{curr}</span>
              <span className="text-gray-500 text-sm">{currencyNames[curr]}</span>
              {currency === curr && (
                <svg className="w-4 h-4 ml-auto text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
