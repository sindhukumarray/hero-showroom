import React from 'react';
import { Calendar, Clock, Building2, Bike, AlertCircle, FileText } from 'lucide-react';
import Card from '../Card';
import Badge from '../Badge';
import EmptyState from '../EmptyState';
import Loading from '../Loading';
import Button from '../Button';

const getStatusBadgeVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'success';
    case 'requested':
      return 'warning';
    case 'completed':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'outline';
  }
};

/**
 * Customer Dashboard Test Ride Activity List
 * Renders booked test rides and appointment preferences.
 */
const TestRideActivityList = ({
  testRides = [],
  isLoading = false,
  error = null,
  onRetry,
  onExplore
}) => {
  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loading text="Loading your scheduled test rides..." size="md" />
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

  if (!testRides || testRides.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No test ride requests yet"
        message="You have not scheduled any motorcycle test rides yet. Pick a flagship bike model and request a test ride at an authorized showroom."
        actionLabel={onExplore ? 'Browse Motorcycles' : undefined}
        onAction={onExplore}
        className="border-dashed py-10"
      />
    );
  }

  return (
    <div className="space-y-3">
      {testRides.map((ride) => {
        const bikeName = ride.bike?.name || 'Motorcycle Model';
        const showroomName = ride.showroom?.name || 'Dealership Hub';
        const formattedScheduleDate = ride.preferredDate
          ? new Date(ride.preferredDate).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          : 'Pending schedule';

        return (
          <Card
            key={ride._id}
            variant="default"
            className="p-5 border-border/80 hover:border-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getStatusBadgeVariant(ride.status)} size="sm">
                  {ride.status ? ride.status.toUpperCase() : 'REQUESTED'}
                </Badge>
                {ride.variant?.name && (
                  <span className="text-[11px] text-surface-200 font-medium bg-surface-800 px-2 py-0.5 rounded border border-border/40">
                    {ride.variant.name}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="font-sans font-semibold text-surface-50 text-sm md:text-base flex items-center gap-2">
                  <Bike className="w-4 h-4 text-brand-red shrink-0" aria-hidden="true" />
                  <span>{bikeName}</span>
                </h4>
                <p className="typography-small text-surface-200 text-xs flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span>{showroomName}</span>
                </p>
              </div>

              {ride.notes && (
                <p className="text-xs text-muted-foreground italic flex items-start gap-1.5 pt-1">
                  <FileText className="w-3 h-3 text-brand-red shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="line-clamp-1">"{ride.notes}"</span>
                </p>
              )}
            </div>

            <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40 flex sm:flex-col items-start sm:items-end justify-between gap-1 text-xs">
              <div className="flex items-center gap-1.5 text-surface-100 font-medium">
                <Calendar className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                <span>{formattedScheduleDate}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{ride.preferredTime ? `${ride.preferredTime} hrs` : 'Time slot pending'}</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default TestRideActivityList;
