import React from 'react';
import Container from './Container';

/**
 * Reusable Section Component
 * Enforces vertical rhythm, semantic sectioning, and structured headers.
 */
const Section = ({
  id,
  eyebrow,
  title,
  description,
  actions,
  children,
  className = '',
  containerClassName = '',
  align = 'left',
  contained = true,
  ...props
}) => {
  const alignClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto'
  }[align] || 'text-left items-start';

  const headerContent = (eyebrow || title || description || actions) && (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14 ${align === 'center' ? 'md:flex-col items-center' : ''}`}>
      <div className={`space-y-3 max-w-3xl flex flex-col ${alignClasses}`}>
        {eyebrow && (
          <span className="typography-label text-brand-red tracking-widest inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
            {eyebrow}
          </span>
        )}
        {title && (
          <h2 className="typography-h2 text-surface-50">
            {title}
          </h2>
        )}
        {description && (
          <p className="typography-body text-surface-200 text-base md:text-lg">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );

  return (
    <section id={id} className={`py-12 md:py-20 relative w-full ${className}`} {...props}>
      {contained ? (
        <Container className={containerClassName}>
          {headerContent}
          {children}
        </Container>
      ) : (
        <>
          {headerContent}
          {children}
        </>
      )}
    </section>
  );
};

export default Section;
