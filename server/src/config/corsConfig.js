const { getConfig } = require('./env');

/**
 * Cross-Origin Resource Sharing (CORS) Configuration
 * Enforces an explicit, configurable allowed-origin strategy to prevent unauthorized
 * cross-origin credential leaks while supporting legitimate local development and production frontends.
 */

const getDefaultAllowedOrigins = (config) => {
  if (config && Array.isArray(config.allowedOrigins)) {
    return config.allowedOrigins;
  }
  return getConfig().allowedOrigins;
};

const getCorsOptions = (config) => {
  const allowedOrigins = getDefaultAllowedOrigins(config);

  return {
    origin: (origin, callback) => {
      // 1. Allow non-browser requests with no origin header (e.g. mobile apps, curl, server-to-server, unit tests)
      if (!origin) {
        return callback(null, true);
      }

      // Normalize origin by stripping any accidental trailing slash
      const normalizedOrigin = typeof origin === 'string' ? origin.replace(/\/+$/, '') : origin;

      // 2. Validate against explicit allowed origins
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // 3. Reject untrusted cross-origin requests safely
      const corsError = new Error(`CORS policy rejection: Origin '${origin}' is not authorized.`);
      corsError.statusCode = 403;
      return callback(corsError, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-ID',
      'x-request-id',
      'x-test-bypass',
      'x-force-rate-limit'
    ],
    exposedHeaders: [
      'X-Request-ID',
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset',
      'Retry-After'
    ],
    maxAge: 86400 // Cache preflight response for 24 hours
  };
};

module.exports = {
  getDefaultAllowedOrigins,
  getCorsOptions
};
