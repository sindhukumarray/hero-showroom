import React from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/**
 * Reusable Premium Card Component
 * Supports luxury automotive dark surfaces, frosted glassmorphism, and hover transitions.
 */
const Card = ({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  onClick,
  as: Component = 'div',
  ...props
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();

  const variantStyles = {
    default:
      'bg-background-card border border-border text-surface-100 shadow-card-dark',
    elevated:
      'bg-gradient-to-b from-background-elevated to-background-card border border-border/80 text-surface-100 shadow-card-dark',
    glass:
      'glass-surface border border-white/10 text-surface-100 shadow-glass',
    accent:
      'bg-background-card border border-brand-red/30 text-surface-100 shadow-glow-red/20'
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-brand-red/40 hover:shadow-card-hover transition-all duration-300'
    : '';

  const motionProps =
    interactive && !shouldReduceMotion
      ? {
          whileHover: { y: -5 },
          transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
        }
      : {};

  const MotionComponent = motion[Component] || motion.div;

  return (
    <MotionComponent
      onClick={onClick}
      {...motionProps}
      tabIndex={interactive ? 0 : undefined}
      role={interactive && onClick ? 'button' : undefined}
      onKeyDown={
        interactive && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      className={`
        rounded-card p-6 relative overflow-hidden
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red
        ${variantStyles[variant] || variantStyles.default}
        ${interactiveStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

export default Card;
