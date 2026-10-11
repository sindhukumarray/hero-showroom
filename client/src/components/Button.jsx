import React from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/**
 * Reusable Premium Button Component
 * Supports multiple luxury automotive variants, sizes, loading states, and accessible motion.
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();

  const variantStyles = {
    primary:
      'bg-brand-red hover:bg-brand-red-hover text-white shadow-glow-red hover:shadow-glow-red-lg border border-transparent',
    secondary:
      'bg-white hover:bg-surface-800 text-surface-100 border border-border hover:border-brand-silver/50 shadow-sm',
    ghost:
      'bg-transparent hover:bg-surface-800 text-surface-200 hover:text-surface-100 border border-transparent',
    outline:
      'bg-transparent hover:bg-brand-red-subtle text-surface-100 hover:text-brand-red border border-border hover:border-brand-red/50',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent'
  };

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 rounded-lg gap-1.5 min-h-[36px]',
    md: 'text-sm px-5 py-2.5 rounded-card gap-2 min-h-[44px]',
    lg: 'text-base px-7 py-3.5 rounded-card gap-2.5 min-h-[50px]'
  };

  const isDisabled = disabled || loading;

  const motionProps = shouldReduceMotion
    ? {}
    : {
        whileHover: isDisabled ? undefined : { scale: 1.02 },
        whileTap: isDisabled ? undefined : { scale: 0.98 },
        transition: { duration: 0.15, ease: 'easeOut' }
      };

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      {...motionProps}
      className={`
        inline-flex items-center justify-center font-sans font-semibold tracking-wide select-none
        transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${variantStyles[variant] || variantStyles.primary}
        ${sizeStyles[size] || sizeStyles.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 shrink-0 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">Loading</span>
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
        </>
      )}
    </motion.button>
  );
};

export default Button;
