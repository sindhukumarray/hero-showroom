/**
 * Authentication Configuration
 * Centralizes JWT and auth-related configuration options.
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return secret.trim();
};

const authConfig = {
  get jwtSecret() {
    return process.env.JWT_SECRET || '';
  },
  getJwtSecret,
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '7d';
  }
};

module.exports = authConfig;
