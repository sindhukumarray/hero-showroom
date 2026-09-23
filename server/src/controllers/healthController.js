const { sendSuccess } = require('../utils/apiResponse');

/**
 * Health check controller
 * Endpoint: GET /api/health
 */
const getHealth = (req, res) => {
  return sendSuccess(res, 'Hero Showroom API is running');
};

module.exports = {
  getHealth
};
