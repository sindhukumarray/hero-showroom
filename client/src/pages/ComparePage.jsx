import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';

const ComparePage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Side-by-Side Model Comparison',
    description: 'Compare motorcycle specifications, engine output, mileage, and features head-to-head.'
  });

  return (
    <motion.div
      variants={accessiblePageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      <header className="space-y-3">
        <span className="typography-label text-brand-red">Comparison</span>
        <h1 className="typography-h1 text-surface-50">Compare Models</h1>
        <p className="typography-body max-w-2xl">
          Side-by-side specification evaluation, performance metrics, pricing comparison, and feature diff analysis.
        </p>
      </header>

      <div className="glass-surface p-8 rounded-card border border-border text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-brand-red-subtle border border-brand-red/30 flex items-center justify-center mx-auto text-brand-red font-bold">
          ⚖️
        </div>
        <h3 className="typography-h3 text-surface-100">Comparison Matrix Engine</h3>
        <p className="typography-small max-w-md mx-auto">
          Interactive multi-vehicle matrix, highlight differences feature, and PDF comparison export will be integrated in Phase 4.
        </p>
      </div>
    </motion.div>
  );
};

export default ComparePage;
