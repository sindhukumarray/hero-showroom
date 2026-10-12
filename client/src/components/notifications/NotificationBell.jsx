import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from './NotificationPanel';

/**
 * Notification Bell Navigation Component
 * Header action providing unread badge indicator and interactive floating panel.
 */
const NotificationBell = ({ className = '' }) => {
  const { isAuthenticated } = useAuth();
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

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Close panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Only render for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  const badgeText = unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="notification-bell-button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className={`
          relative p-2.5 rounded-lg border transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red
          ${
            isOpen
              ? 'bg-surface-800 text-brand-red border-brand-red shadow-sm'
              : 'bg-surface-900/80 hover:bg-surface-800 text-surface-100 hover:text-surface-50 border-border/80'
          }
        `}
      >
        <Bell className="w-4 h-4" aria-hidden="true" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-red text-white text-[10px] font-black font-mono flex items-center justify-center border-2 border-surface-900 shadow-glow-red animate-scaleIn leading-none"
            aria-hidden="true"
          >
            {badgeText}
          </span>
        )}
      </button>

      {/* Floating Notification Panel Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2.5 z-50 origin-top-right focus:outline-none"
          tabIndex={-1}
        >
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            isLoading={isLoading}
            error={error}
            onRetry={fetchNotifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDelete={deleteNotification}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
