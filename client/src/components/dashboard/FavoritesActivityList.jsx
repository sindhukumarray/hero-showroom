import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Bike, MapPin, ArrowUpRight, AlertCircle } from 'lucide-react';
import Card from '../Card';
import Badge from '../Badge';
import EmptyState from '../EmptyState';
import Loading from '../Loading';
import Button from '../Button';
import FavoriteButton from '../favorites/FavoriteButton';

/**
 * Dashboard Favorites Activity List
 * Renders a customer's saved bike models and showrooms with quick navigation links.
 */
const FavoritesActivityList = ({
  favorites = [],
  isLoading = false,
  error = null,
  onRetry,
  onExplore,
  onRemoved
}) => {
  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loading text="Loading your saved items..." size="md" />
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

  if (!favorites || favorites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No saved items yet"
        message="You have not saved any bikes or showrooms yet. Browse the catalogue and tap the heart icon to build your wishlist."
        actionLabel={onExplore ? 'Explore Motorcycles' : undefined}
        onAction={onExplore}
        className="border-dashed py-10"
      />
    );
  }

  return (
    <div className="space-y-3">
      {favorites.map((fav) => {
        const isBike = fav.entityType === 'bike';
        const entity = isBike ? fav.bike : fav.showroom;
        const name = entity?.name || (isBike ? 'Saved Motorcycle' : 'Saved Showroom');
        const href = isBike
          ? `/bikes/${entity?.slug || ''}`
          : `/showrooms/${entity?.slug || ''}`;
        const label = isBike ? 'Motorcycle' : 'Showroom';
        const Icon = isBike ? Bike : MapPin;

        const formattedDate = fav.createdAt
          ? new Date(fav.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          : 'Recently';

        // Secondary descriptor
        let descriptor = '';
        if (isBike) {
          descriptor = entity?.category || '';
        } else {
          const area = entity?.address?.area || entity?.address?.fullAddress || '';
          descriptor = area;
        }

        return (
          <Card
            key={fav._id}
            variant="default"
            className="p-5 border-border/80 hover:border-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={isBike ? 'brand' : 'info'}
                  size="sm"
                  className="text-[10px] flex items-center gap-1"
                >
                  <Icon className="w-3 h-3" aria-hidden="true" />
                  {label}
                </Badge>
              </div>

              <div className="space-y-0.5">
                <Link
                  to={href}
                  className="group inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red rounded"
                >
                  <h4 className="font-sans font-semibold text-surface-50 text-sm md:text-base group-hover:text-brand-red transition-colors flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-brand-red shrink-0" aria-hidden="true" />
                    <span>{name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </h4>
                </Link>
                {descriptor && (
                  <p className="typography-small text-surface-200 text-xs pl-[22px]">
                    {descriptor}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40 flex sm:flex-col items-center sm:items-end justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Saved {formattedDate}
              </span>
              {/* Inline remove toggle — triggers parent refresh via onRemoved callback */}
              <FavoriteButton
                entityType={fav.entityType}
                entityId={isBike ? entity?._id : entity?._id}
                size="sm"
                showLabel
                className="shrink-0"
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default FavoritesActivityList;
