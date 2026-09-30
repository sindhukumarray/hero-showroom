const notificationService = require('../services/notificationService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Controller: Get authenticated customer's notifications with pagination & filtering
 * GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.user.id, req.query);

    return sendSuccess(
      res,
      'Notifications retrieved successfully',
      result.data,
      200,
      result.meta
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get unread notification count for authenticated customer
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.id);

    return sendSuccess(
      res,
      'Unread notification count retrieved successfully',
      result,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mark single notification as read
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markNotificationAsRead(
      req.user.id,
      req.params.id
    );

    return sendSuccess(
      res,
      'Notification marked as read successfully',
      notification,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllNotificationsAsRead(req.user.id);

    return sendSuccess(
      res,
      'All notifications marked as read successfully',
      result,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete a notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(
      req.user.id,
      req.params.id
    );

    return sendSuccess(
      res,
      'Notification deleted successfully',
      result,
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
