'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Star, BookOpen, Loader2 } from 'lucide-react';
import { SiAdobeacrobatreader } from 'react-icons/si';
import { Book } from '../types';
import { useCurrency } from '../i18n/CurrencyContext';

interface ProductCardProps {
  book: Book;
}

export default function ProductCard({ book }: ProductCardProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const { symbol, currency } = useCurrency();

  // Force 2-line format for HKD and TWD (which have wide symbols)
  // Also add fallback: if currency is not available, default to 2-line format
  const needsTwoLineFormat = !currency || currency === 'HKD' || currency === 'TWD';

  // Format price with symbol - uses 2-line format for HKD/TWD
  const formatPrice = (price: number): React.ReactNode => {
    const formattedPrice = price.toFixed(2);
    if (needsTwoLineFormat) {
      return (
        <span className="flex flex-col leading-tight">
          <span>{symbol}</span>
          <span>{formattedPrice}</span>
        </span>
      );
    }
    return `${symbol}${formattedPrice}`;
  };

  // Product link without page param - browser back button will naturally return to catalog page
  const productLink = `/product/${book.id}`;

  const handleClick = () => {
    setIsNavigating(true);
  };

  return (
    <Link
      href={productLink}
      className="card-link card group relative flex flex-col h-full"
      onClick={handleClick}
    >
      {/* Loading Overlay */}
      {isNavigating && (
        <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      {/* Favorite Button */}
      <button
        className="absolute top-3 right-3 z-10 p-2 bg-white/90 rounded-full shadow-sm opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Favorite button click handler will go here
        }}
      >
        <Heart className="w-4 h-4" />
      </button>

      {/* Image */}
      <div className="block relative aspect-[3/4] overflow-hidden rounded-t-xl">
        <img
          src={book.coverImage}
          alt={book.title}
          className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-300"
        />
        {book.isNew && (
          <span className="absolute top-3 left-3 bg-accent-green text-white text-xs font-semibold px-2 py-1 rounded">
            New
          </span>
        )}
        {book.originalPrice && (
          <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-2 py-1 rounded">
            Sale
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="card-title font-semibold text-dark mb-1 line-clamp-2 transition-colors">
          {book.title}
        </h3>

        {/* Author */}
        {book.author && (
          <p className="text-sm text-gray-500 mb-3">{book.author}</p>
        )}

        {/* Price & Book Type Icon */}
        <div className="mt-auto">
          {/* Check for special case: printed book with free e-book download */}
          {(() => {
            const hasFreeEbook = !book.isParent && 
                                book.isShippingRequired === true && 
                                book.downloadUrl && 
                                book.downloadUrl.includes('orthodoxbookshop');
            
            let displayVariants = book.variants || [];
            
            if (hasFreeEbook) {
              // Create synthetic variants for printed book + free e-book
              displayVariants = [
                {
                  id: parseInt(book.id),
                  title: book.title,
                  price: book.price.toFixed(2),
                  is_shipping_required: true,
                  book_type: 'printed' as const,
                  isAvailable: true,
                  isInStock: true,
                  stockCount: 1,
                },
                {
                  id: parseInt(book.id) + 1000000, // Offset to avoid collision
                  title: `${book.title} (E-book)`,
                  price: '0.00',
                  is_shipping_required: false,
                  book_type: 'ebook' as const,
                  isAvailable: true,
                  isInStock: true,
                  stockCount: 0,
                },
              ];
            }
            
            // Show variants if we have them (either real or synthetic)
            if (displayVariants.length > 0) {
              return (
                <div className={`flex flex-col sm:flex-row sm:items-center gap-1 ${displayVariants.length === 2 ? 'sm:justify-between' : 'sm:gap-3'}`}>
                  {[...displayVariants]
                    .sort((a, b) => (b.is_shipping_required ? 1 : 0) - (a.is_shipping_required ? 1 : 0))
                    .map((variant) => (
                    <div key={variant.id} className="flex items-center gap-1">
                      {parseFloat(variant.price) === 0 ? (
                        <span className="text-lg font-bold text-green-600">
                          FREE
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-dark">
                          {formatPrice(parseFloat(variant.price))}
                        </span>
                      )}
                      {/* Book Type Indicator based on is_shipping_required */}
                      {variant.is_shipping_required ? (
                        <span title="Paper book">
                          <BookOpen className="w-4 h-4 text-red-500 ml-1" />
                        </span>
                      ) : (
                        <span title="E-book (PDF)">
                          <SiAdobeacrobatreader className="w-4 h-4 text-red-500 ml-1" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            }
            
            // Standalone product without variants or free e-book
            return (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {book.price === 0 ? (
                    <span className="text-lg font-bold text-green-600">
                      FREE
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-dark">
                      {formatPrice(book.price)}
                    </span>
                  )}
                  {book.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(book.originalPrice)}
                    </span>
                  )}
                  {/* Book Type Indicator */}
                  {book.isShippingRequired === true && (
                    <span title="Paper book">
                      <BookOpen className="w-4 h-4 text-red-500 ml-1" />
                    </span>
                  )}
                  {book.isShippingRequired === false && (
                    <span title="E-book (PDF)">
                      <SiAdobeacrobatreader className="w-4 h-4 text-red-500 ml-1" />
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </Link>
  );
}
