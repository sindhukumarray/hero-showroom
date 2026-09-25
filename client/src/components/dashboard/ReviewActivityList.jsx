import React, { useState } from 'react';
import {
  Star,
  Building2,
  Calendar,
  Edit3,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Card from '../Card';
import Badge from '../Badge';
import Button from '../Button';
import EmptyState from '../EmptyState';
import Loading from '../Loading';
import Modal from '../Modal';
import RatingStars from '../reviews/RatingStars';
import ReviewForm from '../reviews/ReviewForm';
import { reviewService } from '../../services';

const getStatusBadgeVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': return 'success';
    case 'pending':  return 'warning';
    case 'rejected': return 'outline';
    default:         return 'outline';
  }
};

const StatusIcon = ({ status }) => {
  switch (status?.toLowerCase()) {
    case 'approved': return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />;
    case 'rejected': return <XCircle className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />;
    default:         return <Clock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />;
  }
};

/**
 * ReviewActivityList
 * Customer Dashboard tab showing the authenticated user's submitted reviews.
 * Supports edit (via modal) and delete (with confirmation).
 */
const ReviewActivityList = ({
  reviews = [],
  isLoading = false,
  error = null,
  onRetry,
  onExplore,
  onRefresh
}) => {
  const [editingReview, setEditingReview] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    setDeleteError(null);
    try {
      await reviewService.deleteReview(confirmDeleteId);
      setConfirmDeleteId(null);
      if (typeof onRefresh === 'function') onRefresh();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || err?.message || 'Failed to delete review.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loading text="Loading your reviews…" size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-card bg-surface-900 border border-rose-800/60 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" aria-hidden="true" />
        <p className="typography-small text-rose-200 text-sm">{error}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No reviews yet"
        message="You haven't reviewed any showrooms yet. Visit an authorized showroom and share your experience."
        actionLabel={onExplore ? 'Find Showrooms' : undefined}
        onAction={onExplore}
        className="border-dashed py-10"
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {deleteError && (
          <div className="p-3 rounded-card border border-rose-800/60 bg-rose-950/20 flex items-center gap-2 text-sm text-rose-200" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {deleteError}
          </div>
        )}

        {reviews.map((review) => {
          const showroomName = review.showroom?.name || 'Showroom';
          const formattedDate = review.createdAt
            ? new Date(review.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : 'Recently';

          return (
            <Card
              key={review._id}
              variant="default"
              className="p-5 border-border/80 space-y-3"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(review.status)} size="sm" className="flex items-center gap-1">
                      <StatusIcon status={review.status} />
                      {review.status ? review.status.toUpperCase() : 'PENDING'}
                    </Badge>
                    <RatingStars value={review.rating || 0} readonly size="sm" />
                  </div>
                  <h4 className="font-semibold text-surface-50 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-brand-red shrink-0" aria-hidden="true" />
                    {showroomName}
                  </h4>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  {formattedDate}
                </span>
              </div>

              {/* Title */}
              {review.title && review.title.trim() && (
                <p className="text-sm font-medium text-surface-100">"{review.title}"</p>
              )}

              {/* Comment Preview */}
              {review.comment && review.comment.trim() && (
                <p className="text-xs text-muted-foreground italic line-clamp-2">
                  {review.comment}
                </p>
              )}

              {/* Pending notice */}
              {review.status === 'pending' && (
                <p className="text-[11px] text-amber-400/80 bg-amber-950/20 border border-amber-800/30 px-3 py-1.5 rounded-card">
                  Your review is pending moderation and will appear publicly once approved.
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit3}
                  onClick={() => setEditingReview(review)}
                  className="text-xs"
                  aria-label={`Edit review for ${showroomName}`}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  onClick={() => { setConfirmDeleteId(review._id); setDeleteError(null); }}
                  disabled={deletingId === review._id}
                  className="text-xs text-rose-400 hover:text-rose-300 border-rose-800/40 hover:border-rose-600/60"
                  aria-label={`Delete review for ${showroomName}`}
                >
                  {deletingId === review._id ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Modal (uses ReviewForm in update mode) */}
      {editingReview && (
        <Modal
          isOpen={Boolean(editingReview)}
          onClose={() => setEditingReview(null)}
          title="Edit Your Review"
          subtitle="Your updated review will re-enter moderation."
          maxWidth="max-w-lg"
        >
          <EditReviewForm
            review={editingReview}
            onSuccess={() => {
              setEditingReview(null);
              if (typeof onRefresh === 'function') onRefresh();
            }}
          />
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Review"
        subtitle="This action cannot be undone."
        maxWidth="max-w-sm"
      >
        <div className="space-y-5">
          <p className="text-sm text-surface-200">
            Are you sure you want to permanently delete this review?
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteId(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={Boolean(deletingId)}
              className="flex-1 bg-rose-600 hover:bg-rose-500 border-rose-600"
            >
              {deletingId ? 'Deleting…' : 'Delete Review'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/**
 * Inline edit form (update rating/title/comment only)
 */
const EditReviewForm = ({ review, onSuccess }) => {
  const [rating, setRating] = useState(review.rating || 0);
  const [title, setTitle] = useState(review.title || '');
  const [comment, setComment] = useState(review.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (success) {
    return (
      <div className="rounded-card border border-emerald-800/60 bg-emerald-950/30 p-5 flex items-start gap-3" role="status">
        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-300 text-sm">Review updated!</p>
          <p className="text-xs text-emerald-400/80 mt-1">It will be visible after re-moderation.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (rating < 1 || rating > 5) { setError('Please select a valid rating.'); return; }
    setSubmitting(true);
    try {
      const payload = { rating };
      if (title.trim()) payload.title = title.trim();
      if (comment.trim()) payload.comment = comment.trim();
      const res = await reviewService.updateReview(review._id, payload);
      if (res?.success) { setSuccess(true); setTimeout(onSuccess, 1200); }
      else setError(res?.message || 'Failed to update review.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="p-3 rounded-card border border-rose-800/60 bg-rose-950/20 text-sm text-rose-200" role="alert">{error}</div>
      )}
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rating *</label>
        <RatingStars value={rating} onChange={setRating} size="lg" label="Update rating" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="edit-review-title" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Title (optional)</label>
        <input
          id="edit-review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          disabled={submitting}
          className="w-full px-4 py-2.5 text-sm rounded-card border border-border bg-surface-800 text-surface-100 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-red disabled:opacity-50"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="edit-review-comment" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Review (optional)</label>
        <textarea
          id="edit-review-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          disabled={submitting}
          className="w-full px-4 py-2.5 text-sm rounded-card border border-border bg-surface-800 text-surface-100 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-red disabled:opacity-50 resize-none"
        />
      </div>
      <Button type="submit" variant="brand" size="md" disabled={submitting} className="w-full">
        {submitting ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  );
};

export default ReviewActivityList;
