'use client';

import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react';
import CartItem from '../components/CartItem';
import { getBasket, updateBasketLine, removeBasketLine, basketToCartItems, getStoredToken } from '../lib/api';
import { useCart } from '../lib/CartContext';
import { Basket } from '../types';

interface CartItemDisplay {
  id: string;
  basketLineId: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  coverImage: string;
  linePrice: number;
  variantTitle?: string;
}

export default function CartPage() {
  const { refreshCart } = useCart();
  const [basket, setBasket] = useState<Basket | null>(null);
  const [cartItems, setCartItems] = useState<CartItemDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch basket on mount
  const fetchBasket = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const basketData = await getBasket();
      setBasket(basketData);
      const items = await basketToCartItems(basketData);
      setCartItems(items);
    } catch (err) {
      console.error('Failed to fetch basket:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useLayoutEffect(() => {
    // Temporarily disable browser scroll restoration to prevent it from overriding our scroll
    const scrollRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    
    // Scroll to top immediately when component mounts
    window.scrollTo(0, 0);
    
    return () => {
      history.scrollRestoration = scrollRestoration;
    };
  }, []);

  useEffect(() => {
    fetchBasket();
  }, [fetchBasket]);

  const updateQuantity = async (basketLineId: number, quantity: number) => {
    if (!basket?.id || isUpdating) return;
    
    try {
      setIsUpdating(true);
      // updateBasketLine returns the updated line, NOT the basket
      await updateBasketLine(basket.id, basketLineId, quantity);
      // Re-fetch the entire basket to get updated state
      await fetchBasket();
      // Notify Header to refresh cart count
      await refreshCart();
    } catch (err) {
      console.error('Failed to update quantity:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
    } finally {
      setIsUpdating(false);
    }
  };

  const removeItem = async (basketLineId: number) => {
    if (!basket?.id || isUpdating) return;
    
    try {
      setIsUpdating(true);
      // removeBasketLine returns the updated line, NOT the basket
      await removeBasketLine(basket.id, basketLineId);
      // Re-fetch the entire basket to get updated state
      await fetchBasket();
      // Notify Header to refresh cart count
      await refreshCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!getStoredToken();

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.linePrice, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-dark mb-4">Please Sign In</h1>
            <p className="text-gray-500 mb-8">
              You need to sign in to view your cart and make purchases.
            </p>
            <Link href="/login?redirect=/cart" className="btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-dark mb-4">Something went wrong</h1>
            <p className="text-gray-500 mb-8">{error}</p>
            <button onClick={fetchBasket} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-dark mb-4">Your Cart is Empty</h1>
            <p className="text-gray-500 mb-8">
              Looks like you haven't added any books to your cart yet.
            </p>
            <Link href="/catalog" className="btn-primary">
              Start Shopping
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
          <span className="text-dark">Cart</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-8">
          Shopping Cart ({cartItems.length} items)
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.basketLineId}-${index}`}>
                  <CartItem
                    item={item}
                    onUpdateQuantityByDelta={(delta: number) => updateQuantity(item.basketLineId, Math.max(1, item.quantity + delta))}
                    onRemoveByBasketLineId={() => removeItem(item.basketLineId)}
                  />
                  {index < cartItems.length - 1 && (
                    <hr className="border-gray-100" />
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mt-6 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-dark mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-sm text-gray-400">
                    Free shipping on orders over $50
                  </p>
                )}
                <hr className="border-gray-100" />
                <div className="flex justify-between text-lg font-bold text-dark">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="btn-primary w-full text-center block"
              >
                Proceed to Checkout
              </Link>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  or{' '}
                  <Link href="/catalog" className="text-primary hover:underline">
                    continue shopping
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
