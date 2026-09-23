const { sendError } = require('../utils/apiResponse');

const ALLOWED_CATEGORIES = [
  'Commuter',
  'Sport',
  'Cruiser',
  'Tourer',
  'Adventure',
  'Scooter',
  'Electric'
];

const ALLOWED_FUEL_TYPES = ['Petrol', 'Electric', 'Hybrid'];

const ALLOWED_SORTS = ['nameAsc', 'nameDesc', 'priceLow', 'priceHigh', 'newest'];

/**
 * Validates a 24-character hexadecimal MongoDB ObjectId string.
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

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
 * Middleware: Validate Bike Query Parameters
 * GET /api/bikes
 */
const validateBikeQuery = (req, res, next) => {
  const errors = [];
  const {
    page,
    limit,
    search,
    brand,
    category,
    fuelType,
    transmission,
    minPrice,
    maxPrice,
    isActive,
    sort
  } = req.query;

  checkOperatorInjection(req.query, errors);

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

  // Validate brand ObjectId
  if (brand !== undefined) {
    if (!isValidObjectId(brand)) {
      errors.push("Query parameter 'brand' must be a valid 24-character hex MongoDB ObjectId.");
    }
  }

  // Validate category enum
  if (category !== undefined) {
    if (typeof category !== 'string' || !ALLOWED_CATEGORIES.includes(category)) {
      errors.push(
        `Query parameter 'category' must be one of: ${ALLOWED_CATEGORIES.map((c) => `'${c}'`).join(', ')}.`
      );
    }
  }

  // Validate fuelType enum
  if (fuelType !== undefined) {
    if (typeof fuelType !== 'string' || !ALLOWED_FUEL_TYPES.includes(fuelType)) {
      errors.push(
        `Query parameter 'fuelType' must be one of: ${ALLOWED_FUEL_TYPES.map((f) => `'${f}'`).join(', ')}.`
      );
    }
  }

  // Validate transmission string
  if (transmission !== undefined) {
    if (typeof transmission !== 'string' || transmission.trim().length > 50) {
      errors.push("Query parameter 'transmission' must be a string up to 50 characters.");
    } else {
      req.query.transmission = transmission.trim();
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
    if (typeof sort !== 'string' || !ALLOWED_SORTS.includes(sort)) {
      errors.push(`Query parameter 'sort' must be one of: ${ALLOWED_SORTS.map((s) => `'${s}'`).join(', ')}.`);
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

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for request parameters', errors, 400);
  }

  next();
};

/**
 * Middleware: Validate Bike Slug Parameter
 * GET /api/bikes/:slug
 */
const validateBikeSlug = (req, res, next) => {
  const { slug } = req.params;

  if (!slug || typeof slug !== 'string') {
    return sendError(res, 'Bike slug parameter is required', ['Missing slug in request path'], 400);
  }

  const trimmedSlug = slug.trim();
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

  if (!slugRegex.test(trimmedSlug) || trimmedSlug.length > 120) {
    return sendError(
      res,
      'Invalid bike slug format',
      ["Slug must contain only URL-safe alphanumeric characters and hyphens (e.g., 'hero-splendor-plus')."],
      400
    );
  }

  req.params.slug = trimmedSlug.toLowerCase();
  next();
};

module.exports = {
  validateBikeQuery,
  validateBikeSlug,
  ALLOWED_CATEGORIES,
  ALLOWED_FUEL_TYPES,
  ALLOWED_SORTS,
  isValidObjectId
};
