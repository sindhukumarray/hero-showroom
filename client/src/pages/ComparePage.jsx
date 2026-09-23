import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import Container from '../components/Container';
import Badge from '../components/Badge';

const ComparePage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Side-by-Side Model Comparison',
    description: 'Compare motorcycle specifications, engine output, mileage, and features head-to-head.'
  });

  return (
    <Container className="py-10 md:py-14">
      <motion.div
        variants={accessiblePageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-8"
      >
        <header className="space-y-3">
          <Badge variant="brand" size="sm" dot>
            Vehicle Evaluation
          </Badge>
          <h1 className="typography-h1 text-surface-50">Compare Models</h1>
          <p className="typography-body max-w-2xl">
            Side-by-side specification evaluation, performance metrics, pricing comparison, and feature diff analysis.
          </p>
        </header>

        <div className="glass-surface p-10 rounded-card border border-border text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-brand-red-subtle border border-brand-red/30 flex items-center justify-center mx-auto text-brand-red font-bold text-2xl">
            ⚖️
          </div>
          <h3 className="typography-h3 text-surface-100">Comparison Matrix Engine</h3>
          <p className="typography-small max-w-md mx-auto">
            Interactive multi-vehicle matrix, highlight differences feature, and PDF comparison export will be integrated in Phase 4.
          </p>
        </div>
      </motion.div>
    </Container>
  );
};

export default ComparePage;
