/**
 * Cross-Origin Resource Sharing (CORS) Configuration
 * Enforces an explicit, configurable allowed-origin strategy to prevent unauthorized
 * cross-origin credential leaks while supporting legitimate local development and production frontends.
 */

const getDefaultAllowedOrigins = () => {
  const origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  const configuredClientUrl = process.env.CLIENT_URL;
  if (configuredClientUrl && typeof configuredClientUrl === 'string') {
    const customUrls = configuredClientUrl
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    customUrls.forEach((url) => {
      if (!origins.includes(url)) {
        origins.push(url);
      }
    });
  }

  return origins;
};

const getCorsOptions = () => {
  const allowedOrigins = getDefaultAllowedOrigins();

  return {
    origin: (origin, callback) => {
      // 1. Allow non-browser requests with no origin header (e.g. mobile apps, curl, server-to-server, unit tests)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Validate against explicit allowed origins
      if (allowedOrigins.includes(origin)) {
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
      'x-test-bypass'
    ],
    exposedHeaders: [
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
