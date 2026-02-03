'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { CheckoutForm } from '@/app/components/checkout/CheckoutForm';
import { ShippingForm, ShippingAddress } from '@/app/components/checkout/ShippingForm';
import { OrderSummary } from '@/app/components/checkout/OrderSummary';
import { useRouter } from 'next/navigation';
import { CartItem } from '@/app/types';
import { books } from '@/app/lib/data';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        } else {
          // Fallback to mock data if no cart in localStorage
          setCartItems([
            { ...books[0], quantity: 1 },
            { ...books[1], quantity: 2 },
          ]);
        }
      } catch (err) {
        console.error('Error loading cart:', err);
        // Fallback to mock data
        setCartItems([
          { ...books[0], quantity: 1 },
          { ...books[1], quantity: 2 },
        ]);
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
  const handleShippingComplete = async (address: ShippingAddress) => {
    setShippingAddress(address);
    setError(null);

    try {
      // Create PaymentIntent with cart total
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'usd',
        }),
      });

      if (!response.ok) throw new Error('Failed to initialize payment');

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
      setStep('payment');
    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // Clear cart after successful payment
    localStorage.removeItem('cart');
    router.push(`/checkout/confirmation?payment_intent=${paymentIntentId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Empty cart
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-dark mb-4">Your cart is empty</h1>
            <p className="text-gray-500 mb-8">
              Looks like you haven't added any books to your cart yet.
            </p>
            <Link href="/catalog" className="btn-primary">
              Continue Shopping
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

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${step === 'shipping' ? 'text-primary' : 'text-green-600'}`}>
              <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
                step === 'shipping' ? 'border-primary' : 'border-green-600'
              }`}>
                {step === 'payment' ? '✓' : '1'}
              </span>
              <span className="font-medium">Shipping</span>
            </div>
            <div className="flex-1 h-0.5 mx-4 bg-gray-300" />
            <div className={`flex items-center ${step === 'payment' ? 'text-primary' : 'text-gray-400'}`}>
              <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
                step === 'payment' ? 'border-primary' : 'border-gray-400'
              }`}>
                2
              </span>
              <span className="font-medium">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {step === 'shipping' && (
                <ShippingForm onComplete={handleShippingComplete} />
              )}

              {step === 'payment' && clientSecret && shippingAddress && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#D92022',
                        colorBackground: '#ffffff',
                        colorText: '#242424',
                        colorDanger: '#dc2626',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        borderRadius: '8px',
                      },
                    },
                  }}
                >
                  <CheckoutForm
                    orderTotal={total}
                    shippingAddress={shippingAddress}
                    onSuccess={handlePaymentSuccess}
                    onBack={() => setStep('shipping')}
                  />
                </Elements>
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
