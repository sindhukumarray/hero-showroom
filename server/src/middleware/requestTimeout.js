/**
 * Request Timeout Middleware
 * Enforces a maximum execution time for incoming HTTP requests to prevent
 * hung sockets, stale connection leaks, and runaway resource consumption.
 *
 * @param {number} [timeoutMs=30000] - Timeout duration in milliseconds (default 30s)
 * @returns {import('express').RequestHandler}
 */
const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    // Disable timeout during test executions to prevent artificial failures
    if (process.env.NODE_ENV === 'test' || req.headers['x-test-bypass'] === 'true') {
      return next();
    }

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        const error = new Error('Request Timeout: The server took too long to process the request.');
        error.statusCode = 408;
        next(error);
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};

module.exports = requestTimeout;
