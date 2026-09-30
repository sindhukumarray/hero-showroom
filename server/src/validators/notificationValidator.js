const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');
const { ALLOWED_NOTIFICATION_TYPES } = require('../constants/notifications');

/**
 * Validates a 24-character hexadecimal MongoDB ObjectId
 * @param {*} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware: Validate Notification ID route parameter (:id)
 */
const validateNotificationId = (req, res, next) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !isValidObjectId(id.trim())) {
    return sendError(
      res,
      'Invalid notification ID format',
      ["'id' must be a valid 24-character hexadecimal MongoDB ObjectId."],
      400
    );
  }

  req.params.id = id.trim();
  next();
};

/**
 * Middleware: Validate Notification Query Parameters
 * GET /api/notifications?page=1&limit=20&isRead=false&type=LEAD
 */
const validateNotificationQuery = (req, res, next) => {
  const errors = [];
  const { page, limit, isRead, type } = req.query;

  // Prevent MongoDB query injection in query parameters
  for (const key of Object.keys(req.query)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid query parameter '${key}': operators and path injection are forbidden.`);
    }
  }

  // Validate page
  if (page !== undefined && page !== null && page !== '') {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push("Query parameter 'page' must be a positive whole number (>= 1).");
    }
  }

  // Validate limit
  if (limit !== undefined && limit !== null && limit !== '') {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1) {
      errors.push("Query parameter 'limit' must be a positive whole number (>= 1).");
    } else if (limitNum > 100) {
      errors.push("Query parameter 'limit' cannot exceed 100.");
    }
  }

  // Validate isRead
  if (isRead !== undefined && isRead !== null && isRead !== '') {
    const isReadLower = String(isRead).toLowerCase().trim();
    if (isReadLower !== 'true' && isReadLower !== 'false') {
      errors.push("Query parameter 'isRead' must be either 'true' or 'false'.");
    }
  }

  // Validate type
  if (type !== undefined && type !== null && type !== '') {
    const normalizedType = String(type).trim().toUpperCase();
    if (!ALLOWED_NOTIFICATION_TYPES.includes(normalizedType)) {
      errors.push(
        `Query parameter 'type' must be one of: ${ALLOWED_NOTIFICATION_TYPES.join(', ')}.`
      );
    } else {
      req.query.type = normalizedType;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for notification query parameters', errors, 400);
  }

  next();
};

module.exports = {
  isValidObjectId,
  validateNotificationId,
  validateNotificationQuery
};
