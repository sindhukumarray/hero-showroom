const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');
const {
  validateNotificationQuery,
  validateNotificationId
} = require('../validators/notificationValidator');

const router = express.Router();

/**
 * Notification Routes
 * Base: /api/notifications
 * All notification routes require JWT authentication.
 */

// All routes in this router require authentication
router.use(verifyToken);

// GET /api/notifications - List customer notifications (with query filters and pagination)
router.get('/', validateNotificationQuery, notificationController.getNotifications);

// GET /api/notifications/unread-count - Get customer's unread count
router.get('/unread-count', notificationController.getUnreadCount);

// PATCH /api/notifications/read-all - Mark all customer notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// PATCH /api/notifications/:id/read - Mark a single notification as read
router.patch('/:id/read', validateNotificationId, notificationController.markAsRead);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', validateNotificationId, notificationController.deleteNotification);

module.exports = router;
