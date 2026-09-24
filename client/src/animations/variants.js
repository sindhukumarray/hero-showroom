/**
 * Framer Motion Reusable Automotive Animation Foundation
 * Includes full support for prefers-reduced-motion.
 */

// Timing and Easing Presets
export const TRANSITION_PRESETS = {
  smooth: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  cinematic: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  quick: { duration: 0.25, ease: 'easeOut' },
  spring: { type: 'spring', stiffness: 350, damping: 25 }
};

// Entrance Variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: (custom = {}) => ({
    opacity: 1,
    transition: { ...TRANSITION_PRESETS.smooth, delay: custom.delay || 0 }
  })
};

export const slideUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (custom = {}) => ({
    opacity: 1,
    y: 0,
    transition: { ...TRANSITION_PRESETS.smooth, delay: custom.delay || 0 }
  })
};

export const slideDown = {
  hidden: { opacity: 0, y: -28 },
  visible: (custom = {}) => ({
    opacity: 1,
    y: 0,
    transition: { ...TRANSITION_PRESETS.smooth, delay: custom.delay || 0 }
  })
};

export const slideLeft = {
  hidden: { opacity: 0, x: 30 },
  visible: (custom = {}) => ({
    opacity: 1,
    x: 0,
    transition: { ...TRANSITION_PRESETS.smooth, delay: custom.delay || 0 }
  })
};

export const slideRight = {
  hidden: { opacity: 0, x: -30 },
  visible: (custom = {}) => ({
    opacity: 1,
    x: 0,
    transition: { ...TRANSITION_PRESETS.smooth, delay: custom.delay || 0 }
  })
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: (custom = {}) => ({
    opacity: 1,
    scale: 1,
    transition: { ...TRANSITION_PRESETS.smooth, delay: custom.delay || 0 }
  })
};

// Interactive Variants
export const cardHover = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -6,
    scale: 1.015,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
  tap: {
    scale: 0.985,
    transition: { duration: 0.1 }
  }
};

export const ctaInteraction = {
  initial: { scale: 1 },
  hover: {
    scale: 1.04,
    transition: { duration: 0.25, ease: 'easeOut' }
  },
  tap: {
    scale: 0.96,
    transition: { duration: 0.1 }
  }
};

export const imageZoom = {
  initial: { scale: 1 },
  hover: {
    scale: 1.06,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

// Page Transition Variants
export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: 'easeInOut' }
  }
};

// Cinematic Hero Animation Foundation
export const heroContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export const heroImageReveal = {
  hidden: { opacity: 0, scale: 1.08, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] }
  }
};

export const heroHeadline = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
  }
};

/**
 * Strips spatial translations/scaling for users who prefer reduced motion.
 * Returns opacity-only transitions.
 */
export const getAccessibleVariant = (variant, shouldReduceMotion) => {
  if (!shouldReduceMotion) return variant;

  const sanitizeState = (state) => {
    if (!state || typeof state !== 'object') return state;
    const { y, x, scale, rotate, filter, ...safeProps } = state;
    return {
      ...safeProps,
      transition: { duration: 0.15 }
    };
  };

  const accessibleVariant = {};
  for (const [key, val] of Object.entries(variant)) {
    if (typeof val === 'function') {
      accessibleVariant[key] = (custom) => sanitizeState(val(custom));
    } else {
      accessibleVariant[key] = sanitizeState(val);
    }
  }
  return accessibleVariant;
};
