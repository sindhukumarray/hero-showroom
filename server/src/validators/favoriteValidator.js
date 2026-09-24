const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');
const { ALLOWED_FAVORITE_TYPES } = require('../constants/favorites');

/**
 * Validates a 24-character hexadecimal MongoDB ObjectId
 * @param {*} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware: Validate Toggle Favorite Request Payload
 * POST /api/favorites/toggle
 */
const validateToggleFavorite = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(
      res,
      'Validation failed for favorite toggle input',
      ['Request body must be a valid JSON object.'],
      400
    );
  }

  // Prevent MongoDB operator injection
  for (const key of Object.keys(req.body)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid field '${key}': operators and path injection are forbidden.`);
    }
  }

  // Security: Ignore client-supplied user identity — always derived from JWT
  if (req.body.user !== undefined) {
    delete req.body.user;
  }
  if (req.body.userId !== undefined) {
    delete req.body.userId;
  }

  const { entityType, entityId } = req.body;

  // Validate entityType
  if (!entityType || typeof entityType !== 'string') {
    errors.push("Field 'entityType' is required.");
  } else if (!ALLOWED_FAVORITE_TYPES.includes(entityType.trim())) {
    errors.push(`Field 'entityType' must be one of: ${ALLOWED_FAVORITE_TYPES.join(', ')}.`);
  } else {
    req.body.entityType = entityType.trim();
  }

  // Validate entityId
  if (!entityId || typeof entityId !== 'string') {
    errors.push("Field 'entityId' is required.");
  } else if (!isValidObjectId(entityId.trim())) {
    errors.push("Field 'entityId' must be a valid MongoDB ObjectId.");
  } else {
    req.body.entityId = entityId.trim();
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for favorite toggle input', errors, 400);
  }

  next();
};

module.exports = {
  validateToggleFavorite,
  isValidObjectId
};
