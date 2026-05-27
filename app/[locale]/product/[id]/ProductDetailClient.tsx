// app/product/[id]/ProductDetailClient.tsx
// Client component for product detail with localization support

'use client';

import { useState, useEffect } from 'react';
import LocalizedLink from '../../../components/LocalizedLink';
import Breadcrumbs from '../../../components/Breadcrumbs';
import ProductGrid from '../../../components/ProductGrid';
import ProductImage from '../../../components/ProductImage';
import { Download, FileText, BookOpen, Package, Monitor, ShoppingCart, Check } from 'lucide-react';
import { getProductById, getProductReviews, oscarProductToBook, parseVariantPrice, getMyBooks } from '../../../lib/api';
import ProductReviewsSection from '../../../components/ProductReviewsSection';
import { useAuth } from '../../../lib/AuthContext';
import { useApiLocale } from '../../../i18n/useApiLocale';
import { useLanguage, useTranslations } from '../../../i18n/LanguageContext';
import { useCurrency } from '../../../i18n/CurrencyContext';
import { useLocalCart } from '../../../lib/localCart';
import { Book, Review, Variant } from '../../../types';
import { Loader2 } from 'lucide-react';

interface ProductDetailClientProps {
  productId: string;
  initialBook: Book | null;
  initialReviews?: Review[];
  serverFetchKey: string;
  relatedBooks?: Book[];
}

function DownloadButtons({ book, isPurchased }: { book: Book; isPurchased?: boolean }) {
  const t = useTranslations('product');
  
  // If all URLs are null/empty, don't show any download buttons
  if (!book.downloadUrl && !book.previewUrl && !book.epubUrl) {
    return null;
  }

  const isPaidBook = book.downloadUrl?.includes('orthodoxpaidbooks');
  const isFreeBook = book.downloadUrl?.includes('orthodoxbookshop');

  // Purchased book: show full PDF and EPUB download buttons (same as free books)
  if (isPurchased) {
    return (
      <div className="flex flex-col gap-3 pt-4 border-t">
        <span className="text-sm text-gray-500 font-medium">{t('downloadPurchasedBook')}</span>
        <div className="flex flex-wrap gap-3">
          {book.downloadUrl && (
            <a
              href={book.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold text-ink rounded-lg font-medium hover:bg-gold-light transition-colors duration-200 active:scale-95 transform"
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
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold text-ink rounded-lg font-medium hover:bg-gold-light transition-colors duration-200 active:scale-95 transform"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('downloadEpub')}</span>
            </a>
          )}
        </div>
      </div>
    );
  }

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
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-burgundy text-burgundy rounded-lg font-medium hover:bg-burgundy hover:text-parchment-light transition-colors duration-200 active:scale-95 transform"
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
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold text-ink rounded-lg font-medium hover:bg-gold-light transition-colors duration-200 active:scale-95 transform"
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
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold text-ink rounded-lg font-medium hover:bg-gold-light transition-colors duration-200 active:scale-95 transform"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('downloadEpub')}</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  // Unknown source with preview URL: show generic download button
  if (book.previewUrl) {
    return (
      <div className="flex flex-col gap-3 pt-4 border-t">
        <span className="text-sm text-gray-500 font-medium">{t('download')}</span>
        <a
          href={book.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-burgundy text-burgundy rounded-lg font-medium hover:bg-burgundy hover:text-parchment-light transition-colors duration-200 active:scale-95 transform"
        >
          <Download className="w-4 h-4" />
          <span>{t('download')}</span>
        </a>
      </div>
    );
  }

  return null;
}

export default function ProductDetailClient({
  productId,
  initialBook,
  initialReviews = [],
  serverFetchKey,
  relatedBooks = [],
}: ProductDetailClientProps) {
  const { isLoading: contextLoading } = useLanguage();
  const locale = useApiLocale();
  const t = useTranslations();
  const tProduct = useTranslations('product');
  const { symbol, currency, isLoading: currencyIsLoading } = useCurrency();
  const { addItem } = useLocalCart();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [book, setBook] = useState<Book | null>(initialBook);
  const [loading, setLoading] = useState(!initialBook);
  const [error, setError] = useState<string | null>(initialBook ? null : 'not_found');
  const [purchasedBookIds, setPurchasedBookIds] = useState<Set<number>>(new Set());
  const [fetchedForKey, setFetchedForKey] = useState<string | undefined>(
    initialBook ? serverFetchKey : undefined
  );
  const currentKey = `${locale}:${currency}`;
  
  // Add to cart state - track per-variant ID for success feedback
  const [addedToCartVariantId, setAddedToCartVariantId] = useState<number | null>(null);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

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
    if (contextLoading || currencyIsLoading || authLoading) {
      return;
    }

    const abortController = new AbortController();
    const ssrMatchesCurrent = Boolean(
      initialBook && currentKey === serverFetchKey
    );

    if (ssrMatchesCurrent) {
      setBook(initialBook);
      setFetchedForKey(currentKey);
      setLoading(false);
      setError(null);

      if (!isAuthenticated) {
        return () => abortController.abort();
      }

      // Refresh auth-only fields (can_review) without a full-page loading state
      (async () => {
        try {
          const product = await getProductById(
            productId,
            abortController.signal,
            locale
          );
          if (abortController.signal.aborted) return;
          const converted = oscarProductToBook(product, locale);
          setBook((prev) =>
            prev
              ? {
                  ...prev,
                  canReview: converted.canReview,
                  rating: converted.rating,
                  reviewCount: converted.reviewCount,
                }
              : converted
          );
        } catch (err) {
          if (!abortController.signal.aborted) {
            console.error('Failed to refresh product auth fields:', err);
          }
        }
      })();

      return () => abortController.abort();
    }

    async function fetchBook() {
      try {
        setLoading(true);
        setError(null);
        const product = await getProductById(
          productId,
          abortController.signal,
          locale
        );
        if (abortController.signal.aborted) return;
        const convertedBook = oscarProductToBook(product, locale);
        setBook(convertedBook);
        setFetchedForKey(currentKey);
      } catch (err) {
        if (abortController.signal.aborted) return;
        console.error('Failed to fetch book:', err);
        setError(err instanceof Error ? err.message : 'Failed to load book');
        setBook(null);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchBook();

    return () => {
      abortController.abort();
    };
  }, [
    productId,
    locale,
    currency,
    contextLoading,
    currencyIsLoading,
    currentKey,
    serverFetchKey,
    initialBook,
    isAuthenticated,
    authLoading,
  ]);

  // Fetch purchased book IDs for the logged-in user
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchPurchasedBooks() {
      try {
        const myBooks = await getMyBooks();
        const purchasedIds = new Set<number>();
        for (const mb of myBooks) {
          if (mb.purchased) {
            purchasedIds.add(mb.book_id);
          }
        }
        setPurchasedBookIds(purchasedIds);
      } catch (err) {
        // Silently ignore — isPurchased will remain false
        console.error('Failed to fetch purchased books:', err);
      }
    }

    fetchPurchasedBooks();
  }, [authLoading, isAuthenticated]);

  // Reviews: use SSR when locale matches; refetch when locale/auth changes
  useEffect(() => {
    if (authLoading) return;

    const reviewKey = `${locale}:${currency}`;
    if (serverFetchKey === reviewKey) {
      setReviews(initialReviews);
      if (!isAuthenticated) {
        return;
      }
    }

    const abortController = new AbortController();

    async function fetchReviews() {
      try {
        const data = await getProductReviews(productId, {
          signal: abortController.signal,
          locale,
          auth: isAuthenticated,
        });
        if (!abortController.signal.aborted) {
          setReviews(data);
          if (data.length > 0) {
            const avgRating =
              data.reduce((sum, r) => sum + r.rating, 0) / data.length;
            setBook((prev) =>
              prev
                ? { ...prev, reviewCount: data.length, rating: avgRating }
                : prev
            );
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('Failed to fetch reviews:', err);
        }
      }
    }

    fetchReviews();

    return () => abortController.abort();
  }, [
    productId,
    locale,
    currency,
    isAuthenticated,
    authLoading,
    serverFetchKey,
    initialReviews,
  ]);

  // Determine if the current book (or its ebook variant) has been purchased
  const isPurchased = book ? (
    purchasedBookIds.has(parseInt(book.id)) ||
    (book.parentId != null && purchasedBookIds.has(book.parentId)) ||
    (book.variants?.some(v => v.book_type === 'ebook' && purchasedBookIds.has(v.id)) ?? false)
  ) : false;

  // Handle add to cart — now uses localStorage cart (instant, no API call)
  const handleAddToCart = (variantId: number) => {
    if (!book) return;

    try {
      setAddToCartError(null);

      const isVariant = book.isParent && book.variants && book.variants.length > 0;

      let itemTitle: string, itemAuthor: string, itemCoverImage: string, itemPrice: number;
      let itemVariantTitle: string | undefined;
      let itemIsShippingRequired: boolean;
      let parentProductId: number;

      if (isVariant) {
        const variant = book.variants!.find(v => v.id === variantId);
        if (!variant) return;
        itemTitle = book.title;
        itemAuthor = book.author;
        itemCoverImage = book.coverImage;
        itemPrice = parseVariantPrice(variant);
        itemVariantTitle = variant.title;
        itemIsShippingRequired = variant.is_shipping_required;
        parentProductId = parseInt(book.id);
      } else {
        itemTitle = book.title;
        itemAuthor = book.author;
        itemCoverImage = book.coverImage;
        itemPrice = book.price;
        itemVariantTitle = undefined;
        itemIsShippingRequired = book.isShippingRequired ?? true;
        parentProductId = book.parentId ? book.parentId : parseInt(book.id);
      }

      addItem({
        productId: variantId,
        parentProductId,
        quantity: 1,
        title: itemTitle,
        author: itemAuthor,
        coverImage: itemCoverImage,
        variantTitle: itemVariantTitle,
        price: itemPrice,
        currency,
        isShippingRequired: itemIsShippingRequired,
        addedAt: new Date().toISOString(),
      });

      setAddedToCartVariantId(variantId);
      setTimeout(() => setAddedToCartVariantId(null), 2000);
    } catch (err) {
      console.error('[handleAddToCart] Error adding to cart:', err);
      setAddToCartError(err instanceof Error ? err.message : 'Failed to add to cart');
    }
  };

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-burgundy" />
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
          <LocalizedLink href="/catalog" className="btn-burgundy">
            {tProduct('browseCatalog')}
          </LocalizedLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: t('nav.home'), href: '/' },
            { label: t('nav.catalog'), href: '/catalog' },
            { label: book.title },
          ]}
        />

        {/* Product layout: row 1 = cover | info+details; row 2 = description | reviews */}
        <div className="grid md:grid-cols-2 md:items-start gap-8 lg:gap-12 mb-16">
          {/* Column 1, row 1: Cover */}
          <div className="aspect-[3/4] bg-white rounded-2xl overflow-hidden shadow-sm relative">
            <ProductImage
              src={book.coverImage}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Column 2, row 1: Title, purchase options, product details */}
          <div className="flex flex-col gap-6">
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
                {[...book.variants].sort((a, b) => {
                  // Use the language-agnostic book_type field instead of regex on
                  // the localized title, which only worked for English keywords.
                  const aIsEbook = a.book_type === 'ebook';
                  const bIsEbook = b.book_type === 'ebook';
                  if (aIsEbook && !bIsEbook) return -1;
                  if (!aIsEbook && bIsEbook) return 1;
                  return 0;
                }).map((variant: Variant) => {
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
                          <button className="btn-burgundy w-full whitespace-nowrap opacity-50 cursor-not-allowed active:scale-100" disabled>
                            {t('common.outOfStock')}
                          </button>
                        ) : addedToCartVariantId === variant.id ? (
                          <button className="btn-burgundy w-full whitespace-nowrap bg-green-600 hover:bg-green-600">
                            <Check className="w-4 h-4 inline mr-2" />
                            {t('common.added')}
                          </button>
                        ) : addToCartError ? (
                          <button className="btn-burgundy w-full whitespace-nowrap bg-red-500 hover:bg-red-600">
                            {t('common.error')}
                          </button>
                        ) : (
                          <button
                            className="btn-burgundy w-full whitespace-nowrap"
                            onClick={() => handleAddToCart(variant.id)}
                          >
                            <ShoppingCart className="w-4 h-4 inline mr-2" />
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
              <div className="flex flex-col gap-3 bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between gap-4">
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
                      addedToCartVariantId === parseInt(book.id) ? (
                        <button className="btn-burgundy whitespace-nowrap bg-green-600 hover:bg-green-600">
                          <Check className="w-4 h-4 inline mr-2" />
                          {t('common.added')}
                        </button>
                      ) : addToCartError ? (
                        <button className="btn-burgundy whitespace-nowrap bg-red-500 hover:bg-red-600">
                          {addToCartError}
                        </button>
                      ) : (
                        <button
                          className="btn-burgundy whitespace-nowrap"
                          onClick={() => handleAddToCart(parseInt(book.id))}
                        >
                          <ShoppingCart className="w-4 h-4 inline mr-2" />
                          {t('common.addToCart')}
                        </button>
                      )
                    ) : (
                      <button className="btn-burgundy whitespace-nowrap opacity-50 cursor-not-allowed active:scale-100" disabled>
                        {t('common.outOfStock')}
                      </button>
                    )
                  )}
                </div>
                {/* Error message display */}
                {addToCartError && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {addToCartError}
                  </div>
                )}
              </div>
            )}

            {/* Download Buttons */}
            <DownloadButtons book={book} isPurchased={isPurchased} />



            {/* Product details (metadata only) */}
            <div className="bg-white rounded-xl p-6 shadow-sm mt-8">
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
            </div>
          </div>

          {/* Column 1, row 2: Description (under cover) */}
          {book.description ? (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-dark mb-4">{tProduct('description')}</h3>
              <div
                className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: book.description }}
              />
            </div>
          ) : (
            <div className="hidden md:block" aria-hidden="true" />
          )}

          {/* Column 2, row 2: Reviews (aligned with description) */}
          <ProductReviewsSection
            productId={productId}
            book={book}
            reviews={reviews}
            onReviewsChange={setReviews}
            onBookUpdate={(updates) => setBook((prev) => (prev ? { ...prev, ...updates } : prev))}
          />
        </div>

        {relatedBooks.length > 0 && (
          <section className="mt-8 pt-6 pb-12 border-t border-parchment-dark/30">
            <h2 className="section-title text-center mb-8">{t('catalog.relatedProducts')}</h2>
            <ProductGrid books={relatedBooks} />
          </section>
        )}
      </div>
    </div>
  );
}
