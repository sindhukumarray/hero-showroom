import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';

const ShowroomsPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Explore Authorized Showrooms',
    description: 'Find authorized dealership showrooms, addresses, amenities, and contact details.'
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
        <span className="typography-label text-brand-red">Discovery</span>
        <h1 className="typography-h1 text-surface-50">Authorized Showrooms</h1>
        <p className="typography-body max-w-2xl">
          Locate and explore premium dealership outlets across the country with verified physical locations and services.
        </p>
      </header>

      <div className="glass-surface p-8 rounded-card border border-border text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-brand-red-subtle border border-brand-red/30 flex items-center justify-center mx-auto text-brand-red font-bold">
          📍
        </div>
        <h3 className="typography-h3 text-surface-100">Showroom Discovery Engine</h3>
        <p className="typography-small max-w-md mx-auto">
          Multi-filter search, city filtering, verified badges, and interactive map locator will be connected in Phase 2.
        </p>
      </div>
    </motion.div>
  );
};

export default ShowroomsPage;
