const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const { ALLOWED_ROLES } = require('../constants/roles');
const { sendError } = require('../utils/apiResponse');

/**
 * JWT Verification Middleware
 * Authenticates requests using a Bearer JWT token from the Authorization header.
 * Attaches verified claims (id, role) to req.user as an immutable object.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // 1. Enforce presence of Authorization header
  if (!authHeader || typeof authHeader !== 'string' || authHeader.trim() === '') {
    return sendError(res, 'Authentication required', [], 401);
  }

  // 2. Validate Bearer authentication format strictly
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return sendError(res, 'Authentication required', [], 401);
  }

  const token = parts[1];
  if (!token || token.trim() === '') {
    return sendError(res, 'Authentication required', [], 401);
  }

  // 3. Cryptographically verify token signature and expiration
  let decoded;
  try {
    const secret = authConfig.getJwtSecret();
    decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch (error) {
    // Return generic error without exposing JWT secrets or internal exceptions
    return sendError(res, 'Invalid or expired token', [], 401);
  }

  // 4. Validate essential payload claims
  if (!decoded || typeof decoded !== 'object' || !decoded.sub || typeof decoded.sub !== 'string' || decoded.sub.trim() === '') {
    return sendError(res, 'Invalid or expired token', [], 401);
  }

  if (!decoded.role || !ALLOWED_ROLES.includes(decoded.role)) {
    return sendError(res, 'Invalid or expired token', [], 401);
  }

  // 5. Attach immutable trusted identity to request
  req.user = Object.freeze({
    id: decoded.sub.trim(),
    role: decoded.role
  });

  return next();
};

/**
 * Role-Based Access Control (RBAC) Middleware Factory
 * Restricts route access to users with specified allowed roles.
 * Must be preceded by verifyToken in the middleware pipeline.
 *
 * @param {...string|string[]} roles Allowed user roles
 * @returns {import('express').RequestHandler}
 */
const requireRole = (...roles) => {
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    // Assert user identity has been populated by verifyToken
    if (!req.user || !req.user.role) {
      return sendError(res, 'Authentication required', [], 401);
    }

    // Check role authorization
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Forbidden', [], 403);
    }

    return next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};
