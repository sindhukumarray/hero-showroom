import React from 'react';
import { Mail, Building2, Bike, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import Card from '../Card';
import Badge from '../Badge';
import EmptyState from '../EmptyState';
import Loading from '../Loading';
import Button from '../Button';

const getStatusBadgeVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'new':
      return 'brand';
    case 'contacted':
      return 'info';
    case 'qualified':
      return 'warning';
    case 'converted':
      return 'success';
    case 'closed':
    default:
      return 'outline';
  }
};

/**
 * Customer Dashboard Lead Activity List
 * Renders submitted showroom and motorcycle enquiries.
 */
const LeadActivityList = ({
  leads = [],
  isLoading = false,
  error = null,
  onRetry,
  onExplore
}) => {
  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loading text="Loading your submitted enquiries..." size="md" />
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

  if (!leads || leads.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="No enquiries yet"
        message="You have not submitted any dealership enquiries or model requests yet. Connect with authorized showrooms to receive exclusive price quotes."
        actionLabel={onExplore ? 'Explore Motorcycles' : undefined}
        onAction={onExplore}
        className="border-dashed py-10"
      />
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => {
        const bikeName = lead.bike?.name || 'Selected Motorcycle';
        const showroomName = lead.showroom?.name || 'Authorized Dealership';
        const formattedDate = lead.createdAt
          ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          : 'Recently';

        return (
          <Card
            key={lead._id}
            variant="default"
            className="p-5 border-border/80 hover:border-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getStatusBadgeVariant(lead.status)} size="sm">
                  {lead.status ? lead.status.toUpperCase() : 'NEW'}
                </Badge>
                {lead.source && (
                  <Badge variant="outline" size="sm" className="capitalize text-[10px]">
                    via {lead.source}
                  </Badge>
                )}
                {lead.variant?.name && (
                  <span className="text-[11px] text-surface-200 font-medium bg-surface-800 px-2 py-0.5 rounded border border-border/40">
                    {lead.variant.name}
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

              {lead.message && (
                <p className="text-xs text-muted-foreground italic flex items-start gap-1.5 pt-1">
                  <MessageSquare className="w-3 h-3 text-brand-red shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="line-clamp-1">"{lead.message}"</span>
                </p>
              )}
            </div>

            <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40 flex sm:flex-col items-center sm:items-end justify-between gap-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{formattedDate}</span>
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default LeadActivityList;
