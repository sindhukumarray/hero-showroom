const { validateConfig } = require('./config/env');

// Fail fast on invalid environment configuration before accepting traffic
const { config: validatedConfig } = validateConfig();

const express = require('express');
const cors = require('cors');
const { getCorsOptions } = require('./config/corsConfig');
const {
  securityHeaders,
  sanitizeInput,
  generalApiLimiter,
  notFoundHandler,
  errorHandler,
  requestTimeout,
  requestId,
  requestLogger
} = require('./middleware');
const apiRoutes = require('./routes');

const app = express();

// Disable Express fingerprinting header
app.disable('x-powered-by');

// 1. Request Correlation ID (Assign or preserve traceable X-Request-ID)
app.use(requestId);

// 2. Request Lifecycle Structured Logging (Observability without leaking sensitive bodies)
app.use(requestLogger);

// 3. Request Timeout Protection (30s threshold prevents hanging sockets and connection leaks)
app.use(requestTimeout(30000));

// 4. HTTP Security Headers (OWASP baseline)
app.use(securityHeaders);

// 5. Hardened CORS Configuration
app.use(cors(getCorsOptions(validatedConfig)));

// 6. Request Body Size Limits (Mitigate payload flooding & memory exhaustion)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 7. Universal Input Sanitization (Defense-in-depth against MongoDB operator injections)
app.use(sanitizeInput);

// Root welcome check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Hero Showroom API. Access endpoints via /api'
  });
});

// 6. Mount Rate Limiting and Central API Routes under /api
app.use('/api', generalApiLimiter, apiRoutes);

// Catch-all 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
