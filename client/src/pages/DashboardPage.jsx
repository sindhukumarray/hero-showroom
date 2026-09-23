import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import Container from '../components/Container';
import Badge from '../components/Badge';

const DashboardPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Customer Dashboard',
    description: 'Track your scheduled test rides, favorite motorbikes, and showroom inquiries.'
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
            User Portal
          </Badge>
          <h1 className="typography-h1 text-surface-50">User Dashboard</h1>
          <p className="typography-body max-w-2xl">
            Central hub for tracking booked test rides, dealer responses, and saved models.
          </p>
        </header>

        <div className="glass-surface p-10 rounded-card border border-border text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-brand-red-subtle border border-brand-red/30 flex items-center justify-center mx-auto text-brand-red font-bold text-2xl">
            📊
          </div>
          <h3 className="typography-h3 text-surface-100">User Dashboard Experience</h3>
          <p className="typography-small max-w-md mx-auto">
            Test ride bookings, favorites list, and inquiry tracking will be connected in Phase 5.
          </p>
        </div>
      </motion.div>
    </Container>
  );
};

export default DashboardPage;
