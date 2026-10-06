const { Review, Showroom, User } = require('../models');
const { isConnected } = require('../config/database');
const { REVIEW_STATUS } = require('../constants/reviews');
const notificationService = require('./notificationService');
const { NOTIFICATION_TYPES } = require('../constants/notifications');

/**
 * Asserts database availability.
 */
const assertDatabaseConnected = () => {
  if (!isConnected() && !Review._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Safe user population projection — never exposes sensitive fields.
 */
const USER_PUBLIC_PROJECTION = 'name';

/**
 * Service: Create a customer review for a showroom.
 * User identity is always derived from JWT (userId param) — never from payload.
 *
 * @param {string} userId - From JWT (req.user.id)
 * @param {object} payload - Validated request body
 * @returns {Promise<object>} Populated review document
 */
const createReview = async (userId, payload) => {
  assertDatabaseConnected();

  const { showroom: showroomId, rating, title = '', comment = '' } = payload;

  // 1. Verify authenticated user is active
  const user = await User.findById(userId);
  if (!user || user.isActive === false) {
    const error = new Error('Authenticated user account is inactive or not found');
    error.statusCode = 401;
    throw error;
  }

  // 2. Verify showroom exists and is active
  const showroom = await Showroom.findById(showroomId);
  if (!showroom) {
    const error = new Error('Showroom not found');
    error.statusCode = 404;
    throw error;
  }
  if (showroom.isActive === false) {
    const error = new Error('Showroom is currently inactive and cannot receive reviews');
    error.statusCode = 400;
    throw error;
  }

  // 3. Prevent duplicate — one review per user per showroom
  const existingReview = await Review.findOne({ user: userId, showroom: showroomId });
  if (existingReview) {
    const error = new Error('You have already submitted a review for this showroom');
    error.statusCode = 409;
    throw error;
  }

  // 4. Create with server-enforced user ownership and pending status
  let review;
  try {
    review = await Review.create({
      user: userId,
      showroom: showroom._id,
      rating,
      title: title ? title.trim() : '',
      comment: comment ? comment.trim() : '',
      status: REVIEW_STATUS.PENDING,
      moderationNote: ''
    });
  } catch (err) {
    // Handle race condition duplicate key error safely
    if (err.code === 11000) {
      const dupError = new Error('You have already submitted a review for this showroom');
      dupError.statusCode = 409;
      throw dupError;
    }
    throw err;
  }

  // 5. Return populated document — never expose passwordHash
  const populated = await Review.findById(review._id)
    .populate('user', USER_PUBLIC_PROJECTION)
    .populate('showroom', 'name slug address showroomType city isActive');

  // 6. Safely create customer notification without interrupting review submission
  try {
    const showroomTitle = showroom ? showroom.name : 'Authorized Showroom';

    await notificationService.createNotification({
      userId: user._id,
      type: NOTIFICATION_TYPES.REVIEW,
      title: 'Showroom Review Submitted',
      message: `Thank you for reviewing ${showroomTitle}. Your review is currently pending moderation.`,
      relatedEntity: review._id,
      relatedEntityType: 'Review',
      metadata: {
        reviewId: review._id,
        showroomId: showroom._id,
        showroomName: showroom.name,
        rating
      }
    });
  } catch (notifErr) {
    // Non-blocking notification failure
  }

  return populated;
};

/**
 * Service: Retrieve paginated approved reviews for a showroom (public).
 * Includes rating aggregation: averageRating, totalReviews, distribution.
 *
 * @param {string} showroomId
 * @param {object} query
 * @param {number} [query.page=1]
 * @param {number} [query.limit=20]
 * @returns {Promise<{ data: Array, meta: object, aggregation: object }>}
 */
const getShowroomReviews = async (showroomId, { page = 1, limit = 20 } = {}) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {
    showroom: showroomId,
    status: REVIEW_STATUS.APPROVED
  };

  // Execute count, list, and aggregation concurrently for maximum throughput
  const [total, reviews, aggregationPipeline] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', USER_PUBLIC_PROJECTION)
      .select('-__v')
      .lean(),
    Review.aggregate([
      { $match: { showroom: require('mongoose').Types.ObjectId.createFromHexString(showroomId.toString()), status: REVIEW_STATUS.APPROVED } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          count1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          count2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          count3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          count4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          count5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }
        }
      }
    ])
  ]);

  const agg = aggregationPipeline[0] || null;
  const aggregation = agg
    ? {
        averageRating: Math.round(agg.averageRating * 10) / 10,
        totalReviews: agg.totalReviews,
        distribution: {
          '5': agg.count5,
          '4': agg.count4,
          '3': agg.count3,
          '2': agg.count2,
          '1': agg.count1
        }
      }
    : {
        averageRating: 0,
        totalReviews: 0,
        distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
      };

  return {
    data: reviews,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    },
    aggregation
  };
};

/**
 * Service: Retrieve paginated reviews owned by the authenticated customer.
 * @param {string} userId
 * @param {object} query
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getUserReviews = async (userId, { page = 1, limit = 20 } = {}) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = { user: userId };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('showroom', 'name slug address showroomType city isActive')
      .select('-__v')
      .lean(),
    Review.countDocuments(filter)
  ]);

  return {
    data: reviews,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Service: Retrieve a single review by ID.
 * Restricts access: only review owner or approved reviews are readable.
 *
 * @param {string} reviewId
 * @param {string|null} [requestingUserId] - null for unauthenticated
 * @returns {Promise<object>} Review document
 */
const getReviewById = async (reviewId, requestingUserId = null) => {
  assertDatabaseConnected();

  const review = await Review.findById(reviewId)
    .populate('user', USER_PUBLIC_PROJECTION)
    .populate('showroom', 'name slug address showroomType city isActive')
    .select('-__v')
    .lean();

  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  // Approved reviews are publicly readable; pending/rejected only by owner
  const isOwner = requestingUserId && review.user._id.toString() === requestingUserId.toString();
  if (review.status !== REVIEW_STATUS.APPROVED && !isOwner) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  return review;
};

/**
 * Service: Update the authenticated customer's own review.
 * Resets status to pending after edit (moderation workflow).
 *
 * @param {string} userId - From JWT
 * @param {string} reviewId
 * @param {object} payload - Validated update fields
 * @returns {Promise<object>} Updated populated review document
 */
const updateReview = async (userId, reviewId, payload) => {
  assertDatabaseConnected();

  const review = await Review.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  // Enforce ownership — 403 not 404 so we don't leak existence info to the wrong user
  // (but we do return 403 for UX clarity here since the route is owner-only)
  if (review.user.toString() !== userId.toString()) {
    const error = new Error('You are not authorized to modify this review');
    error.statusCode = 403;
    throw error;
  }

  // Permitted update fields only — user and showroom cannot change
  const { rating, title, comment } = payload;
  if (rating !== undefined) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;

  // Reset to pending so moderation can re-approve edited content
  review.status = REVIEW_STATUS.PENDING;

  await review.save();

  const populated = await Review.findById(review._id)
    .populate('user', USER_PUBLIC_PROJECTION)
    .populate('showroom', 'name slug address showroomType city isActive');

  return populated;
};

/**
 * Service: Delete the authenticated customer's own review.
 * @param {string} userId - From JWT
 * @param {string} reviewId
 * @returns {Promise<void>}
 */
const deleteReview = async (userId, reviewId) => {
  assertDatabaseConnected();

  const review = await Review.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  if (review.user.toString() !== userId.toString()) {
    const error = new Error('You are not authorized to delete this review');
    error.statusCode = 403;
    throw error;
  }

  await Review.deleteOne({ _id: review._id });
};

/**
 * Escapes regex special characters to prevent ReDoS and injection.
 * @param {string} string
 * @returns {string}
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const REVIEW_SORT_MAP = {
  newest: { createdAt: -1, _id: 1 },
  oldest: { createdAt: 1, _id: 1 },
  rating_high: { rating: -1, createdAt: -1, _id: 1 },
  rating_low: { rating: 1, createdAt: -1, _id: 1 },
  status: { status: 1, createdAt: -1, _id: 1 }
};

/**
 * Service: Retrieve paginated reviews for admin console with moderation filters.
 * @param {object} params
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getAdminReviews = async ({
  page = 1,
  limit = 20,
  status,
  rating,
  showroom,
  user,
  search,
  sort = 'newest'
} = {}) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (rating && rating !== 'all') {
    filter.rating = Number(rating);
  }

  if (showroom && showroom !== 'all') {
    filter.showroom = showroom;
  }

  if (user && user !== 'all') {
    filter.user = user;
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const sanitized = escapeRegex(search.trim());
    const searchRegex = new RegExp(sanitized, 'i');

    // Find users whose name or email matches the search term
    const matchedUsers = await User.find({
      $or: [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } }
      ]
    }).select('_id').lean();

    const matchedUserIds = matchedUsers.map((u) => u._id);

    filter.$or = [
      { title: { $regex: searchRegex } },
      { comment: { $regex: searchRegex } },
      { moderationNote: { $regex: searchRegex } }
    ];

    if (matchedUserIds.length > 0) {
      filter.$or.push({ user: { $in: matchedUserIds } });
    }
  }

  const sortCriteria = REVIEW_SORT_MAP[sort] || REVIEW_SORT_MAP.newest;

  const [data, total] = await Promise.all([
    Review.find(filter)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'name email phone role isActive')
      .populate('showroom', 'name slug dealerName address city showroomType isActive')
      .select('-__v')
      .lean(),
    Review.countDocuments(filter)
  ]);

  const pages = Math.ceil(total / limitNum) || 1;

  return {
    data,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      pages
    }
  };
};

/**
 * Service: Retrieve single review by ID with populated details for admin.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
const getAdminReviewById = async (id) => {
  assertDatabaseConnected();

  if (!id) return null;

  return Review.findById(id)
    .populate('user', 'name email phone role isActive createdAt')
    .populate('showroom', 'name slug dealerName address city showroomType contact openingHours isActive')
    .select('-__v')
    .lean();
};

/**
 * Service: Update review moderation status and optional note.
 * @param {string} id
 * @param {string} status
 * @param {string} [moderationNote]
 * @returns {Promise<object>}
 */
const updateReviewStatus = async (id, status, moderationNote) => {
  assertDatabaseConnected();

  const review = await Review.findById(id);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  review.status = status;
  if (moderationNote !== undefined) {
    review.moderationNote = moderationNote ? moderationNote.trim() : '';
  }

  await review.save();

  const populated = await Review.findById(id)
    .populate('user', 'name email phone role isActive')
    .populate('showroom', 'name slug dealerName address city showroomType isActive')
    .select('-__v')
    .lean();

  // Safely notify customer of moderation outcome
  try {
    const isApproved = status === REVIEW_STATUS.APPROVED;
    const isRejected = status === REVIEW_STATUS.REJECTED;
    const showroomTitle = populated.showroom?.name || 'Authorized Showroom';

    if (isApproved || isRejected) {
      await notificationService.createNotification({
        userId: review.user,
        type: NOTIFICATION_TYPES.REVIEW,
        title: isApproved ? 'Showroom Review Approved' : 'Showroom Review Moderation Update',
        message: isApproved
          ? `Your review for ${showroomTitle} has been approved and published.`
          : `Your review for ${showroomTitle} was not approved.${review.moderationNote ? ` Note: ${review.moderationNote}` : ''}`,
        relatedEntity: review._id,
        relatedEntityType: 'Review',
        metadata: {
          reviewId: review._id,
          showroomId: review.showroom,
          status,
          moderationNote: review.moderationNote
        }
      });
    }
  } catch (notifErr) {
    // Non-blocking notification failure
  }

  return populated;
};

module.exports = {
  createReview,
  getShowroomReviews,
  getUserReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getAdminReviews,
  getAdminReviewById,
  updateReviewStatus,
  escapeRegex,
  REVIEW_SORT_MAP
};
