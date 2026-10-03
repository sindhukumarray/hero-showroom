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

/**
 * Validates a 24-character hexadecimal MongoDB ObjectId string.
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Middleware: Validate Parent Bike ID Parameter
 * /api/admin/bikes/:bikeId/variants
 */
const validateBikeVariantParentId = (req, res, next) => {
  const { bikeId } = req.params;

  if (!bikeId || !isValidObjectId(bikeId)) {
    return sendError(
      res,
      'Invalid parent bike ID format',
      ['Parameter :bikeId must be a 24-character hexadecimal MongoDB ObjectId.'],
      400
    );
  }

  next();
};

/**
 * Middleware: Validate Variant ID Parameter
 * /api/admin/bikes/:bikeId/variants/:variantId
 */
const validateVariantId = (req, res, next) => {
  const { variantId } = req.params;

  if (!variantId || !isValidObjectId(variantId)) {
    return sendError(
      res,
      'Invalid variant ID format',
      ['Parameter :variantId must be a 24-character hexadecimal MongoDB ObjectId.'],
      400
    );
  }

  next();
};

/**
 * Middleware: Validate Bike Variant Creation Payload
 * POST /api/admin/bikes/:bikeId/variants
 */
const validateCreateBikeVariant = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for variant payload', ['Request body must be a JSON object.'], 400);
  }

  checkOperatorInjection(req.body, errors);

  const { name, slug, exShowroomPrice, colors, keySpecifications, keyFeatures, isActive } = req.body;

  // Name validation
  if (!name || typeof name !== 'string') {
    errors.push("Field 'name' is required.");
  } else {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      errors.push("Variant name must be between 2 and 100 characters.");
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
    } else if (trimmedSlug.length < 2 || trimmedSlug.length > 100) {
      errors.push("Slug must be between 2 and 100 characters long.");
    } else {
      req.body.slug = trimmedSlug;
    }
  }

  // Price validation
  if (exShowroomPrice === undefined || exShowroomPrice === null || typeof exShowroomPrice !== 'number' || exShowroomPrice < 0) {
    errors.push("Field 'exShowroomPrice' is required and must be a non-negative number.");
  }

  // Optional colors
  if (colors !== undefined && !Array.isArray(colors)) {
    errors.push("Field 'colors' must be an array.");
  }

  // Optional keySpecifications
  if (keySpecifications !== undefined && (typeof keySpecifications !== 'object' || Array.isArray(keySpecifications))) {
    errors.push("Field 'keySpecifications' must be an object.");
  }

  // Optional keyFeatures
  if (keyFeatures !== undefined && !Array.isArray(keyFeatures)) {
    errors.push("Field 'keyFeatures' must be an array of strings.");
  }

  // Optional isActive
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push("Field 'isActive' must be a boolean.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for variant payload', errors, 400);
  }

  next();
};

/**
 * Middleware: Validate Bike Variant Update Payload
 * PUT /api/admin/bikes/:bikeId/variants/:variantId
 */
const validateUpdateBikeVariant = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for variant update', ['Request body must be a JSON object.'], 400);
  }

  checkOperatorInjection(req.body, errors);

  const { name, slug, exShowroomPrice, colors, keySpecifications, keyFeatures, isActive } = req.body;

  const providedFields = [name, slug, exShowroomPrice, colors, keySpecifications, keyFeatures, isActive].filter(
    (v) => v !== undefined
  );

  if (providedFields.length === 0) {
    return sendError(res, 'Validation failed for variant update', ['At least one field must be provided to update.'], 400);
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      errors.push("Variant name must be between 2 and 100 characters.");
    } else {
      req.body.name = name.trim();
    }
  }

  if (slug !== undefined) {
    const trimmedSlug = String(slug).trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(trimmedSlug) || trimmedSlug.length < 2 || trimmedSlug.length > 100) {
      errors.push("Slug must contain only lowercase URL-safe alphanumeric characters and single hyphens.");
    } else {
      req.body.slug = trimmedSlug;
    }
  }

  if (exShowroomPrice !== undefined) {
    if (typeof exShowroomPrice !== 'number' || exShowroomPrice < 0) {
      errors.push("Field 'exShowroomPrice' must be a non-negative number.");
    }
  }

  if (colors !== undefined && !Array.isArray(colors)) {
    errors.push("Field 'colors' must be an array.");
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push("Field 'isActive' must be a boolean.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for variant update', errors, 400);
  }

  next();
};

/**
 * Middleware: Validate Bike Variant Status Payload
 * PATCH /api/admin/bikes/:bikeId/variants/:variantId/status
 */
const validateBikeVariantStatus = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for variant status', ['Request body must be a JSON object.'], 400);
  }

  const { isActive } = req.body;
  if (isActive === undefined || typeof isActive !== 'boolean') {
    return sendError(
      res,
      'Validation failed for variant status',
      ["Field 'isActive' is required and must be a boolean (true or false)."],
      400
    );
  }

  next();
};

/**
 * Middleware: Validate Admin Bike Variant Query Parameters
 * GET /api/admin/bikes/:bikeId/variants
 */
const validateAdminBikeVariantQuery = (req, res, next) => {
  const errors = [];
  const { page, limit, search, minPrice, maxPrice, isActive, sort } = req.query;

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

  if (minPrice !== undefined) {
    const minPriceNum = Number(minPrice);
    if (isNaN(minPriceNum) || !isFinite(minPriceNum) || minPriceNum < 0) {
      errors.push("Query parameter 'minPrice' must be a valid non-negative finite number.");
    }
  }

  if (maxPrice !== undefined) {
    const maxPriceNum = Number(maxPrice);
    if (isNaN(maxPriceNum) || !isFinite(maxPriceNum) || maxPriceNum < 0) {
      errors.push("Query parameter 'maxPrice' must be a valid non-negative finite number.");
    }
  }

  if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
    errors.push("Query parameter 'minPrice' cannot be greater than 'maxPrice'.");
  }

  if (isActive !== undefined && isActive !== '' && isActive !== 'all') {
    const val = String(isActive).toLowerCase();
    if (val !== 'true' && val !== 'false' && val !== 'all') {
      errors.push("Query parameter 'isActive' must be 'true', 'false', or 'all'.");
    }
  }

  if (sort !== undefined && !ALLOWED_VARIANT_SORTS.includes(sort)) {
    errors.push(
      `Query parameter 'sort' must be one of: ${ALLOWED_VARIANT_SORTS.map((s) => `'${s}'`).join(', ')}.`
    );
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

module.exports = {
  validateBikeVariantQuery,
  validateAdminBikeVariantQuery,
  validateBikeVariantParentId,
  validateVariantId,
  validateCreateBikeVariant,
  validateUpdateBikeVariant,
  validateBikeVariantStatus,
  isValidObjectId,
  ALLOWED_VARIANT_SORTS
};


