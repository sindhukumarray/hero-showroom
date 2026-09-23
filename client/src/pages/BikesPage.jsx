import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import Container from '../components/Container';
import Badge from '../components/Badge';

const BikesPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Flagship Motorcycle Catalogue',
    description: 'Browse the latest motorcycle models, engine specs, pricing, and color variants.'
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
            Model Catalogue
          </Badge>
          <h1 className="typography-h1 text-surface-50">Flagship Motorcycles</h1>
          <p className="typography-body max-w-2xl">
            Detailed technical specifications, performance metrics, high-resolution visual galleries, and on-road pricing estimates.
          </p>
        </header>

        <div className="glass-surface p-10 rounded-card border border-border text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-brand-red-subtle border border-brand-red/30 flex items-center justify-center mx-auto text-brand-red font-bold text-2xl">
            🏍️
          </div>
          <h3 className="typography-h3 text-surface-100">Model Showcase & Specs Engine</h3>
          <p className="typography-small max-w-md mx-auto">
            Full motorcycle catalogue data, 360-degree views, and specification filters will be connected in Phase 2.
          </p>
        </div>
      </motion.div>
    </Container>
  );
};

export default BikesPage;
