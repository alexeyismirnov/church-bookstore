'use client';

import { useState, useEffect } from 'react';
import ProductGrid from '../components/ProductGrid';
import FilterSidebar from '../components/FilterSidebar';
import { getProducts, oscarProductToBook } from '../lib/api';
import { OscarProduct, Book } from '../types';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export default function CatalogPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popular'>('newest');
  
  // API state
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Fetch products from API
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getProducts(currentPage);
        
        // Convert Oscar products to Book format
        const convertedBooks = response.results.map(oscarProductToBook);
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
  }, [currentPage]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Filter and sort books (client-side on current page)
  const filteredBooks = books
    .filter((book) => {
      if (selectedCategories.length > 0) {
        const categorySlug = book.category.toLowerCase().replace(/\s+/g, '-');
        if (!selectedCategories.includes(categorySlug)) return false;
      }
      if (inStock && !book.inStock) return false;
      if (book.price < priceRange[0] || book.price > priceRange[1]) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'popular':
          return b.reviewCount - a.reviewCount;
        case 'newest':
        default:
          return b.year - a.year;
      }
    });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of product grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-dark">Catalog</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-dark">Catalog</h1>
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${totalCount} items`}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 border rounded-lg bg-white text-sm"
              disabled={loading}
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <FilterSidebar
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            inStock={inStock}
            onStockChange={setInStock}
          />

          {/* Product Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-gray-500">Loading products...</span>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-500 text-lg mb-4">Error loading products</p>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-primary hover:underline"
                >
                  Try again
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
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    Page {currentPage}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage || loading}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Page info */}
                <p className="text-center text-sm text-gray-500 mt-4">
                  Showing {filteredBooks.length} of {totalCount} products
                </p>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No books found matching your criteria.</p>
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setPriceRange([0, 100]);
                    setInStock(false);
                  }}
                  className="mt-4 text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
