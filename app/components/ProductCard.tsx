'use client';

import Link from 'next/link';
import { Heart, Star, BookOpen } from 'lucide-react';
import { SiAdobeacrobatreader } from 'react-icons/si';
import { Book } from '../types';

interface ProductCardProps {
  book: Book;
}

export default function ProductCard({ book }: ProductCardProps) {
  return (
    <div className="card group relative flex flex-col h-full">
      {/* Favorite Button */}
      <button className="absolute top-3 right-3 z-10 p-2 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white">
        <Heart className="w-4 h-4" />
      </button>

      {/* Image */}
      <Link href={`/product/${book.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-t-xl">
        <img
          src={book.coverImage}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <Link href={`/product/${book.id}`}>
          <h3 className="font-semibold text-dark mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
        </Link>

        {/* Author */}
        <p className="text-sm text-gray-500 mb-3">{book.author}</p>

        {/* Price & Book Type Icon */}
        <div className="mt-auto">
          {/* Check for special case: printed book with free e-book download */}
          {(() => {
            const hasFreeEbook = !book.isParent && 
                                book.isShippingRequired === true && 
                                book.downloadUrl && 
                                book.downloadUrl.includes('orthodoxbookshop');
            
            // Build variants array: existing variants or create synthetic ones for special case
            let displayVariants = book.variants || [];
            
            if (hasFreeEbook) {
              // Create synthetic variants for printed book + free e-book
              displayVariants = [
                {
                  id: parseInt(book.id),
                  price: book.price.toFixed(2),
                  is_shipping_required: true,
                  book_type: 'printed' as const,
                },
                {
                  id: parseInt(book.id) + 1000000, // Offset to avoid collision
                  price: '0.00',
                  is_shipping_required: false,
                  book_type: 'ebook' as const,
                },
              ];
            }
            
            // Show variants if we have them (either real or synthetic)
            if (displayVariants.length > 0) {
              return (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
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
                          ${parseFloat(variant.price).toFixed(2)}
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
                      ${book.price.toFixed(2)}
                    </span>
                  )}
                  {book.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ${book.originalPrice.toFixed(2)}
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
    </div>
  );
}
