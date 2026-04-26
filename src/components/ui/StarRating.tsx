import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}

export default function StarRating({
  rating,
  max = 5,
  size = 14,
  showValue = false,
  reviewCount,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const partial = !filled && i < rating;

          return (
            <span key={i} className="relative">
              <Star size={size} className="fill-gray-200 text-gray-200" />
              {(filled || partial) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? '100%' : `${(rating % 1) * 100}%` }}
                >
                  <Star size={size} className="fill-amber-400 text-amber-400" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-gray-400">({reviewCount.toLocaleString('ar-EG')})</span>
      )}
    </div>
  );
}
