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

module.exports = {
  registerUser
};
