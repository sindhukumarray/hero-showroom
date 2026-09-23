import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';

const NotFoundPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: '404 - Page Not Found',
    description: 'The requested page could not be located on the platform.'
  });

  return (
    <motion.div
      variants={accessiblePageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-lg mx-auto my-20 text-center space-y-6"
    >
      <div className="text-7xl font-extrabold text-brand-red font-display">404</div>
      <h2 className="typography-h2 text-surface-50">Page Not Found</h2>
      <p className="typography-body text-surface-200">
        The destination you are attempting to reach does not exist or has been relocated.
      </p>
      <div>
        <a
          href="/"
          className="typography-button inline-flex px-6 py-3 rounded-card bg-brand-red hover:bg-brand-red-hover text-white transition-all shadow-glow-red"
        >
          Return to Platform Home
        </a>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;
