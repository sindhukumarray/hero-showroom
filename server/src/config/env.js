/**
 * Centralized Application Environment & Configuration Layer
 * Validates, normalizes, and exposes environment variables safely.
 * Prevents insecure defaults, secret leakage, and invalid configurations in production.
 */

const ALLOWED_ENVIRONMENTS = ['development', 'production', 'test'];

const INSECURE_JWT_SECRETS = [
  'your_jwt_secret_key_here',
  'default_secret',
  'secret',
  'password',
  '12345678',
  '1234567890123456'
];

let currentValidatedConfig = null;

/**
 * Validates and normalizes configuration options across environments.
 *
 * @param {object} [options={}]
 * @param {boolean} [options.throwOnError=true]
 * @param {object} [options.envOverrides={}]
 * @returns {{ valid: boolean, errors: string[], config: object }}
 */
const validateConfig = (options = {}) => {
  const { throwOnError = true, envOverrides = {} } = options;
  const envSource = { ...process.env, ...envOverrides };
  const errors = [];

  // 1. NODE_ENV validation
  let nodeEnv = (envSource.NODE_ENV || 'development').trim().toLowerCase();
  if (!ALLOWED_ENVIRONMENTS.includes(nodeEnv)) {
    errors.push(`Invalid NODE_ENV '${nodeEnv}'. Allowed environments: ${ALLOWED_ENVIRONMENTS.join(', ')}.`);
    nodeEnv = 'development';
  }

  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';
  const isTest = nodeEnv === 'test';

  // 2. PORT validation
  let port = 5000;
  if (envSource.PORT !== undefined && String(envSource.PORT).trim() !== '') {
    const parsedPort = parseInt(String(envSource.PORT).trim(), 10);
    if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      errors.push(`Invalid PORT '${envSource.PORT}'. Must be an integer between 1 and 65535.`);
    } else {
      port = parsedPort;
    }
  }

  // 3. MONGODB_URI validation
  const mongodbUri = (
    envSource.MONGODB_URI ||
    envSource.MONGO_URI ||
    envSource.DATABASE_URL ||
    ''
  ).trim();

  if (isProduction) {
    if (!mongodbUri) {
      errors.push('MONGODB_URI is required in production.');
    } else if (mongodbUri.includes('127.0.0.1') || mongodbUri.includes('localhost')) {
      errors.push('MONGODB_URI cannot point to localhost or 127.0.0.1 in production. Provide a valid remote connection URI.');
    }
  }

  // 4. JWT_SECRET validation
  const jwtSecret = (envSource.JWT_SECRET || '').trim();
  if (!jwtSecret) {
    if (isProduction) {
      errors.push('JWT_SECRET is required and must not be empty.');
    }
  } else if (isProduction) {
    if (jwtSecret.length < 16) {
      errors.push('JWT_SECRET must be at least 16 characters in production for cryptographic safety.');
    }
    if (INSECURE_JWT_SECRETS.includes(jwtSecret.toLowerCase())) {
      errors.push('Insecure or placeholder JWT_SECRET is not permitted in production.');
    }
  }

  // 5. JWT_EXPIRES_IN validation
  const jwtExpiresIn = (envSource.JWT_EXPIRES_IN || '7d').trim();

  // 6. CLIENT_URL / CORS allowed origins normalization
  const baseLocalOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  const allowedOrigins = [...baseLocalOrigins];
  const configuredClientUrl = (envSource.CLIENT_URL || '').trim();

  if (configuredClientUrl) {
    const customUrls = configuredClientUrl
      .split(',')
      .map((url) => url.trim().replace(/\/+$/, '')) // strip trailing slashes
      .filter(Boolean);

    for (const url of customUrls) {
      if (url === '*') {
        if (isProduction) {
          errors.push("Wildcard '*' CLIENT_URL cannot be used with credentials enabled in production.");
        }
      } else if (!allowedOrigins.includes(url)) {
        allowedOrigins.push(url);
      }
    }
  }

  const valid = errors.length === 0;

  if (throwOnError && !valid) {
    const error = new Error(`Configuration validation failed:\n - ${errors.join('\n - ')}`);
    error.name = 'ConfigValidationError';
    error.errors = errors;
    throw error;
  }

  const config = Object.freeze({
    nodeEnv,
    isProduction,
    isDevelopment,
    isTest,
    port,
    mongodbUri,
    jwtSecret,
    jwtExpiresIn,
    clientUrl: configuredClientUrl,
    allowedOrigins,
    bodyLimit: '1mb',
    rateLimits: Object.freeze({
      auth: {
        windowMs: 15 * 60 * 1000,
        max: isProduction ? 30 : 1000
      },
      publicWrite: {
        windowMs: 15 * 60 * 1000,
        max: isProduction ? 60 : 1000
      },
      generalApi: {
        windowMs: 15 * 60 * 1000,
        max: isProduction ? 1000 : 10000
      }
    })
  });

  if (Object.keys(envOverrides).length === 0 && valid) {
    currentValidatedConfig = config;
  }

  return { valid, errors, config };
};

/**
 * Get current normalized configuration snapshot.
 * Returns cached validated config if initialized, or evaluates safely.
 */
const getConfig = () => {
  if (currentValidatedConfig) {
    return currentValidatedConfig;
  }
  return validateConfig({ throwOnError: false }).config;
};

/**
 * Reset cached validated configuration snapshot.
 * Useful for test suites re-evaluating process.env dynamically.
 */
const resetConfigCache = () => {
  currentValidatedConfig = null;
};

/**
 * Production-hardened JWT Secret accessor.
 * Validates presence, length, and rejects placeholder secrets in production.
 * @returns {string}
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  const trimmed = secret.trim();
  const isProduction = (process.env.NODE_ENV || 'development').trim().toLowerCase() === 'production';

  if (isProduction) {
    if (trimmed.length < 16) {
      throw new Error('JWT_SECRET must be at least 16 characters in production for cryptographic safety.');
    }
    if (INSECURE_JWT_SECRETS.includes(trimmed.toLowerCase())) {
      throw new Error('Insecure or placeholder JWT_SECRET is not permitted in production.');
    }
  }

  return trimmed;
};

/**
 * Access configured JWT expiry duration.
 * @returns {string}
 */
const getJwtExpiresIn = () => {
  return (process.env.JWT_EXPIRES_IN || '7d').trim();
};

module.exports = {
  validateConfig,
  getConfig,
  resetConfigCache,
  getJwtSecret,
  getJwtExpiresIn,
  ALLOWED_ENVIRONMENTS,
  INSECURE_JWT_SECRETS
};
