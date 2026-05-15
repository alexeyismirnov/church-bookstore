'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, BookOpen, Headphones, Cross, type LucideIcon } from 'lucide-react';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import { getNewArrivals, getMyBooks, getFullImageUrl } from './lib/api';
import { useAuth } from './lib/AuthContext';
import { STATIC_CATEGORIES } from './lib/data';
import { useApiLocale } from './i18n/useApiLocale';
import { useCurrency } from './i18n/CurrencyContext';
import { useTranslations } from './i18n/LanguageContext';
import { Book, MyBook } from './types';

// Icons for top-level categories, keyed by slug
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'books': BookOpen,
  'audiovideo': Headphones,
  'church-supplies': Cross,
};

// Translation keys for category descriptions, keyed by slug
const CATEGORY_DESC_KEYS: Record<string, string> = {
  'books': 'categories.booksDesc',
  'audiovideo': 'categories.audiovideoDesc',
  'church-supplies': 'categories.churchSuppliesDesc',
};

export default function HomePage() {
  const locale = useApiLocale();
  const { isLoading: isCurrencyLoading } = useCurrency();
  const t = useTranslations('homepage');
  const tGlobal = useTranslations();
  const [newArrivals, setNewArrivals] = useState<Book[]>([]);
  const [heroBook, setHeroBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [miniBookshelf, setMiniBookshelf] = useState<MyBook[]>([]);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Don't fetch until currency context is loaded
    if (isCurrencyLoading) return;

    async function fetchData() {
      setLoading(true);
      try {
        const newArrivalsData = await getNewArrivals(5);
        // Randomly select a hero book from the fetched arrivals
        const heroIndex = Math.floor(Math.random() * newArrivalsData.length);
        const hero = newArrivalsData[heroIndex];
        setHeroBook(hero);
        setNewArrivals(newArrivalsData.filter((_, i) => i !== heroIndex));
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [locale, isCurrencyLoading]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setMiniBookshelf([]);
      return;
    }

    async function fetchMiniBookshelf() {
      try {
        const myBooks = await getMyBooks();
        const visibleBooks = myBooks.filter((book) => {
          const downloadUrl = book.download_url || '';
          const epubUrl = book.epub_url || '';
          const isFree = downloadUrl.includes('orthodoxbookshop') || epubUrl.includes('orthodoxbookshop');
          return book.purchased || isFree;
        });
        setMiniBookshelf(visibleBooks.slice(0, 4));
      } catch (err) {
        console.error('Error fetching mini bookshelf:', err);
        setMiniBookshelf([]);
      }
    }

    fetchMiniBookshelf();
  }, [authLoading, isAuthenticated, locale]);

  return (
    <div>
      <Hero book={heroBook} />

      {!authLoading && isAuthenticated && miniBookshelf.length > 0 && (
        <section className="pt-8 pb-8 md:pt-10 md:pb-10 bg-parchment-dark/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative mb-8 md:mb-10">
              <h2 className="section-title text-center mb-0">{tGlobal('bookshelf.title')}</h2>
              <Link
                href="/bookshelf"
                className="absolute right-0 top-0 text-sm font-medium text-burgundy hover:text-burgundy-dark hover:underline"
              >
                {tGlobal('common.viewAll')}
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {miniBookshelf.map((book) => (
                <Link
                  key={book.book_id}
                  href={`/product/${book.book_id}`}
                  className="group block rounded-xl overflow-hidden border border-parchment-dark/30 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-parchment">
                    <img
                      src={getFullImageUrl(book.cover_image)}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-ink line-clamp-2 group-hover:text-burgundy transition-colors">
                      {book.title}
                    </h3>
                    {book.author_name && (
                      <p className="mt-1 text-xs text-ink-light line-clamp-1">{book.author_name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      <section className="pt-8 pb-16 md:pt-12 md:pb-20 bg-parchment">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-0">{t('featured.newArrivals')}</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-burgundy" />
            </div>
          ) : newArrivals.length > 0 ? (
            <ProductGrid books={newArrivals} />
          ) : (
            <p className="text-center text-ink-muted py-8">No new arrivals at the moment. Check back soon!</p>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="pt-8 pb-16 md:pt-12 md:pb-20 bg-parchment-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-12">{t('categories.title')}</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-burgundy" />
            </div>
          ) : (
            <div className="space-y-4">
              {STATIC_CATEGORIES.map((category) => {
                const CategoryIcon = CATEGORY_ICONS[category.slug] || BookOpen;
                return (
                  <div
                    key={category.id}
                    className="group"
                  >
                    <div className="flex items-start gap-4 p-6 rounded-xl bg-parchment border border-parchment-dark/30 hover:border-gold/50 hover:shadow-md transition-all">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-burgundy/10 flex items-center justify-center text-burgundy group-hover:bg-burgundy group-hover:text-parchment-light transition-colors">
                        <CategoryIcon className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <h3 className="text-lg font-semibold text-ink group-hover:text-burgundy transition-colors">
                          {tGlobal(category.nameKey)}
                        </h3>
                        <p className="mt-1 text-sm text-ink-light leading-relaxed">
                          {t(CATEGORY_DESC_KEYS[category.slug] || 'categories.defaultDesc', { name: tGlobal(category.nameKey) })}
                        </p>
                        {category.children && category.children.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {category.children.map((child) => (
                              <Link
                                key={child.id}
                                href={`/catalog?category=${child.id}`}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-parchment text-ink-light border border-parchment-dark/20 hover:bg-burgundy/10 hover:text-burgundy hover:border-burgundy/30 hover:shadow-md transition-all"
                              >
                                {tGlobal(child.nameKey)}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="pt-8 md:pt-10 pb-16 md:pb-20 bg-parchment">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-ink mb-2">{t('features.curatedTitle')}</h3>
              <p className="text-ink-light">
                {t('features.curatedDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-ink mb-2">{t('features.qualityTitle')}</h3>
              <p className="text-ink-light">
                {t('features.qualityDesc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-ink mb-2">{t('features.churchTitle')}</h3>
              <p className="text-ink-light">
                {t('features.churchDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

