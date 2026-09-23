const { sendError } = require('../utils/apiResponse');

const ALLOWED_VARIANT_SORTS = ['priceLow', 'priceHigh', 'nameAsc', 'nameDesc', 'newest'];

/**
 * Checks for MongoDB operator injection in query parameters.
 * @param {object} query
 * @param {Array<string>} errors
 */
const checkOperatorInjection = (query, errors) => {
  for (const key of Object.keys(query)) {
    if (key.startsWith('$')) {
      errors.push(`Invalid query parameter '${key}': operators are forbidden.`);
    }
  }
};

/**
 * Middleware: Validate Bike Variant Query Parameters
 * GET /api/bikes/:slug/variants
 */
const validateBikeVariantQuery = (req, res, next) => {
  const errors = [];
  const { page, limit, minPrice, maxPrice, isActive, sort } = req.query;
  const { slug } = req.params;

  checkOperatorInjection(req.query, errors);

  // Validate parent bike slug in path
  if (!slug || typeof slug !== 'string') {
    errors.push('Parent bike slug parameter is required.');
  } else {
    const trimmedSlug = slug.trim();
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
    if (!slugRegex.test(trimmedSlug) || trimmedSlug.length > 120) {
      errors.push("Invalid parent bike slug format. Must contain only URL-safe alphanumeric characters and hyphens.");
    } else {
      req.params.slug = trimmedSlug.toLowerCase();
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

  // Validate minPrice and maxPrice numbers
  let minPriceNum;
  let maxPriceNum;

  if (minPrice !== undefined) {
    minPriceNum = Number(minPrice);
    if (isNaN(minPriceNum) || !isFinite(minPriceNum) || minPriceNum < 0) {
      errors.push("Query parameter 'minPrice' must be a valid non-negative finite number.");
    }
  }

  if (maxPrice !== undefined) {
    maxPriceNum = Number(maxPrice);
    if (isNaN(maxPriceNum) || !isFinite(maxPriceNum) || maxPriceNum < 0) {
      errors.push("Query parameter 'maxPrice' must be a valid non-negative finite number.");
    }
  }

  if (
    minPriceNum !== undefined &&
    maxPriceNum !== undefined &&
    !isNaN(minPriceNum) &&
    !isNaN(maxPriceNum) &&
    minPriceNum > maxPriceNum
  ) {
    errors.push("Query parameter 'minPrice' cannot be greater than 'maxPrice'.");
  }

  // Validate isActive boolean
  if (isActive !== undefined) {
    if (typeof isActive !== 'string' || (isActive !== 'true' && isActive !== 'false')) {
      errors.push("Query parameter 'isActive' must be a boolean ('true' or 'false').");
    }
  }

  // Validate sort whitelist
  if (sort !== undefined) {
    if (typeof sort !== 'string' || !ALLOWED_VARIANT_SORTS.includes(sort)) {
      errors.push(
        `Query parameter 'sort' must be one of: ${ALLOWED_VARIANT_SORTS.map((s) => `'${s}'`).join(', ')}.`
      );
    }
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for request parameters', errors, 400);
  }

  next();
};

module.exports = {
  validateBikeVariantQuery,
  ALLOWED_VARIANT_SORTS
};
