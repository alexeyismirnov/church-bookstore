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
        <div className="mt-auto flex items-center justify-between gap-2">
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
      </div>
    </div>
  );
}
