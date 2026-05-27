'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import LocalizedLink from './LocalizedLink';
import { voteOnReview } from '../lib/api';
import { useTranslations } from '../i18n/LanguageContext';
import { Review } from '../types';

interface ReviewCardProps {
  review: Review;
  productId: string;
  isAuthenticated: boolean;
  onVoteUpdate: (review: Review) => void;
}

export default function ReviewCard({
  review,
  productId,
  isAuthenticated,
  onVoteUpdate,
}: ReviewCardProps) {
  const tProduct = useTranslations('product');
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteThanks, setVoteThanks] = useState(false);

  const canVote =
    isAuthenticated &&
    !review.isOwnReview &&
    review.userVote === null;

  const handleVote = async (delta: 1 | -1) => {
    if (!canVote || voting) return;
    setVoting(true);
    setVoteError(null);
    try {
      const updated = await voteOnReview(productId, review.id, delta);
      onVoteUpdate(updated);
      setVoteThanks(true);
      setTimeout(() => setVoteThanks(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.toLowerCase().includes('own')) {
        setVoteError(tProduct('cannotVoteOwnReview'));
      } else if (message.toLowerCase().includes('once') || message.toLowerCase().includes('voted')) {
        setVoteError(tProduct('alreadyVoted'));
      } else {
        setVoteError(message || tProduct('alreadyVoted'));
      }
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="bg-parchment/30 rounded-xl p-5 border border-parchment-dark/20">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center flex-shrink-0">
          <span className="text-burgundy font-semibold">
            {review.author.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-dark text-sm">{review.author}</h4>
            <span className="text-xs text-gray-400 flex-shrink-0">{review.date}</span>
          </div>

          <div className="flex gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= review.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
          </div>

          {review.title && (
            <p className="font-medium text-dark text-sm mb-1">{review.title}</p>
          )}
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
            {review.text}
          </p>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-parchment-dark/20">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" />
                {review.upvotes}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="w-3.5 h-3.5" />
                {review.downvotes}
              </span>
            </div>

            {canVote && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={voting}
                  onClick={() => handleVote(1)}
                  className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-burgundy disabled:opacity-50"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {tProduct('helpful')}
                </button>
                <button
                  type="button"
                  disabled={voting}
                  onClick={() => handleVote(-1)}
                  className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-burgundy disabled:opacity-50"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  {tProduct('notHelpful')}
                </button>
              </div>
            )}

            {isAuthenticated && review.userVote !== null && (
              <span className="text-xs text-burgundy">
                {review.userVote === 1 ? tProduct('helpful') : tProduct('notHelpful')}
              </span>
            )}

            {!isAuthenticated && (
              <LocalizedLink href="/login" className="text-xs text-burgundy hover:underline">
                {tProduct('loginToVote')}
              </LocalizedLink>
            )}
          </div>

          {voteThanks && (
            <p className="text-xs text-green-700 mt-2">{tProduct('voteThanks')}</p>
          )}
          {voteError && (
            <p className="text-xs text-red-600 mt-2">{voteError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
