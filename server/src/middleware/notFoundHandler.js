const { sendError } = require('../utils/apiResponse');

/**
 * 404 Route Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    [`The requested endpoint '${req.originalUrl}' does not exist on this server.`],
    404
  );
};

module.exports = notFoundHandler;
