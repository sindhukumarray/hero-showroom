const { sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { redact, redactString } = require('../utils/redact');

/**
 * Strips sensitive credentials, tokens, or MongoDB connection strings from error messages.
 * Prevents accidental disclosure in server console logs.
 * @param {string} message
 * @returns {string}
 */
const sanitizeLogMessage = (message) => {
  if (!message || typeof message !== 'string') return 'Unknown error';
  return redactString(message);
};

/**
 * Centralized Application Error Handling Middleware
 * Normalizes Mongoose, MongoDB, Express body-parser, and JWT errors into
 * predictable, consistent HTTP response contracts.
 * Sanitizes production error responses to prevent leaking internal stack traces,
 * file paths, database connection details, or sensitive server internals.
 */
const errorHandler = (err, req, res, next) => {
  // If response headers have already been sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Initial status resolution
  let statusCode =
    Number(err.statusCode) ||
    Number(err.status) ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  let message = err.message || 'Internal Server Error';
  let errors = [];

  if (Array.isArray(err.errors)) {
    errors = [...err.errors];
  } else if (typeof err.errors === 'string') {
    errors = [err.errors];
  }

  // 2. Normalize SyntaxError from malformed JSON payloads (Express body-parser)
  if (err instanceof SyntaxError && (err.status === 400 || statusCode === 400) && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload. Please ensure request body is valid JSON.';
    if (errors.length === 0) {
      errors = ['Unable to parse request body as valid JSON.'];
    }
  }

  // 3. Normalize Request Entity Too Large (413 Payload Too Large)
  else if (err.type === 'entity.too.large' || statusCode === 413) {
    statusCode = 413;
    message = 'Request payload exceeds maximum allowable size limit (1MB).';
    if (errors.length === 0) {
      errors = ['Request entity exceeds maximum allowable size limit (1MB).'];
    }
  }

  // 4. Normalize Mongoose CastError (e.g. invalid ObjectId format in params/queries)
  else if (err.name === 'CastError') {
    statusCode = 400;
    const field = err.path || 'id';
    message = `Invalid format for field '${field}'. Expected a valid ObjectId.`;
    if (errors.length === 0) {
      errors = [`The value '${err.value}' is not a valid ObjectId for field '${field}'.`];
    }
  }

  // 5. Normalize MongoDB Unique Index Violation (Duplicate Key - Code 11000)
  else if (err.code === 11000 || err.codeName === 'DuplicateKey') {
    statusCode = 409;
    const keys = Object.keys(err.keyValue || {});
    const field = keys.length > 0 ? keys[0] : 'field';
    message = `A resource with this ${field} already exists.`;
    if (errors.length === 0) {
      errors = [`Duplicate key constraint violation on '${field}'.`];
    }
  }

  // 6. Normalize Mongoose Schema ValidationError
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    if (errors.length === 0 && err.errors && typeof err.errors === 'object') {
      errors = Object.values(err.errors).map((e) => e.message || `${e.path} is invalid`);
    }
  }

  // 7. Normalize JWT Authentication Errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
    if (errors.length === 0) {
      errors = ['Authentication token verification failed.'];
    }
  }

  // 8. Normalize Request Timeout (408)
  else if (statusCode === 408 || err.code === 'ETIMEDOUT') {
    statusCode = 408;
    message = 'Request timed out';
    if (errors.length === 0) {
      errors = ['The request took too long to complete. Please try again.'];
    }
  }

  // 9. Production sanitization: prevent leaking internal 5xx details
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && statusCode >= 500) {
    message = 'Internal Server Error';
    errors = [];
  } else if (!isProduction && statusCode >= 500 && errors.length === 0) {
    errors.push({
      message: err.message,
      stack: err.stack ? err.stack.split('\n').map((line) => line.trim()) : undefined
    });
  }

  // 10. Safe console logging without leaking credentials or tokens
  const safeMsg = sanitizeLogMessage(message || err.message || 'Internal Server Error');
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, safeMsg);

  // 11. Structured diagnostic logging with correlation ID
  logger.error(safeMsg, {
    requestId: req.id || req.requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode,
    errorName: err.name || 'Error',
    stack: !isProduction && err.stack ? err.stack : undefined
  });

  return sendError(res, message, errors, statusCode);
};

module.exports = errorHandler;
