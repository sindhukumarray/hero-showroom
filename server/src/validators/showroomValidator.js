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

/**
 * Middleware: Validate Showroom ID Parameter
 * /api/admin/showrooms/:id
 */
const validateShowroomId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !isValidObjectId(id)) {
    return sendError(
      res,
      'Invalid showroom ID format',
      ['Parameter :id must be a 24-character hexadecimal MongoDB ObjectId.'],
      400
    );
  }

  next();
};

/**
 * Middleware: Validate Admin Showroom Query Parameters
 * GET /api/admin/showrooms
 */
const validateAdminShowroomQuery = (req, res, next) => {
  const errors = [];
  const { page, limit, search, brand, city, showroomType, isActive, isVerified, sort } = req.query;

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

  if (city !== undefined && city !== '' && city !== 'all') {
    if (!isValidObjectId(city)) {
      errors.push("Query parameter 'city' must be a valid 24-character hex MongoDB ObjectId.");
    }
  }

  if (showroomType !== undefined && showroomType !== '' && showroomType !== 'all') {
    if (!ALLOWED_SHOWROOM_TYPES.includes(showroomType)) {
      errors.push(
        `Query parameter 'showroomType' must be one of: ${ALLOWED_SHOWROOM_TYPES.map((t) => `'${t}'`).join(', ')}.`
      );
    }
  }

  if (isActive !== undefined && isActive !== '') {
    const val = String(isActive).toLowerCase();
    if (val !== 'true' && val !== 'false' && val !== 'all') {
      errors.push("Query parameter 'isActive' must be 'true', 'false', or 'all'.");
    }
  }

  if (isVerified !== undefined && isVerified !== '') {
    const val = String(isVerified).toLowerCase();
    if (val !== 'true' && val !== 'false' && val !== 'all') {
      errors.push("Query parameter 'isVerified' must be 'true', 'false', or 'all'.");
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
 * Middleware: Validate Showroom Creation Payload
 * POST /api/admin/showrooms
 */
const validateCreateShowroom = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for showroom payload', ['Request body must be a JSON object.'], 400);
  }

  checkOperatorInjection(req.body, errors);

  const {
    name,
    slug,
    brand,
    city,
    dealerName,
    showroomType,
    address,
    contact,
    location,
    openingHours,
    facilities,
    images,
    isVerified,
    isActive
  } = req.body;

  // Name validation
  if (!name || typeof name !== 'string') {
    errors.push("Field 'name' is required.");
  } else {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 150) {
      errors.push("Showroom name must be between 2 and 150 characters.");
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

  // City ObjectId validation
  if (!city || !isValidObjectId(city)) {
    errors.push("Field 'city' is required and must be a valid 24-character hexadecimal MongoDB ObjectId.");
  }

  // Dealer Name
  if (dealerName !== undefined && dealerName !== null) {
    if (typeof dealerName !== 'string') {
      errors.push("Field 'dealerName' must be a string.");
    } else {
      req.body.dealerName = dealerName.trim();
    }
  }

  // Showroom Type
  if (showroomType !== undefined && showroomType !== null) {
    if (!ALLOWED_SHOWROOM_TYPES.includes(showroomType)) {
      errors.push(`Field 'showroomType' must be one of: ${ALLOWED_SHOWROOM_TYPES.join(', ')}.`);
    }
  }

  // Address validation
  if (!address || typeof address !== 'object' || Array.isArray(address)) {
    errors.push("Field 'address' is required and must be an object.");
  } else {
    if (!address.fullAddress || typeof address.fullAddress !== 'string' || address.fullAddress.trim().length < 5) {
      errors.push("Field 'address.fullAddress' is required and must be at least 5 characters long.");
    } else {
      address.fullAddress = address.fullAddress.trim();
    }
    if (address.street && typeof address.street === 'string') address.street = address.street.trim();
    if (address.area && typeof address.area === 'string') address.area = address.area.trim();
    if (address.pincode && typeof address.pincode === 'string') address.pincode = address.pincode.trim();
  }

  // Contact validation
  if (!contact || typeof contact !== 'object' || Array.isArray(contact)) {
    errors.push("Field 'contact' is required and must be an object.");
  } else {
    if (!contact.phone || typeof contact.phone !== 'string' || contact.phone.trim().length < 7) {
      errors.push("Field 'contact.phone' is required and must be a valid phone number (minimum 7 digits).");
    } else {
      contact.phone = contact.phone.trim();
    }
    if (contact.email && typeof contact.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email.trim())) {
        errors.push("Field 'contact.email' must be a valid email address.");
      } else {
        contact.email = contact.email.trim().toLowerCase();
      }
    }
    if (contact.alternatePhone && typeof contact.alternatePhone === 'string') {
      contact.alternatePhone = contact.alternatePhone.trim();
    }
    if (contact.website && typeof contact.website === 'string') {
      contact.website = contact.website.trim();
    }
  }

  // Location / coordinates normalization
  if (location !== undefined && location !== null) {
    if (typeof location !== 'object' || Array.isArray(location)) {
      errors.push("Field 'location' must be an object.");
    } else if (location.coordinates) {
      if (Array.isArray(location.coordinates) && location.coordinates.length === 2) {
        const [lng, lat] = location.coordinates.map(Number);
        if (isNaN(lng) || lng < -180 || lng > 180 || isNaN(lat) || lat < -90 || lat > 90) {
          errors.push("Location coordinates must be [longitude (-180..180), latitude (-90..90)].");
        } else {
          req.body.location = { type: 'Point', coordinates: [lng, lat] };
        }
      } else if (location.latitude !== undefined && location.longitude !== undefined) {
        const lat = Number(location.latitude);
        const lng = Number(location.longitude);
        if (isNaN(lng) || lng < -180 || lng > 180 || isNaN(lat) || lat < -90 || lat > 90) {
          errors.push("Location latitude (-90..90) and longitude (-180..180) must be valid numbers.");
        } else {
          req.body.location = { type: 'Point', coordinates: [lng, lat] };
        }
      }
    }
  }

  // Opening Hours
  if (openingHours !== undefined && openingHours !== null) {
    if (typeof openingHours !== 'object' || Array.isArray(openingHours)) {
      errors.push("Field 'openingHours' must be an object.");
    }
  }

  // Facilities
  if (facilities !== undefined && facilities !== null) {
    if (!Array.isArray(facilities)) {
      errors.push("Field 'facilities' must be an array of strings.");
    }
  }

  // Images
  if (images !== undefined && images !== null) {
    if (typeof images !== 'object' || Array.isArray(images)) {
      errors.push("Field 'images' must be an object.");
    }
  }

  // Booleans
  if (isVerified !== undefined && typeof isVerified !== 'boolean') {
    errors.push("Field 'isVerified' must be a boolean.");
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push("Field 'isActive' must be a boolean.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for showroom payload', errors, 400);
  }

  next();
};

/**
 * Middleware: Validate Showroom Update Payload
 * PUT /api/admin/showrooms/:id
 */
const validateUpdateShowroom = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for showroom update', ['Request body must be a JSON object.'], 400);
  }

  checkOperatorInjection(req.body, errors);

  const {
    name,
    slug,
    brand,
    city,
    dealerName,
    showroomType,
    address,
    contact,
    location,
    openingHours,
    facilities,
    images,
    isVerified,
    isActive
  } = req.body;

  const providedFields = [
    name,
    slug,
    brand,
    city,
    dealerName,
    showroomType,
    address,
    contact,
    location,
    openingHours,
    facilities,
    images,
    isVerified,
    isActive
  ].filter((v) => v !== undefined);

  if (providedFields.length === 0) {
    return sendError(res, 'Validation failed for showroom update', ['At least one field must be provided to update.'], 400);
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 150) {
      errors.push("Showroom name must be between 2 and 150 characters.");
    } else {
      req.body.name = name.trim();
    }
  }

  if (slug !== undefined) {
    const trimmedSlug = String(slug).trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(trimmedSlug) || trimmedSlug.length < 2 || trimmedSlug.length > 120) {
      errors.push("Slug must contain only lowercase URL-safe alphanumeric characters and single hyphens (2-120 chars).");
    } else {
      req.body.slug = trimmedSlug;
    }
  }

  if (brand !== undefined) {
    if (!isValidObjectId(brand)) {
      errors.push("Field 'brand' must be a valid 24-character hexadecimal MongoDB ObjectId.");
    }
  }

  if (city !== undefined) {
    if (!isValidObjectId(city)) {
      errors.push("Field 'city' must be a valid 24-character hexadecimal MongoDB ObjectId.");
    }
  }

  if (showroomType !== undefined && showroomType !== null) {
    if (!ALLOWED_SHOWROOM_TYPES.includes(showroomType)) {
      errors.push(`Field 'showroomType' must be one of: ${ALLOWED_SHOWROOM_TYPES.join(', ')}.`);
    }
  }

  if (address !== undefined) {
    if (typeof address !== 'object' || Array.isArray(address)) {
      errors.push("Field 'address' must be an object.");
    } else {
      if (address.fullAddress !== undefined) {
        if (typeof address.fullAddress !== 'string' || address.fullAddress.trim().length < 5) {
          errors.push("Field 'address.fullAddress' must be at least 5 characters long.");
        } else {
          address.fullAddress = address.fullAddress.trim();
        }
      }
    }
  }

  if (contact !== undefined) {
    if (typeof contact !== 'object' || Array.isArray(contact)) {
      errors.push("Field 'contact' must be an object.");
    } else {
      if (contact.phone !== undefined) {
        if (typeof contact.phone !== 'string' || contact.phone.trim().length < 7) {
          errors.push("Field 'contact.phone' must be a valid phone number (minimum 7 digits).");
        } else {
          contact.phone = contact.phone.trim();
        }
      }
      if (contact.email !== undefined && contact.email !== '' && contact.email !== null) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(contact.email).trim())) {
          errors.push("Field 'contact.email' must be a valid email address.");
        } else {
          contact.email = String(contact.email).trim().toLowerCase();
        }
      }
    }
  }

  if (location !== undefined && location !== null) {
    if (typeof location !== 'object' || Array.isArray(location)) {
      errors.push("Field 'location' must be an object.");
    } else if (location.coordinates) {
      if (Array.isArray(location.coordinates) && location.coordinates.length === 2) {
        const [lng, lat] = location.coordinates.map(Number);
        if (isNaN(lng) || lng < -180 || lng > 180 || isNaN(lat) || lat < -90 || lat > 90) {
          errors.push("Location coordinates must be [longitude (-180..180), latitude (-90..90)].");
        } else {
          req.body.location = { type: 'Point', coordinates: [lng, lat] };
        }
      }
    }
  }

  if (isVerified !== undefined && typeof isVerified !== 'boolean') {
    errors.push("Field 'isVerified' must be a boolean.");
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push("Field 'isActive' must be a boolean.");
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for showroom update', errors, 400);
  }

  next();
};

/**
 * Middleware: Validate Showroom Status Payload
 * PATCH /api/admin/showrooms/:id/status
 */
const validateShowroomStatus = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for showroom status', ['Request body must be a JSON object.'], 400);
  }

  const { isActive } = req.body;
  if (isActive === undefined || typeof isActive !== 'boolean') {
    return sendError(
      res,
      'Validation failed for showroom status',
      ["Field 'isActive' is required and must be a boolean (true or false)."],
      400
    );
  }

  next();
};

module.exports = {
  validateShowroomQuery,
  validateShowroomSlug,
  validateNearbyQuery,
  validateShowroomId,
  validateAdminShowroomQuery,
  validateCreateShowroom,
  validateUpdateShowroom,
  validateShowroomStatus,
  ALLOWED_SHOWROOM_TYPES,
  ALLOWED_SORTS,
  isValidObjectId
};

