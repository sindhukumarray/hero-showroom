const { sendError } = require('../utils/apiResponse');

/**
 * Centralized Application Error Handling Middleware
 * Sanitizes production error responses to prevent leaking internal stack traces,
 * file paths, database connection details, or sensitive server internals.
 */
const errorHandler = (err, req, res, next) => {
  // Support both err.statusCode and body-parser's err.status (e.g. 413 Payload Too Large)
  const statusCode =
    err.statusCode ||
    err.status ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  // In production, sanitize 500 internal server error messages to prevent leaking stack/DB specifics
  let message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  // Handle payload too large specifically
  if (err.type === 'entity.too.large' || statusCode === 413) {
    message = 'Request payload exceeds maximum allowable size limit (1MB).';
  }

  const errors = [];
  if (process.env.NODE_ENV === 'development') {
    errors.push({
      message: err.message,
      stack: err.stack ? err.stack.split('\n').map((line) => line.trim()) : undefined
    });
  }

  // Safe logging on the server console (without leaking passwords/tokens)
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  return sendError(res, message, errors, statusCode);
};

module.exports = errorHandler;
