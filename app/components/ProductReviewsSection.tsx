'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import LocalizedLink from './LocalizedLink';
import ReviewCard from './ReviewCard';
import { useAuth } from '../lib/AuthContext';
import { useTranslations } from '../i18n/LanguageContext';
import { createProductReview } from '../lib/api';
import type { Book, Review } from '../types';

interface ProductReviewsSectionProps {
  productId: string;
  book: Book;
  reviews: Review[];
  onReviewsChange: (reviews: Review[]) => void;
  onBookUpdate: (updates: Partial<Book>) => void;
}

function StarRatingDisplay({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const starClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starClass} ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function ProductReviewsSection({
  productId,
  book,
  reviews,
  onReviewsChange,
  onBookUpdate,
}: ProductReviewsSectionProps) {
  const tProduct = useTranslations('product');
  const { isAuthenticated } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [score, setScore] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const hasOwnReview = reviews.some((r) => r.isOwnReview);
  const canReview = isAuthenticated && !hasOwnReview && book.canReview !== false;

  const summaryCount = reviews.length > 0 ? reviews.length : book.reviewCount;
  const summaryRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : book.rating;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const newReview = await createProductReview(productId, { title, score, body });
      const updatedReviews = [newReview, ...reviews];
      onReviewsChange(updatedReviews);
      const newCount = updatedReviews.length;
      const newRating =
        updatedReviews.reduce((sum, r) => sum + r.rating, 0) / newCount;
      onBookUpdate({
        reviewCount: newCount,
        rating: newRating,
        canReview: false,
      });
      setFormSuccess(true);
      setShowForm(false);
      setTitle('');
      setBody('');
      setScore(5);
    } catch (err) {
      const message = err instanceof Error ? err.message : tProduct('submitReview');
      if (message.toLowerCase().includes('already')) {
        setFormError(tProduct('alreadyReviewed'));
      } else {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="font-semibold text-dark text-lg">{tProduct('reviews')}</h3>
        {summaryCount > 0 && (
          <div className="flex items-center gap-3">
            <StarRatingDisplay rating={summaryRating} />
            <span className="text-sm text-gray-500">
              {tProduct('averageRating', {
                rating: summaryRating.toFixed(1),
                count: String(summaryCount),
              })}
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-500 text-sm mb-4">{tProduct('noReviews')}</p>
      ) : (
        <div className="space-y-4 mb-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              productId={productId}
              isAuthenticated={isAuthenticated}
              onVoteUpdate={(updated) => {
                onReviewsChange(
                  reviews.map((r) => (r.id === updated.id ? updated : r))
                );
              }}
            />
          ))}
        </div>
      )}

      {formSuccess && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-4">
          {tProduct('reviewSubmitted')}
        </p>
      )}

      {canReview && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-burgundy text-sm"
        >
          {tProduct('writeReview')}
        </button>
      )}

      {!isAuthenticated && (
        <p className="text-sm text-gray-500 mt-2">
          <LocalizedLink href="/login" className="text-burgundy hover:underline">
            {tProduct('loginToReview')}
          </LocalizedLink>
        </p>
      )}

      {isAuthenticated && !canReview && hasOwnReview && (
        <p className="text-sm text-gray-500 mt-2">{tProduct('alreadyReviewed')}</p>
      )}

      {canReview && showForm && (
        <form onSubmit={handleSubmitReview} className="mt-4 pt-4 border-t space-y-4">
          <h4 className="font-medium text-dark">{tProduct('writeReview')}</h4>

          <div>
            <label className="block text-sm text-gray-600 mb-2">{tProduct('yourRating')}</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setScore(star)}
                  className="p-0.5"
                  aria-label={`${star} stars`}
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= score
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="review-title" className="block text-sm text-gray-600 mb-1">
              {tProduct('reviewTitle')}
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/30"
            />
          </div>

          <div>
            <label htmlFor="review-body" className="block text-sm text-gray-600 mb-1">
              {tProduct('reviewBody')}
            </label>
            <textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-burgundy/30"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-burgundy text-sm">
              {submitting ? '...' : tProduct('submitReview')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormError(null);
              }}
              className="btn-secondary text-sm"
            >
              {tProduct('cancelReview')}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
