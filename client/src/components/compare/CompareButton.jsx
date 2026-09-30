import React from 'react';
import { GitCompare, Check } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import Button from '../Button';

/**
 * CompareButton Component
 * Reusable CTA for toggling a motorcycle in/out of the comparison matrix.
 * Visual active state, accessible ARIA attributes, and max-3 constraint feedback.
 */
const CompareButton = ({
  bike,
  variant = 'outline',
  size = 'sm',
  fullWidth = false,
  className = '',
  showText = true,
  disabled = false
}) => {
  const { isInCompare, toggleBike, isFull } = useCompare();

  if (!bike || !bike._id) return null;

  const isSelected = isInCompare(bike._id);
  const isLimitReached = isFull && !isSelected;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLimitReached) {
      return;
    }

    toggleBike(bike);
  };

  const buttonTitle = isSelected
    ? `Remove ${bike.name || 'bike'} from comparison`
    : isLimitReached
    ? 'Comparison limit reached (max 3 bikes)'
    : `Add ${bike.name || 'bike'} to comparison`;

  return (
    <Button
      type="button"
      variant={isSelected ? 'secondary' : variant}
      size={size}
      fullWidth={fullWidth}
      icon={isSelected ? Check : GitCompare}
      onClick={handleClick}
      disabled={disabled || isLimitReached}
      aria-pressed={isSelected}
      aria-label={buttonTitle}
      title={buttonTitle}
      className={`
        transition-all duration-200 select-none
        ${
          isSelected
            ? 'bg-brand-red/15 text-brand-red border-brand-red/50 hover:bg-brand-red/25 hover:border-brand-red shadow-sm'
            : isLimitReached
            ? 'opacity-50 cursor-not-allowed text-muted-foreground'
            : 'hover:text-brand-red hover:border-brand-red/40'
        }
        ${className}
      `}
    >
      {showText && (
        <span className="font-semibold text-xs tracking-wide">
          {isSelected ? 'In Compare' : 'Add to Compare'}
        </span>
      )}
    </Button>
  );
};

export default CompareButton;
