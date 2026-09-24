const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');
const { ALLOWED_OFFER_TYPES } = require('../constants/offers');

/**
 * Validates a string as a 24-character hexadecimal MongoDB ObjectId
 * @param {*} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware: Validate Offer Creation / Update Input Payload
 */
const validateCreateOffer = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(
      res,
      'Validation failed for offer input',
      ['Request body must be a valid JSON object.'],
      400
    );
  }

  // Prevent MongoDB operator injection in body keys
  for (const key of Object.keys(req.body)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid field '${key}': operators and path injection are forbidden.`);
    }
  }

  const {
    title,
    description,
    bike,
    variant,
    showroom,
    offerType,
    discountValue,
    benefits,
    terms,
    validFrom,
    validUntil,
    isActive
  } = req.body;

  // Validate title
  if (title === undefined || title === null || typeof title !== 'string') {
    errors.push("Field 'title' is required.");
  } else {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      errors.push("Title must be at least 3 characters long.");
    } else if (trimmedTitle.length > 120) {
      errors.push("Title cannot exceed 120 characters.");
    } else {
      req.body.title = trimmedTitle;
    }
  }

  // Validate description
  if (description === undefined || description === null || typeof description !== 'string') {
    errors.push("Field 'description' is required.");
  } else {
    const trimmedDesc = description.trim();
    if (trimmedDesc.length < 5) {
      errors.push("Description must be at least 5 characters long.");
    } else if (trimmedDesc.length > 1000) {
      errors.push("Description cannot exceed 1000 characters.");
    } else {
      req.body.description = trimmedDesc;
    }
  }

  // Validate bike reference
  if (bike === undefined || bike === null || bike === '') {
    errors.push("Field 'bike' is required.");
  } else if (!isValidObjectId(String(bike).trim())) {
    errors.push("Field 'bike' must be a valid MongoDB ObjectId.");
  } else {
    req.body.bike = String(bike).trim();
  }

  // Validate optional variant reference
  if (variant !== undefined && variant !== null && variant !== '') {
    if (!isValidObjectId(String(variant).trim())) {
      errors.push("Field 'variant' must be a valid MongoDB ObjectId.");
    } else {
      req.body.variant = String(variant).trim();
    }
  } else {
    req.body.variant = null;
  }

  // Validate optional showroom reference
  if (showroom !== undefined && showroom !== null && showroom !== '') {
    if (!isValidObjectId(String(showroom).trim())) {
      errors.push("Field 'showroom' must be a valid MongoDB ObjectId.");
    } else {
      req.body.showroom = String(showroom).trim();
    }
  } else {
    req.body.showroom = null;
  }

  // Validate offerType
  if (offerType === undefined || offerType === null || offerType === '') {
    errors.push("Field 'offerType' is required.");
  } else if (!ALLOWED_OFFER_TYPES.includes(offerType)) {
    errors.push(`Field 'offerType' must be one of: ${ALLOWED_OFFER_TYPES.join(', ')}.`);
  }

  // Validate discountValue
  if (discountValue !== undefined && discountValue !== null) {
    const num = Number(discountValue);
    if (isNaN(num) || num < 0) {
      errors.push("Field 'discountValue' must be a non-negative number.");
    } else {
      req.body.discountValue = num;
    }
  }

  // Validate dates
  let parsedFrom = new Date();
  if (validFrom !== undefined && validFrom !== null && validFrom !== '') {
    parsedFrom = new Date(validFrom);
    if (isNaN(parsedFrom.getTime())) {
      errors.push("Field 'validFrom' must be a valid date.");
    } else {
      req.body.validFrom = parsedFrom;
    }
  }

  if (validUntil === undefined || validUntil === null || validUntil === '') {
    errors.push("Field 'validUntil' is required.");
  } else {
    const parsedUntil = new Date(validUntil);
    if (isNaN(parsedUntil.getTime())) {
      errors.push("Field 'validUntil' must be a valid date.");
    } else {
      req.body.validUntil = parsedUntil;
      if (!isNaN(parsedFrom.getTime()) && parsedUntil < parsedFrom) {
        errors.push("Field 'validUntil' cannot be earlier than 'validFrom'.");
      }
    }
  }

  // Validate isActive
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push("Field 'isActive' must be a boolean.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for offer input', errors, 400);
  }

  next();
};

/**
 * Middleware: Validate Query Parameters for Listing Offers
 * GET /api/offers
 */
const validateGetOffers = (req, res, next) => {
  const errors = [];

  for (const key of Object.keys(req.query)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid query parameter '${key}': operators and path injection are forbidden.`);
    }
  }

  const { bike, showroom, offerType, page, limit, active } = req.query;

  if (bike && !isValidObjectId(bike)) {
    errors.push("Query parameter 'bike' must be a valid MongoDB ObjectId.");
  }

  if (showroom && !isValidObjectId(showroom)) {
    errors.push("Query parameter 'showroom' must be a valid MongoDB ObjectId.");
  }

  if (offerType && !ALLOWED_OFFER_TYPES.includes(offerType)) {
    errors.push(`Query parameter 'offerType' must be one of: ${ALLOWED_OFFER_TYPES.join(', ')}.`);
  }

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push("Query parameter 'page' must be a positive integer.");
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push("Query parameter 'limit' must be an integer between 1 and 100.");
    }
  }

  if (active !== undefined && !['true', 'false', 'all'].includes(String(active).toLowerCase())) {
    errors.push("Query parameter 'active' must be 'true', 'false', or 'all'.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Invalid query parameters for offers', errors, 400);
  }

  next();
};

module.exports = {
  validateCreateOffer,
  validateGetOffers,
  isValidObjectId
};
