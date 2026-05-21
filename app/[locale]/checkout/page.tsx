'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import LocalizedLink from '../../components/LocalizedLink';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ShippingForm } from '../../components/checkout/ShippingForm';
import { CheckoutForm } from '../../components/checkout/CheckoutForm';
import { OrderSummary } from '../../components/checkout/OrderSummary';
import { useSearchParams } from 'next/navigation';
import { useLocalizedRouter } from '../../i18n/useLocalizedRouter';
import { ShippingAddress, ShippingMethod, Basket } from '../../types';
import { getShippingMethods, placeOrder, getStoredToken } from '../../lib/api';
import { useLocalCart, type SyncResult } from '../../lib/localCart';
import { useCurrency } from '../../i18n/CurrencyContext';
import { useTranslations } from '../../i18n/LanguageContext';
import { useApiLocale } from '../../i18n/useApiLocale';
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
  shippingAddress: ShippingAddress | null;
  clientSecret: string;
  paymentIntentId: string;
  selectedShippingMethod: ShippingMethod | null;
  basketId: string;
  currency: string;
  total: string;
}

/** Convert a SyncResult into CartItemForDisplay[] for the checkout UI. */
function syncResultToDisplayItems(result: SyncResult): CartItemForDisplay[] {
  return result.lines.map(line => {
    const productUrl: string = line.product || '';
    const match = productUrl.match(/\/products\/(\d+)\/?$/);
    const productId = match ? match[1] : '';

    const localItem = result.localItems.find(
      i => i.productId === parseInt(productId, 10)
    );

    const linePrice = parseFloat(line.price_incl_tax) || 0;
    const unitPrice = line.quantity > 0 ? linePrice / line.quantity : 0;

    const lineIdMatch = line.url?.match(/\/lines\/(\d+)\/?$/);
    const lineId = lineIdMatch ? parseInt(lineIdMatch[1], 10) : line.id;

    return {
      id: productId,
      basketLineId: lineId,
      title: localItem?.title || 'Unknown Product',
      author: localItem?.author || '',
      price: unitPrice,
      quantity: line.quantity,
      coverImage: localItem?.coverImage || '/images/placeholder-book.jpg',
      linePrice,
      variantTitle: localItem?.variantTitle,
      is_shipping_required: line.is_shipping_required ?? true,
    };
  });
}

// Inner component that uses useSearchParams
function CheckoutContent() {
  const router = useLocalizedRouter();
  const searchParams = useSearchParams();

  // Require authentication for checkout
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    if (!getStoredToken()) {
      router.replace('/login', 'redirect=/checkout');
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  const { currency, symbol } = useCurrency();
  const t = useTranslations();
  const tCheckout = useTranslations('checkout');
  const locale = useApiLocale();
  const redirectStatus = searchParams.get('redirect_status');
  const [cartItems, setCartItems] = useState<CartItemForDisplay[]>([]);
  const [basket, setBasket] = useState<Basket | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the first load (not a currency refresh)
  const [isBasketLoaded, setIsBasketLoaded] = useState(false);
  const [isStepDetermined, setIsStepDetermined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('shipping');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlacementError, setOrderPlacementError] = useState<string | null>(null);
  const [syncSkippedItems, setSyncSkippedItems] = useState<SyncResult['skippedItems']>([]);
  
  // Redirect payment order placement state
  const [redirectOrderPlacementNeeded, setRedirectOrderPlacementNeeded] = useState(false);
  const redirectOrderPlacedRef = useRef(false);
  
  // Track currency refresh to prevent transient isShippingRequired changes.
  // When currency changes, we snapshot the current shipping-required state and
  // hold it steady until the basket refresh completes and the new data is stable.
  const currencyRefreshInProgressRef = useRef(false);
  const shippingRequiredSnapshotRef = useRef<boolean>(true);
  
  // Local cart context for syncToBackend, clearCart, refreshPrices, and items
  const { syncToBackend, clearCart, refreshPrices, items: localCartItems, isHydrated } = useLocalCart();

  // Calculate if shipping is required based on cartItems (use cartItems which has is_shipping_required from fetched lines)
  const isShippingRequiredRaw = cartItems.some(item => item.is_shipping_required === true);
  // During a currency refresh, hold the pre-refresh shipping-required state steady
  // to prevent transient backend inconsistencies from causing UI flicker or
  // unintended auto-advance from shipping to payment step.
  const isShippingRequired = currencyRefreshInProgressRef.current
    ? shippingRequiredSnapshotRef.current
    : isShippingRequiredRaw;

  // Clear the currency-refresh guard after the render with updated cartItems.
  // This useEffect runs post-render, so the snapshot value was used during that render.
  // A state update forces a re-render so the now-unguarded raw value is applied.
  const [, setShippingGuardForceUpdate] = useState(0);
  useEffect(() => {
    if (!currencyRefreshInProgressRef.current) return;
    // cartItems was updated while a currency refresh was in progress.
    // The render that triggered this effect used the snapshotted value.
    // Now clear the guard so subsequent renders use the live value.
    currencyRefreshInProgressRef.current = false;
    setShippingGuardForceUpdate(n => n + 1);
  }, [cartItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle failed payment redirect from Stripe
  useEffect(() => {
    if (redirectStatus === 'failed') {
      setPaymentFailed(true);
      setError(tCheckout('payment.failed'));
      
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
      // Payment succeeded via redirect — order placement still needed.
      // Set a flag so a separate effect can call placeOrder() once the basket is loaded.
      // Do NOT clear sessionStorage yet; the checkout state is needed for placeOrder().
      setRedirectOrderPlacementNeeded(true);
      setIsStepDetermined(true); // Prevent step-determination effect from running
    }
  }, [redirectStatus, router]);

  // Place order after a successful Stripe redirect payment.
  // Waits for the basket to be loaded, then restores checkout state from sessionStorage
  // and calls placeOrder() — mirroring what handlePaymentSuccess() does for inline payments.
  useEffect(() => {
    if (!redirectOrderPlacementNeeded || !isBasketLoaded || redirectOrderPlacedRef.current) return;

    const savedStateJson = sessionStorage.getItem(CHECKOUT_STATE_KEY);
    if (!savedStateJson) {
      console.error('[checkout] Redirect succeeded but no checkout state found in sessionStorage');
      setOrderPlacementError(
        'Payment succeeded but checkout state was lost. Please contact support with your payment reference.'
      );
      return;
    }

    let checkoutState: CheckoutPaymentState;
    try {
      checkoutState = JSON.parse(savedStateJson);
    } catch {
      console.error('[checkout] Failed to parse checkout state from sessionStorage');
      setOrderPlacementError(
        'Payment succeeded but checkout state is corrupted. Please contact support.'
      );
      return;
    }

    if (!checkoutState.basketId) {
      console.error('[checkout] Redirect succeeded but basketId is missing from checkout state');
      setOrderPlacementError(
        'Payment succeeded but basket information is missing. Please contact support.'
      );
      return;
    }

    // Guard against double invocation (e.g. React Strict Mode)
    redirectOrderPlacedRef.current = true;
    setIsPlacingOrder(true);
    setOrderPlacementError(null);

    const placeRedirectOrder = async () => {
      try {
        const order = await placeOrder({
          basketId: checkoutState.basketId,
          total: checkoutState.total,
          currency: checkoutState.currency,
          shippingMethodCode: checkoutState.selectedShippingMethod?.code || 'free-shipping',
          shippingCharge: checkoutState.selectedShippingMethod
            ? {
                currency: checkoutState.selectedShippingMethod.price.currency,
                excl_tax: checkoutState.selectedShippingMethod.price.excl_tax,
                tax: checkoutState.selectedShippingMethod.price.tax,
              }
            : undefined,
          shippingAddress: checkoutState.shippingAddress || undefined,
        });

        console.log('Order placed successfully after redirect:', order.number);
        sessionStorage.removeItem(CHECKOUT_STATE_KEY);
        clearCart();
        router.replace('/checkout/confirmation');
      } catch (err) {
        console.error('Order placement failed after redirect payment:', err);
        // Keep redirectOrderPlacementNeeded true so the dedicated error screen is shown.
        // The ref stays true to prevent this effect from re-running;
        // retries are handled by handleRedirectOrderRetry() via the retry button.
        setOrderPlacementError(
          err instanceof Error
            ? err.message
            : 'Payment succeeded but order placement failed. Please contact support.'
        );
      } finally {
        setIsPlacingOrder(false);
      }
    };

    placeRedirectOrder();
  }, [redirectOrderPlacementNeeded, isBasketLoaded, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync local cart to backend basket — wait for localStorage hydration first
  // to avoid reading an empty cart during React Strict Mode's double effect invocation.
  // Only runs once on initial load; currency changes are handled by the currency change effect.
  useEffect(() => {
    if (!isHydrated || !isInitialLoad) return;

    let didCancel = false;

    const loadCart = async () => {
      try {
        const result = await syncToBackend(currency);
        if (didCancel) return;
        const items = syncResultToDisplayItems(result);
        setCartItems(items);
        setBasket({ ...result.basketData, id: String(result.basketData.id) });
        setSyncSkippedItems(result.skippedItems);
        setIsBasketLoaded(true);
      } catch (err) {
        if (didCancel) return;
        console.error('Error syncing cart to backend:', err);
        setError(tCheckout('errors.cartLoadFailed'));
        // Set empty cart on error - will redirect to cart page
        setCartItems([]);
        setIsBasketLoaded(true);
      } finally {
        if (!didCancel) {
          setIsLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    loadCart();

    return () => {
      didCancel = true;
    };
  }, [currency, isHydrated, isInitialLoad]);

  // Determine the correct step after basket is loaded
  useEffect(() => {
    // Only run once basket is loaded and step not yet determined
    if (!isBasketLoaded || isStepDetermined) return;

    // Guard: if cart is empty, don't proceed to payment — redirect to cart
    if (cartItems.length === 0) {
      console.warn('[checkout] Basket loaded with no items, redirecting to cart page');
      setError(tCheckout('errors.emptyCart'));
      setIsStepDetermined(true);
      return;
    }
    
    if (!isShippingRequired && checkoutStep === 'shipping') {
      // No shipping required - go directly to payment
      // Create payment intent immediately without shipping address
      console.log('[checkout] Step determination: cartItems=', cartItems.length, 'items, isShippingRequired=', isShippingRequired);
      const createPaymentIntent = async () => {
        // Calculate subtotal from cartItems (no shipping cost for digital-only orders)
        const orderTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        console.log('[checkout] Creating payment intent: orderTotal=', orderTotal, 'currency=', currency);

        // Guard: Stripe has minimum charge amounts per currency (e.g. $0.50 USD).
        // If the total is below the minimum, show an error instead of failing at Stripe.
        const stripeMinimums: Record<string, number> = {
          usd: 0.50, eur: 0.50, gbp: 0.30, cad: 0.50, aud: 0.50,
          jpy: 50, hkd: 4.00, sgd: 0.50, chf: 0.50,
        };
        const minAmount = stripeMinimums[currency.toLowerCase()] ?? 0.50;
        if (orderTotal < minAmount) {
          console.error(`[checkout] Order total ${orderTotal} ${currency} is below Stripe minimum ${minAmount}`);
          setError(tCheckout('errors.belowMinimumAmount', { min: minAmount, currency }));
          setIsStepDetermined(true);
          return;
        }
        
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
    
          // Save checkout state to sessionStorage for recovery after Stripe redirect
          try {
            const checkoutState: CheckoutPaymentState = {
              shippingAddress: null,
              clientSecret: data.clientSecret,
              paymentIntentId: data.paymentIntentId,
              selectedShippingMethod: null,
              basketId: basket?.id || '',
              currency: basket?.currency || currency,
              total: orderTotal.toFixed(2),
            };
            sessionStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify(checkoutState));
          } catch (err) {
            console.error('Error saving checkout state to sessionStorage:', err);
          }
        } catch (err) {
          console.error('Error creating payment intent for non-shipping order:', err);
          setError(tCheckout('errors.paymentInitFailed'));
          setIsStepDetermined(true); // Mark as determined even on error to avoid infinite loading
        }
      };
      
      createPaymentIntent();
    } else {
      // Shipping required - stay on shipping step, mark step as determined
      setIsStepDetermined(true);
    }
  }, [isBasketLoaded, isStepDetermined, isShippingRequired, checkoutStep, cartItems]);

  // Handle currency change - re-fetch basket and refresh payment intent if needed
  const prevCurrencyRef = useRef(currency);
  useEffect(() => {
    // Only act if currency actually changed (not on initial mount)
    if (prevCurrencyRef.current !== currency) {
      const oldCurrency = prevCurrencyRef.current;
      prevCurrencyRef.current = currency;
      
      // Snapshot current shipping-required state before async refresh to prevent
      // transient backend inconsistencies from flipping isShippingRequired to false
      currencyRefreshInProgressRef.current = true;
      shippingRequiredSnapshotRef.current = isShippingRequired;
      
      // Re-sync cart to get updated prices in the new currency
      const refreshBasket = async () => {
        setIsLoading(true);
        try {
          const result = await syncToBackend(currency);
          const items = syncResultToDisplayItems(result);
          setCartItems(items);
          setBasket({ ...result.basketData, id: String(result.basketData.id) });
          setSyncSkippedItems(result.skippedItems);
          return items;
        } catch (err) {
          console.error('Error refreshing cart after currency change:', err);
          return [];
        } finally {
          setIsLoading(false);
        }
      };

      // If we're on the payment step, create a new payment intent with the new currency
      // Note: For digital-only orders (no shipping required), shippingAddress is null but we still need to refresh
      if (checkoutStep === 'payment' && (shippingAddress || !isShippingRequired)) {
        const refreshPaymentIntent = async () => {
          const items = await refreshBasket();
          
          // Re-fetch shipping methods and update selected method with new price (only if shipping is required)
          let updatedShippingMethod = selectedShippingMethod;
          if (isShippingRequired && shippingAddress) {
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
                basketId: basket?.id || '',
                currency: basket?.currency || currency,
                total: newTotal.toFixed(2),
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
        // Not on payment step, just refresh the basket.
        // Do NOT clear selectedShippingMethod here — the ShippingForm component's
        // effect watches currency changes and will re-fetch shipping methods,
        // then re-select the first method with updated prices. Clearing it here
        // creates a race condition where the null update can overwrite the valid
        // method update from ShippingForm's async effect.
        refreshBasket();
      }
    }
  }, [currency, checkoutStep, shippingAddress, selectedShippingMethod]);

  // When locale changes, re-fetch all cart item data (title, author, coverImage) in the new language
  useEffect(() => {
    if (localCartItems.length === 0) return;
    refreshPrices(currency);
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  // When local cart items are updated (e.g. after locale-triggered refreshPrices),
  // propagate the updated title/author/coverImage to the checkout's cartItems state
  useEffect(() => {
    if (localCartItems.length === 0 || cartItems.length === 0) return;

    setCartItems(prev => prev.map(ci => {
      const localItem = localCartItems.find(li => li.productId === parseInt(ci.id, 10));
      if (!localItem) return ci;
      return {
        ...ci,
        title: localItem.title || ci.title,
        author: localItem.author || ci.author,
        coverImage: localItem.coverImage || ci.coverImage,
      };
    }));
  }, [localCartItems]); // eslint-disable-line react-hooks/exhaustive-deps

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
          basketId: basket?.id || '',
          currency: basket?.currency || currency,
          total: total.toFixed(2),
        };
        sessionStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify(checkoutState));
      } catch (err) {
        console.error('Error saving checkout state to sessionStorage:', err);
      }
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError(tCheckout('errors.paymentInitFailed'));
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
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setPaymentIntentId(paymentIntentId);
    setIsPlacingOrder(true);
    setOrderPlacementError(null);

    try {
      const order = await placeOrder({
        basketId: basket?.id || '',
        total: total.toFixed(2),
        currency: basket?.currency || 'USD',
        shippingMethodCode: selectedShippingMethod?.code || 'free-shipping',
        shippingCharge: selectedShippingMethod ? {
          currency: selectedShippingMethod.price.currency,
          excl_tax: selectedShippingMethod.price.excl_tax,
          tax: selectedShippingMethod.price.tax,
        } : undefined,
        shippingAddress: shippingAddress || undefined,
      });

      console.log('Order placed successfully:', order.number);
      setCheckoutStep('complete');
      // Clear the saved checkout state since payment succeeded
      sessionStorage.removeItem(CHECKOUT_STATE_KEY);
      // Clear localStorage cart since the order has been placed
      clearCart();
      // Navigate to confirmation page
      router.push('/checkout/confirmation');
    } catch (err) {
      console.error('Order placement failed after payment:', err);
      setOrderPlacementError(
        err instanceof Error ? err.message : 'Payment succeeded but order placement failed. Please contact support.'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Retry order placement after a failed redirect payment.
  // Reads checkout state from sessionStorage and calls placeOrder() directly.
  const handleRedirectOrderRetry = async () => {
    const savedStateJson = sessionStorage.getItem(CHECKOUT_STATE_KEY);
    if (!savedStateJson) {
      setOrderPlacementError('Checkout state not found. Cannot retry order placement.');
      return;
    }

    let checkoutState: CheckoutPaymentState;
    try {
      checkoutState = JSON.parse(savedStateJson);
    } catch {
      setOrderPlacementError('Checkout state is corrupted. Cannot retry order placement.');
      return;
    }

    if (!checkoutState.basketId) {
      setOrderPlacementError('Basket information is missing. Cannot retry order placement.');
      return;
    }

    setIsPlacingOrder(true);
    setOrderPlacementError(null);

    try {
      const order = await placeOrder({
        basketId: checkoutState.basketId,
        total: checkoutState.total,
        currency: checkoutState.currency,
        shippingMethodCode: checkoutState.selectedShippingMethod?.code || 'free-shipping',
        shippingCharge: checkoutState.selectedShippingMethod
          ? {
              currency: checkoutState.selectedShippingMethod.price.currency,
              excl_tax: checkoutState.selectedShippingMethod.price.excl_tax,
              tax: checkoutState.selectedShippingMethod.price.tax,
            }
          : undefined,
        shippingAddress: checkoutState.shippingAddress || undefined,
      });

      console.log('Order placed successfully after retry:', order.number);
      sessionStorage.removeItem(CHECKOUT_STATE_KEY);
      clearCart();
      router.replace('/checkout/confirmation');
    } catch (err) {
      console.error('Order placement retry failed:', err);
      setOrderPlacementError(
        err instanceof Error
          ? err.message
          : 'Order placement failed again. Please contact support.'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Redirect to cart page if cart is empty (but not during redirect order placement)
  useEffect(() => {
    if (!isLoading && cartItems.length === 0 && !redirectOrderPlacementNeeded) {
      router.push('/cart');
    }
  }, [isLoading, cartItems.length, router, redirectOrderPlacementNeeded]);

  // Auth check - redirect to login if not authenticated
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-burgundy" />
      </div>
    );
  }

  // Redirect payment flow — show dedicated screen for order placement
  if (redirectOrderPlacementNeeded) {
    if (orderPlacementError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Placement Failed</h2>
              <p className="text-gray-600 mb-4">
                Your payment was successful but we could not place your order.
              </p>
              <p className="text-sm text-red-600 mb-4">{orderPlacementError}</p>
              <p className="text-sm text-gray-500 mb-6">
                Please try again or contact support with your payment reference.
              </p>
              <button
                onClick={handleRedirectOrderRetry}
                disabled={isPlacingOrder}
                className="w-full btn-burgundy py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? 'Placing order...' : 'Retry Order Placement'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-burgundy mx-auto" />
          <p className="mt-4 text-gray-500">Payment confirmed. Placing your order...</p>
        </div>
      </div>
    );
  }

  // Loading state - show spinner only during INITIAL load (not during currency refreshes)
  // This preserves the shipping form state when currency changes
  if ((isLoading && isInitialLoad) || !isBasketLoaded || !isStepDetermined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy mx-auto" />
          <p className="mt-4 text-gray-500">
          {isLoading && isInitialLoad ? tCheckout('syncingCart') : t('common.loading')}
          </p>
        </div>
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
        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-8">
          {checkoutStep === 'payment' ? t('checkout.paymentTitle') : t('checkout.shipping')}
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {syncSkippedItems.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <p className="font-medium">{tCheckout('skippedItems.title')}</p>
            <ul className="mt-1 text-sm list-disc list-inside">
              {syncSkippedItems.map((item) => (
                <li key={item.product_id}>
                  {tCheckout('skippedItems.itemLabel', { id: item.product_id })} — {item.reason.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isPlacingOrder && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            <p>{tCheckout('placingOrder')}</p>
          </div>
        )}

        {orderPlacementError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">{tCheckout('orderPlacementFailed.title')}</p>
            <p className="text-sm mt-1">{orderPlacementError}</p>
            <p className="text-sm mt-1">{tCheckout('orderPlacementFailed.contactSupport')}</p>
            <button
              onClick={() => handlePaymentSuccess(paymentIntentId!)}
              disabled={isPlacingOrder}
              className="mt-2 text-sm underline text-red-700 hover:text-red-900"
            >
              {isPlacingOrder ? tCheckout('orderPlacementFailed.retrying') : tCheckout('orderPlacementFailed.retry')}
            </button>
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
              <LocalizedLink
                href="/cart"
                className="inline-flex items-center gap-2 text-burgundy hover:text-burgundy-dark mt-6 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                {tCheckout('backToCart')}
              </LocalizedLink>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
