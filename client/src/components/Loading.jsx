import React from 'react';

/**
 * Reusable Loading Component
 * Supports animated spinners and content skeletons with automotive dark aesthetics.
 */
const Loading = ({
  type = 'spinner',
  text = 'Loading...',
  size = 'md',
  className = '',
  rows = 3
}) => {
  const sizeStyles = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4'
  };

  if (type === 'skeleton') {
    return (
      <div
        role="status"
        aria-label="Loading content"
        className={`w-full space-y-3.5 animate-pulse ${className}`}
      >
        <div className="h-6 bg-surface-800 rounded-lg w-1/3" />
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="h-14 bg-surface-800/60 rounded-card border border-border/40"
          />
        ))}
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={text}
      className={`flex flex-col items-center justify-center p-8 gap-3 text-center ${className}`}
    >
      <div
        className={`
          ${sizeStyles[size] || sizeStyles.md}
          border-border border-t-brand-red rounded-full animate-spin
        `}
      />
      {text && (
        <p className="typography-small text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
      <span className="sr-only">{text}</span>
    </div>
  );
};

export default Loading;
