const errorHandler = require('./errorHandler');
const notFoundHandler = require('./notFoundHandler');
const { verifyToken, requireRole } = require('./authMiddleware');
const securityHeaders = require('./securityHeaders');
const sanitizeInput = require('./sanitizeInput');
const requestTimeout = require('./requestTimeout');
const requestId = require('./requestId');
const requestLogger = require('./requestLogger');
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
  requestId,
  requestLogger,
  createRateLimiter,
  authLimiter,
  publicWriteLimiter,
  generalApiLimiter
};
