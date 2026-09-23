import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import Container from '../components/Container';
import Button from '../components/Button';

const NotFoundPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: '404 - Destination Not Found',
    description: 'The requested route could not be located on the platform.'
  });

  return (
    <Container className="py-20 md:py-28 text-center">
      <motion.div
        variants={accessiblePageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-md mx-auto space-y-6"
      >
        <div className="font-display font-black text-7xl md:text-8xl text-brand-red">
          404
        </div>
        <div className="space-y-2">
          <h2 className="typography-h2 text-surface-50">Page Not Found</h2>
          <p className="typography-body text-surface-200 text-sm md:text-base">
            The showroom destination or model page you requested could not be located.
          </p>
        </div>
        <div className="pt-2">
          <NavLink to="/">
            <Button variant="primary" size="md">
              Return to Platform Home
            </Button>
          </NavLink>
        </div>
      </motion.div>
    </Container>
  );
};

export default NotFoundPage;
