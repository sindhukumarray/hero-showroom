import api from './api';

/**
 * Admin Service
 * Handles administrative verification, platform metrics, and administrative CRUD operations.
 */

/**
 * Verify administrative session and retrieve platform status
 * GET /api/admin/status
 * @returns {Promise<object>} API response { success, message, data }
 */
export const getAdminStatus = async () => {
  return await api.get('/admin/status');
};

export default {
  getAdminStatus
};
