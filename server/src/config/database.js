const mongoose = require('mongoose');

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
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
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
  disconnectDatabase
};
