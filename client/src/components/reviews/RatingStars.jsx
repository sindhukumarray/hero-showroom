import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/**
 * RatingStars
 * Interactive or display-only 1-5 star rating component.
 *
 * Props:
 *   value {number}   - Current selected rating (0 = none)
 *   onChange {fn}    - If provided, renders as interactive selector
 *   size {string}    - 'sm' | 'md' | 'lg'
 *   label {string}   - Accessible group label
 *   readonly {bool}  - If true, renders display-only stars
 */
const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
};

const RatingStars = ({
  value = 0,
  onChange = null,
  size = 'md',
  label = 'Rating',
  readonly = false,
  className = ''
}) => {
  const [hovered, setHovered] = useState(0);
  const shouldReduceMotion = usePrefersReducedMotion();
  const isInteractive = !readonly && typeof onChange === 'function';
  const displayValue = isInteractive && hovered > 0 ? hovered : value;
  const iconSize = sizeMap[size] || sizeMap.md;

  const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (readonly) {
    return (
      <div
        className={`flex items-center gap-0.5 ${className}`}
        aria-label={`${label}: ${value} out of 5 stars`}
        role="img"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= value;
          // Support fractional display with partial fill for display value
          const halfFilled = !filled && star - 0.5 <= value;
          return (
            <Star
              key={star}
              className={`
                ${iconSize} shrink-0
                ${filled
                  ? 'text-amber-400 fill-amber-400'
                  : halfFilled
                    ? 'text-amber-400 fill-amber-400/50'
                    : 'text-surface-600 fill-surface-600/20'}
              `}
              aria-hidden="true"
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role="radiogroup"
      aria-label={label}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isSelected = star <= value;
        const isHighlighted = star <= displayValue;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star !== 1 ? 's' : ''} — ${ratingLabels[star - 1]}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => !shouldReduceMotion && setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(0)}
            className={`
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
              focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900
              rounded p-0.5
              ${shouldReduceMotion ? '' : 'transition-transform duration-100 hover:scale-110 active:scale-95'}
            `}
          >
            <Star
              className={`
                ${iconSize} pointer-events-none
                ${shouldReduceMotion ? '' : 'transition-colors duration-150'}
                ${isHighlighted
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                  : 'text-surface-500 fill-surface-500/10'}
                ${isSelected && !isHighlighted ? 'text-amber-400 fill-amber-400' : ''}
              `}
              aria-hidden="true"
            />
          </button>
        );
      })}

      {displayValue > 0 && (
        <span
          className={`
            ml-2 text-xs font-medium text-amber-400
            ${shouldReduceMotion ? '' : 'transition-opacity duration-150'}
          `}
          aria-live="polite"
          aria-atomic="true"
        >
          {ratingLabels[displayValue - 1]}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
