'use client';

import { useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import FilterSidebar from '../components/FilterSidebar';
import { books } from '../lib/data';

export default function CatalogPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'popular'>('newest');

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Filter and sort books
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
              {filteredBooks.length} items
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 border rounded-lg bg-white text-sm"
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
            {filteredBooks.length > 0 ? (
              <ProductGrid books={filteredBooks} />
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
