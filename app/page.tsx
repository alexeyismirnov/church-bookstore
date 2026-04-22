'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, BookOpen, Headphones, Cross, type LucideIcon } from 'lucide-react';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import { getNewArrivals, getCategories } from './lib/api';
import { useApiLocale } from './i18n/useApiLocale';
import { useCurrency } from './i18n/CurrencyContext';
import { useTranslations } from './i18n/LanguageContext';
import { Book, Category } from './types';

// Category slugs to exclude from the homepage display
// "Language" shows all books (same as "Books"), so it's redundant
const EXCLUDED_CATEGORY_SLUGS = ['language'];

// Descriptions and icons for top-level categories, keyed by slug
const CATEGORY_INFO: Record<string, { description: string; Icon: LucideIcon }> = {
  'books': {
    description: 'Theology, lives of saints, liturgical texts, church history, and more — our full collection of printed and digital Orthodox Christian literature.',
    Icon: BookOpen,
  },
  'audiovideo': {
    description: 'Audio CDs of Orthodox liturgical music and choral works, plus the film "Faith of Saints" — multimedia resources for spiritual enrichment.',
    Icon: Headphones,
  },
  'church-supplies': {
    description: 'Hand-painted icons and frankincense for your home or parish — sacred items to support Orthodox worship and prayer life.',
    Icon: Cross,
  },
};

export default function HomePage() {
  const locale = useApiLocale();
  const { isLoading: isCurrencyLoading } = useCurrency();
  const t = useTranslations('homepage');
  const [newArrivals, setNewArrivals] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't fetch until currency context is loaded
    if (isCurrencyLoading) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [newArrivalsData, categoriesData] = await Promise.all([
          getNewArrivals(4),
          getCategories(),
        ]);
        setNewArrivals(newArrivalsData);
        setCategories(
          categoriesData.filter(c => !EXCLUDED_CATEGORY_SLUGS.includes(c.slug))
        );
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [locale, isCurrencyLoading]);

  return (
    <div>
      <Hero />

      {/* New Arrivals Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title mb-0">{t('featured.newArrivals')}</h2>
            <Link
              href="/catalog?sort=newest"
              className="flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : newArrivals.length > 0 ? (
            <ProductGrid books={newArrivals} />
          ) : (
            <p className="text-center text-gray-500 py-8">No new arrivals at the moment. Check back soon!</p>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-12">{t('categories.title')}</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => {
                const info = CATEGORY_INFO[category.slug];
                const CategoryIcon = info?.Icon || BookOpen;
                return (
                  <Link
                    key={category.id}
                    href={`/catalog?category=${category.id}`}
                    className="group block"
                  >
                    <div className="flex items-start gap-4 p-6 rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <CategoryIcon className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-lg font-semibold text-dark group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          <span className="text-sm text-gray-500 flex-shrink-0">{category.count} books</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                          {info?.description || `Browse our collection of ${category.name.toLowerCase()}.`}
                        </p>
                        {category.children && category.children.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {category.children.map((child) => (
                              <span
                                key={child.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                              >
                                {child.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">Curated Selection</h3>
              <p className="text-gray-600">
                Carefully selected books from Orthodox publishers worldwide, ensuring doctrinal soundness and spiritual value.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">
                All our books are printed on high-quality paper with durable bindings, built to last for generations.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">Church Supported</h3>
              <p className="text-gray-600">
                Proceeds support our parish ministries and charitable works in the local community and abroad.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

