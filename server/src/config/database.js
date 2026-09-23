const mongoose = require('mongoose');

/**
 * Strips sensitive credentials from error messages to avoid accidental log leakage.
 * @param {string} message
 * @returns {string}
 */
const sanitizeErrorMessage = (message) => {
  if (!message || typeof message !== 'string') return 'Unknown database error';
  return message
    .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, 'mongodb://<sanitized-uri>')
    .replace(/:([^\s:@/]+)@/g, ':<hidden>@');
};

/**
 * Connect to MongoDB instance using Mongoose.
 * Validates MONGODB_URI and handles connection lifecycle events.
 */
const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    throw new Error('MONGODB_URI is not defined in environment variables. Database connection aborted.');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log('[MongoDB] Connected successfully');
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${sanitizeErrorMessage(error.message)}`);
    throw error;
  }
};

// Aliased for backwards compatibility
const connectDB = connectDatabase;

/**
 * Check if MongoDB connection is active
 * @returns {boolean}
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Verifies that a database connection can be established and is ready for operations.
 * Reusable database verification mechanism.
 * @returns {Promise<{ ok: boolean, readyState: number, message: string }>}
 */
const verifyConnection = async () => {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === '') {
    return { ok: false, readyState: mongoose.connection.readyState, message: 'MONGODB_URI is not configured' };
  }
  if (!isConnected()) {
    await connectDatabase();
  }
  const ready = isConnected();
  return {
    ok: ready,
    readyState: mongoose.connection.readyState,
    message: ready ? 'MongoDB connection verified and ready' : 'MongoDB connection not ready'
  };
};

/**
 * Disconnect from MongoDB (useful for teardowns / test runners)
 */
const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected successfully');
  }
};

module.exports = {
  connectDatabase,
  connectDB,
  isConnected,
  verifyConnection,
  disconnectDatabase,
  sanitizeErrorMessage
};
