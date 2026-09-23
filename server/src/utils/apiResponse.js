/**
 * Standardized API Response Utilities
 * Follows the project-wide API response contract.
 */

/**
 * Send a standardized success response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {object|array|null} [data]
 * @param {number} [statusCode=200]
 */
const sendSuccess = (res, message = 'Request successful', data = undefined, statusCode = 200) => {
  const payload = {
    success: true,
    message
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Send a standardized error response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {array|object|null} [errors=[]]
 * @param {number} [statusCode=500]
 */
const sendError = (res, message = 'Something went wrong', errors = [], statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

module.exports = {
  sendSuccess,
  sendError
};
