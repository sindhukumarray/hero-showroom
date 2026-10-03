const express = require('express');
const cors = require('cors');
const { getCorsOptions } = require('./config/corsConfig');
const {
  securityHeaders,
  sanitizeInput,
  generalApiLimiter,
  notFoundHandler,
  errorHandler
} = require('./middleware');
const apiRoutes = require('./routes');

const app = express();

// Disable Express fingerprinting header
app.disable('x-powered-by');

// 1. HTTP Security Headers (OWASP baseline)
app.use(securityHeaders);

// 2. Hardened CORS Configuration
app.use(cors(getCorsOptions()));

// 3. Request Body Size Limits (Mitigate payload flooding & memory exhaustion)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Universal Input Sanitization (Defense-in-depth against MongoDB operator injections)
app.use(sanitizeInput);

// Root welcome check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Hero Showroom API. Access endpoints via /api'
  });
});

// 5. Mount Rate Limiting and Central API Routes under /api
app.use('/api', generalApiLimiter, apiRoutes);

// Catch-all 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
