import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import Card from '../Card';
import Badge from '../Badge';

/**
 * Dashboard Summary Card
 * Interactive activity metric widget linking directly to its respective dashboard section.
 *
 * @param {object} props
 * @param {string} props.title - Card title (e.g. "Test Rides")
 * @param {number|string} props.count - Metric value
 * @param {string} [props.subtitle] - Helper text below count
 * @param {React.ElementType} props.icon - Lucide icon component
 * @param {string} [props.badge] - Optional status indicator text
 * @param {string} [props.badgeVariant='brand'] - Badge color variant
 * @param {function} props.onClick - Navigation callback
 * @param {boolean} [props.isLoading=false] - Loading state toggle
 * @param {string} [props.ariaLabel] - Accessibility label
 */
const DashboardSummaryCard = ({
  title,
  count = 0,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = 'brand',
  onClick,
  isLoading = false,
  ariaLabel
}) => {
  return (
    <Card
      variant="default"
      interactive={!isLoading}
      onClick={!isLoading ? onClick : undefined}
      aria-label={ariaLabel || `Navigate to ${title}`}
      className="p-5 border-border/80 hover:border-brand-red/50 transition-all flex flex-col justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red select-none"
    >
      <div className="space-y-3">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-card bg-surface-800 border border-border flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-colors">
            {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
          </div>

          {badge && !isLoading && (
            <Badge variant={badgeVariant} size="sm" className="text-[11px] font-medium tracking-wide">
              {badge}
            </Badge>
          )}
        </div>

        {/* Value and Title */}
        <div className="space-y-1">
          {isLoading ? (
            <div className="h-8 w-16 bg-surface-800 animate-pulse rounded" />
          ) : (
            <div className="typography-h1 text-2xl md:text-3xl font-display font-extrabold text-surface-50">
              {count}
            </div>
          )}
          <h3 className="typography-body font-semibold text-surface-100 text-sm md:text-base group-hover:text-brand-red transition-colors flex items-center gap-1.5">
            <span>{title}</span>
            <ArrowUpRight
              className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </h3>
          {subtitle && (
            <p className="typography-small text-surface-200 text-xs">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground group-hover:text-brand-red transition-colors">
        <span className="font-medium">View details</span>
        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
      </div>
    </Card>
  );
};

export default DashboardSummaryCard;
