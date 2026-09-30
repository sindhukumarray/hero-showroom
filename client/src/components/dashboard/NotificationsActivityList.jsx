import React, { useState } from 'react';
import { Bell, CheckCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from '../notifications/NotificationItem';
import Button from '../Button';
import Loading from '../Loading';
import EmptyState from '../EmptyState';

/**
 * Dashboard Notifications Activity List
 * Embedded customer activity view for managing all account notifications.
 */
const NotificationsActivityList = ({ onExplore }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread'

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'unread') return !notif.isRead;
    return true;
  });

  if (isLoading && notifications.length === 0) {
    return (
      <div className="py-12 flex justify-center">
        <Loading text="Loading notifications..." size="md" />
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="p-6 rounded-card bg-surface-900 border border-rose-800/60 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" aria-hidden="true" />
        <p className="typography-small text-rose-200 text-sm">{error}</p>
        <Button variant="secondary" size="sm" onClick={() => fetchNotifications()} icon={RefreshCw}>
          Try Again
        </Button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        message="You are all caught up! Updates regarding your scheduled test rides, dealership enquiries, and exclusive offers will appear here."
        actionLabel={onExplore ? 'Explore Motorcycles' : undefined}
        onAction={onExplore}
        className="border-dashed py-10"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-900/60 border border-border/60">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeFilter === 'all'
                ? 'bg-surface-700 text-white shadow-xs'
                : 'text-muted-foreground hover:text-surface-100 hover:bg-surface-800/60'
            }`}
          >
            All Updates ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeFilter === 'unread'
                ? 'bg-surface-700 text-white shadow-xs'
                : 'text-muted-foreground hover:text-surface-100 hover:bg-surface-800/60'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={CheckCheck}
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark All Read
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchNotifications()}
            disabled={isLoading}
            className="text-xs"
          >
            {isLoading ? 'Updating...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-surface-900/40 border border-border/40">
          <p className="text-sm text-muted-foreground">
            No unread notifications right now.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notif) => (
            <NotificationItem
              key={notif._id}
              notification={notif}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsActivityList;
