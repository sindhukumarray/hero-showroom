const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');
const { ALLOWED_LEAD_STATUS, ALLOWED_LEAD_SOURCES } = require('../constants/leads');

// RFC 5322 compliant simplified email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Standard domestic/international phone number format (7-20 chars)
const PHONE_REGEX = /^[+]?[0-9\s-]{7,20}$/;

/**
 * Validates a string as a 24-character hexadecimal MongoDB ObjectId
 * @param {*} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware: Validate Lead Creation Request Payload
 * POST /api/leads
 */
const validateCreateLead = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(
      res,
      'Validation failed for lead creation input',
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

  // Security: Ignore and remove client-provided user identity fields to enforce authenticated identity
  if (req.body.user !== undefined) {
    delete req.body.user;
  }
  if (req.body.userId !== undefined) {
    delete req.body.userId;
  }

  // Security: Reject client attempts to inject role or passwords
  if (req.body.role !== undefined) {
    errors.push("Field 'role' cannot be specified in lead payload.");
  }
  if (req.body.password !== undefined || req.body.passwordHash !== undefined) {
    errors.push("Password fields are forbidden in lead payload.");
  }

  // Validate or reject status manipulation
  if (req.body.status !== undefined) {
    if (!ALLOWED_LEAD_STATUS.includes(req.body.status)) {
      errors.push(`Field 'status' must be one of: ${ALLOWED_LEAD_STATUS.join(', ')}.`);
    } else if (req.body.status !== 'new') {
      errors.push("Field 'status' cannot be overridden during lead creation.");
    }
  }

  const { name, email, phone, showroom, bike, variant, source, message } = req.body;

  // Validate name
  if (name === undefined || name === null || typeof name !== 'string') {
    errors.push("Field 'name' is required.");
  } else {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      errors.push("Name must be at least 2 characters long.");
    } else if (trimmedName.length > 60) {
      errors.push("Name cannot exceed 60 characters.");
    } else {
      req.body.name = trimmedName;
    }
  }

  // Validate email
  if (email === undefined || email === null || typeof email !== 'string') {
    errors.push("Field 'email' is required.");
  } else {
    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.push("Please provide a valid email address.");
    } else if (trimmedEmail.length > 254) {
      errors.push("Email address cannot exceed 254 characters.");
    } else {
      req.body.email = trimmedEmail.toLowerCase();
    }
  }

  // Validate phone (optional)
  if (phone !== undefined && phone !== null && phone !== '') {
    if (typeof phone !== 'string') {
      errors.push("Field 'phone' must be a string.");
    } else {
      const trimmedPhone = phone.trim();
      if (!PHONE_REGEX.test(trimmedPhone)) {
        errors.push("Please provide a valid phone number.");
      } else {
        req.body.phone = trimmedPhone;
      }
    }
  } else {
    req.body.phone = '';
  }

  // Validate showroom reference
  if (showroom === undefined || showroom === null || showroom === '') {
    errors.push("Field 'showroom' is required.");
  } else if (!isValidObjectId(String(showroom).trim())) {
    errors.push("Field 'showroom' must be a valid MongoDB ObjectId.");
  } else {
    req.body.showroom = String(showroom).trim();
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

  // Validate optional offer reference
  if (req.body.offer !== undefined && req.body.offer !== null && req.body.offer !== '') {
    if (!isValidObjectId(String(req.body.offer).trim())) {
      errors.push("Field 'offer' must be a valid MongoDB ObjectId.");
    } else {
      req.body.offer = String(req.body.offer).trim();
    }
  } else {
    req.body.offer = null;
  }

  // Validate source (optional)
  if (source !== undefined && source !== null && source !== '') {
    if (!ALLOWED_LEAD_SOURCES.includes(source)) {
      errors.push(`Field 'source' must be one of: ${ALLOWED_LEAD_SOURCES.join(', ')}.`);
    }
  }

  // Validate message (optional)
  if (message !== undefined && message !== null && message !== '') {
    if (typeof message !== 'string') {
      errors.push("Field 'message' must be a string.");
    } else if (message.trim().length > 500) {
      errors.push("Message cannot exceed 500 characters.");
    } else {
      req.body.message = message.trim();
    }
  } else {
    req.body.message = '';
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for lead creation input', errors, 400);
  }

  next();
};

const ALLOWED_ADMIN_LEAD_SORTS = ['newest', 'oldest', 'status', 'name'];

/**
 * Middleware: Validate Admin Lead Query Parameters
 * GET /api/admin/leads
 */
const validateAdminLeadQuery = (req, res, next) => {
  const errors = [];
  const { page, limit, status, source, showroom, bike, user, search, sort, startDate, endDate } = req.query;

  // Prevent MongoDB operator injection
  for (const key of Object.keys(req.query)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.push(`Invalid query parameter '${key}': operators and path injection are forbidden.`);
    }
  }

  // Validate page
  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      errors.push("Query parameter 'page' must be a positive integer greater than or equal to 1.");
    }
  }

  // Validate limit
  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push("Query parameter 'limit' must be a positive integer between 1 and 100.");
    }
  }

  // Validate status enum
  if (status !== undefined && status !== '' && status !== 'all') {
    if (!ALLOWED_LEAD_STATUS.includes(status)) {
      errors.push(`Query parameter 'status' must be one of: ${ALLOWED_LEAD_STATUS.join(', ')} or 'all'.`);
    }
  }

  // Validate source enum
  if (source !== undefined && source !== '' && source !== 'all') {
    if (!ALLOWED_LEAD_SOURCES.includes(source)) {
      errors.push(`Query parameter 'source' must be one of: ${ALLOWED_LEAD_SOURCES.join(', ')} or 'all'.`);
    }
  }

  // Validate showroom ObjectId
  if (showroom !== undefined && showroom !== '' && showroom !== 'all') {
    if (!isValidObjectId(showroom)) {
      errors.push("Query parameter 'showroom' must be a valid 24-character hexadecimal MongoDB ObjectId.");
    }
  }

  // Validate bike ObjectId
  if (bike !== undefined && bike !== '' && bike !== 'all') {
    if (!isValidObjectId(bike)) {
      errors.push("Query parameter 'bike' must be a valid 24-character hexadecimal MongoDB ObjectId.");
    }
  }

  // Validate user ObjectId
  if (user !== undefined && user !== '' && user !== 'all') {
    if (!isValidObjectId(user)) {
      errors.push("Query parameter 'user' must be a valid 24-character hexadecimal MongoDB ObjectId.");
    }
  }

  // Validate sort
  if (sort !== undefined && sort !== '') {
    if (!ALLOWED_ADMIN_LEAD_SORTS.includes(sort)) {
      errors.push(`Query parameter 'sort' must be one of: ${ALLOWED_ADMIN_LEAD_SORTS.join(', ')}.`);
    }
  }

  // Validate date range
  if (startDate !== undefined && startDate !== '') {
    const d = new Date(startDate);
    if (isNaN(d.getTime())) {
      errors.push("Query parameter 'startDate' must be a valid ISO date string.");
    }
  }
  if (endDate !== undefined && endDate !== '') {
    const d = new Date(endDate);
    if (isNaN(d.getTime())) {
      errors.push("Query parameter 'endDate' must be a valid ISO date string.");
    }
  }

  // Validate search
  if (search !== undefined && search !== '') {
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
 * Middleware: Validate Lead ID Parameter
 * /api/admin/leads/:id
 */
const validateLeadId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !isValidObjectId(id)) {
    return sendError(
      res,
      'Invalid lead ID format',
      ['Parameter :id must be a 24-character hexadecimal MongoDB ObjectId.'],
      400
    );
  }

  next();
};

/**
 * Middleware: Validate Lead Status Update Payload
 * PATCH /api/admin/leads/:id/status
 */
const validateLeadStatus = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(res, 'Validation failed for lead status', ['Request body must be a JSON object.'], 400);
  }

  // Prevent MongoDB operator injection
  for (const key of Object.keys(req.body)) {
    if (key.startsWith('$') || key.includes('.')) {
      return sendError(res, 'Invalid field: operators and path injection are forbidden.', [], 400);
    }
  }

  const { status } = req.body;
  if (!status || typeof status !== 'string') {
    return sendError(res, 'Validation failed for lead status', ["Field 'status' is required and must be a string."], 400);
  }

  const normalizedStatus = status.trim().toLowerCase();
  if (!ALLOWED_LEAD_STATUS.includes(normalizedStatus)) {
    return sendError(
      res,
      'Invalid lead status value',
      [`Status must be one of: ${ALLOWED_LEAD_STATUS.join(', ')}.`],
      400
    );
  }

  req.body.status = normalizedStatus;
  next();
};

module.exports = {
  validateCreateLead,
  validateAdminLeadQuery,
  validateLeadId,
  validateLeadStatus,
  isValidObjectId,
  ALLOWED_ADMIN_LEAD_SORTS
};

