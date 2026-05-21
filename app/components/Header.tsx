// app/components/Header.tsx
// Updated to include authentication dropdown

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LocalizedLink from './LocalizedLink';
import { useLocalizedPath } from '../i18n/useLocalizedPath';
import { Search, User, ShoppingCart, Menu, X, Heart, LogOut, User as UserIcon, BookOpen } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySelector from './CurrencySelector';
import { useTranslations } from '../i18n/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { useLocalCart } from '../lib/localCart';

export default function Header() {
  const router = useRouter();
  const localizedPath = useLocalizedPath();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { totalItems } = useLocalCart();
  
  // Get translations for navigation
  const t = useTranslations('nav');
  const { isAuthenticated, user, logout } = useAuth();

  const navLinks = [
    { href: '/catalog', label: t('catalog') },
    { href: '/resources', label: t('resources') },
    { href: '/contact', label: t('contact') },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    router.push(localizedPath('/'));
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-parchment/95 backdrop-blur-sm shadow-sm border-b border-parchment-dark/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <LocalizedLink href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 relative">
              <img
                src="/images/church_logo.png"
                alt="Church Bookstore"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="hidden md:block text-lg font-bold text-ink">
              {t('title')}
            </span>
          </LocalizedLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <LocalizedLink
                key={link.href}
                href={link.href}
                className="text-ink hover:text-burgundy transition-colors font-medium"
              >
                {link.label}
              </LocalizedLink>
            ))}
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Currency Selector */}
            <div className="hidden sm:block">
              <CurrencySelector />
            </div>



            {/* Account - Login or Dropdown */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="hidden sm:flex p-2 hover:bg-parchment-dark/30 rounded-full transition-colors items-center gap-2"
                >
                  <User className="w-5 h-5 text-ink" />
                  {user?.first_name && (
                    <span className="text-sm text-ink">{user.first_name}</span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-parchment-light rounded-lg shadow-lg py-2 z-50 border">
                      <LocalizedLink
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-ink hover:bg-parchment-dark/20 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <UserIcon className="w-4 h-4" />
                        {t('myProfile')}
                      </LocalizedLink>
                      <LocalizedLink
                        href="/orders"
                        className="flex items-center gap-2 px-4 py-2 text-ink hover:bg-parchment-dark/20 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <UserIcon className="w-4 h-4" />
                        {t('myOrders')}
                      </LocalizedLink>
                      <LocalizedLink
                        href="/bookshelf"
                        className="flex items-center gap-2 px-4 py-2 text-ink hover:bg-parchment-dark/20 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <BookOpen className="w-4 h-4" />
                        {t('bookshelf')}
                      </LocalizedLink>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-burgundy hover:bg-burgundy/10 transition-colors w-full"
                      >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <LocalizedLink
                href="/login"
                className="hidden sm:flex p-2 hover:bg-parchment-dark/30 rounded-full transition-colors"
              >
                <User className="w-5 h-5 text-ink" />
              </LocalizedLink>
            )}

            {/* Cart */}
            <LocalizedLink
              href="/cart"
              className="flex items-center gap-1 p-2 hover:bg-parchment-dark/30 rounded-full transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5 text-ink" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-ink text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </LocalizedLink>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-parchment-dark/30 rounded-full transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-ink" />
              ) : (
                <Menu className="w-6 h-6 text-ink" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-parchment-light border-t">
          <nav className="flex flex-col py-4">
            {navLinks.map((link) => (
              <LocalizedLink
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-ink hover:bg-parchment-dark/20 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </LocalizedLink>
            ))}
            {/* Language Switcher in Mobile Menu */}
            <div className="px-4 py-3 border-t">
              <p className="text-sm text-ink-muted mb-2">{t('selectLanguage')}</p>
              <LanguageSwitcher />
            </div>
            {/* Currency Selector in Mobile Menu */}
            <div className="px-4 py-3 border-t">
              <p className="text-sm text-ink-muted mb-2">{t('selectCurrency')}</p>
              <CurrencySelector />
            </div>
            {/* Mobile Account - Show login or profile/logout */}
            {isAuthenticated ? (
              <>
                <LocalizedLink
                  href="/profile"
                  className="px-4 py-3 text-ink hover:bg-parchment-dark/20 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('myProfile')}
                </LocalizedLink>
                <LocalizedLink
                  href="/orders"
                  className="px-4 py-3 text-ink hover:bg-parchment-dark/20 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('myOrders')}
                </LocalizedLink>
                <LocalizedLink
                  href="/bookshelf"
                  className="px-4 py-3 text-ink hover:bg-parchment-dark/20 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('bookshelf')}
                </LocalizedLink>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-3 text-burgundy hover:bg-burgundy/10 transition-colors text-left"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <LocalizedLink
                href="/login"
                className="px-4 py-3 text-ink hover:bg-parchment-dark/20 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('account')}
              </LocalizedLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
