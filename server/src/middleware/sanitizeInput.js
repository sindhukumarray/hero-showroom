const { sendError } = require('../utils/apiResponse');

/**
 * Universal Input Sanitization Middleware
 * Provides blanket defense-in-depth protection against MongoDB query/operator injections
 * ($where, $gt, $ne, $regex) and dot-path property traversals across req.query, req.body, and req.params.
 */
const sanitizeInput = (req, res, next) => {
  const detectDangerousKeys = (obj, sourceName) => {
    if (!obj || typeof obj !== 'object') return null;

    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        return `Forbidden operator or path parameter detected in ${sourceName}: '${key}'`;
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const nested = detectDangerousKeys(obj[key], sourceName);
        if (nested) return nested;
      }
    }
    return null;
  };

  // 1. Audit query parameters
  const queryViolation = detectDangerousKeys(req.query, 'query parameters');
  if (queryViolation) {
    return sendError(res, 'Invalid request input: security violation', [queryViolation], 400);
  }

  // 2. Audit URL route parameters
  const paramsViolation = detectDangerousKeys(req.params, 'URL parameters');
  if (paramsViolation) {
    return sendError(res, 'Invalid request input: security violation', [paramsViolation], 400);
  }

  // 3. Audit parsed request body
  if (req.body && typeof req.body === 'object') {
    const bodyViolation = detectDangerousKeys(req.body, 'request body');
    if (bodyViolation) {
      return sendError(res, 'Invalid request input: security violation', [bodyViolation], 400);
    }
  }

  next();
};

module.exports = sanitizeInput;
