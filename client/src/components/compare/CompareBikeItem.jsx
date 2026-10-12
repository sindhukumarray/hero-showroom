import React, { useState } from 'react';
import { X, Bike as BikeIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * CompareBikeItem Component
 * Renders a compact vehicle chip within the floating CompareBar.
 */
const CompareBikeItem = ({ bike, onRemove }) => {
  const [imgError, setImgError] = useState(false);

  if (!bike) return null;

  const minPrice = bike.priceRange?.minPrice;
  const heroImage = bike.images?.heroImage;

  return (
    <div className="relative group flex items-center gap-2.5 bg-surface-800/90 hover:bg-surface-800 border border-border/80 hover:border-brand-red/40 rounded-card p-2 pr-3 transition-all duration-200 min-w-[150px] sm:min-w-[180px] max-w-[220px]">
      {/* Thumbnail or Fallback Icon */}
      <div className="w-10 h-10 rounded-lg bg-surface-900 border border-border/60 flex items-center justify-center shrink-0 overflow-hidden">
        {heroImage && !imgError ? (
          <img
            src={heroImage}
            alt={bike.name || 'Motorcycle'}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <BikeIcon className="w-5 h-5 text-surface-200 group-hover:text-brand-red transition-colors" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="font-display font-bold text-xs text-surface-50 truncate" title={bike.name}>
          {bike.name}
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <span>{bike.category || 'Motorcycle'}</span>
          {minPrice !== undefined && minPrice !== null && (
            <>
              <span>•</span>
              <span className="text-surface-200 font-medium">{formatCurrency(minPrice)}</span>
            </>
          )}
        </div>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(bike._id);
        }}
        aria-label={`Remove ${bike.name || 'bike'} from comparison`}
        className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-brand-red hover:bg-brand-red-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};

export default CompareBikeItem;
