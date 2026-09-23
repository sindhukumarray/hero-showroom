import React from 'react';

/**
 * Reusable Container Layout Component
 * Standardizes max-width and horizontal gutters across viewports.
 */
const Container = ({
  children,
  className = '',
  as: Component = 'div',
  clean = false,
  ...props
}) => {
  const baseClasses = clean
    ? 'w-full'
    : 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  return (
    <Component className={`${baseClasses} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export default Container;
