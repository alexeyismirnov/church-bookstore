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

  // Keep a ref to the latest locale so the profile-sync effect always compares
  // against the current locale, not a stale closure value.
  // (locale is intentionally excluded from the effect's dep array to prevent a
  // feedback loop, but that caused the guard `profileLocale !== locale` to use
  // a stale value — this ref solves that without re-introducing the loop.)
  const localeRef = useRef<Locale>(locale);
  useEffect(() => {
    localeRef.current = locale;
  });

  // Sync with profile language when profile changes and user is authenticated.
  // Only syncs FROM profile TO context (not the other way around).
  useEffect(() => {
    if (isAuthenticated && profile?.language) {
      const profileLocale = profile.language as Locale;
      // Use the ref to get the current locale without adding it to deps
      if (locales.includes(profileLocale) && profileLocale !== localeRef.current) {
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
    
    // If user is authenticated, update profile with new language.
    // Note: rapid switching may cause out-of-order updateProfile responses.
    // The localeRef guard in the profile-sync effect prevents the UI locale
    // from being overwritten by a stale response, since localeRef.current will
    // already reflect the latest selection by the time any response arrives.
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
