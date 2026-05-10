'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { useTranslations } from '../i18n/LanguageContext';
import { getOrders } from '../lib/api';
import { OscarOrder, OscarOrderListResponse } from '../types';
import { currencySymbols } from '../i18n/settings';
import { Package, ChevronLeft, ChevronRight, Calendar, Loader2, ShoppingBag } from 'lucide-react';


/**
 * Extract the database primary key from the order's `url` field.
 * The `url` looks like `https://orthodoxbookshop.asia/api/orders/42/`
 * We need the pk (42) for the django-oscar-api `<int:pk>` route.
 */
function extractOrderPk(url: string): string {
  const matches = url.match(/\/orders\/(\d+)\/?$/);
  return matches ? matches[1] : '';
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

export default function OrdersPage() {
  const router = useRouter();
  const t = useTranslations('orders');
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [ordersData, setOrdersData] = useState<OscarOrderListResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch orders
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    async function fetchOrders() {
      setLoading(true);
      setError(null);
      try {
        const data = await getOrders(currentPage);
        if (!cancelled) {
          setOrdersData(data);
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

    fetchOrders();
    return () => { cancelled = true; };
  }, [isAuthenticated, currentPage, t]);

  const totalPages = useMemo(() => {
    if (!ordersData || ordersData.count === 0) return 1;
    // If there's a next page, the current page is full so results.length is the page size
    if (ordersData.next) {
      return Math.ceil(ordersData.count / ordersData.results.length);
    }
    // No next page — this is the last page
    // If no previous either, there's only 1 page
    if (!ordersData.previous) return 1;
    // Has previous but no next — we're on the last page, so totalPages === currentPage
    return currentPage;
  }, [ordersData, currentPage]);

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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-burgundy to-burgundy-dark py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-parchment font-display">{t('title')}</h1>
          <p className="text-xl text-parchment/70 max-w-3xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
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
            <p className="text-burgundy mb-4">{error}</p>
            <button
              onClick={() => setCurrentPage(currentPage)}
              className="bg-burgundy text-white px-6 py-2 rounded-lg hover:bg-burgundy-dark transition-colors"
            >
              {t('error')}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && ordersData && ordersData.results.length === 0 && (
          <div className="bg-parchment-light border border-parchment-dark/30 rounded-lg p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-ink-muted mx-auto mb-4" />
            <p className="text-ink-light text-lg mb-6">{t('noOrders')}</p>
            <button
              onClick={() => router.push('/catalog')}
              className="bg-burgundy text-white px-6 py-2.5 rounded-lg hover:bg-burgundy-dark transition-colors font-medium"
            >
              {t('startShopping')}
            </button>
          </div>
        )}

        {/* Orders list */}
        {!loading && !error && ordersData && ordersData.results.length > 0 && (
          <>
            <div className="space-y-4">
              {ordersData.results.map((order: OscarOrder) => (
                <button
                  key={order.number}
                  onClick={() => router.push(`/orders/${extractOrderPk(order.url)}`)}
                  className="w-full bg-parchment-light border border-parchment-dark/30 rounded-lg p-5 sm:p-6 text-left hover:border-burgundy/30 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Left side: order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-ink group-hover:text-burgundy transition-colors">
                          {t('orderNumber', { number: order.number })}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClasses(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-light">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(order.date_placed)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" />
                          {order.shipping_method || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Right side: total */}
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <span className="text-lg font-bold text-gold">
                        {(currencySymbols as Record<string, string>)[order.currency] ?? order.currency ?? '$'}{parseFloat(order.total_incl_tax || '0').toFixed(2)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-parchment-dark/20">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={!ordersData.previous}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed
                    bg-parchment-light border border-parchment-dark/30 text-ink hover:border-burgundy/30 hover:text-burgundy"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('previous')}
                </button>

                <span className="text-sm text-ink-light">
                  {t('page', { current: currentPage, total: totalPages })}
                </span>

                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!ordersData.next}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed
                    bg-burgundy text-white hover:bg-burgundy-dark"
                >
                  {t('next')}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  </div>
  );
}
