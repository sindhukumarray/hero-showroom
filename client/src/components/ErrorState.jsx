import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * Reusable Error State Component
 * Provides clean error messaging and optional retry triggers.
 */
const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error processing your request. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = ''
}) => {
  return (
    <div
      role="alert"
      className={`
        glass-surface p-8 rounded-card border border-rose-900/40 text-center
        flex flex-col items-center justify-center max-w-md mx-auto space-y-4
        ${className}
      `}
    >
      <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h3 className="typography-h3 text-surface-50">{title}</h3>
        <p className="typography-small text-surface-200">{message}</p>
      </div>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={RefreshCw}
          className="mt-2 text-rose-300 hover:text-white border-rose-800/60 hover:bg-rose-900/30"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
