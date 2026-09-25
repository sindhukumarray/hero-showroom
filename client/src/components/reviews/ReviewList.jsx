import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, AlertCircle, ChevronDown } from 'lucide-react';
import { reviewService } from '../../services';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import RatingStars from './RatingStars';
import Loading from '../Loading';
import EmptyState from '../EmptyState';
import Button from '../Button';
import Badge from '../Badge';
import Modal from '../Modal';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/**
 * Rating distribution bar row
 */
const DistributionBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-4 text-right">{star}</span>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" aria-hidden="true" />
      <div className="flex-1 h-1.5 rounded-full bg-surface-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="text-muted-foreground w-5 text-right">{count}</span>
    </div>
  );
};

/**
 * ReviewList
 * Shows rating aggregation summary and paginated approved reviews for a showroom.
 * Also renders the ReviewForm (authenticated submit).
 *
 * Props:
 *   showroomId {string}  - MongoDB ObjectId
 */
const ReviewList = ({ showroomId }) => {
  const shouldReduceMotion = usePrefersReducedMotion();

  const [reviews, setReviews] = useState([]);
  const [aggregation, setAggregation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchReviews = useCallback(async (pageNum = 1, append = false) => {
    if (!showroomId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await reviewService.getShowroomReviews(showroomId, { page: pageNum, limit: 10 });
      if (res?.success) {
        setReviews((prev) => append ? [...prev, ...(res.data || [])] : (res.data || []));
        setMeta(res.meta);
        if (res.meta?.aggregation) {
          setAggregation(res.meta.aggregation);
        }
      } else {
        setError('Failed to load reviews.');
      }
    } catch {
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showroomId]);

  useEffect(() => {
    fetchReviews(1, false);
  }, [fetchReviews]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  const handleReviewSuccess = () => {
    setIsReviewModalOpen(false);
    // Refresh aggregation and reviews list
    setPage(1);
    fetchReviews(1, false);
  };

  const hasMore = meta && meta.page < meta.totalPages;
  const totalReviews = aggregation?.totalReviews ?? (meta?.total ?? 0);
  const avgRating = aggregation?.averageRating ?? 0;
  const distribution = aggregation?.distribution;

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 id="reviews-heading" className="typography-h3 text-surface-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-red" aria-hidden="true" />
            Customer Reviews
            {totalReviews > 0 && (
              <Badge variant="outline" size="sm">{totalReviews}</Badge>
            )}
          </h2>
          {avgRating > 0 && (
            <div className="flex items-center gap-2">
              <RatingStars value={Math.round(avgRating)} readonly size="sm" />
              <span className="text-sm font-semibold text-amber-400">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">out of 5</span>
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Star}
          onClick={() => setIsReviewModalOpen(true)}
          id="write-review-btn"
        >
          Write a Review
        </Button>
      </div>

      {/* Rating Distribution Summary */}
      {distribution && totalReviews > 0 && (
        <div className="rounded-card border border-border/60 bg-surface-900/60 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Rating Breakdown
          </p>
          {[5, 4, 3, 2, 1].map((star) => (
            <DistributionBar
              key={star}
              star={star}
              count={distribution[String(star)] || 0}
              total={totalReviews}
            />
          ))}
        </div>
      )}

      {/* Review Form Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Write a Review"
        subtitle="Share your showroom experience with other riders."
        maxWidth="max-w-lg"
      >
        <ReviewForm
          showroomId={showroomId}
          onSuccess={handleReviewSuccess}
        />
      </Modal>

      {/* Reviews List */}
      {loading && reviews.length === 0 ? (
        <div className="py-8 flex justify-center">
          <Loading text="Loading reviews…" size="md" />
        </div>
      ) : error ? (
        <div
          className="p-5 rounded-card border border-rose-800/60 bg-rose-950/20 flex items-center gap-3"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />
          <p className="text-sm text-rose-200">{error}</p>
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          message="Be the first to review this showroom and help other riders make an informed choice."
          actionLabel="Write the First Review"
          onAction={() => setIsReviewModalOpen(true)}
          className="border-dashed py-10 max-w-full"
        />
      ) : (
        <AnimatePresence initial={false}>
          <div className="space-y-3">
            {reviews.map((review, idx) => (
              <motion.div
                key={review._id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2, delay: shouldReduceMotion ? 0 : idx * 0.04 }}
              >
                <ReviewCard review={review} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            icon={ChevronDown}
            onClick={handleLoadMore}
          >
            Load More Reviews
          </Button>
        </div>
      )}

      {/* Loading more spinner */}
      {loading && reviews.length > 0 && (
        <div className="py-4 flex justify-center">
          <Loading text="Loading more…" size="sm" />
        </div>
      )}
    </section>
  );
};

export default ReviewList;
