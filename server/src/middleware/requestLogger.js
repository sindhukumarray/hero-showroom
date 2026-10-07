const logger = require('../utils/logger');

/**
 * Checks if the request path is a high-frequency polling/health endpoint.
 * @param {string} url
 * @returns {boolean}
 */
const isHealthCheckUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url === '/api/health' || url.startsWith('/api/health?') || url === '/';
};

/**
 * Request Lifecycle Logging Middleware
 * Records start time and emits structured lifecycle logs upon response completion.
 * Excludes request bodies, credentials, authorization headers, and cookies.
 */
const requestLogger = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    try {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1e6;

      const pathUrl = req.originalUrl || req.url;
      const isHealth = isHealthCheckUrl(pathUrl);

      // Noise suppression: log health checks at debug level unless explicitly enabled
      const shouldSuppress = isHealth && process.env.LOG_HEALTH_CHECK !== 'true';

      const context = {
        requestId: req.id,
        method: req.method,
        path: pathUrl,
        url: pathUrl,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        environment: process.env.NODE_ENV || 'development'
      };

      const message = `${req.method} ${pathUrl} ${res.statusCode} (${durationMs.toFixed(1)}ms)`;

      if (shouldSuppress) {
        logger.debug(message, context);
      } else if (res.statusCode >= 500) {
        logger.error(message, context);
      } else if (res.statusCode >= 400) {
        logger.warn(message, context);
      } else {
        logger.info(message, context);
      }
    } catch (err) {
      // Fail-safe: never interrupt request lifecycle if logging fails
    }
  });

  next();
};

module.exports = requestLogger;
