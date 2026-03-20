'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, CheckCircle } from 'lucide-react';
import { ShippingForm } from '@/app/components/checkout/ShippingForm';
import { OrderSummary } from '@/app/components/checkout/OrderSummary';
import { useRouter } from 'next/navigation';
import { ShippingAddress } from '@/app/types';
import { getBasket, basketToCartItems } from '@/app/lib/api';

interface CartItemForDisplay {
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

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItemForDisplay[]>([]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Load cart from Oscar API on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const basket = await getBasket();
        const items = await basketToCartItems(basket);
        setCartItems(items);
      } catch (err) {
        console.error('Error loading cart from API:', err);
        setError('Failed to load cart. Please try again.');
        // Set empty cart on error - will redirect to cart page
        setCartItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  // Handle shipping form completion
  const handleShippingComplete = (address: ShippingAddress) => {
    setShippingAddress(address);
    setError(null);

    // Save shipping address to localStorage for persistence
    try {
      localStorage.setItem('shippingAddress', JSON.stringify(address));
    } catch (err) {
      console.error('Error saving shipping address to localStorage:', err);
    }

    // Show success message (payment step will be implemented later)
    setFormSubmitted(true);
  };

  // Redirect to cart page if cart is empty
  useEffect(() => {
    if (!isLoading && cartItems.length === 0) {
      router.push('/cart');
    }
  }, [isLoading, cartItems.length, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Don't render checkout if cart is empty (will redirect)
  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/cart" className="hover:text-primary">Cart</Link>
          <span className="mx-2">/</span>
          <span className="text-dark">Checkout</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-8">
          Checkout
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {formSubmitted && shippingAddress ? (
                // Success message after form submission
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-dark mb-4">
                    Shipping Address Saved!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your shipping address has been saved. The next checkout steps will be implemented soon.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                    <p className="text-sm font-medium text-gray-700 mb-2">Shipping to:</p>
                    <p className="text-gray-600">
                      {shippingAddress.first_name} {shippingAddress.last_name}<br />
                      {shippingAddress.line1}<br />
                      {shippingAddress.line2 && <>{shippingAddress.line2}<br /></>}
                      {shippingAddress.line4 && <>{shippingAddress.line4}, </>}
                      {shippingAddress.state && <>{shippingAddress.state} </>}
                      {shippingAddress.postcode}<br />
                      {shippingAddress.country}
                    </p>
                  </div>
                </div>
              ) : (
                // Show shipping form
                <ShippingForm onComplete={handleShippingComplete} />
              )}
            </div>

            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mt-6 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cart
            </Link>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary cartItems={cartItems} shipping={shipping} />
          </div>
        </div>
      </div>
    </div>
  );
}
