import { Star } from 'lucide-react';
import { Review } from '../types';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-semibold text-lg">
            {review.author.charAt(0)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-dark">{review.author}</h4>
            <span className="text-sm text-gray-400">{review.date}</span>
          </div>

          {/* Rating */}
          <div className="flex gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Review Text */}
          <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>
        </div>
      </div>
    </div>
  );
}
