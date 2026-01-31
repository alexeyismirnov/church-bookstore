'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { categories } from '../lib/data';

interface FilterSidebarProps {
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  inStock: boolean;
  onStockChange: (value: boolean) => void;
}

export default function FilterSidebar({
  selectedCategories,
  onCategoryChange,
  priceRange,
  onPriceChange,
  inStock,
  onStockChange,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    availability: true,
    categories: true,
    price: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside className="w-full lg:w-64 space-y-6">
      {/* Availability */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <button
          className="flex items-center justify-between w-full font-semibold text-dark"
          onClick={() => toggleSection('availability')}
        >
          Availability
          {expandedSections.availability ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {expandedSections.availability && (
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => onStockChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600">In Stock</span>
            </label>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <button
          className="flex items-center justify-between w-full font-semibold text-dark"
          onClick={() => toggleSection('categories')}
        >
          Categories
          {expandedSections.categories ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {expandedSections.categories && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.slug)}
                  onChange={() => onCategoryChange(category.slug)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-600 flex-grow">
                  {category.name}
                </span>
                <span className="text-xs text-gray-400">({category.count})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <button
          className="flex items-center justify-between w-full font-semibold text-dark"
          onClick={() => toggleSection('price')}
        >
          Price Range
          {expandedSections.price ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {expandedSections.price && (
          <div className="mt-3 space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) =>
                  onPriceChange([Number(e.target.value), priceRange[1]])
                }
                className="w-20 px-3 py-2 border rounded-lg text-sm"
                placeholder="Min"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) =>
                  onPriceChange([priceRange[0], Number(e.target.value)])
                }
                className="w-20 px-3 py-2 border rounded-lg text-sm"
                placeholder="Max"
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={priceRange[1]}
              onChange={(e) =>
                onPriceChange([priceRange[0], Number(e.target.value)])
              }
              className="w-full accent-primary"
            />
          </div>
        )}
      </div>

      {/* Apply Filters Button */}
      <button className="w-full btn-primary">
        Apply Filters
      </button>
    </aside>
  );
}
