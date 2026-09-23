import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';

const AdminPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Platform Management Console',
    description: 'Administrative portal for dealership management, catalogue updates, and system telemetry.'
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
        <span className="typography-label text-brand-red">Administration</span>
        <h1 className="typography-h1 text-surface-50">Admin Console</h1>
        <p className="typography-body max-w-2xl">
          Dealer onboarding, showroom verification, catalogue synchronization, and lead distribution control center.
        </p>
      </header>

      <div className="glass-surface p-8 rounded-card border border-border text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-brand-red-subtle border border-brand-red/30 flex items-center justify-center mx-auto text-brand-red font-bold">
          🛡️
        </div>
        <h3 className="typography-h3 text-surface-100">Administrator Management Suite</h3>
        <p className="typography-small max-w-md mx-auto">
          Showroom approvals, bike inventory CRUD, analytics charts, and role-based permissions will be implemented in Phase 6.
        </p>
      </div>
    </motion.div>
  );
};

export default AdminPage;
