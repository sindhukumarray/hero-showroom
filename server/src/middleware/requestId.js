const crypto = require('crypto');

/**
 * Validates whether an incoming request ID is safe for logging and propagation.
 * Prevents log injection and CRLF header attacks.
 * @param {string} id
 * @returns {boolean}
 */
const isValidRequestId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  return trimmed.length >= 8 && trimmed.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(trimmed);
};

/**
 * Request Correlation ID Middleware
 * Ensures every incoming HTTP request carries a unique, traceable correlation ID.
 * Preserves safe incoming X-Request-ID from upstream proxies/gateways or generates
 * a cryptographically strong UUID.
 */
const requestId = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];

  const id = isValidRequestId(incomingId) ? incomingId.trim() : crypto.randomUUID();

  req.id = id;
  req.requestId = id;

  // Expose correlation ID on response headers for client diagnostics
  res.setHeader('X-Request-ID', id);

  next();
};

module.exports = requestId;
