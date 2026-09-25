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

module.exports = {
  validateCreateReview,
  validateUpdateReview,
  isValidObjectId
};
