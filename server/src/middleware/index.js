const errorHandler = require('./errorHandler');
const notFoundHandler = require('./notFoundHandler');
const { verifyToken, requireRole } = require('./authMiddleware');
const securityHeaders = require('./securityHeaders');
const sanitizeInput = require('./sanitizeInput');
const requestTimeout = require('./requestTimeout');
const {
  createRateLimiter,
  authLimiter,
  publicWriteLimiter,
  generalApiLimiter
} = require('./rateLimiter');

module.exports = {
  errorHandler,
  notFoundHandler,
  verifyToken,
  requireRole,
  securityHeaders,
  sanitizeInput,
  requestTimeout,
  createRateLimiter,
  authLimiter,
  publicWriteLimiter,
  generalApiLimiter
};
