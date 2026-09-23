import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import Container from '../components/Container';
import Badge from '../components/Badge';

const ShowroomsPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Explore Authorized Showrooms',
    description: 'Find authorized dealership showrooms, addresses, amenities, and contact details.'
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
            Dealership Discovery
          </Badge>
          <h1 className="typography-h1 text-surface-50">Authorized Showrooms</h1>
          <p className="typography-body max-w-2xl">
            Locate and explore official dealership outlets across the country with verified physical locations and services.
          </p>
        </header>

        <div className="glass-surface p-10 rounded-card border border-border text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-brand-red-subtle border border-brand-red/30 flex items-center justify-center mx-auto text-brand-red font-bold text-2xl">
            📍
          </div>
          <h3 className="typography-h3 text-surface-100">Showroom Discovery Engine</h3>
          <p className="typography-small max-w-md mx-auto">
            Multi-filter search, city filtering, verified badges, and interactive map locator will be connected in Phase 2.
          </p>
        </div>
      </motion.div>
    </Container>
  );
};

export default ShowroomsPage;
