const { sendError } = require('../utils/apiResponse');

/**
 * In-Memory Sliding Window Rate Limiter
 * Provides DDoS, brute-force, and API abuse protection without introducing heavyweight external dependencies.
 */

// Periodic memory store cleanup
const rateLimitStore = new Map();
const CLEANUP_INTERVAL_MS = 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

/**
 * Creates an Express rate limiter middleware.
 *
 * @param {object} options
 * @param {number} options.windowMs - Window time in milliseconds (e.g. 15 * 60 * 1000)
 * @param {number} options.max - Maximum requests allowed per window
 * @param {string} options.message - Error message when rate limit is exceeded
 * @param {string} [options.keyPrefix='rl'] - Prefix for store keying
 * @returns {import('express').RequestHandler}
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.',
    keyPrefix = 'rl'
  } = options;

  return (req, res, next) => {
    // 1. Allow automated test suites to bypass rate limiting unless explicitly forced for testing
    const isTestEnvironment = process.env.NODE_ENV === 'test' || req.headers['x-test-bypass'] === 'true';
    if (isTestEnvironment && !req.headers['x-force-rate-limit']) {
      return next();
    }

    const now = Date.now();
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      '127.0.0.1';

    const storeKey = `${keyPrefix}:${clientIp}`;
    let record = rateLimitStore.get(storeKey);

    if (!record || record.resetTime <= now) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(storeKey, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetTimeSeconds = Math.ceil(record.resetTime / 1000);
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

    // Standard RFC RateLimit headers
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetTimeSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      return sendError(
        res,
        message,
        [`Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`],
        429
      );
    }

    return next();
  };
};

// 1. Auth Rate Limiter (Brute-force protection on /register and /login)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 1000,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  keyPrefix: 'auth'
});

// 2. Public Write Limiter (Spam protection on lead enquiries, test rides, and reviews)
const publicWriteLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 60 : 1000,
  message: 'Submission limit reached. Please wait before submitting additional requests.',
  keyPrefix: 'write'
});

// 3. General API Limiter (Platform-wide abuse prevention)
const generalApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
  message: 'Too many API requests from this client. Please slow down.',
  keyPrefix: 'api'
});

module.exports = {
  createRateLimiter,
  authLimiter,
  publicWriteLimiter,
  generalApiLimiter,
  rateLimitStore
};
