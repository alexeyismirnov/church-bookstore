'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import { useTranslations } from '../../i18n/LanguageContext';
import { getOrderById, getOrderLines, fetchProductDetails } from '../../lib/api';
import { OscarOrder, OrderLine } from '../../types';
import { currencySymbols, Currency } from '../../i18n/settings';
import { ArrowLeft, Package, MapPin, Loader2, AlertCircle } from 'lucide-react';

/** Extended line with product display info resolved from the API */
interface OrderLineDisplay extends OrderLine {
  product_title?: string;
  coverImage?: string;
  variantTitle?: string;
  parentId?: string;
}

function getStatusBadgeClasses(status: string): string {
  const s = status?.toLowerCase() ?? '';
  if (s === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (s === 'processing') return 'bg-gold/20 text-amber-700 border-gold/30';
  if (s === 'shipped') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (s === 'delivered') return 'bg-green-100 text-green-800 border-green-200';
  if (s === 'cancelled') return 'bg-gray-100 text-gray-600 border-gray-200';
  return 'bg-parchment-light text-ink-light border-parchment-dark/30';
}

/** Map an ISO-4217 currency code to its display symbol. */
function getCurrencySymbol(code: string): string {
  return (currencySymbols as Record<string, string>)[code] ?? code;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  // This is the database primary key (not the order number).
  // The order list page extracts it from the order's `url` field.
  const orderPk = params?.id as string;
  const t = useTranslations('orders');
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<OscarOrder | null>(null);
  const [lines, setLines] = useState<OrderLineDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch order detail and lines
  useEffect(() => {
    if (!isAuthenticated || !orderPk) return;
    let cancelled = false;

    async function fetchOrderDetail() {
      setLoading(true);
      setError(null);
      try {
        const [orderData, linesData] = await Promise.all([
          getOrderById(orderPk),
          getOrderLines(orderPk),
        ]);
        if (!cancelled) {
          setOrder(orderData);
          const rawLines = linesData.results || [];

          // Fetch product details for each line (title, cover image, variant info)
          const linesWithDetails = await Promise.all(
            rawLines.map(async (line): Promise<OrderLineDisplay> => {
              try {
                // Extract product ID from the product URL
                // URL format: https://orthodoxbookshop.asia/api/products/381/
                const match = line.product?.match(/\/products\/(\d+)\/?$/);
                if (match) {
                  const details = await fetchProductDetails(match[1]);
                  if (details) {
                    return {
                      ...line,
                      product_title: details.title,
                      coverImage: details.coverImage,
                      variantTitle: details.variantTitle,
                      parentId: details.parentId,
                    };
                  }
                }
              } catch {
                // Ignore individual product fetch failures
              }
              return { ...line, product_title: undefined };
            })
          );
          if (!cancelled) {
            setLines(linesWithDetails);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(t('error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchOrderDetail();
    return () => { cancelled = true; };
  }, [isAuthenticated, orderPk, t]);

  /** Derive the currency code from the first order line (all lines share the same currency). */
  const currencyCode = useMemo<string>(() => {
    if (lines.length > 0 && lines[0].price_currency) {
      return lines[0].price_currency;
    }
    return 'USD';
  }, [lines]);

  const currencySymbol = useMemo(() => getCurrencySymbol(currencyCode), [currencyCode]);

  /** Format a numeric price string with the correct currency symbol. */
  function formatPrice(priceStr: string): string {
    const value = parseFloat(priceStr || '0');
    if (isNaN(value)) return `${currencySymbol}0.00`;
    return `${currencySymbol}${value.toFixed(2)}`;
  }

  function getStatusLabel(status: string): string {
    const s = status?.toLowerCase() ?? '';
    if (s === 'pending') return t('pending');
    if (s === 'processing') return t('processing');
    if (s === 'shipped') return t('shipped');
    if (s === 'delivered') return t('delivered');
    if (s === 'cancelled') return t('cancelled');
    return status;
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  function formatAddress(addr: { first_name?: string; last_name?: string; line1?: string; line2?: string; line3?: string; line4?: string; state?: string; postcode?: string; country?: string; phone_number?: string } | null): string {
    if (!addr) return '—';
    const countryMatch = addr.country?.match(/\/countries\/([A-Z]{2})\/?$/);
    const countryCode = countryMatch ? countryMatch[1] : null;
    const parts = [
      [addr.first_name, addr.last_name].filter(Boolean).join(' '),
      addr.line1,
      addr.line2,
      addr.line3,
      addr.line4,
      addr.state,
      addr.postcode,
      countryCode,
      addr.phone_number,
    ].filter(Boolean);
    return parts.join(', ') || '—';
  }

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-burgundy" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => router.push('/orders')}
          className="inline-flex items-center gap-2 text-ink-light hover:text-burgundy transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">{t('backToOrders')}</span>
        </button>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-burgundy mb-4" />
            <p className="text-ink-light">{t('loading')}</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-parchment-light border border-parchment-dark/30 rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-burgundy mx-auto mb-4" />
            <p className="text-burgundy mb-4">{error}</p>
            <button
              onClick={() => router.push('/orders')}
              className="bg-burgundy text-white px-6 py-2 rounded-lg hover:bg-burgundy-dark transition-colors"
            >
              {t('backToOrders')}
            </button>
          </div>
        )}

        {/* Order detail */}
        {!loading && !error && order && (
          <>
            {/* Order header */}
            <div className="bg-parchment-light border border-parchment-dark/30 rounded-lg p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-ink mb-1">
                    {t('orderNumber', { number: order.number })}
                  </h1>
                  <p className="text-sm text-ink-light">
                    {formatDate(order.date_placed)}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusBadgeClasses(order.status)}`}>
                  <Package className="h-4 w-4" />
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content: line items */}
              <div className="lg:col-span-2">
                <div className="bg-parchment-light border border-parchment-dark/30 rounded-lg overflow-hidden">
                  {/* Table header - hidden on mobile */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-parchment-dark/10 text-xs font-semibold text-ink-light uppercase tracking-wider">
                    <div className="col-span-6">{t('product')}</div>
                    <div className="col-span-2 text-center">{t('quantity')}</div>
                    <div className="col-span-2 text-right">{t('unitPrice')}</div>
                    <div className="col-span-2 text-right">{t('lineTotal')}</div>
                  </div>

                  {/* Line items */}
                  {lines.length === 0 ? (
                    <div className="px-6 py-8 text-center text-ink-light">
                      <Package className="h-8 w-8 mx-auto mb-2 text-ink-muted" />
                      <p className="text-sm">No items found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-parchment-dark/20">
                      {lines.map((line, idx) => {
                        const unitPrice = line.quantity > 0
                          ? parseFloat(line.price_incl_tax || '0') / line.quantity
                          : 0;

                        const productLinkId = line.parentId || line.product?.match(/\/products\/(\d+)\/?$/)?.[1];

                        return (
                          <div
                            key={idx}
                            className="px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center hover:bg-parchment-dark/5 transition-colors"
                          >
                            {/* Product image + title */}
                            <div className="sm:col-span-6 flex items-center gap-3 min-w-0">
                              {/* Cover image */}
                              {line.coverImage ? (
                                <Link href={`/product/${productLinkId}`} className="block cursor-pointer flex-shrink-0">
                                  <img
                                    src={line.coverImage}
                                    alt={line.product_title || ''}
                                    className="w-12 h-16 object-cover rounded hover:opacity-80 transition-opacity"
                                  />
                                </Link>
                              ) : (
                                <div className="w-12 h-16 bg-parchment-dark/20 rounded flex-shrink-0 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-ink-muted" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <Link href={`/product/${productLinkId}`} className="hover:underline cursor-pointer">
                                  <p className="font-medium text-ink break-words hover:text-burgundy transition-colors">
                                    {line.product_title || `Product #${line.product?.split('/').filter(Boolean).pop() || '?'}`}
                                  </p>
                                </Link>
                                {line.variantTitle && (
                                  <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full bg-burgundy/10 text-burgundy border border-burgundy/20 truncate max-w-full">
                                    {line.variantTitle}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity */}
                            <div className="sm:col-span-2 sm:text-center">
                              <span className="sm:hidden text-xs text-ink-muted">{t('quantity')}: </span>
                              <span className="text-ink">{line.quantity}</span>
                            </div>

                            {/* Unit price */}
                            <div className="sm:col-span-2 sm:text-right">
                              <span className="sm:hidden text-xs text-ink-muted">{t('unitPrice')}: </span>
                              <span className="text-ink-light">
                                {formatPrice(unitPrice.toFixed(2))}
                              </span>
                            </div>

                            {/* Line total */}
                            <div className="sm:col-span-2 sm:text-right">
                              <span className="sm:hidden text-xs text-ink-muted">{t('lineTotal')}: </span>
                              <span className="font-semibold text-ink">
                                {formatPrice(line.price_incl_tax || '0')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar: shipping address + order summary */}
              <div className="space-y-6">
                {/* Shipping address */}
                {order.shipping_address && (
                <div className="bg-parchment-light border border-parchment-dark/30 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-burgundy" />
                    <h3 className="font-semibold text-ink">{t('shippingAddress')}</h3>
                  </div>
                  <p className="text-sm text-ink-light whitespace-pre-line leading-relaxed">
                    {formatAddress(order.shipping_address as any)}
                  </p>
                </div>
                )}

                {/* Order summary */}
                <div className="bg-parchment-light border border-parchment-dark/30 rounded-lg p-6">
                  <h3 className="font-semibold text-ink mb-4">{t('orderSummary')}</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-light">{t('subtotal')}</span>
                      <span className="text-ink">
                        {formatPrice(order.total_excl_tax || '0')}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-ink-light">{t('shipping')}</span>
                      <span className="text-ink">
                        {formatPrice(order.shipping_incl_tax || '0')}
                      </span>
                    </div>

                    <div className="border-t border-parchment-dark/20 pt-3 flex justify-between">
                      <span className="font-semibold text-ink">{t('totalInclTax')}</span>
                      <span className="text-lg font-bold text-gold">
                        {formatPrice(order.total_incl_tax || '0')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
