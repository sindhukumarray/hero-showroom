import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GitCompare,
  Plus,
  Trash2,
  X,
  ArrowLeft,
  ArrowRight,
  Bike as BikeIcon,
  Check,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import { useCompare } from '../context/CompareContext';
import { formatPriceRange, formatCurrency } from '../utils/formatters';
import Container from '../components/Container';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import CompareEmptyState from '../components/compare/CompareEmptyState';

/**
 * Specification Matrix Rows Definition
 */
const SPEC_SECTIONS = [
  {
    title: 'General Overview',
    fields: [
      {
        label: 'Brand',
        getValue: (bike) => bike.brand?.name || '—'
      },
      {
        label: 'Category',
        getValue: (bike) => bike.category || '—'
      },
      {
        label: 'Ex-Showroom Price Range',
        getValue: (bike) =>
          formatPriceRange(bike.priceRange?.minPrice, bike.priceRange?.maxPrice)
      },
      {
        label: 'Fuel Type',
        getValue: (bike) => bike.fuelType || '—'
      },
      {
        label: 'Transmission',
        getValue: (bike) => bike.transmission || '—'
      },
      {
        label: 'Tagline',
        getValue: (bike) => (bike.tagline ? `"${bike.tagline}"` : '—')
      }
    ]
  },
  {
    title: 'Engine & Performance',
    fields: [
      {
        label: 'Engine Displacement',
        getValue: (bike) =>
          bike.engine?.displacementCc ? `${bike.engine.displacementCc} cc` : '—'
      },
      {
        label: 'Maximum Power',
        getValue: (bike) => bike.engine?.maxPower || '—'
      },
      {
        label: 'Maximum Torque',
        getValue: (bike) => bike.engine?.maxTorque || '—'
      },
      {
        label: 'Cooling System',
        getValue: (bike) => bike.engine?.cooling || '—'
      },
      {
        label: 'Emission Standard',
        getValue: (bike) => bike.engine?.emissionStandard || '—'
      }
    ]
  },
  {
    title: 'Mileage & Fuel Economy',
    fields: [
      {
        label: 'Estimated Mileage',
        getValue: (bike) =>
          bike.mileage?.estimatedKmpl ? `${bike.mileage.estimatedKmpl} kmpl` : '—'
      },
      {
        label: 'Certified Range',
        getValue: (bike) =>
          bike.mileage?.certifiedRangeKm ? `${bike.mileage.certifiedRangeKm} km` : '—'
      }
    ]
  },
  {
    title: 'Braking & Safety',
    fields: [
      {
        label: 'Front Brake',
        getValue: (bike) => bike.brakes?.front || '—'
      },
      {
        label: 'Rear Brake',
        getValue: (bike) => bike.brakes?.rear || '—'
      },
      {
        label: 'Anti-Lock Braking (ABS)',
        getValue: (bike) => bike.brakes?.absType || '—'
      }
    ]
  }
];

/**
 * ComparePage Component
 * Full side-by-side vehicle comparison matrix supporting 2 to 3 motorcycles.
 */
const ComparePage = () => {
  const {
    compareBikes,
    compareCount,
    canCompare,
    maxAllowed,
    isLoading,
    error,
    removeBike,
    clearCompare,
    reloadCompareBikes
  } = useCompare();

  const navigate = useNavigate();
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  const [highlightDiffs, setHighlightDiffs] = useState(false);

  useSEO({
    title: 'Motorcycle Comparison Matrix | Hero Showroom',
    description:
      'Compare motorcycle technical specifications, displacement, horsepower, mileage, braking, and pricing side-by-side.'
  });

  // Helper to determine if values in a row are different across compared bikes
  const areValuesDifferent = (field) => {
    if (compareBikes.length < 2) return false;
    const firstVal = field.getValue(compareBikes[0]);
    return compareBikes.some((b) => field.getValue(b) !== firstVal);
  };

  return (
    <Container className="py-8 md:py-14 space-y-8">
      <motion.div
        variants={accessiblePageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-8"
      >
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/80 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowLeft}
                onClick={() => navigate('/bikes')}
                className="text-xs text-muted-foreground hover:text-white px-2 py-1 -ml-2"
              >
                Catalogue
              </Button>
              <Badge variant="brand" size="sm" dot>
                Technical Evaluation
              </Badge>
            </div>
            <h1 className="typography-h1 text-surface-50 font-black tracking-tight">
              Compare Motorcycles
            </h1>
            <p className="typography-body text-sm md:text-base max-w-2xl text-muted-foreground">
              Direct head-to-head evaluation of technical parameters, engine output, fuel efficiency, and ex-showroom pricing.
            </p>
          </div>

          {compareCount > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              {compareCount >= 2 && (
                <button
                  type="button"
                  onClick={() => setHighlightDiffs(!highlightDiffs)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all
                    ${
                      highlightDiffs
                        ? 'bg-brand-red/15 text-brand-red border-brand-red shadow-sm'
                        : 'bg-surface-800/80 text-surface-200 border-border hover:text-white hover:bg-surface-800'
                    }
                  `}
                  title="Toggle highlight on differing specifications"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Highlight Diffs</span>
                </button>
              )}

              {compareCount < maxAllowed && (
                <Link to="/bikes">
                  <Button variant="secondary" size="sm" icon={Plus} className="text-xs py-1.5 px-3">
                    Add Model
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={clearCompare}
                className="text-xs text-muted-foreground hover:text-rose-400 py-1.5 px-2.5"
                title="Clear all motorcycles from comparison"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Content States */}
        {isLoading ? (
          <div className="py-16">
            <Loading type="skeleton" rows={5} />
          </div>
        ) : error ? (
          <ErrorState
            title="Comparison Data Unavailable"
            message={error}
            onRetry={reloadCompareBikes}
            retryLabel="Retry Loading"
          />
        ) : compareCount === 0 ? (
          <CompareEmptyState count={0} onExplore={() => navigate('/bikes')} />
        ) : compareCount === 1 ? (
          <div className="space-y-8">
            {/* Notice Banner */}
            <div className="flex items-center gap-3 p-4 rounded-card bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <div className="flex-1">
                <strong>1 motorcycle currently selected.</strong> Add at least one more motorcycle to unlock side-by-side comparison metrics.
              </div>
              <Link to="/bikes">
                <Button variant="primary" size="sm" icon={Plus} className="text-xs shrink-0">
                  Add 2nd Model
                </Button>
              </Link>
            </div>

            {/* Partial Matrix View with Empty Slot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Bike 1 Card */}
              <Card variant="elevated" className="p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Badge variant="brand" size="sm">
                      {compareBikes[0].brand?.name || 'Brand'}
                    </Badge>
                    <h3 className="font-display font-bold text-lg text-surface-50">
                      {compareBikes[0].name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{compareBikes[0].category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBike(compareBikes[0]._id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-surface-700/80 transition-colors"
                    aria-label={`Remove ${compareBikes[0].name} from comparison`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-full h-44 rounded-card bg-surface-900 border border-border/70 flex items-center justify-center p-4 overflow-hidden relative">
                  {compareBikes[0].images?.heroImage ? (
                    <img
                      src={compareBikes[0].images.heroImage}
                      alt={compareBikes[0].name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <BikeIcon className="w-16 h-16 text-surface-200" />
                  )}
                </div>

                <div className="pt-2 border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                    Ex-Showroom Price Range
                  </span>
                  <div className="font-display font-bold text-xl text-surface-50">
                    {formatPriceRange(
                      compareBikes[0].priceRange?.minPrice,
                      compareBikes[0].priceRange?.maxPrice
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/bikes/${compareBikes[0].slug}`} className="flex-1">
                    <Button variant="outline" size="sm" fullWidth className="text-xs">
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Empty Slot Card */}
              <div className="border-2 border-dashed border-border/80 rounded-card-lg p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-brand-red/50 transition-colors bg-surface-950/30">
                <div className="w-14 h-14 rounded-full bg-surface-800 border border-border/80 flex items-center justify-center text-muted-foreground">
                  <Plus className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-base text-surface-100">
                    Add Motorcycle #2
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Choose from our active catalogue to evaluate specs and pricing head-to-head.
                  </p>
                </div>
                <Link to="/bikes">
                  <Button variant="primary" size="sm" icon={Plus} className="text-xs">
                    Browse Catalogue
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Full Side-by-Side Matrix (2 or 3 Bikes) */
          <div className="space-y-8">
            {/* Vehicle Sticky Header Cards */}
            <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div
                className={`grid gap-4 sm:gap-6 min-w-[650px] ${
                  compareBikes.length === 2
                    ? 'grid-cols-[200px_1fr_1fr]'
                    : 'grid-cols-[200px_1fr_1fr_1fr]'
                }`}
              >
                {/* Column 0: Category / Label Header */}
                <div className="flex flex-col justify-end p-4 rounded-card bg-surface-900/60 border border-border/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Comparison Matrix
                  </span>
                  <div className="font-display font-black text-lg text-surface-50 mt-1">
                    {compareBikes.length} Models Selected
                  </div>
                  {compareBikes.length < maxAllowed && (
                    <Link to="/bikes" className="mt-3">
                      <Button variant="ghost" size="sm" icon={Plus} className="text-xs px-2 py-1 text-brand-red hover:bg-brand-red/10">
                        Add 3rd Model
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Compared Bike Cards */}
                {compareBikes.map((bike) => (
                  <Card
                    key={bike._id}
                    variant="elevated"
                    className="p-4 sm:p-5 flex flex-col justify-between space-y-4 relative group"
                  >
                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => removeBike(bike._id)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-surface-700/80 transition-colors z-10"
                      aria-label={`Remove ${bike.name} from comparison`}
                      title="Remove model"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="space-y-3">
                      {/* Brand & Category */}
                      <div className="flex items-center gap-1.5 flex-wrap pr-6">
                        <Badge variant="brand" size="sm">
                          {bike.brand?.name || 'Hero'}
                        </Badge>
                        <Badge variant="default" size="sm">
                          {bike.category}
                        </Badge>
                      </div>

                      {/* Model Name */}
                      <h3 className="font-display font-bold text-base sm:text-lg text-surface-50 line-clamp-1" title={bike.name}>
                        {bike.name}
                      </h3>

                      {/* Vehicle Image Representation */}
                      <div className="w-full h-36 rounded-card bg-surface-900 border border-border/70 flex items-center justify-center p-2 overflow-hidden relative">
                        {bike.images?.heroImage ? (
                          <img
                            src={bike.images.heroImage}
                            alt={bike.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <BikeIcon className="w-12 h-12 text-surface-200 group-hover:text-brand-red transition-colors" />
                        )}
                      </div>

                      {/* Ex-Showroom Pricing */}
                      <div className="pt-2 border-t border-border/60">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                          Ex-Showroom Price Range
                        </span>
                        <div className="font-display font-bold text-base sm:text-lg text-surface-50">
                          {formatPriceRange(bike.priceRange?.minPrice, bike.priceRange?.maxPrice)}
                        </div>
                      </div>
                    </div>

                    {/* Quick CTAs */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                      <Link to={`/bikes/${bike.slug}`} className="w-full">
                        <Button variant="outline" size="sm" fullWidth className="text-xs">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Specification Sections Table */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="min-w-[650px] space-y-6">
                {SPEC_SECTIONS.map((section, sIdx) => (
                  <div
                    key={section.title}
                    className="glass-surface rounded-card-lg border border-border/80 overflow-hidden shadow-card"
                  >
                    {/* Section Header */}
                    <div className="px-5 py-3.5 bg-surface-850 border-b border-border/80 flex items-center justify-between">
                      <h3 className="font-display font-bold text-sm text-surface-100 uppercase tracking-wider">
                        {section.title}
                      </h3>
                      <span className="text-[11px] text-muted-foreground">
                        {section.fields.length} specifications
                      </span>
                    </div>

                    {/* Field Rows */}
                    <div className="divide-y divide-border/50">
                      {section.fields.map((field, fIdx) => {
                        const isDiff = highlightDiffs && areValuesDifferent(field);

                        return (
                          <div
                            key={field.label}
                            className={`
                              grid items-center transition-colors
                              ${
                                compareBikes.length === 2
                                  ? 'grid-cols-[200px_1fr_1fr]'
                                  : 'grid-cols-[200px_1fr_1fr_1fr]'
                              }
                              ${
                                isDiff
                                  ? 'bg-brand-red/10 border-l-2 border-brand-red'
                                  : fIdx % 2 === 0
                                  ? 'bg-surface-900/30'
                                  : 'bg-transparent'
                              }
                              hover:bg-surface-800/40
                            `}
                          >
                            {/* Spec Label */}
                            <div className="p-3.5 sm:p-4 text-xs font-semibold text-muted-foreground">
                              {field.label}
                            </div>

                            {/* Spec Values for each bike */}
                            {compareBikes.map((bike) => {
                              const val = field.getValue(bike);
                              const isEmpty = !val || val === '—';

                              return (
                                <div
                                  key={bike._id}
                                  className="p-3.5 sm:p-4 text-xs sm:text-sm font-medium text-surface-100 border-l border-border/40"
                                >
                                  {isEmpty ? (
                                    <span className="text-muted-foreground/60">—</span>
                                  ) : (
                                    <span>{val}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 glass-surface rounded-card border border-border">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-display font-bold text-sm text-surface-50">
                  Ready to experience the ride?
                </h4>
                <p className="text-xs text-muted-foreground">
                  Book a complimentary test ride at your nearest authorized dealership.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/bikes">
                  <Button variant="outline" size="sm" icon={ArrowLeft} className="text-xs">
                    Back to Catalogue
                  </Button>
                </Link>
                <Link to="/showrooms">
                  <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right" className="text-xs">
                    Find Dealerships
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </Container>
  );
};

export default ComparePage;
