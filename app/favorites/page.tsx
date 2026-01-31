'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import { books } from '../lib/data';
import { Book } from '../types';

export default function FavoritesPage() {
  // Mock favorites - in a real app, this would come from a database or localStorage
  const [favorites, setFavorites] = useState<Book[]>([books[0], books[3], books[5]]);

  const removeFromFavorites = (id: string) => {
    setFavorites((prev) => prev.filter((book) => book.id !== id));
  };

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-dark mb-4">Your Favorites is Empty</h1>
            <p className="text-gray-500 mb-8">
              Save items you love to your favorites list for quick access later.
            </p>
            <Link href="/catalog" className="btn-primary">
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-dark">Favorites</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-dark">
            My Favorites ({favorites.length})
          </h1>
          <Link
            href="/catalog"
            className="btn-secondary"
          >
            Continue Shopping
          </Link>
        </div>

        <ProductGrid books={favorites} />

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-dark">Ready to purchase?</h3>
              <p className="text-gray-500">
                Add your favorite items to the cart and complete your order.
              </p>
            </div>
            <Link href="/cart" className="btn-primary inline-flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              View Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
