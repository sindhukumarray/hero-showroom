import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import Container from '../components/Container';
import Badge from '../components/Badge';

const RegisterPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Create an Account',
    description: 'Register to unlock personalized recommendations, test ride scheduling, and dealer portal tools.'
  });

  return (
    <Container className="py-14 md:py-20">
      <motion.div
        variants={accessiblePageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-md mx-auto"
      >
        <div className="glass-surface p-8 md:p-10 rounded-card border border-border shadow-card-dark space-y-6">
          <div className="text-center space-y-2">
            <Badge variant="brand" size="sm" dot>
              Membership
            </Badge>
            <h2 className="typography-h2 text-surface-50">Create Account</h2>
            <p className="typography-small">Join the premium automotive discovery network.</p>
          </div>

          <div className="p-4 rounded-card bg-surface-800/80 border border-border/80 text-center">
            <p className="typography-small text-muted-foreground text-xs">
              Account registration and verification will be implemented in Phase 3.
            </p>
          </div>
        </div>
      </motion.div>
    </Container>
  );
};

export default RegisterPage;
