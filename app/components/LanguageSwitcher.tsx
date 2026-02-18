// app/components/LanguageSwitcher.tsx
// Language switcher component - similar to Django's navbar dropdown

'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage, locales, languageNames, languageFlags, type Locale } from '../i18n/LanguageContext';
import { useTranslations } from '../i18n/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { ChevronDown } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const t = useTranslations('nav');
  const { isAuthenticated, profile, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with profile language when profile changes and user is authenticated
  // Note: We intentionally DON'T include locale in deps to prevent loop
  // The effect should only sync FROM profile TO context, not the other way around
  useEffect(() => {
    if (isAuthenticated && profile?.language) {
      const profileLocale = profile.language as Locale;
      if (locales.includes(profileLocale) && profileLocale !== locale) {
        setLocale(profileLocale);
      }
    }
  }, [profile, isAuthenticated, setLocale]);

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

  const handleLanguageSelect = async (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
    
    // If user is authenticated, update profile with new language
    if (isAuthenticated) {
      try {
        await updateProfile({ language: newLocale });
      } catch (error) {
        console.error('Failed to update profile language:', error);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-dark hover:bg-white/10 rounded-md transition-colors"
        aria-label="Select language"
      >
        <span className="text-lg">{languageFlags[locale]}</span>
        <span className="hidden sm:inline text-sm font-medium">{languageNames[locale]}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          <div className="px-4 py-2 text-xs text-gray-500 uppercase font-semibold border-b">
            {t('selectLanguage')}
          </div>
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLanguageSelect(loc)}
              className={`w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                locale === loc ? 'bg-gray-50 text-primary font-medium' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{languageFlags[loc]}</span>
              <span>{languageNames[loc]}</span>
              {locale === loc && (
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
