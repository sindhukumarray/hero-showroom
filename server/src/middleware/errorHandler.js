const { sendError } = require('../utils/apiResponse');

/**
 * Centralized Application Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  const errors = [];
  if (process.env.NODE_ENV === 'development') {
    errors.push({
      message: err.message,
      stack: err.stack ? err.stack.split('\n').map((line) => line.trim()) : undefined
    });
  }

  // Safe logging on the server console (without leaking secrets)
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  return sendError(res, message, errors, statusCode);
};

module.exports = errorHandler;
