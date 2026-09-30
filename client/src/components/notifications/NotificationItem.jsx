import React from 'react';
import { Bike, Mail, Tag, Star, Bell, Check, Trash2, Clock } from 'lucide-react';
import Badge from '../Badge';

/**
 * Format timestamp into relative or locale date
 * @param {string|Date} date
 * @returns {string}
 */
const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return past.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });
};

/**
 * Resolve display metadata for notification type
 * @param {string} type
 * @returns {{ icon: any, label: string, badgeVariant: string }}
 */
const getTypeConfig = (type) => {
  switch (type) {
    case 'TEST_RIDE':
      return {
        icon: Bike,
        label: 'Test Ride',
        badgeVariant: 'brand',
        iconBg: 'bg-brand-red/10 text-brand-red border-brand-red/30'
      };
    case 'LEAD':
      return {
        icon: Mail,
        label: 'Enquiry',
        badgeVariant: 'secondary',
        iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
      };
    case 'OFFER':
      return {
        icon: Tag,
        label: 'Special Offer',
        badgeVariant: 'outline',
        iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      };
    case 'REVIEW':
      return {
        icon: Star,
        label: 'Review',
        badgeVariant: 'outline',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      };
    case 'SYSTEM':
    default:
      return {
        icon: Bell,
        label: 'Notice',
        badgeVariant: 'outline',
        iconBg: 'bg-surface-700 text-surface-200 border-surface-600'
      };
  }
};

/**
 * Notification Item Component
 * Renders individual notification with read/unread visual distinction, type icon, and quick actions.
 */
const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
  className = ''
}) => {
  if (!notification) return null;

  const { _id, type, title, message, isRead, createdAt } = notification;
  const config = getTypeConfig(type);
  const IconComponent = config.icon;
  const timeAgo = formatTimeAgo(createdAt);

  return (
    <article
      tabIndex={0}
      aria-label={`${isRead ? 'Read' : 'Unread'} notification: ${title}`}
      className={`
        relative group p-4 rounded-xl transition-all duration-200 border
        ${
          !isRead
            ? 'bg-surface-800/90 border-brand-red/40 hover:border-brand-red/70 shadow-sm'
            : 'bg-surface-900/60 border-border/50 hover:bg-surface-800/50 hover:border-border'
        }
        ${className}
      `}
    >
      {/* Unread Accent Bar */}
      {!isRead && (
        <span
          className="absolute left-0 top-3 bottom-3 w-1 bg-brand-red rounded-r shadow-glow-red"
          aria-hidden="true"
        />
      )}

      <div className="flex items-start gap-3 pl-1">
        {/* Type Icon */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${config.iconBg}`}
          aria-hidden="true"
        >
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={config.badgeVariant} size="sm" className="text-[10px] px-1.5 py-0 uppercase">
                {config.label}
              </Badge>
              {!isRead && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-brand-red shadow-glow-red inline-block"
                  title="Unread"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Timestamp */}
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3 opacity-60" aria-hidden="true" />
              <span>{timeAgo}</span>
            </span>
          </div>

          <h4
            className={`text-sm leading-snug line-clamp-1 ${
              !isRead ? 'font-semibold text-surface-50' : 'font-medium text-surface-200'
            }`}
          >
            {title}
          </h4>

          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {message}
          </p>
        </div>

        {/* Actions (Mark as Read / Delete) */}
        <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
          {!isRead && onMarkAsRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(_id);
              }}
              title="Mark as read"
              aria-label="Mark as read"
              className="p-1.5 rounded-md text-surface-300 hover:text-white hover:bg-surface-700/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-red"
            >
              <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(_id);
              }}
              title="Delete notification"
              aria-label="Delete notification"
              className="p-1.5 rounded-md text-surface-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default NotificationItem;
