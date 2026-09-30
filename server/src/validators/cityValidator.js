const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');

/**
 * Validates a string as a 24-character hexadecimal MongoDB ObjectId
 * @param {*} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
};

const ALLOWED_TIERS = ['Metro', 'Tier 1', 'Tier 2', 'Tier 3'];

/**
 * Validate City Query Parameters
 * GET /api/cities and GET /api/admin/cities
 */
const validateCityQuery = (req, res, next) => {
  const errors = [];
  const { page, limit, search, state, isActive } = req.query;

  // Prevent MongoDB operator injection in query params
  for (const key of Object.keys(req.query)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid query parameter '${key}': operators and path injections are forbidden.`);
    }
  }

  // Validate page
  if (page !== undefined) {
    if (typeof page !== 'string' && typeof page !== 'number') {
      errors.push("Query parameter 'page' must be a valid integer.");
    } else {
      const pageNum = Number(page);
      if (!Number.isInteger(pageNum) || pageNum < 1) {
        errors.push("Query parameter 'page' must be a positive integer greater than or equal to 1.");
      }
    }
  }

  // Validate limit
  if (limit !== undefined) {
    if (typeof limit !== 'string' && typeof limit !== 'number') {
      errors.push("Query parameter 'limit' must be a valid integer.");
    } else {
      const limitNum = Number(limit);
      if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push("Query parameter 'limit' must be a positive integer between 1 and 100.");
      }
    }
  }

  // Validate isActive boolean or 'all'
  if (isActive !== undefined) {
    const val = String(isActive).toLowerCase();
    if (val !== 'true' && val !== 'false' && val !== 'all') {
      errors.push("Query parameter 'isActive' must be 'true', 'false', or 'all'.");
    }
  }

  // Validate search string
  if (search !== undefined) {
    if (typeof search !== 'string') {
      errors.push("Query parameter 'search' must be a string.");
    } else if (search.trim().length > 100) {
      errors.push("Query parameter 'search' cannot exceed 100 characters.");
    } else {
      req.query.search = search.trim();
    }
  }

  // Validate state string
  if (state !== undefined) {
    if (typeof state !== 'string') {
      errors.push("Query parameter 'state' must be a string.");
    } else if (state.trim().length > 100) {
      errors.push("Query parameter 'state' cannot exceed 100 characters.");
    } else {
      req.query.state = state.trim();
    }
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for request parameters', errors, 400);
  }

  next();
};

/**
 * Validate City Slug Parameter
 * GET /api/cities/:slug
 */
const validateCitySlug = (req, res, next) => {
  const { slug } = req.params;

  if (!slug || typeof slug !== 'string') {
    return sendError(res, 'City slug parameter is required', ['Missing slug in request path'], 400);
  }

  const trimmedSlug = slug.trim();
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
  if (!slugRegex.test(trimmedSlug) || trimmedSlug.length > 120) {
    return sendError(
      res,
      'Invalid city slug format',
      ["Slug must contain only URL-safe alphanumeric characters and hyphens (e.g., 'mumbai')."],
      400
    );
  }

  req.params.slug = trimmedSlug.toLowerCase();
  next();
};

/**
 * Validate City ID Parameter
 * /api/admin/cities/:id
 */
const validateCityId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !isValidObjectId(id)) {
    return sendError(
      res,
      'Invalid city ID format',
      ['Parameter :id must be a 24-character hexadecimal MongoDB ObjectId.'],
      400
    );
  }

  next();
};

/**
 * Validate City Creation Payload
 * POST /api/admin/cities
 */
const validateCreateCity = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for city payload', ['Request body must be a JSON object.'], 400);
  }

  for (const key of Object.keys(req.body)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid field '${key}': operators and path injections are forbidden.`);
    }
  }

  const { name, slug, state, country, tier, coordinates, isActive } = req.body;

  // Name validation
  if (name === undefined || name === null || typeof name !== 'string') {
    errors.push("Field 'name' is required.");
  } else {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      errors.push("City name must be at least 2 characters long.");
    } else if (trimmed.length > 100) {
      errors.push("City name cannot exceed 100 characters.");
    } else {
      req.body.name = trimmed;
    }
  }

  // Slug validation
  if (slug === undefined || slug === null || typeof slug !== 'string') {
    errors.push("Field 'slug' is required.");
  } else {
    const trimmedSlug = slug.trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(trimmedSlug)) {
      errors.push("Slug must contain only lowercase URL-safe alphanumeric characters and single hyphens.");
    } else if (trimmedSlug.length < 2 || trimmedSlug.length > 120) {
      errors.push("Slug must be between 2 and 120 characters long.");
    } else {
      req.body.slug = trimmedSlug;
    }
  }

  // State validation
  if (state === undefined || state === null || typeof state !== 'string') {
    errors.push("Field 'state' is required.");
  } else {
    const trimmedState = state.trim();
    if (trimmedState.length < 2) {
      errors.push("State name must be at least 2 characters long.");
    } else if (trimmedState.length > 100) {
      errors.push("State name cannot exceed 100 characters.");
    } else {
      req.body.state = trimmedState;
    }
  }

  // Optional country
  if (country !== undefined && country !== null) {
    if (typeof country !== 'string') {
      errors.push("Field 'country' must be a string.");
    } else {
      req.body.country = country.trim();
    }
  }

  // Optional tier
  if (tier !== undefined && tier !== null) {
    if (!ALLOWED_TIERS.includes(tier)) {
      errors.push(`Field 'tier' must be one of: ${ALLOWED_TIERS.join(', ')}.`);
    }
  }

  // Optional coordinates
  if (coordinates !== undefined && coordinates !== null) {
    if (typeof coordinates !== 'object' || Array.isArray(coordinates)) {
      errors.push("Field 'coordinates' must be an object with latitude and longitude.");
    } else {
      const { latitude, longitude } = coordinates;
      if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
        errors.push("Latitude must be a number between -90 and 90.");
      }
      if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
        errors.push("Longitude must be a number between -180 and 180.");
      }
    }
  }

  // Optional isActive
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push("Field 'isActive' must be a boolean.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for city payload', errors, 400);
  }

  next();
};

/**
 * Validate City Update Payload
 * PUT /api/admin/cities/:id
 */
const validateUpdateCity = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for city update', ['Request body must be a JSON object.'], 400);
  }

  for (const key of Object.keys(req.body)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid field '${key}': operators and path injections are forbidden.`);
    }
  }

  const { name, slug, state, country, tier, coordinates, isActive } = req.body;

  const providedFields = [name, slug, state, country, tier, coordinates, isActive].filter((v) => v !== undefined);
  if (providedFields.length === 0) {
    return sendError(res, 'Validation failed for city update', ['At least one field must be provided to update.'], 400);
  }

  if (name !== undefined) {
    if (typeof name !== 'string') {
      errors.push("Field 'name' must be a string.");
    } else {
      const trimmed = name.trim();
      if (trimmed.length < 2 || trimmed.length > 100) {
        errors.push("City name must be between 2 and 100 characters long.");
      } else {
        req.body.name = trimmed;
      }
    }
  }

  if (slug !== undefined) {
    if (typeof slug !== 'string') {
      errors.push("Field 'slug' must be a string.");
    } else {
      const trimmedSlug = slug.trim().toLowerCase();
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(trimmedSlug)) {
        errors.push("Slug must contain only lowercase URL-safe alphanumeric characters and single hyphens.");
      } else if (trimmedSlug.length < 2 || trimmedSlug.length > 120) {
        errors.push("Slug must be between 2 and 120 characters long.");
      } else {
        req.body.slug = trimmedSlug;
      }
    }
  }

  if (state !== undefined) {
    if (typeof state !== 'string') {
      errors.push("Field 'state' must be a string.");
    } else {
      const trimmed = state.trim();
      if (trimmed.length < 2 || trimmed.length > 100) {
        errors.push("State name must be between 2 and 100 characters long.");
      } else {
        req.body.state = trimmed;
      }
    }
  }

  if (country !== undefined && country !== null) {
    if (typeof country !== 'string') {
      errors.push("Field 'country' must be a string.");
    } else {
      req.body.country = country.trim();
    }
  }

  if (tier !== undefined && tier !== null) {
    if (!ALLOWED_TIERS.includes(tier)) {
      errors.push(`Field 'tier' must be one of: ${ALLOWED_TIERS.join(', ')}.`);
    }
  }

  if (coordinates !== undefined && coordinates !== null) {
    if (typeof coordinates !== 'object' || Array.isArray(coordinates)) {
      errors.push("Field 'coordinates' must be an object with latitude and longitude.");
    } else {
      const { latitude, longitude } = coordinates;
      if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
        errors.push("Latitude must be a number between -90 and 90.");
      }
      if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
        errors.push("Longitude must be a number between -180 and 180.");
      }
    }
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push("Field 'isActive' must be a boolean.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for city update', errors, 400);
  }

  next();
};

/**
 * Validate City Status Payload
 * PATCH /api/admin/cities/:id/status
 */
const validateCityStatus = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for city status', ['Request body must be a JSON object.'], 400);
  }

  const { isActive } = req.body;
  if (isActive === undefined || typeof isActive !== 'boolean') {
    return sendError(
      res,
      'Validation failed for city status',
      ["Field 'isActive' is required and must be a boolean (true or false)."],
      400
    );
  }

  next();
};

module.exports = {
  validateCityQuery,
  validateCitySlug,
  validateCityId,
  validateCreateCity,
  validateUpdateCity,
  validateCityStatus,
  isValidObjectId,
  ALLOWED_TIERS
};
