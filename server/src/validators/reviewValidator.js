const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');
const { REVIEW_RATING } = require('../constants/reviews');

/**
 * Validates a 24-character hexadecimal MongoDB ObjectId
 * @param {*} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
};

/**
 * Strip dangerous fields and enforce security constraints common to create/update.
 * Mutates req.body in place.
 * @param {object} body - req.body
 * @param {string[]} errors - mutable errors array
 */
const enforceSecurityConstraints = (body, errors) => {
  // Reject MongoDB operator injection in body keys
  for (const key of Object.keys(body)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid field '${key}': operators and path injection are forbidden.`);
    }
  }

  // Security: Strip client-provided user identity — always derived from JWT
  if (body.user !== undefined) {
    delete body.user;
  }
  if (body.userId !== undefined) {
    delete body.userId;
  }

  // Security: Clients must NOT control moderation status or notes
  if (body.status !== undefined) {
    delete body.status;
  }
  if (body.moderationNote !== undefined) {
    delete body.moderationNote;
  }
};

/**
 * Middleware: Validate Review Creation Payload
 * POST /api/reviews
 */
const validateCreateReview = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(
      res,
      'Validation failed for review creation input',
      ['Request body must be a valid JSON object.'],
      400
    );
  }

  enforceSecurityConstraints(req.body, errors);

  const { showroom, rating, title, comment } = req.body;

  // Validate showroom ObjectId (required on create)
  if (!showroom || typeof showroom !== 'string') {
    errors.push("Field 'showroom' is required.");
  } else if (!isValidObjectId(showroom.trim())) {
    errors.push("Field 'showroom' must be a valid MongoDB ObjectId.");
  } else {
    req.body.showroom = showroom.trim();
  }

  // Validate rating
  if (rating === undefined || rating === null || rating === '') {
    errors.push("Field 'rating' is required.");
  } else {
    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum)) {
      errors.push("Field 'rating' must be a number.");
    } else if (!Number.isInteger(ratingNum)) {
      errors.push("Field 'rating' must be a whole number (1-5).");
    } else if (ratingNum < REVIEW_RATING.MIN) {
      errors.push(`Field 'rating' must be at least ${REVIEW_RATING.MIN}.`);
    } else if (ratingNum > REVIEW_RATING.MAX) {
      errors.push(`Field 'rating' cannot exceed ${REVIEW_RATING.MAX}.`);
    } else {
      req.body.rating = ratingNum;
    }
  }

  // Validate optional title
  if (title !== undefined && title !== null && title !== '') {
    if (typeof title !== 'string') {
      errors.push("Field 'title' must be a string.");
    } else {
      const trimmedTitle = title.trim();
      if (trimmedTitle.length > 100) {
        errors.push("Review title cannot exceed 100 characters.");
      } else {
        req.body.title = trimmedTitle;
      }
    }
  } else {
    req.body.title = '';
  }

  // Validate optional comment
  if (comment !== undefined && comment !== null && comment !== '') {
    if (typeof comment !== 'string') {
      errors.push("Field 'comment' must be a string.");
    } else {
      const trimmedComment = comment.trim();
      if (trimmedComment.length < 5) {
        errors.push("Review comment must be at least 5 characters if provided.");
      } else if (trimmedComment.length > 1000) {
        errors.push("Review comment cannot exceed 1000 characters.");
      } else {
        req.body.comment = trimmedComment;
      }
    }
  } else {
    req.body.comment = '';
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for review creation input', errors, 400);
  }

  next();
};

/**
 * Middleware: Validate Review Update Payload
 * PUT /api/reviews/:id
 */
const validateUpdateReview = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(
      res,
      'Validation failed for review update input',
      ['Request body must be a valid JSON object.'],
      400
    );
  }

  enforceSecurityConstraints(req.body, errors);

  // Cannot change showroom on update
  if (req.body.showroom !== undefined) {
    delete req.body.showroom;
  }

  const { rating, title, comment } = req.body;

  // Validate rating if provided
  if (rating !== undefined && rating !== null && rating !== '') {
    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum)) {
      errors.push("Field 'rating' must be a number.");
    } else if (!Number.isInteger(ratingNum)) {
      errors.push("Field 'rating' must be a whole number (1-5).");
    } else if (ratingNum < REVIEW_RATING.MIN) {
      errors.push(`Field 'rating' must be at least ${REVIEW_RATING.MIN}.`);
    } else if (ratingNum > REVIEW_RATING.MAX) {
      errors.push(`Field 'rating' cannot exceed ${REVIEW_RATING.MAX}.`);
    } else {
      req.body.rating = ratingNum;
    }
  }

  // Validate optional title
  if (title !== undefined && title !== null && title !== '') {
    if (typeof title !== 'string') {
      errors.push("Field 'title' must be a string.");
    } else {
      const trimmedTitle = title.trim();
      if (trimmedTitle.length > 100) {
        errors.push("Review title cannot exceed 100 characters.");
      } else {
        req.body.title = trimmedTitle;
      }
    }
  } else if (title === '') {
    req.body.title = '';
  }

  // Validate optional comment
  if (comment !== undefined && comment !== null && comment !== '') {
    if (typeof comment !== 'string') {
      errors.push("Field 'comment' must be a string.");
    } else {
      const trimmedComment = comment.trim();
      if (trimmedComment.length < 5) {
        errors.push("Review comment must be at least 5 characters if provided.");
      } else if (trimmedComment.length > 1000) {
        errors.push("Review comment cannot exceed 1000 characters.");
      } else {
        req.body.comment = trimmedComment;
      }
    }
  } else if (comment === '') {
    req.body.comment = '';
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for review update input', errors, 400);
  }

  next();
};

const ALLOWED_ADMIN_REVIEW_SORTS = ['newest', 'oldest', 'rating_high', 'rating_low', 'status'];

/**
 * Middleware: Validate Admin Review Query Parameters
 * GET /api/admin/reviews
 */
const validateAdminReviewQuery = (req, res, next) => {
  const errors = [];
  const { page, limit, status, rating, showroom, user, search, sort } = req.query;

  // Prevent MongoDB operator and path injection
  for (const key of Object.keys(req.query)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid query parameter '${key}': operators and path injection are forbidden.`);
    }
  }

  // Validate page
  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push("Query parameter 'page' must be a positive integer greater than or equal to 1.");
    }
  }

  // Validate limit
  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push("Query parameter 'limit' must be a positive integer between 1 and 100.");
    }
  }

  // Validate status enum
  const { ALLOWED_REVIEW_STATUS } = require('../constants/reviews');
  if (status !== undefined && status !== '' && status !== 'all') {
    if (!ALLOWED_REVIEW_STATUS.includes(status)) {
      errors.push(`Query parameter 'status' must be one of: ${ALLOWED_REVIEW_STATUS.join(', ')} or 'all'.`);
    }
  }

  // Validate rating
  if (rating !== undefined && rating !== '' && rating !== 'all') {
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < REVIEW_RATING.MIN || ratingNum > REVIEW_RATING.MAX) {
      errors.push(`Query parameter 'rating' must be a whole number between ${REVIEW_RATING.MIN} and ${REVIEW_RATING.MAX} or 'all'.`);
    }
  }

  // Validate showroom ObjectId
  if (showroom !== undefined && showroom !== '' && showroom !== 'all') {
    if (!isValidObjectId(showroom)) {
      errors.push("Query parameter 'showroom' must be a valid 24-character hexadecimal MongoDB ObjectId.");
    }
  }

  // Validate user ObjectId
  if (user !== undefined && user !== '' && user !== 'all') {
    if (!isValidObjectId(user)) {
      errors.push("Query parameter 'user' must be a valid 24-character hexadecimal MongoDB ObjectId.");
    }
  }

  // Validate sort
  if (sort !== undefined && sort !== '') {
    if (!ALLOWED_ADMIN_REVIEW_SORTS.includes(sort)) {
      errors.push(`Query parameter 'sort' must be one of: ${ALLOWED_ADMIN_REVIEW_SORTS.join(', ')}.`);
    }
  }

  // Validate search
  if (search !== undefined && search !== '') {
    if (typeof search !== 'string') {
      errors.push("Query parameter 'search' must be a string.");
    } else if (search.trim().length > 100) {
      errors.push("Query parameter 'search' cannot exceed 100 characters.");
    } else {
      req.query.search = search.trim();
    }
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for request parameters', errors, 400);
  }

  next();
};

/**
 * Middleware: Validate Review ID Parameter
 * /api/admin/reviews/:id
 */
const validateReviewId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !isValidObjectId(id)) {
    return sendError(
      res,
      'Invalid review ID format',
      ['Parameter :id must be a 24-character hexadecimal MongoDB ObjectId.'],
      400
    );
  }

  next();
};

/**
 * Middleware: Validate Review Moderation Status Update Payload
 * PATCH /api/admin/reviews/:id/status
 */
const validateReviewStatus = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for review status', ['Request body must be a JSON object.'], 400);
  }

  // Prevent MongoDB operator injection
  for (const key of Object.keys(req.body)) {
    if (key.startsWith('$') || key.includes('.')) {
      return sendError(res, 'Invalid field: operators and path injection are forbidden.', [], 400);
    }
  }

  const { status, moderationNote } = req.body;
  if (!status || typeof status !== 'string') {
    return sendError(res, 'Validation failed for review status', ["Field 'status' is required and must be a string."], 400);
  }

  const { ALLOWED_REVIEW_STATUS } = require('../constants/reviews');
  const normalizedStatus = status.trim().toLowerCase();
  if (!ALLOWED_REVIEW_STATUS.includes(normalizedStatus)) {
    return sendError(
      res,
      'Invalid review status value',
      [`Status must be one of: ${ALLOWED_REVIEW_STATUS.join(', ')}.`],
      400
    );
  }

  req.body.status = normalizedStatus;

  if (moderationNote !== undefined && moderationNote !== null) {
    if (typeof moderationNote !== 'string') {
      return sendError(res, 'Validation failed for review moderation', ["Field 'moderationNote' must be a string."], 400);
    }
    if (moderationNote.trim().length > 500) {
      return sendError(res, 'Validation failed for review moderation', ['Moderation note cannot exceed 500 characters.'], 400);
    }
    req.body.moderationNote = moderationNote.trim();
  }

  next();
};

module.exports = {
  validateCreateReview,
  validateUpdateReview,
  validateAdminReviewQuery,
  validateReviewId,
  validateReviewStatus,
  isValidObjectId,
  ALLOWED_ADMIN_REVIEW_SORTS
};
