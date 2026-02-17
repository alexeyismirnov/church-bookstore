// app/components/Header.tsx
// Updated to include language switcher and translations

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, User, ShoppingCart, Menu, X, Heart } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySelector from './CurrencySelector';
import { useTranslations } from '../i18n/LanguageContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount] = useState(2);
  
  // Get translations for navigation
  const t = useTranslations('nav');

  const navLinks = [
    { href: '/catalog', label: t('catalog') },
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
  ];

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

            {/* Search */}
            <button className="p-2 hover:bg-background rounded-full transition-colors">
              <Search className="w-5 h-5 text-dark" />
            </button>

            {/* Favorites */}
            <Link
              href="/favorites"
              className="hidden sm:flex p-2 hover:bg-background rounded-full transition-colors"
            >
              <Heart className="w-5 h-5 text-dark" />
            </Link>

            {/* Account */}
            <Link
              href="/login"
              className="hidden sm:flex p-2 hover:bg-background rounded-full transition-colors"
            >
              <User className="w-5 h-5 text-dark" />
            </Link>

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
            <Link
              href="/login"
              className="px-4 py-3 text-dark hover:bg-background transition-colors sm:hidden"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('account')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
