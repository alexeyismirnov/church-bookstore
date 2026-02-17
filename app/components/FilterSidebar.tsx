'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { getCategories } from '../lib/api';
import { Category } from '../types';
import { useTranslations } from '../i18n/LanguageContext';
import { useApiLocale } from '../i18n/useApiLocale';

interface FilterSidebarProps {
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  inStock: boolean;
  onStockChange: (value: boolean) => void;
  onCategorySelect?: (categoryId: string | null) => void;
  selectedCategoryId?: string | null;
}

// Check if a category or any of its children is selected
function isCategoryOrChildSelected(category: Category, selectedCategories: string[]): boolean {
  if (selectedCategories.includes(category.slug)) {
    return true;
  }
  if (category.children) {
    return category.children.some((child) => isCategoryOrChildSelected(child, selectedCategories));
  }
  return false;
}

export default function FilterSidebar({
  selectedCategories,
  onCategoryChange,
  inStock,
  onStockChange,
  onCategorySelect,
  selectedCategoryId,
}: FilterSidebarProps) {
  const t = useTranslations();
  const tCatalog = useTranslations('catalog');
  
  // Get current locale for API calls
  const locale = useApiLocale();
  
  const [expandedSections, setExpandedSections] = useState({
    availability: true,
    categories: true,
  });
  
  // Track expanded parent categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Fetch categories from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [locale]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategoryClick = (category: Category, hasChildren: boolean) => {
    // Parent categories (with children) - toggle expand/collapse only
    if (hasChildren) {
      toggleCategoryExpand(category.id);
      return;
    }
    
    // Subcategories (no children) - filter products
    onCategoryChange(category.slug);
    
    // Notify parent component about category selection for API-based filtering
    if (onCategorySelect) {
      const newSelected = selectedCategories.includes(category.slug)
        ? selectedCategories.filter((s) => s !== category.slug)
        : [...selectedCategories, category.slug];
      
      if (newSelected.length > 0) {
        // Use the category's id directly - the category object already has the id
        onCategorySelect(category.id);
      } else {
        onCategorySelect(null);
      }
    }
  };

  // Render a single category item (recursively for children)
  const renderCategoryItem = (category: Category, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategories.includes(category.slug) || category.id === selectedCategoryId;
    const isPartiallySelected = hasChildren && isCategoryOrChildSelected(category, selectedCategories) && !isSelected;

    return (
      <div key={category.id} style={{ marginLeft: `${depth * 12}px` }}>
        <div className={`flex items-center gap-2 cursor-pointer py-1 px-2 rounded-lg transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-gray-100'}`}>
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCategoryExpand(category.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <button
            type="button"
            onClick={() => handleCategoryClick(category, !!hasChildren)}
            className={`text-sm flex-grow text-left whitespace-nowrap ${isSelected ? 'text-primary font-bold' : isPartiallySelected ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
          >
            {category.name}
          </button>
          <span className="text-xs text-gray-400">({category.count})</span>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {category.children!.map((child) => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 min-w-[280px] space-y-6">
      {/* Availability */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <button
          className="flex items-center justify-between w-full font-semibold text-dark"
          onClick={() => toggleSection('availability')}
        >
          {tCatalog('filter.availability')}
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
              <span className="text-sm text-gray-600">{tCatalog('filter.inStockOnly')}</span>
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
          {tCatalog('filter.categories')}
          {expandedSections.categories ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {expandedSections.categories && (
          <div className="mt-3 space-y-1">
            {loading && <p className="text-sm text-gray-400">{t('common.loading')}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
            {!loading && !error && categories.map((category) => renderCategoryItem(category))}
          </div>
        )}
      </div>
    </aside>
  );
}
