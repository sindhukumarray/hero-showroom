const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { ROLES } = require('../constants/roles');
const { isConnected } = require('../config/database');

/**
 * Asserts database connectivity before executing operations.
 */
const assertDatabaseConnected = () => {
  if (!isConnected() && !User._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Register a new customer user.
 * @param {object} input
 * @param {string} input.name
 * @param {string} input.email
 * @param {string} input.password
 * @param {string} [input.phone]
 * @returns {Promise<object>} Safe user profile representation
 */
const registerUser = async ({ name, email, password, phone }) => {
  assertDatabaseConnected();

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Proactive duplicate check
  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (existingUser) {
    const conflictError = new Error('An account with this email address already exists');
    conflictError.statusCode = 409;
    throw conflictError;
  }

  // 2. Hash password with bcrypt (cost factor 10)
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  try {
    // 3. Create user enforcing role: customer and sanitized fields
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.CUSTOMER,
      phone: phone ? phone.trim() : '',
      isActive: true
    });

    // 4. Return safe user object omitting all credential internals
    return {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };
  } catch (error) {
    // Handle concurrent duplicate key race condition (MongoDB E11000)
    if (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000)) {
      const conflictError = new Error('An account with this email address already exists');
      conflictError.statusCode = 409;
      throw conflictError;
    }
    throw error;
  }
};

const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

/**
 * Generate a signed JWT access token for an authenticated user.
 * Claims include minimum necessary identifiers: sub and role.
 * @param {object} user Safe user representation
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (user) => {
  const secret = authConfig.getJwtSecret();
  const expiresIn = authConfig.jwtExpiresIn;

  return jwt.sign(
    {
      sub: user.id || user._id.toString(),
      role: user.role
    },
    secret,
    { expiresIn }
  );
};

/**
 * Authenticate a user and return safe credentials along with a JWT access token.
 * Uses generic authentication failure messages to prevent account enumeration.
 * @param {object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ accessToken: string, user: object }>}
 */
const loginUser = async ({ email, password }) => {
  assertDatabaseConnected();

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Generic authentication error template (401 Unauthorized)
  const genericAuthError = new Error('Invalid email or password');
  genericAuthError.statusCode = 401;

  // 2. Lookup user by email
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw genericAuthError;
  }

  // 3. Check account active status
  if (!user.isActive) {
    throw genericAuthError;
  }

  // 4. Verify password with stored bcrypt hash
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw genericAuthError;
  }

  // 5. Build sanitized user object
  const safeUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  // 6. Generate signed JWT access token
  const accessToken = generateAccessToken(safeUser);

  return {
    accessToken,
    user: safeUser
  };
};

module.exports = {
  registerUser,
  loginUser,
  generateAccessToken
};
