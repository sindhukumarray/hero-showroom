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

/**
 * Middleware: Validate Bike ID Parameter
 * /api/admin/bikes/:id
 */
const validateBikeId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !isValidObjectId(id)) {
    return sendError(
      res,
      'Invalid bike ID format',
      ['Parameter :id must be a 24-character hexadecimal MongoDB ObjectId.'],
      400
    );
  }

  next();
};

/**
 * Middleware: Validate Admin Bike Query Parameters
 * GET /api/admin/bikes
 */
const validateAdminBikeQuery = (req, res, next) => {
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
    isFeatured,
    sort
  } = req.query;

  checkOperatorInjection(req.query, errors);

  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push("Query parameter 'page' must be a positive integer greater than or equal to 1.");
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push("Query parameter 'limit' must be a positive integer between 1 and 100.");
    }
  }

  if (brand !== undefined && brand !== '' && brand !== 'all') {
    if (!isValidObjectId(brand)) {
      errors.push("Query parameter 'brand' must be a valid 24-character hex MongoDB ObjectId.");
    }
  }

  if (category !== undefined && category !== '' && category !== 'all') {
    if (!ALLOWED_CATEGORIES.includes(category)) {
      errors.push(
        `Query parameter 'category' must be one of: ${ALLOWED_CATEGORIES.map((c) => `'${c}'`).join(', ')}.`
      );
    }
  }

  if (fuelType !== undefined && fuelType !== '' && fuelType !== 'all') {
    if (!ALLOWED_FUEL_TYPES.includes(fuelType)) {
      errors.push(
        `Query parameter 'fuelType' must be one of: ${ALLOWED_FUEL_TYPES.map((f) => `'${f}'`).join(', ')}.`
      );
    }
  }

  if (isActive !== undefined && isActive !== '') {
    const val = String(isActive).toLowerCase();
    if (val !== 'true' && val !== 'false' && val !== 'all') {
      errors.push("Query parameter 'isActive' must be 'true', 'false', or 'all'.");
    }
  }

  if (isFeatured !== undefined && isFeatured !== '') {
    const val = String(isFeatured).toLowerCase();
    if (val !== 'true' && val !== 'false' && val !== 'all') {
      errors.push("Query parameter 'isFeatured' must be 'true', 'false', or 'all'.");
    }
  }

  if (sort !== undefined) {
    if (typeof sort !== 'string' || !ALLOWED_SORTS.includes(sort)) {
      errors.push(`Query parameter 'sort' must be one of: ${ALLOWED_SORTS.map((s) => `'${s}'`).join(', ')}.`);
    }
  }

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
 * Middleware: Validate Bike Creation Payload
 * POST /api/admin/bikes
 */
const validateCreateBike = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for bike payload', ['Request body must be a JSON object.'], 400);
  }

  checkOperatorInjection(req.body, errors);

  const {
    name,
    slug,
    brand,
    category,
    priceRange,
    tagline,
    description,
    images,
    engine,
    fuelType,
    transmission,
    brakes,
    mileage,
    isFeatured,
    isActive
  } = req.body;

  // Name validation
  if (!name || typeof name !== 'string') {
    errors.push("Field 'name' is required.");
  } else {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 120) {
      errors.push("Bike name must be between 2 and 120 characters.");
    } else {
      req.body.name = trimmed;
    }
  }

  // Slug validation
  if (!slug || typeof slug !== 'string') {
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

  // Brand ObjectId validation
  if (!brand || !isValidObjectId(brand)) {
    errors.push("Field 'brand' is required and must be a valid 24-character hexadecimal MongoDB ObjectId.");
  }

  // Category validation
  if (!category || !ALLOWED_CATEGORIES.includes(category)) {
    errors.push(`Field 'category' is required and must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`);
  }

  // PriceRange validation
  if (!priceRange || typeof priceRange !== 'object' || Array.isArray(priceRange)) {
    errors.push("Field 'priceRange' is required and must be an object with minPrice and maxPrice.");
  } else {
    const { minPrice, maxPrice } = priceRange;
    if (minPrice === undefined || typeof minPrice !== 'number' || minPrice < 0) {
      errors.push("Field 'priceRange.minPrice' is required and must be a non-negative number.");
    }
    if (maxPrice === undefined || typeof maxPrice !== 'number' || maxPrice < 0) {
      errors.push("Field 'priceRange.maxPrice' is required and must be a non-negative number.");
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      errors.push("Field 'priceRange.minPrice' cannot exceed 'priceRange.maxPrice'.");
    }
  }

  // Optional fuelType
  if (fuelType !== undefined && !ALLOWED_FUEL_TYPES.includes(fuelType)) {
    errors.push(`Field 'fuelType' must be one of: ${ALLOWED_FUEL_TYPES.join(', ')}.`);
  }

  // Optional transmission
  if (transmission !== undefined && typeof transmission !== 'string') {
    errors.push("Field 'transmission' must be a string.");
  }

  // Optional engine
  if (engine !== undefined) {
    if (typeof engine !== 'object' || Array.isArray(engine)) {
      errors.push("Field 'engine' must be an object.");
    } else if (engine.displacementCc !== undefined && (typeof engine.displacementCc !== 'number' || engine.displacementCc < 0)) {
      errors.push("Field 'engine.displacementCc' must be a non-negative number.");
    }
  }

  // Optional booleans
  if (isFeatured !== undefined && typeof isFeatured !== 'boolean') {
    errors.push("Field 'isFeatured' must be a boolean.");
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push("Field 'isActive' must be a boolean.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for bike payload', errors, 400);
  }

  next();
};

/**
 * Middleware: Validate Bike Update Payload
 * PUT /api/admin/bikes/:id
 */
const validateUpdateBike = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for bike update', ['Request body must be a JSON object.'], 400);
  }

  checkOperatorInjection(req.body, errors);

  const {
    name,
    slug,
    brand,
    category,
    priceRange,
    tagline,
    description,
    images,
    engine,
    fuelType,
    transmission,
    brakes,
    mileage,
    isFeatured,
    isActive
  } = req.body;

  const providedFields = [
    name,
    slug,
    brand,
    category,
    priceRange,
    tagline,
    description,
    images,
    engine,
    fuelType,
    transmission,
    brakes,
    mileage,
    isFeatured,
    isActive
  ].filter((v) => v !== undefined);

  if (providedFields.length === 0) {
    return sendError(res, 'Validation failed for bike update', ['At least one field must be provided to update.'], 400);
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) {
      errors.push("Bike name must be between 2 and 120 characters.");
    } else {
      req.body.name = name.trim();
    }
  }

  if (slug !== undefined) {
    const trimmedSlug = String(slug).trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(trimmedSlug) || trimmedSlug.length < 2 || trimmedSlug.length > 120) {
      errors.push("Slug must contain only lowercase URL-safe alphanumeric characters and single hyphens.");
    } else {
      req.body.slug = trimmedSlug;
    }
  }

  if (brand !== undefined) {
    if (!isValidObjectId(brand)) {
      errors.push("Field 'brand' must be a valid 24-character hexadecimal MongoDB ObjectId.");
    }
  }

  if (category !== undefined) {
    if (!ALLOWED_CATEGORIES.includes(category)) {
      errors.push(`Field 'category' must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`);
    }
  }

  if (priceRange !== undefined) {
    if (typeof priceRange !== 'object' || Array.isArray(priceRange)) {
      errors.push("Field 'priceRange' must be an object.");
    } else {
      if (priceRange.minPrice !== undefined && (typeof priceRange.minPrice !== 'number' || priceRange.minPrice < 0)) {
        errors.push("Field 'priceRange.minPrice' must be a non-negative number.");
      }
      if (priceRange.maxPrice !== undefined && (typeof priceRange.maxPrice !== 'number' || priceRange.maxPrice < 0)) {
        errors.push("Field 'priceRange.maxPrice' must be a non-negative number.");
      }
    }
  }

  if (fuelType !== undefined && !ALLOWED_FUEL_TYPES.includes(fuelType)) {
    errors.push(`Field 'fuelType' must be one of: ${ALLOWED_FUEL_TYPES.join(', ')}.`);
  }

  if (isFeatured !== undefined && typeof isFeatured !== 'boolean') {
    errors.push("Field 'isFeatured' must be a boolean.");
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push("Field 'isActive' must be a boolean.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for bike update', errors, 400);
  }

  next();
};

/**
 * Middleware: Validate Bike Status Payload
 * PATCH /api/admin/bikes/:id/status
 */
const validateBikeStatus = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for bike status', ['Request body must be a JSON object.'], 400);
  }

  const { isActive } = req.body;
  if (isActive === undefined || typeof isActive !== 'boolean') {
    return sendError(
      res,
      'Validation failed for bike status',
      ["Field 'isActive' is required and must be a boolean (true or false)."],
      400
    );
  }

  next();
};

module.exports = {
  validateBikeQuery,
  validateBikeSlug,
  validateBikeId,
  validateAdminBikeQuery,
  validateCreateBike,
  validateUpdateBike,
  validateBikeStatus,
  ALLOWED_CATEGORIES,
  ALLOWED_FUEL_TYPES,
  ALLOWED_SORTS,
  isValidObjectId
};

