const { getJwtSecret, getJwtExpiresIn } = require('./env');

/**
 * Authentication Configuration
 * Centralizes JWT and auth-related configuration options.
 */
const authConfig = {
  get jwtSecret() {
    return process.env.JWT_SECRET || '';
  },
  getJwtSecret,
  get jwtExpiresIn() {
    return getJwtExpiresIn();
  }
};

module.exports = authConfig;
