const { sendError } = require('../utils/apiResponse');

// RFC 5322 compliant simplified email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Standard domestic/international phone number format (7-20 chars)
const PHONE_REGEX = /^[+]?[0-9\s-]{7,20}$/;

/**
 * Middleware: Validate Registration Request Payload
 * POST /api/auth/register
 */
const validateRegister = (req, res, next) => {
  const errors = [];

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(
      res,
      'Validation failed for registration input',
      ['Request body must be a valid JSON object.'],
      400
    );
  }

  const { name, email, password, phone, role, passwordHash } = req.body;

  // Prevent MongoDB operator injection in body keys
  for (const key of Object.keys(req.body)) {
    if (key.startsWith('$')) {
      errors.push(`Invalid field '${key}': operators are forbidden.`);
    }
  }

  // Security: Reject client attempts to inject role or escalate to admin
  if (role !== undefined) {
    errors.push("Field 'role' cannot be specified during public registration.");
  }

  // Security: Reject client attempts to supply raw passwordHash
  if (passwordHash !== undefined) {
    errors.push("Field 'passwordHash' is forbidden in registration payload.");
  }

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

  // Validate password
  if (password === undefined || password === null || typeof password !== 'string') {
    errors.push("Field 'password' is required.");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long.");
    } else if (password.length > 128) {
      errors.push("Password cannot exceed 128 characters.");
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

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for registration input', errors, 400);
  }

  next();
};

module.exports = {
  validateRegister
};
