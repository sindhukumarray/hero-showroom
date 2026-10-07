/**
 * Sensitive Data Redaction Utility
 * Sanitizes logs, errors, and diagnostic context to prevent accidental disclosure
 * of passwords, tokens, JWTs, cookies, authorization headers, API keys, and database credentials.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'pass',
  'token',
  'accesstoken',
  'refreshtoken',
  'jwt',
  'secret',
  'jwtsecret',
  'authorization',
  'cookie',
  'cookies',
  'set-cookie',
  'apikey',
  'api_key',
  'key'
]);

/**
 * Checks whether a given property key is sensitive.
 * @param {string} key
 * @returns {boolean}
 */
const isSensitiveKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  return SENSITIVE_KEYS.has(normalized) ||
    normalized.includes('password') ||
    normalized.includes('secret') ||
    normalized.includes('token') ||
    normalized.includes('apikey');
};

/**
 * Redacts sensitive patterns within a raw string.
 * @param {string} str
 * @returns {string}
 */
const redactString = (str) => {
  if (!str || typeof str !== 'string') return str;

  return str
    // Redact MongoDB connection URIs
    .replace(/mongodb(\+srv)?:\/\/[^\s"'`]+/gi, 'mongodb://<sanitized-uri>')
    // Redact generic connection URI credentials (user:pass@host)
    .replace(/:([^\s:@/]+)@/g, ':<hidden>@')
    // Redact Bearer authorization tokens
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    // Redact JWT tokens (header.payload.signature)
    .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, '[REDACTED_JWT]');
};

/**
 * Deeply sanitizes and redacts objects, arrays, and primitives.
 * Safely guards against circular references.
 *
 * @param {any} target
 * @param {WeakSet} [visited]
 * @returns {any} Sanitized clone of target
 */
const redactObject = (target, visited = new WeakSet()) => {
  if (target === null || target === undefined) {
    return target;
  }

  if (typeof target === 'string') {
    return redactString(target);
  }

  if (typeof target !== 'object') {
    return target;
  }

  // Handle circular references gracefully
  if (visited.has(target)) {
    return '[Circular]';
  }
  visited.add(target);

  // Handle Dates
  if (target instanceof Date) {
    return target.toISOString();
  }

  // Handle Errors
  if (target instanceof Error) {
    const errorCopy = {
      name: target.name,
      message: redactString(target.message),
      code: target.code,
      statusCode: target.statusCode || target.status
    };
    if (target.stack) {
      errorCopy.stack = redactString(target.stack);
    }
    return errorCopy;
  }

  // Handle Arrays
  if (Array.isArray(target)) {
    return target.map((item) => redactObject(item, visited));
  }

  // Handle Plain Objects & general key-value dictionaries
  const sanitized = {};
  for (const [key, value] of Object.entries(target)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = redactObject(value, visited);
    }
  }

  return sanitized;
};

/**
 * Universal redaction entry point.
 * @param {any} data
 * @returns {any}
 */
const redact = (data) => {
  try {
    return redactObject(data);
  } catch (err) {
    // Fail-safe: if deep traversal errors, fallback to basic stringification
    return '[Redaction Fallback: Sanitization Skipped]';
  }
};

module.exports = {
  redact,
  redactString,
  redactObject,
  isSensitiveKey
};
