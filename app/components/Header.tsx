// app/components/Header.tsx
// Updated to include authentication dropdown

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, User, ShoppingCart, Menu, X, Heart, LogOut, User as UserIcon, BookOpen } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySelector from './CurrencySelector';
import { useTranslations } from '../i18n/LanguageContext';
import { useAuth } from '../lib/AuthContext';

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [cartCount] = useState(2);
  
  // Get translations for navigation
  const t = useTranslations('nav');
  const { isAuthenticated, user, logout } = useAuth();

  const navLinks = [
    { href: '/catalog', label: t('catalog') },
    { href: '/about', label: t('about') },
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
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 relative">
              <img
                src="/images/church_logo.jpg"
                alt="Church Bookstore"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="hidden md:block text-lg font-bold text-dark">
              Orthodox Bookstore
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-dark hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </Link>
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
                  className="hidden sm:flex p-2 hover:bg-background rounded-full transition-colors items-center gap-2"
                >
                  <User className="w-5 h-5 text-dark" />
                  {user?.first_name && (
                    <span className="text-sm text-dark">{user.first_name}</span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-dark hover:bg-gray-50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <UserIcon className="w-4 h-4" />
                      {t('myProfile')}
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center gap-2 px-4 py-2 text-dark hover:bg-gray-50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <UserIcon className="w-4 h-4" />
                      {t('myOrders')}
                    </Link>
                    <Link
                      href="/bookshelf"
                      className="flex items-center gap-2 px-4 py-2 text-dark hover:bg-gray-50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <BookOpen className="w-4 h-4" />
                      {t('bookshelf')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex p-2 hover:bg-background rounded-full transition-colors"
              >
                <User className="w-5 h-5 text-dark" />
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="flex items-center gap-1 p-2 hover:bg-background rounded-full transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5 text-dark" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-background rounded-full transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-dark" />
              ) : (
                <Menu className="w-6 h-6 text-dark" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="flex flex-col py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-dark hover:bg-background transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {/* Language Switcher in Mobile Menu */}
            <div className="px-4 py-3 border-t">
              <p className="text-sm text-gray-500 mb-2">Language / 语言</p>
              <LanguageSwitcher />
            </div>
            {/* Currency Selector in Mobile Menu */}
            <div className="px-4 py-3 border-t">
              <p className="text-sm text-gray-500 mb-2">Currency</p>
              <CurrencySelector />
            </div>
            <Link
              href="/favorites"
              className="px-4 py-3 text-dark hover:bg-background transition-colors sm:hidden"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('favorites')}
            </Link>
            {/* Mobile Account - Show login or profile/logout */}
            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="px-4 py-3 text-dark hover:bg-background transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('myProfile')}
                </Link>
                <Link
                  href="/orders"
                  className="px-4 py-3 text-dark hover:bg-background transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('myOrders')}
                </Link>
                <Link
                  href="/bookshelf"
                  className="px-4 py-3 text-dark hover:bg-background transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('bookshelf')}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-3 text-dark hover:bg-background transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('account')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
