import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';

const RegisterPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Create an Account',
    description: 'Register to unlock personalized recommendations, test ride scheduling, and dealer portal tools.'
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
          <span className="typography-label text-brand-red">Membership</span>
          <h2 className="typography-h2 text-surface-50">Create Account</h2>
          <p className="typography-small">Join the premium automotive discovery network.</p>
        </div>

        <div className="p-4 rounded-card bg-surface-800/80 border border-border/80 text-center">
          <p className="typography-small text-muted-foreground">
            Account registration and verification will be implemented in Phase 3.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterPage;
