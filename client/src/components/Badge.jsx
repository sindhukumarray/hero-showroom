import React from 'react';

/**
 * Reusable Badge Component
 * Follows automotive status indicator standards.
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default:
      'bg-surface-800 text-surface-200 border-border',
    brand:
      'bg-brand-red-subtle text-brand-red border-brand-red/30 shadow-sm',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning:
      'bg-amber-50 text-amber-700 border-amber-200',
    danger:
      'bg-rose-50 text-rose-700 border-rose-200',
    info:
      'bg-sky-50 text-sky-700 border-sky-200'
  };

  const dotColors = {
    default: 'bg-surface-200',
    brand: 'bg-brand-red',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-sky-400'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5'
  };

  return (
    <span
      className={`
        inline-flex items-center font-sans font-bold uppercase tracking-wider rounded-full border
        ${variantStyles[variant] || variantStyles.default}
        ${sizeStyles[size] || sizeStyles.md}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
