import React from 'react';
import { User, Calendar, MessageSquare } from 'lucide-react';
import Card from '../Card';
import Badge from '../Badge';
import RatingStars from './RatingStars';

/**
 * ReviewCard
 * Renders a single approved showroom review card.
 * Never exposes private user data — only display name from safe API projection.
 */
const ReviewCard = ({ review, className = '' }) => {
  if (!review) return null;

  const displayName = review.user?.name || 'Anonymous';
  const formattedDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Recently';
  const rating = typeof review.rating === 'number' ? review.rating : 0;

  return (
    <Card
      variant="default"
      className={`p-5 border-border/70 space-y-3 ${className}`}
    >
      {/* Header: User + Date + Rating */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar circle */}
          <div
            className="w-9 h-9 rounded-full bg-surface-700 border border-border flex items-center justify-center text-brand-red shrink-0"
            aria-hidden="true"
          >
            <User className="w-4 h-4" />
          </div>

          <div>
            <p className="font-semibold text-surface-100 text-sm leading-tight">{displayName}</p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              <time dateTime={review.createdAt}>{formattedDate}</time>
            </span>
          </div>
        </div>

        <RatingStars value={rating} readonly size="sm" label="Review rating" />
      </div>

      {/* Review Title */}
      {review.title && review.title.trim() && (
        <h4 className="font-semibold text-surface-50 text-sm">{review.title}</h4>
      )}

      {/* Review Comment */}
      {review.comment && review.comment.trim() && (
        <p className="text-sm text-surface-200 leading-relaxed flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
          <span>{review.comment}</span>
        </p>
      )}

      {!review.comment && !review.title && (
        <p className="text-xs text-muted-foreground italic">No written review provided.</p>
      )}
    </Card>
  );
};

export default ReviewCard;
