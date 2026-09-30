import React, { useState, useMemo } from 'react';
import { Bell, CheckCheck, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import NotificationItem from './NotificationItem';
import Button from '../Button';
import Loading from '../Loading';
import EmptyState from '../EmptyState';

/**
 * Notification List Component
 * Renders filtered notification feed with loading, error, empty states, and bulk actions.
 */
const NotificationList = ({
  notifications = [],
  isLoading = false,
  error = null,
  onRetry,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  emptyTitle = 'No notifications yet',
  emptyMessage = 'You are all caught up! Updates regarding test rides, dealer responses, and special offers will appear here.',
  showFilters = true,
  maxHeightClass = 'max-h-[360px]'
}) => {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unread'

  const filteredNotifications = useMemo(() => {
    if (filterMode === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filterMode]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  if (isLoading && notifications.length === 0) {
    return (
      <div className="py-12 flex justify-center items-center">
        <Loading text="Loading notifications..." size="md" />
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="p-6 rounded-card bg-surface-900 border border-rose-800/60 text-center space-y-3 m-2">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" aria-hidden="true" />
        <p className="typography-small text-rose-200 text-sm">{error}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} icon={RefreshCw}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <div className="p-3 border-b border-border/70 flex items-center justify-between gap-2 flex-shrink-0 bg-surface-900/60">
        <div className="flex items-center gap-2">
          {showFilters && (
            <div className="flex items-center gap-1 bg-surface-800/80 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterMode === 'all'
                    ? 'bg-surface-700 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-surface-100'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('unread')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterMode === 'unread'
                    ? 'bg-surface-700 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-surface-100'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          )}
        </div>

        {unreadCount > 0 && onMarkAllAsRead && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-xs font-medium text-brand-red hover:text-brand-red-light transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Content List */}
      <div className={`overflow-y-auto space-y-2 p-3 ${maxHeightClass}`}>
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filterMode === 'unread' ? 'No unread notifications' : emptyTitle}
            message={
              filterMode === 'unread'
                ? 'All of your notifications have been marked as read.'
                : emptyMessage
            }
            className="py-8 border-dashed"
          />
        ) : (
          filteredNotifications.map((notif) => (
            <NotificationItem
              key={notif._id}
              notification={notif}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
