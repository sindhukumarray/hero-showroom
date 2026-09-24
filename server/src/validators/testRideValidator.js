const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');
const { ALLOWED_TEST_RIDE_STATUS } = require('../constants/testRides');

// RFC 5322 compliant simplified email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Standard domestic/international phone number format (7-20 chars)
const PHONE_REGEX = /^[+]?[0-9\s-]{7,20}$/;
// 24-hour time format HH:mm
const TIME_REGEX = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Validates a string as a 24-character hexadecimal MongoDB ObjectId
 * @param {*} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware: Validate Test Ride Booking Request Payload
 * POST /api/test-rides
 */
const validateCreateTestRide = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(
      res,
      'Validation failed for test ride booking input',
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
    errors.push("Field 'role' cannot be specified in test ride payload.");
  }
  if (req.body.password !== undefined || req.body.passwordHash !== undefined) {
    errors.push("Password fields are forbidden in test ride payload.");
  }

  // Validate or reject status manipulation
  if (req.body.status !== undefined) {
    if (!ALLOWED_TEST_RIDE_STATUS.includes(req.body.status)) {
      errors.push(`Field 'status' must be one of: ${ALLOWED_TEST_RIDE_STATUS.join(', ')}.`);
    } else if (req.body.status !== 'requested') {
      errors.push("Field 'status' cannot be overridden during test ride booking.");
    }
  }

  const { name, email, phone, showroom, bike, variant, preferredDate, preferredTime, notes } = req.body;

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

  // Validate preferredDate
  if (preferredDate === undefined || preferredDate === null || preferredDate === '') {
    errors.push("Field 'preferredDate' is required.");
  } else {
    const parsedDate = new Date(preferredDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push("Field 'preferredDate' must be a valid date.");
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsedDate < today) {
        errors.push("Field 'preferredDate' cannot be in the past.");
      } else {
        req.body.preferredDate = parsedDate;
      }
    }
  }

  // Validate preferredTime
  if (preferredTime === undefined || preferredTime === null || preferredTime === '') {
    errors.push("Field 'preferredTime' is required.");
  } else if (typeof preferredTime !== 'string' || !TIME_REGEX.test(preferredTime.trim())) {
    errors.push("Field 'preferredTime' must be in HH:mm format (e.g. 10:30, 15:00).");
  } else {
    req.body.preferredTime = preferredTime.trim();
  }

  // Validate notes (optional)
  if (notes !== undefined && notes !== null && notes !== '') {
    if (typeof notes !== 'string') {
      errors.push("Field 'notes' must be a string.");
    } else if (notes.trim().length > 500) {
      errors.push("Notes cannot exceed 500 characters.");
    } else {
      req.body.notes = notes.trim();
    }
  } else {
    req.body.notes = '';
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for test ride booking input', errors, 400);
  }

  next();
};

module.exports = {
  validateCreateTestRide,
  isValidObjectId
};
