import React from 'react';
import { Link } from 'react-router-dom';
import { GitCompare, Plus, ArrowRight } from 'lucide-react';
import Button from '../Button';

/**
 * CompareEmptyState Component
 * Displays empty state messaging for the motorcycle comparison matrix.
 */
const CompareEmptyState = ({
  count = 0,
  onExplore,
  title,
  message
}) => {
  const isSingleBike = count === 1;

  const defaultTitle = isSingleBike
    ? 'Select One More Motorcycle to Compare'
    : 'No Motorcycles Selected for Comparison';

  const defaultMessage = isSingleBike
    ? 'You need at least 2 motorcycles to view side-by-side technical specifications, pricing, and engine telemetry.'
    : 'Choose up to 3 motorcycles from our active catalogue to compare technical specifications, performance metrics, and pricing head-to-head.';

  return (
    <div className="glass-surface p-8 sm:p-12 rounded-card-lg border border-border/80 text-center space-y-6 max-w-xl mx-auto shadow-card">
      <div className="w-16 h-16 rounded-full bg-brand-red-subtle border border-brand-red/30 flex items-center justify-center mx-auto text-brand-red shadow-glow-red/20">
        <GitCompare className="w-8 h-8" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display font-bold text-xl sm:text-2xl text-surface-50">
          {title || defaultTitle}
        </h3>
        <p className="typography-small text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          {message || defaultMessage}
        </p>
      </div>

      <div className="pt-2">
        <Link to="/bikes">
          <Button
            variant="primary"
            size="md"
            icon={isSingleBike ? Plus : ArrowRight}
            iconPosition="right"
            onClick={onExplore}
            className="shadow-glow-red/30"
          >
            {isSingleBike ? 'Choose Another Motorcycle' : 'Browse Motorcycle Catalogue'}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CompareEmptyState;
