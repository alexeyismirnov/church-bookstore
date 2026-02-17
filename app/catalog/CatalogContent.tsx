'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ProductGrid from '../components/ProductGrid';
import FilterSidebar from '../components/FilterSidebar';
import { getProducts, getProductsByCategory, oscarProductToBook } from '../lib/api';
import { useApiLocale } from '../i18n/useApiLocale';
import { useCurrency } from '../i18n/CurrencyContext';
import { useTranslations } from '../i18n/LanguageContext';
import { Book } from '../types';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface CatalogContentProps {
  categoryId?: string;
}

export default function CatalogContent({ categoryId }: CatalogContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const tCatalog = useTranslations('catalog');
  const { isLoading: isCurrencyLoading, currency } = useCurrency();
  
  // Get current locale for API calls
  const locale = useApiLocale();
  
  // Get page from URL query params, default to 1
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  // Extract category from URL for dependency tracking
  const categoryParam = searchParams.get('category');
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [inStock, setInStock] = useState(false);
  
  // API state
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  
  // Category ID for API-based filtering (passed from FilterSidebar)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categoryId || null);
  // Refresh counter to force re-fetch when category is re-selected
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync currentPage with URL when it changes externally (e.g., back button)
  useEffect(() => {
    setCurrentPage(pageFromUrl);
  }, [pageFromUrl]);
 
  // Sync selectedCategoryId with categoryId prop when it changes (e.g., from URL)
  useEffect(() => {
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    } else {
      setSelectedCategoryId(null);
    }
  }, [categoryId]);

  // Fetch products from API - triggered by currentPage, selectedCategoryId, or categoryParam changes
  // Also waits for currency to be loaded to avoid race condition
  useEffect(() => {
    // Don't fetch until currency context is loaded
    if (isCurrencyLoading) {
      return;
    }
    
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      
      try {
        let response;
        if (selectedCategoryId) {
          // Fetch products by category from /api/prodcat/<categoryId>/
          response = await getProductsByCategory(selectedCategoryId, currentPage);
        } else {
          // Fetch all products from /api/oscar/products/
          response = await getProducts(currentPage);
        }
        
        // Convert Oscar products to Book format with current locale
        const convertedBooks = response.results.map((product) => oscarProductToBook(product, locale));
        setBooks(convertedBooks);
        
        // Update pagination state
        setTotalCount(response.count);
        setHasNextPage(!!response.next);
        setHasPrevPage(!!response.previous);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [currentPage, selectedCategoryId, categoryParam, refreshKey, locale, isCurrencyLoading, currency]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Handle category selection from FilterSidebar and update URL
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    // Clear client-side category filters when using API-based filtering
    setSelectedCategories([]);
    // Increment refresh key to force re-fetch even if category ID is the same
    setRefreshKey(prev => prev + 1);
    
    // Reset page to 1 when category changes
    setCurrentPage(1);
    
    // Update URL with category parameter and reset page to 1
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    // Delete page first, then set to 1 to ensure proper reset
    params.delete('page');
    params.set('page', '1');
    
    // Use shallow routing with the current path - don't do full navigation
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Filter and sort books (client-side on current page)
  const filteredBooks = books
    .filter((book) => {
      if (selectedCategories.length > 0) {
        const categorySlug = book.category.toLowerCase().replace(/\s+/g, '-');
        if (!selectedCategories.includes(categorySlug)) return false;
      }
      if (inStock && !book.inStock) return false;
      return true;
    });

  const handlePageChange = (newPage: number) => {
    // Update URL with new page number
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    
    setCurrentPage(newPage);
    // Scroll to top of product grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary">{t('nav.home')}</Link>
          <span className="mx-2">/</span>
          <span className="text-dark">{tCatalog('title')}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-dark">{tCatalog('title')}</h1>
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {loading ? t('common.loading') : `${totalCount} ${tCatalog('products')}`}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <FilterSidebar
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            inStock={inStock}
            onStockChange={setInStock}
            onCategorySelect={handleCategorySelect}
            selectedCategoryId={selectedCategoryId}
          />

          {/* Product Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-gray-500">{t('common.loading')}</span>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-500 text-lg mb-4">{t('common.error')}</p>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-primary hover:underline"
                >
                  {t('common.retry')}
                </button>
              </div>
            ) : filteredBooks.length > 0 ? (
              <>
                <ProductGrid books={filteredBooks} />
                
                {/* Pagination */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevPage || loading}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {tCatalog('previous')}
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    {tCatalog('page')} {currentPage}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage || loading}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {tCatalog('next')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">{tCatalog('empty')}</p>
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedCategoryId(null);
                    setInStock(false);
                    // Clear category from URL
                    const params = new URLSearchParams(searchParams);
                    params.delete('category');
                    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                  }}
                  className="mt-4 text-primary hover:underline"
                >
                  {tCatalog('filter.clearAll')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
