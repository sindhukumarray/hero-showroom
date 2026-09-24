import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, ArrowRight, Building2, Bike as BikeIcon, ShieldCheck } from 'lucide-react';
import Card from '../Card';
import Badge from '../Badge';
import Button from '../Button';
import { formatCurrency } from '../../utils/formatters';

/**
 * Reusable Offer Showcase Card Component
 */
const OfferCard = ({ offer, onEnquire }) => {
  if (!offer) return null;

  const validUntilFormatted = offer.validUntil
    ? new Date(offer.validUntil).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Limited Period';

  const typeVariantMap = {
    discount: 'brand',
    cashback: 'success',
    exchange: 'warning',
    accessories: 'default',
    service: 'default',
    special: 'brand'
  };

  const badgeVariant = typeVariantMap[offer.offerType] || 'brand';

  return (
    <Card
      variant="elevated"
      hover
      className="flex flex-col justify-between h-full border-border/80 group overflow-hidden"
    >
      <div className="space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant={badgeVariant} size="sm" className="capitalize">
            <Tag className="w-3 h-3 mr-1" aria-hidden="true" />
            {offer.offerType}
          </Badge>
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            Till {validUntilFormatted}
          </span>
        </div>

        {/* Title & Value Callout */}
        <div className="space-y-1.5">
          <Link
            to={`/offers/${offer._id}`}
            className="block font-display font-bold text-surface-50 text-lg group-hover:text-brand-red transition-colors line-clamp-2"
          >
            {offer.title}
          </Link>
          {offer.discountValue > 0 && (
            <div className="text-xl font-black text-brand-red font-display">
              Benefits up to {formatCurrency(offer.discountValue)}
            </div>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {offer.description}
        </p>

        {/* Association Pills */}
        <div className="pt-2 border-t border-border/40 space-y-2 text-xs">
          {offer.bike?.name && (
            <div className="flex items-center gap-2 text-surface-200">
              <BikeIcon className="w-3.5 h-3.5 text-brand-red shrink-0" aria-hidden="true" />
              <span className="truncate">
                Applicable on <strong>{offer.bike.name}</strong>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="truncate">
              {offer.showroom?.name ? (
                <span>Exclusive at <strong>{offer.showroom.name}</strong></span>
              ) : (
                <span>All Authorized Dealerships</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-5 mt-4 border-t border-border/60 flex items-center gap-2">
        <Link to={`/offers/${offer._id}`} className="flex-1">
          <Button variant="secondary" size="sm" fullWidth icon={ArrowRight}>
            View Details
          </Button>
        </Link>
        {onEnquire && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onEnquire(offer)}
            className="flex-1"
          >
            Claim Offer
          </Button>
        )}
      </div>
    </Card>
  );
};

export default OfferCard;
