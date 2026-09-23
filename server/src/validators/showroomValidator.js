const { sendError } = require('../utils/apiResponse');

const ALLOWED_SHOWROOM_TYPES = [
  'Standard Dealership',
  'Premia Flagship',
  'Experience Center',
  'Service Hub'
];

const ALLOWED_SORTS = ['nameAsc', 'nameDesc', 'ratingDesc', 'newest'];

/**
 * Validates a 24-character hexadecimal MongoDB ObjectId string.
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Check for MongoDB operator injection and non-primitive query values.
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
 * Middleware: Validate Showroom Collection Query Parameters
 * GET /api/showrooms
 */
const validateShowroomQuery = (req, res, next) => {
  const errors = [];
  const { page, limit, search, brand, city, showroomType, isActive, sort } = req.query;

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

  // Validate city ObjectId
  if (city !== undefined) {
    if (!isValidObjectId(city)) {
      errors.push("Query parameter 'city' must be a valid 24-character hex MongoDB ObjectId.");
    }
  }

  // Validate showroomType
  if (showroomType !== undefined) {
    if (typeof showroomType !== 'string' || !ALLOWED_SHOWROOM_TYPES.includes(showroomType)) {
      errors.push(
        `Query parameter 'showroomType' must be one of: ${ALLOWED_SHOWROOM_TYPES.map((t) => `'${t}'`).join(', ')}.`
      );
    }
  }

  // Validate isActive
  if (isActive !== undefined) {
    if (typeof isActive !== 'string' || (isActive !== 'true' && isActive !== 'false')) {
      errors.push("Query parameter 'isActive' must be a boolean ('true' or 'false').");
    }
  }

  // Validate sort
  if (sort !== undefined) {
    if (typeof sort !== 'string' || !ALLOWED_SORTS.includes(sort)) {
      errors.push(`Query parameter 'sort' must be one of: ${ALLOWED_SORTS.map((s) => `'${s}'`).join(', ')}.`);
    }
  }

  // Validate search
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
 * Middleware: Validate Showroom Slug Parameter
 * GET /api/showrooms/:slug
 */
const validateShowroomSlug = (req, res, next) => {
  const { slug } = req.params;

  if (!slug || typeof slug !== 'string') {
    return sendError(res, 'Showroom slug parameter is required', ['Missing slug in request path'], 400);
  }

  const trimmedSlug = slug.trim();
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

  if (!slugRegex.test(trimmedSlug) || trimmedSlug.length > 120) {
    return sendError(
      res,
      'Invalid showroom slug format',
      ["Slug must contain only URL-safe alphanumeric characters and hyphens (e.g., 'hero-mumbai-south')."],
      400
    );
  }

  req.params.slug = trimmedSlug.toLowerCase();
  next();
};

/**
 * Middleware: Validate Nearby Showrooms Geospatial Query Parameters
 * GET /api/showrooms/nearby
 */
const validateNearbyQuery = (req, res, next) => {
  const errors = [];
  const { lat, lng, maxDistance, limit, brand, showroomType, isActive } = req.query;

  checkOperatorInjection(req.query, errors);

  // Validate latitude
  if (lat === undefined || lat === '') {
    errors.push("Query parameter 'lat' (latitude) is required.");
  } else {
    const latNum = Number(lat);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.push("Query parameter 'lat' must be a valid number between -90 and 90.");
    }
  }

  // Validate longitude
  if (lng === undefined || lng === '') {
    errors.push("Query parameter 'lng' (longitude) is required.");
  } else {
    const lngNum = Number(lng);
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errors.push("Query parameter 'lng' must be a valid number between -180 and 180.");
    }
  }

  // Validate maxDistance (in meters, e.g., 1 to 500,000 meters / 500km)
  if (maxDistance !== undefined && maxDistance !== '') {
    const distNum = Number(maxDistance);
    if (isNaN(distNum) || distNum <= 0 || distNum > 500000) {
      errors.push("Query parameter 'maxDistance' must be a positive number up to 500000 meters (500 km).");
    }
  }

  // Validate limit
  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push("Query parameter 'limit' must be a positive integer between 1 and 100.");
    }
  }

  // Validate optional brand ObjectId
  if (brand !== undefined && !isValidObjectId(brand)) {
    errors.push("Query parameter 'brand' must be a valid 24-character hex MongoDB ObjectId.");
  }

  // Validate optional showroomType
  if (showroomType !== undefined && !ALLOWED_SHOWROOM_TYPES.includes(showroomType)) {
    errors.push(
      `Query parameter 'showroomType' must be one of: ${ALLOWED_SHOWROOM_TYPES.map((t) => `'${t}'`).join(', ')}.`
    );
  }

  // Validate optional isActive
  if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
    errors.push("Query parameter 'isActive' must be a boolean ('true' or 'false').");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for request parameters', errors, 400);
  }

  next();
};

module.exports = {
  validateShowroomQuery,
  validateShowroomSlug,
  validateNearbyQuery,
  ALLOWED_SHOWROOM_TYPES,
  ALLOWED_SORTS,
  isValidObjectId
};
