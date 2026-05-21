'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage, locales, languageNames, languageFlags, type Locale } from '../i18n/LanguageContext';
import { useTranslations } from '../i18n/LanguageContext';
import { replaceLocaleInPathname } from '../i18n/routing';
import { useAuth } from '../lib/AuthContext';
import { ChevronDown } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale } = useLanguage();
  const t = useTranslations('nav');
  const { isAuthenticated, updateProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (newLocale: Locale) => {
    // Only persist the preference — do NOT call setLocale() here.
    // Calling setLocale() would update React state immediately, causing all
    // t() calls to re-render in the new language BEFORE router.push() triggers
    // a full page navigation. That creates a visible flicker (double-render).
    // Instead, we write the cookie + localStorage so the server-rendered page
    // at the new URL will pick up the correct locale.
    try {
      document.cookie = `locale=${newLocale}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('Could not save language preference to cookie');
    }
    try {
      localStorage.setItem('locale', newLocale);
    } catch (e) {
      console.warn('Could not save language preference to localStorage');
    }

    setIsOpen(false);
    const newPath = replaceLocaleInPathname(pathname, newLocale);
    const searchString = searchParams.toString();
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const target = searchString ? `${newPath}?${searchString}${hash}` : `${newPath}${hash}`;
    router.push(target);

    // Save to user profile non-blocking (fire and forget).
    // We intentionally do NOT await this — navigation should not be delayed.
    if (isAuthenticated) {
      updateProfile({ language: newLocale }).catch((error: unknown) => {
        console.error('Failed to update profile language:', error);
      });
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
                locale === loc ? 'bg-gray-50 text-burgundy font-medium' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{languageFlags[loc]}</span>
              <span>{languageNames[loc]}</span>
              {locale === loc && (
                <svg className="w-4 h-4 ml-auto text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
