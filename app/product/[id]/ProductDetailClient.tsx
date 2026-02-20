// app/product/[id]/ProductDetailClient.tsx
// Client component for product detail with localization support

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, FileText, BookOpen, Package, Monitor } from 'lucide-react';
import { getProductById, oscarProductToBook, parseVariantPrice } from '../../lib/api';
import { useApiLocale } from '../../i18n/useApiLocale';
import { useLanguage, useTranslations } from '../../i18n/LanguageContext';
import { useCurrency } from '../../i18n/CurrencyContext';
import { Book, Variant } from '../../types';
import { Loader2 } from 'lucide-react';

interface ProductDetailClientProps {
  productId: string;
}

function DownloadButtons({ book }: { book: Book }) {
  const t = useTranslations('product');
  
  // If all URLs are null/empty, don't show any download buttons
  if (!book.downloadUrl && !book.previewUrl && !book.epubUrl) {
    return null;
  }

  const isPaidBook = book.downloadUrl?.includes('orthodoxpaidbooks');
  const isFreeBook = book.downloadUrl?.includes('orthodoxbookshop');

  // Paid book: show only PDF preview button
  if (isPaidBook) {
    if (!book.previewUrl) return null;
    return (
      <div className="flex flex-col gap-3 pt-4 border-t">
        <span className="text-sm text-gray-500 font-medium">{t('digitalVersion')}</span>
        <a
          href={book.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('previewPdf')}</span>
        </a>
        <p className="text-xs text-gray-500">
          {t('paidEbookNote')}
        </p>
      </div>
    );
  }

  // Free book from orthodoxbookshop: show PDF and EPUB buttons
  if (isFreeBook) {
    return (
      <div className="flex flex-col gap-3 pt-4 border-t">
        <span className="text-sm text-gray-500 font-medium">{t('freeDownload')}</span>
        <div className="flex flex-wrap gap-3">
          {book.downloadUrl && (
            <a
              href={book.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>{t('downloadPdf')}</span>
            </a>
          )}
          {book.epubUrl && (
            <a
              href={book.epubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('downloadEpub')}</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Unknown source with download URL: show generic download button
  if (book.downloadUrl) {
    return (
      <div className="flex flex-col gap-3 pt-4 border-t">
        <span className="text-sm text-gray-500 font-medium">{t('download')}</span>
        <a
          href={book.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{t('download')}</span>
        </a>
      </div>
    );
  }

  return null;
}

export default function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const { isLoading: contextLoading } = useLanguage();
  const locale = useApiLocale();
  const t = useTranslations();
  const tProduct = useTranslations('product');
  const { symbol, currency, isLoading: currencyIsLoading } = useCurrency();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track the locale+currency combination for which the currently displayed book data
  // was fetched. Only updated after a successful fetch completes, ensuring the loading
  // spinner stays visible until the new-locale/currency data is actually in state.
  const [fetchedForKey, setFetchedForKey] = useState<string | undefined>(undefined);
  const currentKey = `${locale}:${currency}`;

  // Show loading spinner when:
  // 1. Initial load is in progress
  // 2. Currency context is loading from localStorage
  // 3. The displayed book data was fetched for a different locale/currency than the current one
  //    (i.e., a new fetch is in-flight or hasn't started yet)
  const showLoading = loading || currencyIsLoading || fetchedForKey !== currentKey;

  // Format price with symbol - always single line format for product detail page
  const formatPrice = (price: number): string => {
    const formattedPrice = price.toFixed(2);
    return `${symbol}${formattedPrice}`;
  };

  useEffect(() => {
    // Only fetch after language context is fully initialized
    // This prevents double API call / flicker when locale is loaded from localStorage
    if (contextLoading) {
      return;
    }

    // Create an AbortController so we can cancel stale in-flight requests
    // when currency/locale changes before the previous fetch completes.
    const abortController = new AbortController();

    async function fetchBook() {
      try {
        setLoading(true);
        const product = await getProductById(productId, abortController.signal);
        if (abortController.signal.aborted) return;
        const convertedBook = oscarProductToBook(product, locale);
        setBook(convertedBook);
        // Only mark the data as valid for this locale+currency AFTER the fetch succeeds.
        // This keeps showLoading=true until the correct localized data is in state.
        setFetchedForKey(currentKey);
      } catch (err) {
        if (abortController.signal.aborted) return; // Ignore aborted fetch errors
        console.error('Failed to fetch book:', err);
        setError(err instanceof Error ? err.message : 'Failed to load book');
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchBook();

    // Cleanup: abort the fetch if the effect re-runs (currency/locale changed)
    // before the previous fetch completed.
    return () => {
      abortController.abort();
    };
  }, [productId, locale, currency, contextLoading]);

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-gray-500">{t('common.loading')}</span>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-dark mb-4">{tProduct('notFound')}</h1>
          <p className="text-gray-500 mb-6">{tProduct('notFoundDesc')}</p>
          <Link href="/catalog" className="btn-primary">
            {tProduct('browseCatalog')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-primary">{t('nav.home')}</Link>
          <span className="mx-2">/</span>
          <Link href="/catalog" className="hover:text-primary">{t('nav.catalog')}</Link>
          <span className="mx-2">/</span>
          <span className="text-dark">{book.title}</span>
        </nav>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Image */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-white rounded-2xl overflow-hidden shadow-sm">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-dark mb-4">
                {book.title}
              </h1>
            </div>

            {/* Product Variants or Single Product Row */}
            {book.isParent && book.variants && book.variants.length > 0 ? (
              /* Multiple Variants: Show one row per variant with flex layout */
              <div className="space-y-3">
                {book.variants.map((variant: Variant) => {
                  const variantPrice = parseVariantPrice(variant);
                  return (
                    <div key={variant.id} className="grid grid-cols-[120px_1fr_160px] items-center gap-4 bg-gray-50 rounded-xl p-4">
                      {/* Variant Title & Book Type */}
                      <div className="flex items-center gap-2">
                        {variant.book_type === 'ebook' ? (
                          <>
                            <Monitor className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <span className="text-blue-600 font-medium">{tProduct('ebook')}</span>
                          </>
                        ) : (
                          <>
                            <Package className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            <span className="text-amber-700 font-medium">{tProduct('printed')}</span>
                          </>
                        )}
                      </div>

                      {/* Price - centered in the flexible middle column */}
                      <div className="text-center">
                        {variantPrice === 0 ? (
                          <span className="text-xl font-bold text-green-600">{t('common.free')}</span>
                        ) : (
                          <span className="text-xl font-bold text-dark">
                            {formatPrice(variantPrice)}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button or FREE label */}
                      <div className="flex justify-end">
                        {variantPrice === 0 ? (
                          <span className="text-green-600 font-semibold whitespace-nowrap">{t('common.free')}</span>
                        ) : variant.isAvailable === false ? (
                          <button className="btn-primary w-full whitespace-nowrap opacity-50 cursor-not-allowed" disabled>
                            {t('common.outOfStock')}
                          </button>
                        ) : (
                          <button className="btn-primary w-full whitespace-nowrap">
                            {t('common.addToCart')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single Product: Show one row with book type, price, add to cart */
              <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl p-4">
                {/* Book Type */}
                <div className="flex items-center gap-2">
                  {book.isShippingRequired === false ? (
                    <>
                      <Monitor className="w-5 h-5 text-blue-500" />
                      <span className="text-blue-600 font-medium">{tProduct('ebook')}</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5 text-amber-600" />
                      <span className="text-amber-700 font-medium">{tProduct('printed')}</span>
                    </>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  {book.price === 0 ? (
                    <span className="text-2xl font-bold text-green-600">
                      {t('common.free')}
                    </span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-dark">
                          {formatPrice(book.price)}
                        </span>
                        {book.originalPrice && (
                          <span className="text-lg text-gray-400 line-through">
                            {formatPrice(book.originalPrice)}
                          </span>
                        )}
                    </>
                  )}
                </div>

                {/* Add to Cart Button - hidden for free books */}
                {book.price !== 0 && (
                  book.isShippingRequired === false || book.isInStock ? (
                    <button className="btn-primary whitespace-nowrap">
                      {t('common.addToCart')}
                    </button>
                  ) : (
                    <button className="btn-primary whitespace-allowed opacity-50 cursor-not-allowed" disabled>
                      {t('common.outOfStock')}
                    </button>
                  )
                )}
              </div>
            )}

            {/* Download Buttons */}
            <DownloadButtons book={book} />



            {/* Characteristics */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-dark mb-4">{tProduct('details')}</h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {book.author && (
                  <div>
                    <dt className="text-gray-500">{tProduct('author')}</dt>
                    <dd className="font-medium text-dark">{book.author}</dd>
                  </div>
                )}
                {book.translator && (
                  <div>
                    <dt className="text-gray-500">{tProduct('translator')}</dt>
                    <dd className="font-medium text-dark">{book.translator}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">{tProduct('publisher')}</dt>
                  <dd className="font-medium text-dark">{book.publisher}</dd>
                </div>
                {book.pubDate && (
                  <div>
                    <dt className="text-gray-500">{tProduct('publicationDate')}</dt>
                    <dd className="font-medium text-dark">{book.pubDate}</dd>
                  </div>
                )}
                {book.language && (
                  <div>
                    <dt className="text-gray-500">{tProduct('language')}</dt>
                    <dd className="font-medium text-dark">{book.language}</dd>
                  </div>
                )}
                {book.pages > 0 && (
                  <div>
                    <dt className="text-gray-500">{tProduct('pages')}</dt>
                    <dd className="font-medium text-dark">{book.pages}</dd>
                  </div>
                )}
              </dl>
              {book.description && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-dark mb-2">{tProduct('description')}</h4>
                  <div
                    className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: book.description }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
