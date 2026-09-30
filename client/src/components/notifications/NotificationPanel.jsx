import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ArrowUpRight, X } from 'lucide-react';
import NotificationList from './NotificationList';
import Badge from '../Badge';

/**
 * Notification Panel Component
 * Floating popover panel presenting active customer notifications with direct dashboard navigation.
 */
const NotificationPanel = ({
  notifications = [],
  unreadCount = 0,
  isLoading = false,
  error = null,
  onRetry,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose
}) => {
  return (
    <div
      role="region"
      aria-label="Notifications panel"
      className="w-[360px] sm:w-[400px] glass-surface rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-fadeIn"
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-border/80 flex items-center justify-between bg-surface-900/90">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
            <Bell className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-surface-50 uppercase tracking-wider">
              Notifications
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Dealership and booking alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="brand" size="sm" className="font-semibold text-[11px] px-2 py-0.5">
              {unreadCount} New
            </Badge>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
              aria-label="Close notifications panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Notification Feed */}
      <NotificationList
        notifications={notifications}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        onMarkAsRead={onMarkAsRead}
        onMarkAllAsRead={onMarkAllAsRead}
        onDelete={onDelete}
        maxHeightClass="max-h-[380px]"
      />

      {/* Panel Footer */}
      <div className="p-3 border-t border-border/80 bg-surface-900/80 flex items-center justify-between">
        <Link
          to="/dashboard"
          onClick={onClose}
          className="w-full text-center py-2 px-3 rounded-lg text-xs font-semibold text-surface-100 hover:text-white bg-surface-800/80 hover:bg-surface-700/80 border border-border/60 transition-all flex items-center justify-center gap-1.5 group"
        >
          <span>View All in Dashboard</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-brand-red group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default NotificationPanel;
