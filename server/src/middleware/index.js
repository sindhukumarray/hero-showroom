const errorHandler = require('./errorHandler');
const notFoundHandler = require('./notFoundHandler');
const { verifyToken, requireRole } = require('./authMiddleware');

module.exports = {
  errorHandler,
  notFoundHandler,
  verifyToken,
  requireRole
};
