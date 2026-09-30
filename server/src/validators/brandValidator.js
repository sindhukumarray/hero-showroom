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

/**
 * Validate Brand Query Parameters
 * GET /api/brands and GET /api/admin/brands
 */
const validateBrandQuery = (req, res, next) => {
  const errors = [];
  const { page, limit, search, isActive } = req.query;

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

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for request parameters', errors, 400);
  }

  next();
};

/**
 * Validate Brand Slug Parameter
 * GET /api/brands/:slug
 */
const validateBrandSlug = (req, res, next) => {
  const { slug } = req.params;

  if (!slug || typeof slug !== 'string') {
    return sendError(res, 'Brand slug parameter is required', ['Missing slug in request path'], 400);
  }

  const trimmedSlug = slug.trim();
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
  if (!slugRegex.test(trimmedSlug) || trimmedSlug.length > 120) {
    return sendError(
      res,
      'Invalid brand slug format',
      ["Slug must contain only URL-safe alphanumeric characters and hyphens (e.g., 'hero-motocorp')."],
      400
    );
  }

  req.params.slug = trimmedSlug.toLowerCase();
  next();
};

/**
 * Validate Brand ID Parameter
 * /api/admin/brands/:id
 */
const validateBrandId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !isValidObjectId(id)) {
    return sendError(
      res,
      'Invalid brand ID format',
      ['Parameter :id must be a 24-character hexadecimal MongoDB ObjectId.'],
      400
    );
  }

  next();
};

/**
 * Validate Brand Creation Payload
 * POST /api/admin/brands
 */
const validateCreateBrand = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for brand payload', ['Request body must be a JSON object.'], 400);
  }

  for (const key of Object.keys(req.body)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid field '${key}': operators and path injections are forbidden.`);
    }
  }

  const { name, slug, description, originCountry, website, logo, isActive } = req.body;

  // Name validation
  if (name === undefined || name === null || typeof name !== 'string') {
    errors.push("Field 'name' is required.");
  } else {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      errors.push("Brand name must be at least 2 characters long.");
    } else if (trimmed.length > 100) {
      errors.push("Brand name cannot exceed 100 characters.");
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

  // Optional description
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push("Field 'description' must be a string.");
    } else if (description.trim().length > 1000) {
      errors.push("Description cannot exceed 1000 characters.");
    } else {
      req.body.description = description.trim();
    }
  }

  // Optional originCountry
  if (originCountry !== undefined && originCountry !== null) {
    if (typeof originCountry !== 'string') {
      errors.push("Field 'originCountry' must be a string.");
    } else if (originCountry.trim().length > 100) {
      errors.push("Origin country cannot exceed 100 characters.");
    } else {
      req.body.originCountry = originCountry.trim();
    }
  }

  // Optional website
  if (website !== undefined && website !== null && website !== '') {
    if (typeof website !== 'string') {
      errors.push("Field 'website' must be a string.");
    } else if (website.trim().length > 200) {
      errors.push("Website cannot exceed 200 characters.");
    } else {
      req.body.website = website.trim();
    }
  }

  // Optional logo
  if (logo !== undefined && logo !== null && logo !== '') {
    if (typeof logo !== 'string') {
      errors.push("Field 'logo' must be a string.");
    } else if (logo.trim().length > 300) {
      errors.push("Logo path cannot exceed 300 characters.");
    } else {
      req.body.logo = logo.trim();
    }
  }

  // Optional isActive
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push("Field 'isActive' must be a boolean.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for brand payload', errors, 400);
  }

  next();
};

/**
 * Validate Brand Update Payload
 * PUT /api/admin/brands/:id
 */
const validateUpdateBrand = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for brand update', ['Request body must be a JSON object.'], 400);
  }

  for (const key of Object.keys(req.body)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid field '${key}': operators and path injections are forbidden.`);
    }
  }

  const { name, slug, description, originCountry, website, logo, isActive } = req.body;

  const providedFields = [name, slug, description, originCountry, website, logo, isActive].filter(
    (v) => v !== undefined
  );
  if (providedFields.length === 0) {
    return sendError(res, 'Validation failed for brand update', ['At least one field must be provided to update.'], 400);
  }

  if (name !== undefined) {
    if (typeof name !== 'string') {
      errors.push("Field 'name' must be a string.");
    } else {
      const trimmed = name.trim();
      if (trimmed.length < 2 || trimmed.length > 100) {
        errors.push("Brand name must be between 2 and 100 characters long.");
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

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push("Field 'description' must be a string.");
    } else if (description.trim().length > 1000) {
      errors.push("Description cannot exceed 1000 characters.");
    } else {
      req.body.description = description.trim();
    }
  }

  if (originCountry !== undefined && originCountry !== null) {
    if (typeof originCountry !== 'string') {
      errors.push("Field 'originCountry' must be a string.");
    } else if (originCountry.trim().length > 100) {
      errors.push("Origin country cannot exceed 100 characters.");
    } else {
      req.body.originCountry = originCountry.trim();
    }
  }

  if (website !== undefined && website !== null && website !== '') {
    if (typeof website !== 'string') {
      errors.push("Field 'website' must be a string.");
    } else if (website.trim().length > 200) {
      errors.push("Website cannot exceed 200 characters.");
    } else {
      req.body.website = website.trim();
    }
  }

  if (logo !== undefined && logo !== null && logo !== '') {
    if (typeof logo !== 'string') {
      errors.push("Field 'logo' must be a string.");
    } else if (logo.trim().length > 300) {
      errors.push("Logo path cannot exceed 300 characters.");
    } else {
      req.body.logo = logo.trim();
    }
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push("Field 'isActive' must be a boolean.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for brand update', errors, 400);
  }

  next();
};

/**
 * Validate Brand Status Payload
 * PATCH /api/admin/brands/:id/status
 */
const validateBrandStatus = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for brand status', ['Request body must be a JSON object.'], 400);
  }

  const { isActive } = req.body;
  if (isActive === undefined || typeof isActive !== 'boolean') {
    return sendError(
      res,
      'Validation failed for brand status',
      ["Field 'isActive' is required and must be a boolean (true or false)."],
      400
    );
  }

  next();
};

module.exports = {
  validateBrandQuery,
  validateBrandSlug,
  validateBrandId,
  validateCreateBrand,
  validateUpdateBrand,
  validateBrandStatus,
  isValidObjectId
};
