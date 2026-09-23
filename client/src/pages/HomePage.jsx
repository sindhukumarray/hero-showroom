import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';

const HomePage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Experience Premium Automotive Showrooms',
    description: 'Explore verified dealer showrooms, motorcycle catalogues, and cinematic walkarounds across major cities.'
  });

  return (
    <motion.div
      variants={accessiblePageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-12"
    >
      {/* Cinematic Hero Shell */}
      <section className="relative overflow-hidden rounded-card-lg border border-border/60 bg-gradient-to-br from-background-card via-background-elevated to-background-deep p-8 md:p-14 shadow-card-dark">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-red/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-red-subtle border border-brand-red/20 text-brand-red text-xs font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
            Phase 1 Foundation
          </div>

          <h1 className="typography-display text-surface-50">
            Engineered For the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-orange-400">Obsessed</span>
          </h1>

          <p className="typography-body text-surface-200 text-lg md:text-xl max-w-2xl">
            A premium discovery platform uniting automotive enthusiasts with official authorized showrooms, flagship motorbikes, and transparent dealer experiences.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="/showrooms"
              className="typography-button px-6 py-3.5 rounded-card bg-brand-red hover:bg-brand-red-hover text-white shadow-glow-red hover:shadow-glow-red-lg transition-all"
            >
              Explore Showrooms
            </a>
            <a
              href="/bikes"
              className="typography-button px-6 py-3.5 rounded-card bg-surface-800 hover:bg-surface-700 text-surface-100 border border-border/80 transition-all"
            >
              Browse Catalogue
            </a>
          </div>
        </div>
      </section>

      {/* Grid Status Shell */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-surface glass-surface-hover p-6 rounded-card space-y-3">
          <span className="typography-label text-brand-red">Architecture</span>
          <h3 className="typography-h3 text-surface-100">MERN Foundation</h3>
          <p className="typography-small">Vite + React + Tailwind + Express + MongoDB architecture wired with strict separation of concerns.</p>
        </div>

        <div className="glass-surface glass-surface-hover p-6 rounded-card space-y-3">
          <span className="typography-label text-brand-red">Visual System</span>
          <h3 className="typography-h3 text-surface-100">Cinematic Design</h3>
          <p className="typography-small">Tailored dark luxury tokens, fluid clamp typography, and micro-interactions configured for high contrast.</p>
        </div>

        <div className="glass-surface glass-surface-hover p-6 rounded-card space-y-3">
          <span className="typography-label text-brand-red">Motion</span>
          <h3 className="typography-h3 text-surface-100">Accessible Motion</h3>
          <p className="typography-small">Full Framer Motion choreography coupled with automated prefers-reduced-motion safety sanitization.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;
