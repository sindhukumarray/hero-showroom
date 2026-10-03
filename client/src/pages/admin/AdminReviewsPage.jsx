import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  User,
  Building2,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Filter,
  FileText
} from 'lucide-react';
import { pageTransition, getAccessibleVariant } from '../../animations/variants';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useSEO } from '../../hooks/useSEO';
import { adminService } from '../../services';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

const REVIEW_STATUS_CONFIG = {
  pending: {
    label: 'Pending Audit',
    badgeVariant: 'warning',
    bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Awaiting administrative verification before public display'
  },
  approved: {
    label: 'Approved & Live',
    badgeVariant: 'success',
    bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Published and visible on the public showroom profile'
  },
  rejected: {
    label: 'Rejected',
    badgeVariant: 'danger',
    bgClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    description: 'Hidden from public due to content policy violation'
  }
};

const STATUS_KEYS = ['pending', 'approved', 'rejected'];

const RATING_FILTER_OPTIONS = [
  { value: 'all', label: 'All Ratings' },
  { value: '5', label: '5 Stars ★★★★★' },
  { value: '4', label: '4 Stars ★★★★☆' },
  { value: '3', label: '3 Stars ★★★☆☆' },
  { value: '2', label: '2 Stars ★★☆☆☆' },
  { value: '1', label: '1 Star  ★☆☆☆☆' }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'rating_high', label: 'Highest Rating' },
  { value: 'rating_low', label: 'Lowest Rating' },
  { value: 'status', label: 'By Moderation Status' }
];

const AdminReviewsPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Review Moderation & Feedback | Admin Console',
    description: 'Audit customer showroom ratings, moderate pending reviews, and manage feedback visibility.'
  });

  // Data states
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [showroomFilter, setShowroomFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Auxiliary data
  const [showroomsList, setShowroomsList] = useState([]);

  // Detail & Moderation Modal
  const [selectedReview, setSelectedReview] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [moderationNoteDraft, setModerationNoteDraft] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Auto-dismiss feedback message after 4s
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Load auxiliary showrooms list for filtering
  useEffect(() => {
    const fetchShowrooms = async () => {
      try {
        const res = await adminService.getShowrooms({ limit: 100 });
        if (res.data?.data) {
          setShowroomsList(res.data.data);
        }
      } catch (e) {
        // Aux load failure non-blocking
      }
    };
    fetchShowrooms();
  }, []);

  // Fetch reviews with server-side filtering and pagination
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        sort: sortOrder
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (ratingFilter !== 'all') params.rating = ratingFilter;
      if (showroomFilter !== 'all') params.showroom = showroomFilter;

      const res = await adminService.getReviews(params);
      const dataPayload = res.data?.data || res.data || [];
      const metaPayload = res.data?.meta || {
        page: currentPage,
        limit: 20,
        total: dataPayload.length,
        pages: 1
      };

      setReviews(dataPayload);
      setMeta(metaPayload);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load customer reviews.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, statusFilter, ratingFilter, showroomFilter, sortOrder]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Filter handlers
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRatingFilter('all');
    setShowroomFilter('all');
    setSortOrder('newest');
    setCurrentPage(1);
  };

  // Open detail modal and pre-fill note draft
  const handleOpenDetail = (review) => {
    setSelectedReview(review);
    setModerationNoteDraft(review.moderationNote || '');
    setIsDetailModalOpen(true);
  };

  // Moderation action handler
  const handleModerateStatus = async (reviewId, newStatus, note = '') => {
    if (!newStatus || !STATUS_KEYS.includes(newStatus)) return;
    setIsUpdatingStatus(true);
    try {
      const res = await adminService.updateReviewStatus(reviewId, {
        status: newStatus,
        moderationNote: note
      });
      const updated = res.data?.data || res.data;

      // Update in local state list
      setReviews((prev) =>
        prev.map((item) =>
          item._id === reviewId
            ? { ...item, status: newStatus, moderationNote: note }
            : item
        )
      );

      // Update selected review if modal open
      if (selectedReview && selectedReview._id === reviewId) {
        setSelectedReview((prev) => ({
          ...prev,
          status: newStatus,
          moderationNote: note
        }));
      }

      setFeedback({
        type: 'success',
        message: `Review status updated to '${REVIEW_STATUS_CONFIG[newStatus]?.label || newStatus}' successfully.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to update review moderation status.'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Metrics computation from active dataset
  const totalReviews = meta?.total || reviews.length;
  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <motion.div
      initial={accessiblePageTransition.initial}
      animate={accessiblePageTransition.animate}
      exit={accessiblePageTransition.exit}
      transition={accessiblePageTransition.transition}
      className="space-y-8"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-surface-800 text-brand-red">
              <Star className="w-5 h-5" aria-hidden="true" />
            </span>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-surface-50">
              Customer Review Moderation
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Audit customer showroom ratings, moderate pending reviews, and safeguard public showroom reputation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchReviews}
            disabled={isLoading}
            className="text-xs border-border/80"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
              : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-80 rounded"
            aria-label="Dismiss feedback"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface-900/40 border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Reviews
            </span>
            <FileText className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-surface-50 mt-2">{totalReviews}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Lifetime customer submissions</span>
        </Card>

        <Card className="p-4 bg-amber-950/20 border-amber-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Pending Audit
            </span>
            <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{pendingCount}</p>
          <span className="text-[11px] text-amber-300/80 mt-0.5 block">Awaiting moderation action</span>
        </Card>

        <Card className="p-4 bg-emerald-950/20 border-emerald-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Live & Approved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{approvedCount}</p>
          <span className="text-[11px] text-emerald-300/80 mt-0.5 block">Visible to public visitors</span>
        </Card>

        <Card className="p-4 bg-sky-950/20 border-sky-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Average Rating
            </span>
            <Star className="w-4 h-4 text-sky-400 fill-sky-400" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-sky-400 mt-2">{averageRating} / 5.0</p>
          <span className="text-[11px] text-sky-300/80 mt-0.5 block">Across evaluated reviews</span>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card className="p-4 bg-surface-900/30 border-border/80">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search
                className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search reviewer, title, comments..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-950 border border-border/80 rounded-lg text-sm text-surface-200 placeholder-muted-foreground focus:outline-none focus:border-brand-red/50"
              />
            </div>

            {/* Moderation Status Filter */}
            <div className="md:col-span-2">
              <select
                aria-label="Filter by Moderation Status"
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                className="w-full px-3 py-2 bg-surface-950 border border-border/80 rounded-lg text-sm text-surface-300 focus:outline-none focus:border-brand-red/50"
              >
                <option value="all">All Moderation Statuses</option>
                {STATUS_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {REVIEW_STATUS_CONFIG[k].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div className="md:col-span-2">
              <select
                aria-label="Filter by Star Rating"
                value={ratingFilter}
                onChange={(e) => handleFilterChange(setRatingFilter, e.target.value)}
                className="w-full px-3 py-2 bg-surface-950 border border-border/80 rounded-lg text-sm text-surface-300 focus:outline-none focus:border-brand-red/50"
              >
                {RATING_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="md:col-span-2">
              <select
                aria-label="Sort Reviews"
                value={sortOrder}
                onChange={(e) => handleFilterChange(setSortOrder, e.target.value)}
                className="w-full px-3 py-2 bg-surface-950 border border-border/80 rounded-lg text-sm text-surface-300 focus:outline-none focus:border-brand-red/50"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div className="md:col-span-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-muted-foreground hover:text-surface-100"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Secondary Filter Row: Showroom */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-border/40 text-xs">
            <div className="md:col-span-12 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <select
                aria-label="Filter by Showroom"
                value={showroomFilter}
                onChange={(e) => handleFilterChange(setShowroomFilter, e.target.value)}
                className="w-full md:w-1/2 px-2.5 py-1.5 bg-surface-950 border border-border/60 rounded-md text-xs text-surface-300 focus:outline-none focus:border-brand-red/50"
              >
                <option value="all">All Showrooms</option>
                {showroomsList.map((sr) => (
                  <option key={sr._id} value={sr._id}>
                    {sr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table / Content Section */}
      <Card className="overflow-hidden border-border/80 bg-surface-900/20">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loading message="Loading customer reviews..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" aria-hidden="true" />
            <h2 className="text-base font-bold text-surface-100">Unable to load reviews</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchReviews}>
              Try Again
            </Button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={Star}
              title="No customer reviews found"
              description="No reviews match your current search terms or filter constraints."
              actionLabel="Reset Filters"
              onAction={handleClearFilters}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface-950/60 text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Review Summary</th>
                  <th className="py-3 px-4">Showroom</th>
                  <th className="py-3 px-4">Moderation Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-surface-200">
                {reviews.map((review) => {
                  const statusInfo = REVIEW_STATUS_CONFIG[review.status] || REVIEW_STATUS_CONFIG.pending;

                  return (
                    <tr
                      key={review._id}
                      className="hover:bg-surface-800/40 transition-colors group"
                    >
                      {/* Reviewer Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-surface-100 text-sm">
                            {review.user?.name || 'Anonymous Customer'}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            {review.user?.email || 'No email'}
                          </span>
                          {review.user?.role && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Verified ({review.user.role})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Star Rating */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-700'
                                }`}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                          <span className="font-bold text-surface-100">{review.rating}.0</span>
                        </div>
                      </td>

                      {/* Review Content Preview */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col">
                          {review.title && (
                            <span className="font-semibold text-surface-100 truncate">
                              {review.title}
                            </span>
                          )}
                          <span className="text-muted-foreground text-[11px] line-clamp-2">
                            {review.comment || 'No written comment provided.'}
                          </span>
                        </div>
                      </td>

                      {/* Target Showroom */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-surface-100">
                            {review.showroom?.name || 'Authorized Showroom'}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            {review.showroom?.city?.name || review.showroom?.address?.city || ''}
                          </span>
                        </div>
                      </td>

                      {/* Moderation Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.bgClass}`}
                        >
                          {statusInfo.label}
                        </span>
                        {review.moderationNote && (
                          <span className="block text-[10px] text-muted-foreground mt-0.5 italic truncate max-w-[150px]">
                            Note: {review.moderationNote}
                          </span>
                        )}
                      </td>

                      {/* Submission Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground text-[11px]">
                        <div>{new Date(review.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] opacity-75">
                          {new Date(review.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Moderation Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {review.status !== 'approved' && (
                            <button
                              onClick={() => handleModerateStatus(review._id, 'approved', review.moderationNote)}
                              disabled={isUpdatingStatus}
                              title="Quick Approve"
                              className="p-1 rounded text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 transition-colors"
                              aria-label={`Approve review ${review._id}`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {review.status !== 'rejected' && (
                            <button
                              onClick={() => handleModerateStatus(review._id, 'rejected', review.moderationNote)}
                              disabled={isUpdatingStatus}
                              title="Quick Reject"
                              className="p-1 rounded text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                              aria-label={`Reject review ${review._id}`}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleOpenDetail(review)}
                            className="text-xs hover:text-surface-100"
                          >
                            Inspect
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {meta && meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-surface-950/40 text-xs text-muted-foreground">
            <div>
              Showing page <span className="font-bold text-surface-200">{meta.page}</span> of{' '}
              <span className="font-bold text-surface-200">{meta.pages}</span> ({meta.total} reviews)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={meta.page <= 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="text-xs border-border/60"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                disabled={meta.page >= meta.pages || isLoading}
                onClick={() => setCurrentPage((p) => Math.min(meta.pages, p + 1))}
                className="text-xs border-border/60"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Moderation Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Review Audit & Moderation"
        subtitle={`Review reference ID: ${selectedReview?._id || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedReview && (
          <div className="space-y-6 text-sm text-surface-200">
            {/* Moderation Workflow Control Ribbon */}
            <div className="p-4 rounded-xl bg-surface-950 border border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Moderation Decision
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    (REVIEW_STATUS_CONFIG[selectedReview.status] || REVIEW_STATUS_CONFIG.pending).bgClass
                  }`}
                >
                  Current: {REVIEW_STATUS_CONFIG[selectedReview.status]?.label || selectedReview.status}
                </span>
              </div>

              {/* Moderation Note Input */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Administrative Moderation Note / Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  value={moderationNoteDraft}
                  onChange={(e) => setModerationNoteDraft(e.target.value)}
                  placeholder="Record why this review was approved, rejected, or flagged..."
                  className="w-full p-2.5 bg-surface-900 border border-border/80 rounded-lg text-xs text-surface-200 focus:outline-none focus:border-brand-red"
                  maxLength={500}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="brand"
                  size="sm"
                  icon={CheckCircle2}
                  disabled={isUpdatingStatus || selectedReview.status === 'approved'}
                  onClick={() =>
                    handleModerateStatus(selectedReview._id, 'approved', moderationNoteDraft)
                  }
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Approve Review
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ShieldAlert}
                  disabled={isUpdatingStatus || selectedReview.status === 'rejected'}
                  onClick={() =>
                    handleModerateStatus(selectedReview._id, 'rejected', moderationNoteDraft)
                  }
                  className="border-rose-800/60 text-rose-400 hover:bg-rose-950/40"
                >
                  Reject Review
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Clock}
                  disabled={isUpdatingStatus || selectedReview.status === 'pending'}
                  onClick={() =>
                    handleModerateStatus(selectedReview._id, 'pending', moderationNoteDraft)
                  }
                  className="text-amber-400 hover:bg-amber-950/40"
                >
                  Reset to Pending
                </Button>
              </div>
            </div>

            {/* Rating & Review Content Box */}
            <div className="p-4 rounded-xl bg-surface-950/60 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= selectedReview.rating ? 'fill-amber-400 text-amber-400' : 'text-surface-700'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                  <span className="font-extrabold text-surface-100 text-base ml-2">
                    {selectedReview.rating} out of 5
                  </span>
                </div>
              </div>

              {selectedReview.title && (
                <div className="font-bold text-surface-100 text-base">
                  &ldquo;{selectedReview.title}&rdquo;
                </div>
              )}

              <div className="p-3 bg-surface-900/60 rounded-lg border border-border/40 text-xs text-surface-200 leading-relaxed whitespace-pre-wrap">
                {selectedReview.comment || 'No written comment provided with this rating.'}
              </div>
            </div>

            {/* Reviewer & Dealership Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="p-4 rounded-xl bg-surface-950/60 border border-border/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <User className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                  <span>Reviewer Identity</span>
                </div>
                <div>
                  <span className="font-bold text-surface-100 block">
                    {selectedReview.user?.name || 'Verified Customer'}
                  </span>
                  {selectedReview.user?.email && (
                    <a
                      href={`mailto:${selectedReview.user.email}`}
                      className="text-xs text-brand-red hover:underline block break-all"
                    >
                      {selectedReview.user.email}
                    </a>
                  )}
                  {selectedReview.user?.phone && (
                    <span className="text-xs text-muted-foreground block">
                      Phone: {selectedReview.user.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Showroom Box */}
              <div className="p-4 rounded-xl bg-surface-950/60 border border-border/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                  <span>Target Dealership</span>
                </div>
                <div>
                  <span className="font-bold text-surface-100 block">
                    {selectedReview.showroom?.name || 'Authorized Dealership'}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {selectedReview.showroom?.address?.street || selectedReview.showroom?.address?.fullAddress || ''}
                  </span>
                  {selectedReview.showroom?.showroomType && (
                    <span className="inline-block mt-1 text-[10px] text-sky-400 font-mono">
                      Type: {selectedReview.showroom.showroomType}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Audit Timestamps */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
              <span>Submitted: {new Date(selectedReview.createdAt).toLocaleString()}</span>
              <span>Last Moderated: {new Date(selectedReview.updatedAt || selectedReview.createdAt).toLocaleString()}</span>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-xs"
              >
                Close Audit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default AdminReviewsPage;
