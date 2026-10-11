import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Trash2, Plus } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import CompareBikeItem from './CompareBikeItem';
import Button from '../Button';
import Badge from '../Badge';

/**
 * CompareBar Component
 * Persistent floating bottom drawer that displays currently selected motorcycles
 * and provides navigation to the side-by-side comparison matrix.
 */
const CompareBar = () => {
  const {
    compareBikes,
    compareCount,
    canCompare,
    maxAllowed,
    removeBike,
    clearCompare
  } = useCompare();

  const location = useLocation();
  const shouldReduceMotion = usePrefersReducedMotion();

  // If no bikes are selected, hide completely
  if (compareCount === 0) {
    return null;
  }

  const isComparePage = location.pathname === '/compare';

  return (
    <AnimatePresence>
      <motion.aside
        role="region"
        aria-label="Motorcycle comparison selection"
        initial={shouldReduceMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-border shadow-2xl py-3 px-4 sm:px-6"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Left: Section Header & Count */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                <GitCompare className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xs sm:text-sm text-surface-50 uppercase tracking-wider">
                  Compare
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  {canCompare ? 'Ready for evaluation' : 'Select at least 2 models'}
                </span>
              </div>
            </div>

            <Badge variant={canCompare ? 'brand' : 'default'} size="sm" className="font-bold text-xs">
              {compareCount} / {maxAllowed}
            </Badge>
          </div>

          {/* Center: Selected Bike Chips & Add Slot */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto w-full md:w-auto py-1 scrollbar-none justify-start md:justify-center">
            {compareBikes.map((bike) => (
              <CompareBikeItem
                key={bike._id}
                bike={bike}
                onRemove={removeBike}
              />
            ))}

            {/* Empty Slot (+ Add Model) if under maximum */}
            {compareCount < maxAllowed && (
              <Link
                to="/bikes"
                className="flex items-center gap-2 border border-dashed border-border/80 hover:border-brand-red/50 rounded-card p-2 px-3 text-muted-foreground hover:text-white bg-surface-950/40 hover:bg-surface-800/40 transition-colors shrink-0 text-xs"
                title="Add another motorcycle from catalogue"
              >
                <div className="w-7 h-7 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground group-hover:text-brand-red">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium text-xs hidden sm:inline">Add Model</span>
              </Link>
            )}
          </div>

          {/* Right: Actions Group */}
          <div className="flex items-center justify-end w-full md:w-auto gap-2.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={clearCompare}
              className="text-xs text-muted-foreground hover:text-rose-400 py-1.5 px-2.5"
              title="Clear all selected motorcycles"
            >
              <span className="hidden sm:inline">Clear</span>
            </Button>

            {!isComparePage ? (
              <Link to="/compare" className="flex-1 sm:flex-none">
                <Button
                  variant={canCompare ? 'primary' : 'secondary'}
                  size="sm"
                  icon={GitCompare}
                  iconPosition="right"
                  disabled={!canCompare}
                  fullWidth
                  className={`text-xs py-1.5 px-4 font-bold shadow-sm ${
                    canCompare ? 'shadow-glow-red/30' : 'opacity-60 cursor-not-allowed'
                  }`}
                  title={canCompare ? 'Compare selected motorcycles' : 'Select at least 2 motorcycles to compare'}
                >
                  <span>Compare ({compareCount})</span>
                </Button>
              </Link>
            ) : (
              <Badge variant="brand" size="md" className="font-bold text-xs py-1.5 px-3">
                Viewing Matrix
              </Badge>
            )}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

export default CompareBar;
