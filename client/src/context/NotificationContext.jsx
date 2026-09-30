import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as notificationService from '../services/notificationService';

const NotificationContext = createContext(null);

/**
 * Notification Context Provider
 * Manages customer notification lifecycle, synchronizing unread count and notification states
 * across navigation header, notifications panel, and customer dashboard.
 */
export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch unread notification count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return 0;
    }
    try {
      const res = await notificationService.getUnreadCount();
      const count = res?.data?.unreadCount ?? res?.data?.count ?? 0;
      setUnreadCount(count);
      return count;
    } catch {
      // Graceful fallback without breaking UI
      return 0;
    }
  }, [isAuthenticated]);

  /**
   * Fetch paginated notifications
   */
  const fetchNotifications = useCallback(
    async (params = {}) => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await notificationService.getNotifications(params);
        const items = res?.data || [];
        setNotifications(items);
        if (res?.meta) {
          setMeta(res.meta);
          if (res.meta.unreadCount !== undefined) {
            setUnreadCount(res.meta.unreadCount);
          }
        }
        return items;
      } catch (err) {
        setError(err?.message || 'Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  /**
   * Mark a single notification as read (optimistic update)
   */
  const markAsRead = useCallback(
    async (notificationId) => {
      if (!notificationId) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await notificationService.markAsRead(notificationId);
      } catch (err) {
        // Rollback / refetch on failure
        fetchNotifications();
        fetchUnreadCount();
        throw err;
      }
    },
    [fetchNotifications, fetchUnreadCount]
  );

  /**
   * Mark all notifications as read (optimistic update)
   */
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      fetchNotifications();
      fetchUnreadCount();
      throw err;
    }
  }, [fetchNotifications, fetchUnreadCount]);

  /**
   * Delete a notification (optimistic update)
   */
  const deleteNotification = useCallback(
    async (notificationId) => {
      if (!notificationId) return;

      const target = notifications.find((n) => n._id === notificationId);
      const wasUnread = target && !target.isRead;

      // Optimistic deletion
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await notificationService.deleteNotification(notificationId);
      } catch (err) {
        fetchNotifications();
        fetchUnreadCount();
        throw err;
      }
    },
    [notifications, fetchNotifications, fetchUnreadCount]
  );

  // Sync state on authentication change
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, fetchNotifications, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    meta,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to consume customer notifications context
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
