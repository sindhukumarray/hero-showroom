import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

/**
 * Hook to detect whether the user has requested reduced motion.
 * Wraps Framer Motion's native useReducedMotion for application-wide consistency.
 */
export const usePrefersReducedMotion = () => {
  const shouldReduceMotion = useFramerReducedMotion();
  return Boolean(shouldReduceMotion);
};

export default usePrefersReducedMotion;
