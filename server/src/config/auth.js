/**
 * Authentication Configuration Foundation
 * Centralizes JWT and auth-related configuration options.
 * Does not generate JWT tokens or implement auth endpoints in this step.
 */
const authConfig = {
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

module.exports = authConfig;
