'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import CartItem from '../components/CartItem';
import { books } from '../lib/data';
import { CartItem as CartItemType } from '../types';

export default function CartPage() {
  // Mock cart data
  const [cartItems, setCartItems] = useState<CartItemType[]>([
    { ...books[0], quantity: 1 },
    { ...books[1], quantity: 2 },
  ]);

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

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
                <div key={item.id}>
                  <CartItem
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
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
