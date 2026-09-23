import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';

const LoginPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Customer & Dealer Sign In',
    description: 'Access your saved bikes, booked test rides, and showroom dashboard.'
  });

  return (
    <motion.div
      variants={accessiblePageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-md mx-auto my-12"
    >
      <div className="glass-surface p-8 rounded-card border border-border shadow-card-dark space-y-6">
        <div className="text-center space-y-2">
          <span className="typography-label text-brand-red">Portal Access</span>
          <h2 className="typography-h2 text-surface-50">Welcome Back</h2>
          <p className="typography-small">Sign in to manage test rides and showroom operations.</p>
        </div>

        <div className="p-4 rounded-card bg-surface-800/80 border border-border/80 text-center">
          <p className="typography-small text-muted-foreground">
            Authentication and JWT sessions will be implemented in Phase 3.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
