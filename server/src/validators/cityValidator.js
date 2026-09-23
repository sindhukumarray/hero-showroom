const { sendError } = require('../utils/apiResponse');

/**
 * Validate City Query Parameters
 * GET /api/cities
 */
const validateCityQuery = (req, res, next) => {
  const errors = [];
  const { page, limit, search, state, isActive } = req.query;

  // Prevent MongoDB operator injection in query params
  for (const key of Object.keys(req.query)) {
    if (key.startsWith('$')) {
      errors.push(`Invalid query parameter '${key}': operators are forbidden.`);
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

  // Validate isActive boolean
  if (isActive !== undefined) {
    if (typeof isActive !== 'string' || (isActive !== 'true' && isActive !== 'false')) {
      errors.push("Query parameter 'isActive' must be a boolean ('true' or 'false').");
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
  // Safe slug: alphanumeric with single hyphens, 1-120 chars
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

module.exports = {
  validateCityQuery,
  validateCitySlug
};
