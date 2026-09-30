import React from 'react';
import { Tag, AlertCircle, Sparkles } from 'lucide-react';
import EmptyState from '../EmptyState';
import Loading from '../Loading';
import Button from '../Button';
import OfferCard from '../offers/OfferCard';

/**
 * Customer Dashboard Offers Activity List
 * Renders available promotional discounts, exchange benefits, and cashback offers.
 *
 * @param {object} props
 * @param {Array} props.offers - List of promotional offer objects
 * @param {boolean} [props.isLoading=false] - Loading state toggle
 * @param {string|null} [props.error=null] - Error message string
 * @param {function} [props.onRetry] - Retry callback on error
 * @param {function} [props.onExplore] - Explore action when empty
 * @param {function} [props.onEnquire] - Optional claim/enquire callback
 */
const OffersActivityList = ({
  offers = [],
  isLoading = false,
  error = null,
  onRetry,
  onExplore,
  onEnquire
}) => {
  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loading text="Loading active promotional offers..." size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-card bg-surface-900 border border-rose-800/60 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" aria-hidden="true" />
        <p className="typography-small text-rose-200 text-sm">{error}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <EmptyState
        icon={Tag}
        title="No promotional offers right now"
        message="There are currently no active promotional campaigns. Check back soon for exclusive festive discounts, cashback deals, and exchange bonuses across authorized Hero dealerships."
        actionLabel={onExplore ? 'Explore Motorcycles' : undefined}
        onAction={onExplore}
        className="border-dashed py-10"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="typography-h3 text-surface-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-red" aria-hidden="true" />
            <span>Active Promotional Campaigns</span>
          </h3>
          <p className="typography-small text-muted-foreground text-xs">
            Browse current dealer promotions, seasonal finance bonuses, and model-specific benefits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <OfferCard key={offer._id} offer={offer} onEnquire={onEnquire} />
        ))}
      </div>
    </div>
  );
};

export default OffersActivityList;
