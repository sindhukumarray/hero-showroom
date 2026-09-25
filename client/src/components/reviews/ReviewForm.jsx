import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reviewService } from '../../services';
import RatingStars from './RatingStars';
import Button from '../Button';

/**
 * ReviewForm
 * Authenticated review submission form for a specific showroom.
 * Redirects unauthenticated users to /login.
 *
 * Props:
 *   showroomId {string} - MongoDB ObjectId of showroom
 *   onSuccess  {fn}     - Called after successful submission with new review
 */
const ReviewForm = ({ showroomId, onSuccess }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [ratingError, setRatingError] = useState(false);

  if (authLoading) return null;

  if (!isAuthenticated) {
    return (
      <div className="rounded-card border border-border/60 bg-surface-900/60 p-5 text-center space-y-3">
        <p className="text-sm text-surface-200">Sign in to leave a review for this showroom.</p>
        <Button
          variant="brand"
          size="sm"
          onClick={() => navigate('/login', { state: { from: window.location.pathname } })}
        >
          Sign In to Review
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className="rounded-card border border-emerald-800/60 bg-emerald-950/30 p-5 flex items-start gap-3"
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold text-emerald-300 text-sm">Review submitted!</p>
          <p className="text-xs text-emerald-400/80 mt-1">
            Your review is pending moderation and will appear publicly once approved. Thank you for your feedback.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setRatingError(false);

    if (rating < 1 || rating > 5) {
      setRatingError(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = { showroom: showroomId, rating };
      if (title.trim()) payload.title = title.trim();
      if (comment.trim()) payload.comment = comment.trim();

      const res = await reviewService.createReview(payload);
      if (res?.success && res?.data) {
        setSuccess(true);
        if (typeof onSuccess === 'function') onSuccess(res.data);
      } else {
        setError(res?.message || 'Failed to submit review. Please try again.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit review.';
      const status = err?.response?.status;
      if (status === 409) {
        setError('You have already submitted a review for this showroom. You can edit it from your dashboard.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
      aria-label="Submit review form"
    >
      {/* Error banner */}
      {error && (
        <div
          className="rounded-card border border-rose-800/60 bg-rose-950/30 p-4 flex items-start gap-2"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-rose-200">{error}</p>
        </div>
      )}

      {/* Rating */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Your Rating <span className="text-rose-400" aria-hidden="true">*</span>
        </label>
        <RatingStars
          value={rating}
          onChange={(v) => { setRating(v); setRatingError(false); }}
          size="lg"
          label="Select rating"
        />
        {ratingError && (
          <p className="text-xs text-rose-400" role="alert">Please select a rating before submitting.</p>
        )}
      </div>

      {/* Title (optional) */}
      <div className="space-y-1.5">
        <label htmlFor="review-title" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Review Title <span className="text-muted-foreground/60 font-normal">(optional)</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Summarise your experience…"
          disabled={submitting}
          className="
            w-full px-4 py-2.5 text-sm rounded-card border border-border
            bg-surface-800 text-surface-100 placeholder-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        />
        <p className="text-[11px] text-muted-foreground text-right">{title.length}/100</p>
      </div>

      {/* Comment (optional) */}
      <div className="space-y-1.5">
        <label htmlFor="review-comment" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Review <span className="text-muted-foreground/60 font-normal">(optional, min 5 chars if provided)</span>
        </label>
        <textarea
          id="review-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          placeholder="Share your experience visiting this showroom…"
          disabled={submitting}
          className="
            w-full px-4 py-2.5 text-sm rounded-card border border-border
            bg-surface-800 text-surface-100 placeholder-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red
            disabled:opacity-50 disabled:cursor-not-allowed resize-none
            transition-colors
          "
        />
        <p className="text-[11px] text-muted-foreground text-right">{comment.length}/1000</p>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="brand"
        size="md"
        disabled={submitting}
        icon={submitting ? Loader : null}
        className={submitting ? 'opacity-70 cursor-not-allowed' : ''}
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </Button>
    </form>
  );
};

export default ReviewForm;
