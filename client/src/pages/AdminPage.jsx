import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import Container from '../components/Container';
import Badge from '../components/Badge';

const AdminPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Platform Management Console',
    description: 'Administrative portal for dealership management, catalogue updates, and system telemetry.'
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
            Administration
          </Badge>
          <h1 className="typography-h1 text-surface-50">Admin Console</h1>
          <p className="typography-body max-w-2xl">
            Dealer onboarding, showroom verification, catalogue synchronization, and lead distribution control center.
          </p>
        </header>

        <div className="glass-surface p-10 rounded-card border border-border text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-brand-red-subtle border border-brand-red/30 flex items-center justify-center mx-auto text-brand-red font-bold text-2xl">
            🛡️
          </div>
          <h3 className="typography-h3 text-surface-100">Administrator Management Suite</h3>
          <p className="typography-small max-w-md mx-auto">
            Showroom approvals, bike inventory CRUD, analytics charts, and role-based permissions will be implemented in Phase 6.
          </p>
        </div>
      </motion.div>
    </Container>
  );
};

export default AdminPage;
