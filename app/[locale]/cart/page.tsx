'use client';

import { useLayoutEffect, useEffect, useRef } from 'react';
import LocalizedLink from '../../components/LocalizedLink';
import { ArrowLeft, ShoppingBag, AlertTriangle } from 'lucide-react';
import CartItem from '../../components/CartItem';
import { useLocalCart } from '../../lib/localCart';
import { useAuth } from '../../lib/AuthContext';
import { useCurrency } from '../../i18n/CurrencyContext';
import { useTranslations, useLanguage } from '../../i18n/LanguageContext';

/** Map ISO 4217 currency code to display symbol */
function getCurrencySymbol(currency: string): string {
  try {
    const formatted = Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return formatted.find((p) => p.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}

export default function CartPage() {
  const { items, totalPrice, updateQuantity, removeItem, refreshPrices } = useLocalCart();
  const { currency, symbol } = useCurrency();
  const t = useTranslations();
  const tCart = useTranslations('cart');
  const { locale } = useLanguage();

  // Check if user is authenticated
  const { isAuthenticated } = useAuth();

  // Check if any item requires shipping
  const isShippingRequired = items.some(item => item.isShippingRequired === true);

  // Detect mixed currencies in cart items
  const hasMixedCurrencies = items.length > 0 && new Set(items.map(i => i.currency)).size > 1;

  const lastRefreshKeyRef = useRef<string>('');

  // Refresh cart item data when cart first appears, and when locale/currency changes.
  // Intentionally does NOT depend on `items` to avoid self-trigger loops after setCart writes.
  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const refreshKey = `${locale}__${currency}__${items.map((i) => i.productId).sort((a, b) => a - b).join(',')}`;
    const alreadyRefreshedForKey = lastRefreshKeyRef.current === refreshKey;

    if (alreadyRefreshedForKey) return;

    lastRefreshKeyRef.current = refreshKey;
    refreshPrices(currency, locale).catch((err) => {
      console.warn('[cart/page] refreshPrices failed', err);
      // Allow retry on next effect run after failure.
      if (lastRefreshKeyRef.current === refreshKey) {
        lastRefreshKeyRef.current = '';
      }
    });
  }, [currency, locale, items.length, refreshPrices]);

  // Use totalPrice from local cart (sum of price * quantity for all items)
  const subtotal = totalPrice;

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

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-dark mb-4">{tCart('empty.title')}</h1>
            <p className="text-gray-500 mb-8">
              {tCart('empty.description')}
            </p>
            <LocalizedLink href="/catalog" className="btn-burgundy">
              {tCart('empty.button')}
            </LocalizedLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mixed currency warning */}
        {hasMixedCurrencies && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-amber-800 text-sm">
              Your cart contains items in different currencies. Switch to a single currency to see the correct total.
            </p>
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-8">
          {tCart('title')}
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm">
              {items.map((item, index) => (
                <div key={`${item.productId}`}>
                  <CartItem
                    item={item}
                    onUpdateQuantityByDelta={(delta: number) => updateQuantity(item.productId, Math.max(1, item.quantity + delta))}
                    onRemove={() => removeItem(item.productId)}
                  />
                  {index < items.length - 1 && (
                    <hr className="border-gray-100" />
                  )}
                </div>
              ))}
            </div>

            <LocalizedLink
              href="/catalog"
              className="inline-flex items-center gap-2 text-burgundy hover:text-burgundy-dark mt-6 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.continueShopping')}
            </LocalizedLink>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-dark mb-6">{t('checkout.orderSummary')}</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>{t('common.subtotal')}</span>
                  <span>{symbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('common.shipping')}</span>
                  <span>{isShippingRequired ? tCart('shipping.tbd') : t('common.free')}</span>
                </div>
                {isShippingRequired && (
                  <>
                    <hr className="border-gray-100" />
                    <div className="flex justify-between text-sm text-gray-500 italic">
                      <span></span>
                      <span>{tCart('shipping.calculatedAtCheckout')}</span>
                    </div>
                  </>
                )}
              </div>

              <LocalizedLink
                href={isAuthenticated ? '/checkout' : '/login?redirect=/checkout'}
                className="btn-burgundy w-full text-center block"
              >
                {tCart('proceedToCheckout')}
              </LocalizedLink>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  {tCart('or')}{' '}
                  <LocalizedLink href="/catalog" className="text-burgundy hover:underline">
                    {tCart('continueShoppingLink')}
                  </LocalizedLink>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
