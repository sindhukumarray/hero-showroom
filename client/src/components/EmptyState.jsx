import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * Reusable Empty State Component
 * Clean presentation for zero-result queries and empty inventories.
 */
const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  message = 'There are currently no items matching your criteria.',
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`
        glass-surface p-10 rounded-card border border-border text-center
        flex flex-col items-center justify-center max-w-md mx-auto space-y-4
        ${className}
      `}
    >
      <div className="w-12 h-12 rounded-full bg-surface-800 border border-border flex items-center justify-center text-muted-foreground">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h3 className="typography-h3 text-surface-100">{title}</h3>
        <p className="typography-small text-surface-200">{message}</p>
      </div>

      {actionLabel && onAction && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          className="mt-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
