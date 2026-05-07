'use client';

import { useState, useRef, useEffect } from 'react';
import countries from '@/app/lib/countries.json';
import { useTranslations } from '../../i18n/LanguageContext';

interface CountryAutocompleteProps {
  value: string;
  onChange: (code: string) => void;
  error?: string;
}

export function CountryAutocomplete({ value, onChange, error }: CountryAutocompleteProps) {
  const t = useTranslations('checkout');
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState(countries);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize input value based on selected country
  useEffect(() => {
    if (value) {
      const selectedCountry = countries.find((c) => c.code === value);
      if (selectedCountry) {
        setInputValue(selectedCountry.name);
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  // Filter countries when input changes
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter((country) =>
        country.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
    setHighlightedIndex(-1);
  }, [inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset input to selected country name if user clicks outside without selecting
        if (value) {
          const selectedCountry = countries.find((c) => c.code === value);
          if (selectedCountry) {
            setInputValue(selectedCountry.name);
          }
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
  };

  const handleSelect = (country: typeof countries[0]) => {
    onChange(country.code);
    setInputValue(country.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCountries.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredCountries.length) {
          handleSelect(filteredCountries[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        // Reset input to selected country
        if (value) {
          const selectedCountry = countries.find((c) => c.code === value);
          if (selectedCountry) {
            setInputValue(selectedCountry.name);
          }
        }
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
        {t('country')} <span className="text-red-500">*</span>
      </label>
      <input
        ref={inputRef}
        id="country"
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleInputClick}
        placeholder="Type to search countries..."
        autoComplete="off"
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-burgundy focus:border-burgundy transition-colors ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCountries.length === 0 ? (
            <li className="px-4 py-2.5 text-gray-500 italic">No countries found</li>
          ) : (
            filteredCountries.map((country, index) => (
              <li
                key={country.code}
                onClick={() => handleSelect(country)}
                className={`px-4 py-2.5 cursor-pointer transition-colors ${
                  index === highlightedIndex
                    ? 'bg-burgundy text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {country.name}
              </li>
            ))
          )}
        </ul>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
