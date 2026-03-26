'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ShippingForm } from '@/app/components/checkout/ShippingForm';
import { CheckoutForm } from '@/app/components/checkout/CheckoutForm';
import { OrderSummary } from '@/app/components/checkout/OrderSummary';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShippingAddress, ShippingMethod } from '@/app/types';
import { getBasket, basketToCartItems, getShippingMethods } from '@/app/lib/api';
import { useCurrency } from '@/app/i18n/CurrencyContext';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type CheckoutStep = 'shipping' | 'payment' | 'complete';

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
  is_shipping_required: boolean;
}

// Session storage keys for checkout state persistence
const CHECKOUT_STATE_KEY = 'checkout_payment_state';

interface CheckoutPaymentState {
  shippingAddress: ShippingAddress;
  clientSecret: string;
  paymentIntentId: string;
  selectedShippingMethod: ShippingMethod | null;
}

// Inner component that uses useSearchParams
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency, symbol } = useCurrency();
  const redirectStatus = searchParams.get('redirect_status');
  const [cartItems, setCartItems] = useState<CartItemForDisplay[]>([]);
  const [basket, setBasket] = useState<{ lines: any[] | { results: any[] } } | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBasketLoaded, setIsBasketLoaded] = useState(false);
  const [isStepDetermined, setIsStepDetermined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('shipping');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  
  // Calculate if shipping is required based on cartItems (use cartItems which has is_shipping_required from fetched lines)
  const isShippingRequired = cartItems.some(item => item.is_shipping_required === true);

  // Handle failed payment redirect from Stripe
  useEffect(() => {
    if (redirectStatus === 'failed') {
      setPaymentFailed(true);
      setError('Your payment was not successful. Please try again.');
      
      // Try to restore checkout state from sessionStorage
      try {
        const savedState = sessionStorage.getItem(CHECKOUT_STATE_KEY);
        if (savedState) {
          const checkoutState: CheckoutPaymentState = JSON.parse(savedState);
          setShippingAddress(checkoutState.shippingAddress);
          setClientSecret(checkoutState.clientSecret);
          setPaymentIntentId(checkoutState.paymentIntentId);
          setSelectedShippingMethod(checkoutState.selectedShippingMethod);
          setCheckoutStep('payment');
          setIsStepDetermined(true); // Step is already determined from restored state
          // Clear the saved state after restoring
          sessionStorage.removeItem(CHECKOUT_STATE_KEY);
        }
      } catch (err) {
        console.error('Error restoring checkout state from sessionStorage:', err);
      }
      
      // Clean up the URL by removing the query parameters
      router.replace('/checkout');
    } else if (redirectStatus === 'succeeded') {
      // Payment succeeded via redirect, clean up and navigate to confirmation
      sessionStorage.removeItem(CHECKOUT_STATE_KEY);
      router.replace('/checkout/confirmation');
    }
  }, [redirectStatus, router]);

  // Load cart from Oscar API on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const basketData = await getBasket();
        setBasket(basketData);
        const items = await basketToCartItems(basketData);
        setCartItems(items);
        setIsBasketLoaded(true);
      } catch (err) {
        console.error('Error loading cart from API:', err);
        setError('Failed to load cart. Please try again.');
        // Set empty cart on error - will redirect to cart page
        setCartItems([]);
        setIsBasketLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [currency]);

  // Determine the correct step after basket is loaded
  useEffect(() => {
    // Only run once basket is loaded and step not yet determined
    if (!isBasketLoaded || isStepDetermined) return;
    
    if (!isShippingRequired && checkoutStep === 'shipping') {
      // No shipping required - go directly to payment
      // Create payment intent immediately without shipping address
      const createPaymentIntent = async () => {
        // Calculate subtotal from cartItems (no shipping cost for digital-only orders)
        const orderTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        try {
          const response = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: orderTotal, // No shipping cost for digital-only orders
              currency: currency.toLowerCase(),
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to initialize payment');
          }

          const data = await response.json();
          setClientSecret(data.clientSecret);
          setPaymentIntentId(data.paymentIntentId);
          setShippingAddress(null); // No shipping address needed
          setSelectedShippingMethod(null); // No shipping method needed
          setCheckoutStep('payment');
          setIsStepDetermined(true);
        } catch (err) {
          console.error('Error creating payment intent for non-shipping order:', err);
          setError('Failed to initialize payment. Please try again.');
          setIsStepDetermined(true); // Mark as determined even on error to avoid infinite loading
        }
      };
      
      createPaymentIntent();
    } else {
      // Shipping required - stay on shipping step, mark step as determined
      setIsStepDetermined(true);
    }
  }, [isBasketLoaded, isStepDetermined, isShippingRequired, checkoutStep, cartItems, currency]);

  // Handle currency change - re-fetch basket and refresh payment intent if needed
  const prevCurrencyRef = useRef(currency);
  useEffect(() => {
    // Only act if currency actually changed (not on initial mount)
    if (prevCurrencyRef.current !== currency) {
      const oldCurrency = prevCurrencyRef.current;
      prevCurrencyRef.current = currency;
      
      // Re-fetch basket to get updated prices
      const refreshBasket = async () => {
        setIsLoading(true);
        try {
          const basket = await getBasket();
          const items = await basketToCartItems(basket);
          setCartItems(items);
          return items;
        } catch (err) {
          console.error('Error refreshing cart after currency change:', err);
          return [];
        } finally {
          setIsLoading(false);
        }
      };

      // If we're on the payment step, create a new payment intent with the new currency
      if (checkoutStep === 'payment' && shippingAddress) {
        const refreshPaymentIntent = async () => {
          const items = await refreshBasket();
          
          // Re-fetch shipping methods and update selected method with new price
          let updatedShippingMethod = selectedShippingMethod;
          try {
            const methods = await getShippingMethods(shippingAddress);
            const matchingMethod = methods.find(m => m.code === selectedShippingMethod?.code);
            if (matchingMethod) {
              setSelectedShippingMethod(matchingMethod);
              updatedShippingMethod = matchingMethod;
            }
          } catch (err) {
            console.error('Error refreshing shipping methods after currency change:', err);
          }
          
          // Calculate new total with updated prices
          const newSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const newShipping = updatedShippingMethod
            ? parseFloat(updatedShippingMethod.price.incl_tax)
            : 0;
          const newTotal = newSubtotal + newShipping;

          // Create new payment intent with the new currency
          try {
            const response = await fetch('/api/stripe/create-payment-intent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: newTotal,
                currency: currency.toLowerCase(),
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to initialize payment');
            }

            const data = await response.json();
            setClientSecret(data.clientSecret);
            setPaymentIntentId(data.paymentIntentId);
            
            // Update sessionStorage with new checkout state
            try {
              const checkoutState: CheckoutPaymentState = {
                shippingAddress: shippingAddress,
                clientSecret: data.clientSecret,
                paymentIntentId: data.paymentIntentId,
                selectedShippingMethod: updatedShippingMethod,
              };
              sessionStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify(checkoutState));
            } catch (err) {
              console.error('Error saving checkout state to sessionStorage:', err);
            }
          } catch (err) {
            console.error('Error creating payment intent after currency change:', err);
            setError('Failed to update payment. Please try again.');
          }
        };
        
        refreshPaymentIntent();
      } else {
        // Not on payment step, just refresh the basket
        refreshBasket();
        
        // Clear selected shipping method as prices may have changed
        setSelectedShippingMethod(null);
      }
    }
  }, [currency, checkoutStep, shippingAddress, selectedShippingMethod]);

  // Note: Currency change handling is done in ShippingForm via prevCurrencyRef
  // No need to clear selectedShippingMethod here as ShippingForm handles re-selection

  // Calculate total quantity for useEffect dependency
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Shipping methods are now fetched by ShippingForm when country changes
  // This effect is no longer needed but we keep the state for the OrderSummary
  const [shippingMethodsAvailable, setShippingMethodsAvailable] = useState(true);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Use shipping cost from selected shipping method (price is a string, parse to float)
  const shipping = selectedShippingMethod 
    ? parseFloat(selectedShippingMethod.price.incl_tax) 
    : 0;
  const total = subtotal + shipping;

  // Handle shipping form completion - transition to payment step
  const handleShippingComplete = async (address: ShippingAddress) => {
    setShippingAddress(address);
    setError(null);

    // Save shipping address to localStorage for persistence
    try {
      localStorage.setItem('shippingAddress', JSON.stringify(address));
    } catch (err) {
      console.error('Error saving shipping address to localStorage:', err);
    }

    // Fetch payment intent from Stripe API
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: currency.toLowerCase(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize payment');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setCheckoutStep('payment');
      
      // Save checkout state to sessionStorage for recovery after failed payment redirect
      try {
        const checkoutState: CheckoutPaymentState = {
          shippingAddress: address,
          clientSecret: data.clientSecret,
          paymentIntentId: data.paymentIntentId,
          selectedShippingMethod: selectedShippingMethod,
        };
        sessionStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify(checkoutState));
      } catch (err) {
        console.error('Error saving checkout state to sessionStorage:', err);
      }
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError('Failed to initialize payment. Please try again.');
    }
  };

  // Handle going back to shipping step
  const handleBackToShipping = () => {
    setCheckoutStep('shipping');
    setClientSecret(null);
    // Clear the saved checkout state since user is going back
    sessionStorage.removeItem(CHECKOUT_STATE_KEY);
  };

  // Handle successful payment
  const handlePaymentSuccess = (paymentIntentId: string) => {
    setPaymentIntentId(paymentIntentId);
    setCheckoutStep('complete');
    // Clear the saved checkout state since payment succeeded
    sessionStorage.removeItem(CHECKOUT_STATE_KEY);
    // Navigate to confirmation page
    router.push('/checkout/confirmation');
  };

  // Redirect to cart page if cart is empty
  useEffect(() => {
    if (!isLoading && cartItems.length === 0) {
      router.push('/cart');
    }
  }, [isLoading, cartItems.length, router]);

  // Loading state - show spinner while basket is being loaded AND step is determined
  if (isLoading || !isBasketLoaded || !isStepDetermined) {
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
          <span className="text-dark">{checkoutStep === 'payment' ? 'Payment' : 'Shipping'}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-8">
          {checkoutStep === 'payment' ? 'Payment' : 'Shipping'}
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
              {checkoutStep === 'payment' && clientSecret && (isShippingRequired ? shippingAddress : true) ? (
                // Payment step with Stripe Elements
                // key={clientSecret} forces re-mount when currency changes, ensuring fresh Payment Element
                <Elements
                  key={clientSecret}
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                  }}
                >
                  <CheckoutForm
                    orderTotal={total}
                    shippingAddress={shippingAddress}
                    isShippingRequired={isShippingRequired}
                    onSuccess={handlePaymentSuccess}
                    onBack={isShippingRequired ? handleBackToShipping : undefined}
                  />
                </Elements>
              ) : checkoutStep === 'shipping' ? (
                // Shipping form step
                <ShippingForm
                  onComplete={handleShippingComplete}
                  initialData={shippingAddress || undefined}
                  onShippingMethodsChange={(methods) => {
                    setShippingMethods(methods);
                    setShippingMethodsAvailable(methods.length > 0);
                  }}
                  onSelectedMethodChange={(method) => {
                    setSelectedShippingMethod(method);
                  }}
                  selectedShippingMethod={selectedShippingMethod}
                  currency={currency}
                />
              ) : null}
            </div>

            {checkoutStep === 'shipping' && (
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mt-6 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Cart
              </Link>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary 
              cartItems={cartItems} 
              shipping={shipping} 
              currencySymbol={symbol}
              selectedShippingMethod={selectedShippingMethod}
              isShippingRequired={isShippingRequired}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
