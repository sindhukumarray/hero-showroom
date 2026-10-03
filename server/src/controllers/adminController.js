const adminService = require('../services/adminService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Admin Controller
 * Handles administrative foundation endpoints, session access verification,
 * and high-level platform status.
 */

/**
 * Check admin access and return system verification payload
 * GET /api/admin/status
 */
const getAdminStatus = async (req, res, next) => {
  try {
    const statusData = await adminService.getAdminStatus(req.user.id);
    return sendSuccess(res, 'Admin access verified successfully', statusData, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve comprehensive aggregate metrics across all platform domains
 * GET /api/admin/dashboard
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const dashboardData = await adminService.getDashboardMetrics();
    return sendSuccess(res, 'Admin dashboard metrics retrieved successfully', dashboardData, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStatus,
  getDashboardMetrics
};
