import React, { useRef, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Bike as BikeIcon,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  X,
  Maximize2,
  GitCompare,
  Calculator,
  Tag,
  Calendar,
  MapPin,
  Flame,
  CheckCircle2
} from 'lucide-react';
import Container from './Container';
import Badge from './Badge';
import Button from './Button';
import { heroHeadline, heroContainer, fadeIn, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const HERO_SLIDES = [
  {
    id: 1,
    title: 'Hero Karizma XMR 210',
    subtitle: 'Flagship Liquid-Cooled DOHC Racing Machine',
    tag: 'Mountain Expedition'
  },
  {
    id: 2,
    title: 'Hero Mavrick 440',
    subtitle: 'Muscular Neo-Retro Roadster with 440cc TorqX Engine',
    tag: 'Highway Touring'
  },
  {
    id: 3,
    title: 'Vida V1 Pro Connected EV',
    subtitle: 'Smart Electric Mobility with 165 km Certified Range',
    tag: 'Urban Mobility'
  }
];

const QUICK_ACTIONS = [
  { label: 'Latest Models', icon: Sparkles, to: '/bikes', highlight: false },
  { label: 'Easy Finance', icon: Calculator, to: '/bikes#emi-calc', highlight: false },
  { label: 'Nearby Showrooms', icon: MapPin, to: '/showrooms', highlight: false },
  { label: 'Book Test Ride', icon: Calendar, to: '/showrooms', highlight: true },
  { label: 'Exclusive Offers', icon: Tag, to: '/offers', highlight: false },
  { label: 'Compare Bikes', icon: GitCompare, to: '/compare', highlight: false }
];

/**
 * Cinematic Hero Component — Image & Video-Led Automotive Showcase
 * Matches the original Light Luxury reference:
 * - Real local motorcycle video (/videos/hero-motorcycle.mp4) dominates the hero visual
 * - Premium light luxury scrim ensures crystal-clear typography & red/white CTAs
 * - Integrated telemetry statistics row (Dealerships, Models, Cities, Verified Data)
 * - Carousel slide indicators (Karizma XMR, Mavrick 440, Vida V1)
 * - Automotive quick-action strip (Latest Models, Easy Finance, Showrooms, Test Ride, Offers, Compare)
 * - Working video controls (Play/Pause, Mute/Unmute, Cinematic Theater Modal)
 */
const CinematicHero = ({ videoSrc = '/videos/hero-motorcycle.mp4', onExploreClick }) => {
  const videoRef = useRef(null);
  const modalVideoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const shouldReduceMotion = usePrefersReducedMotion();
  const accessibleHeroContainer = getAccessibleVariant(heroContainer, shouldReduceMotion);
  const accessibleHeadline = getAccessibleVariant(heroHeadline, shouldReduceMotion);
  const accessibleFadeIn = getAccessibleVariant(fadeIn, shouldReduceMotion);

  const activeVideoSrc = videoSrc;
  const posterSrc = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1920&q=85';

  useEffect(() => {
    if (shouldReduceMotion && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [shouldReduceMotion]);

  // When modal opens, pause hero video and auto-play modal video with sound enabled
  useEffect(() => {
    if (isVideoModalOpen) {
      if (videoRef.current) videoRef.current.pause();
      if (modalVideoRef.current) {
        modalVideoRef.current.currentTime = 0;
        modalVideoRef.current.play().catch(() => {});
      }
    } else {
      if (modalVideoRef.current) modalVideoRef.current.pause();
      if (videoRef.current && !shouldReduceMotion && isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isVideoModalOpen, shouldReduceMotion, isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const activeSlide = HERO_SLIDES[activeSlideIndex];

  return (
    <section className="relative overflow-hidden bg-background pt-4 pb-8 md:pt-6 md:pb-12 border-b border-border">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-brand-red/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#E2E6EC_1px,transparent_1px)] [background-size:32px_32px] opacity-60 pointer-events-none" />

      <Container className="relative z-10 space-y-6">
        {/* ========================================================= */}
        {/* PANORAMIC CINEMA STAGE: Dominant Real Video & Motorcycle  */}
        {/* ========================================================= */}
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-border shadow-card-lg bg-surface-900 min-h-[460px] md:min-h-[520px] lg:min-h-[560px] flex items-center">
          {/* Background Video Layer */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={posterSrc}
              alt="High-performance motorcycle mountain road showcase"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                isVideoLoaded && !videoError ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              loading="eager"
            />

            {activeVideoSrc && !shouldReduceMotion && !videoError && (
              <video
                ref={videoRef}
                src={activeVideoSrc}
                poster={posterSrc}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                onLoadedData={() => setIsVideoLoaded(true)}
                onError={() => setVideoError(true)}
                className={`w-full h-full object-cover object-center transition-opacity duration-700 ${
                  isVideoLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
          </div>

          {/* Light Luxury Cinematic Scrim: Crisp Readable Text + Dominant Visible Motorcycle */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 sm:via-white/70 to-transparent/15 w-full sm:w-3/4 lg:w-3/5 z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-black/10 z-10 pointer-events-none" />

          {/* Top-Right Badges */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md border border-border text-surface-50 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
              {isVideoLoaded ? 'Cinematic Ride' : 'Cinematic Showcase'}
            </span>
            <button
              type="button"
              onClick={() => setIsVideoModalOpen(true)}
              aria-label="Expand cinematic film"
              className="p-1.5 rounded-full bg-white/95 backdrop-blur-md text-surface-100 hover:text-brand-red border border-border shadow-sm transition-all hover:scale-105"
              title="Fullscreen film"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Content Overlay Grid */}
          <div className="relative z-20 w-full p-6 sm:p-10 md:p-12 lg:p-14">
            <motion.div
              variants={accessibleHeroContainer}
              initial="hidden"
              animate="visible"
              className="max-w-xl lg:max-w-2xl flex flex-col space-y-4 md:space-y-6 text-left"
            >
              {/* Category Eyebrow */}
              <motion.div variants={accessibleHeadline} className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red-subtle border border-brand-red/20 text-[11px] font-bold uppercase tracking-wider text-brand-red shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                  Commercial Automotive Discovery Platform
                  <span className="text-surface-200 font-normal">|</span>
                  <span className="text-surface-100 font-semibold">2026 Fleet</span>
                </div>
              </motion.div>

              {/* Confident Editorial Headline matching reference */}
              <motion.h1
                variants={accessibleHeadline}
                className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-surface-50 tracking-tight leading-[1.1]"
              >
                The Definitive{' '}
                <span className="text-surface-50">Automotive Showroom</span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red via-red-600 to-rose-600">
                  Experience
                </span>
              </motion.h1>

              {/* Supporting Subtitle */}
              <motion.p
                variants={accessibleHeadline}
                className="text-surface-100 font-medium text-sm sm:text-base md:text-lg leading-relaxed max-w-lg"
              >
                Connect directly with verified dealerships, explore official technical specifications, compare models head-to-head, and schedule priority test rides.
              </motion.p>

              {/* Primary, Secondary, and Watch Film Actions */}
              <motion.div
                variants={accessibleHeadline}
                className="flex flex-wrap items-center gap-3 pt-1"
              >
                <NavLink to="/showrooms">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={Compass}
                    className="bg-brand-red hover:bg-brand-red-hover text-white shadow-button hover:shadow-button-hover font-semibold rounded-xl px-5 py-3 text-sm md:text-base"
                  >
                    Explore Showrooms
                  </Button>
                </NavLink>
                <NavLink to="/bikes">
                  <Button
                    variant="secondary"
                    size="lg"
                    icon={BikeIcon}
                    className="bg-white hover:bg-surface-800 text-surface-50 border border-border shadow-sm font-semibold rounded-xl px-5 py-3 text-sm md:text-base"
                  >
                    Browse Catalogue
                  </Button>
                </NavLink>
                <Button
                  variant="outline"
                  size="lg"
                  icon={Play}
                  onClick={() => setIsVideoModalOpen(true)}
                  className="border-border bg-white hover:bg-surface-800 text-surface-50 hover:text-brand-red shadow-xs font-semibold rounded-xl px-4 py-3 text-sm md:text-base"
                >
                  Watch Film
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Floating Bottom-Right Video Controls & Active Caption */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
            <div className="hidden sm:block text-right bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border shadow-xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-brand-red">{activeSlide.tag}</div>
              <div className="text-xs font-bold text-surface-50">{activeSlide.title}</div>
            </div>
            {activeVideoSrc && !videoError && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md text-surface-100 hover:text-brand-red flex items-center justify-center border border-border shadow-sm transition-all hover:scale-105"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                  className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md text-surface-100 hover:text-brand-red flex items-center justify-center border border-border shadow-sm transition-all hover:scale-105"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Bottom-Left Floating Carousel Slide Indicators */}
          <div className="absolute bottom-4 left-6 sm:left-10 z-20 flex items-center gap-2">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlideIndex(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  activeSlideIndex === idx
                    ? 'bg-surface-50 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-surface-200 border border-border/80'
                }`}
                aria-label={`Slide ${idx + 1}: ${slide.title}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeSlideIndex === idx ? 'bg-brand-red' : 'bg-surface-300'}`} />
                <span className="hidden md:inline">{slide.title.split(' ')[1] || slide.title}</span>
                <span className="md:hidden">0{idx + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* TELEMETRY METRIC STRIP: 4 Essential Statistics Row        */}
        {/* ========================================================= */}
        <motion.div
          variants={accessibleFadeIn}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-white border border-border shadow-xs text-center"
        >
          <div className="space-y-0.5 border-r border-border/60 last:border-0 sm:last:border-r-0">
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-surface-50">30+</div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-surface-200">Dealerships</div>
          </div>
          <div className="space-y-0.5 sm:border-r sm:border-border/60">
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-brand-red">30+</div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-surface-200">Live Models</div>
          </div>
          <div className="space-y-0.5 border-r border-border/60 last:border-0">
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-surface-50">15+</div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-surface-200">Major Cities</div>
          </div>
          <div className="space-y-0.5">
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-emerald-600">100%</div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-surface-200">Verified Data</div>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* QUICK-ACTION AUTOMOTIVE STRIP                             */}
        {/* ========================================================= */}
        <motion.div
          variants={accessibleFadeIn}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1"
        >
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <NavLink
                key={action.label}
                to={action.to}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  action.highlight
                    ? 'bg-brand-red text-white border-brand-red hover:bg-brand-red-hover shadow-button'
                    : 'bg-white text-surface-100 border-border hover:border-brand-red/40 hover:text-brand-red hover:shadow-xs'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${action.highlight ? 'text-white' : 'text-brand-red'}`} />
                <span className="truncate">{action.label}</span>
              </NavLink>
            );
          })}
        </motion.div>
      </Container>

      {/* ========================================================= */}
      {/* FUNCTIONING CINEMATIC THEATER MODAL PRESENTATION           */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/90 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Hero Motorcycle Cinematic Film"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl bg-surface-900 border border-neutral-800 rounded-card-lg overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-black/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Hero Showroom Cinematic Experience</h3>
                    <p className="text-[11px] text-neutral-400">Official High-Definition Riding Film</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors focus:outline-none"
                  aria-label="Close video presentation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theater Video Player */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video
                  ref={modalVideoRef}
                  src={activeVideoSrc}
                  poster={posterSrc}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Modal Footer with Actions */}
              <div className="p-4 bg-neutral-950 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800">
                <p className="text-xs text-neutral-400">
                  Ready to experience the ride in person? Book your priority test ride at an authorized dealership today.
                </p>
                <div className="flex items-center gap-2">
                  <NavLink to="/bikes" onClick={() => setIsVideoModalOpen(false)}>
                    <Button variant="outline" size="sm" className="border-neutral-700 text-white hover:bg-neutral-800">
                      View Model Specs
                    </Button>
                  </NavLink>
                  <NavLink to="/showrooms" onClick={() => setIsVideoModalOpen(false)}>
                    <Button variant="primary" size="sm" className="bg-brand-red hover:bg-brand-red-hover text-white">
                      Book Test Ride
                    </Button>
                  </NavLink>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CinematicHero;
