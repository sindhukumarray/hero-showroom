const { Notification, User } = require('../models');
const { isConnected } = require('../config/database');
const { ALLOWED_NOTIFICATION_TYPES, NOTIFICATION_TYPES } = require('../constants/notifications');

/**
 * Asserts database availability.
 */
const assertDatabaseConnected = () => {
  if (!isConnected() && !Notification._mockActive) {
    const error = new Error('Database service is currently unavailable');
    error.statusCode = 503;
    throw error;
  }
};

/**
 * Service: Create a new customer notification.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.type - One of ALLOWED_NOTIFICATION_TYPES
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.relatedEntity]
 * @param {string} [params.relatedEntityType]
 * @param {object} [params.metadata]
 * @returns {Promise<object>} Created notification document
 */
const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedEntity = null,
  relatedEntityType = null,
  metadata = {}
}) => {
  assertDatabaseConnected();

  if (!userId) {
    const error = new Error('User ID is required to create a notification');
    error.statusCode = 400;
    throw error;
  }

  const normalizedType = type ? String(type).trim().toUpperCase() : NOTIFICATION_TYPES.SYSTEM;
  if (!ALLOWED_NOTIFICATION_TYPES.includes(normalizedType)) {
    const error = new Error(`Invalid notification type '${type}'`);
    error.statusCode = 400;
    throw error;
  }

  if (!title || !title.trim()) {
    const error = new Error('Notification title is required');
    error.statusCode = 400;
    throw error;
  }

  if (!message || !message.trim()) {
    const error = new Error('Notification message is required');
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.create({
    user: userId,
    type: normalizedType,
    title: title.trim(),
    message: message.trim(),
    isRead: false,
    relatedEntity: relatedEntity || null,
    relatedEntityType: relatedEntityType ? String(relatedEntityType).trim() : null,
    metadata: metadata && typeof metadata === 'object' ? metadata : {}
  });

  return notification;
};

/**
 * Service: Retrieve paginated notifications for the authenticated customer only.
 * @param {string} userId - From JWT
 * @param {object} [query]
 * @param {number} [query.page=1]
 * @param {number} [query.limit=20]
 * @param {boolean|string} [query.isRead]
 * @param {string} [query.type]
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const getUserNotifications = async (
  userId,
  { page = 1, limit = 20, isRead, type } = {}
) => {
  assertDatabaseConnected();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = { user: userId };

  if (isRead !== undefined && isRead !== null && isRead !== '') {
    if (isRead === true || String(isRead).toLowerCase() === 'true') {
      filter.isRead = true;
    } else if (isRead === false || String(isRead).toLowerCase() === 'false') {
      filter.isRead = false;
    }
  }

  if (type) {
    const normalizedType = String(type).trim().toUpperCase();
    if (ALLOWED_NOTIFICATION_TYPES.includes(normalizedType)) {
      filter.type = normalizedType;
    }
  }

  const [total, unreadCount, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
      .lean()
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / limitNum);

  return {
    data: notifications,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: totalPages,
      totalPages,
      unreadCount
    }
  };
};

/**
 * Service: Get unread notification count for authenticated customer.
 * @param {string} userId
 * @returns {Promise<{ unreadCount: number, count: number }>}
 */
const getUnreadCount = async (userId) => {
  assertDatabaseConnected();

  const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

  return {
    unreadCount,
    count: unreadCount
  };
};

/**
 * Service: Mark a single notification as read with strict ownership validation.
 * @param {string} userId - From JWT
 * @param {string} notificationId - ObjectId
 * @returns {Promise<object>} Updated notification
 */
const markNotificationAsRead = async (userId, notificationId) => {
  assertDatabaseConnected();

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  if (notification.user.toString() !== userId.toString()) {
    const error = new Error('You are not authorized to modify this notification');
    error.statusCode = 403;
    throw error;
  }

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  return notification;
};

/**
 * Service: Mark all notifications as read for authenticated customer.
 * @param {string} userId - From JWT
 * @returns {Promise<{ modifiedCount: number, unreadCount: number }>}
 */
const markAllNotificationsAsRead = async (userId) => {
  assertDatabaseConnected();

  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );

  return {
    modifiedCount: result.modifiedCount,
    unreadCount: 0
  };
};

/**
 * Service: Delete a customer notification with strict ownership validation.
 * @param {string} userId - From JWT
 * @param {string} notificationId - ObjectId
 * @returns {Promise<{ deleted: boolean, id: string }>}
 */
const deleteNotification = async (userId, notificationId) => {
  assertDatabaseConnected();

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  if (notification.user.toString() !== userId.toString()) {
    const error = new Error('You are not authorized to delete this notification');
    error.statusCode = 403;
    throw error;
  }

  await Notification.deleteOne({ _id: notification._id });

  return {
    deleted: true,
    id: notificationId
  };
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
};
