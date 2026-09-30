import api from './api';

/**
 * Customer Notification Service
 * Manages customer notification retrieval, unread count polling, and read state mutations.
 */

/**
 * Retrieve paginated notifications for the authenticated user
 * @param {object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {boolean|string} [params.isRead]
 * @param {string} [params.type]
 * @returns {Promise<object>} API response { success, data, meta }
 */
export const getNotifications = async (params = {}) => {
  return await api.get('/notifications', { params });
};

/**
 * Get active unread notification count
 * @returns {Promise<object>} API response { success, data: { unreadCount } }
 */
export const getUnreadCount = async () => {
  return await api.get('/notifications/unread-count');
};

/**
 * Mark a single notification as read
 * @param {string} notificationId - 24-character hexadecimal ObjectId
 * @returns {Promise<object>} API response { success, data: updatedNotification }
 */
export const markAsRead = async (notificationId) => {
  return await api.patch(`/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read for current user
 * @returns {Promise<object>} API response { success, data: { modifiedCount, unreadCount } }
 */
export const markAllAsRead = async () => {
  return await api.patch('/notifications/read-all');
};

/**
 * Delete a notification
 * @param {string} notificationId - 24-character hexadecimal ObjectId
 * @returns {Promise<object>} API response { success, data: { deleted: true, id } }
 */
export const deleteNotification = async (notificationId) => {
  return await api.delete(`/notifications/${notificationId}`);
};
