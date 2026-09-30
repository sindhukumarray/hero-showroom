const { User } = require('../models');

/**
 * Admin Service
 * Provides administrative foundation operations, platform access verification,
 * and high-level system telemetry.
 */

/**
 * Verify administrative access and retrieve caller identity metadata
 * @param {string} adminUserId - Authenticated admin MongoDB ObjectId
 * @returns {Promise<object>} Admin session status confirmation
 */
const getAdminStatus = async (adminUserId) => {
  const adminUser = await User.findById(adminUserId).select('name email role isActive createdAt');

  return {
    verified: true,
    system: 'Hero Showroom Administrative Engine',
    version: '1.0.0',
    admin: adminUser ? {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      isActive: adminUser.isActive
    } : null,
    serverTime: new Date().toISOString()
  };
};

module.exports = {
  getAdminStatus
};
