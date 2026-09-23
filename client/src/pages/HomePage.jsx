import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Bike,
  Compass,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  Zap,
  CheckCircle2,
  Calendar,
  Building2,
  Fuel,
  Gauge
} from 'lucide-react';

import {
  Section,
  Container,
  Button,
  Card,
  Badge,
  Input
} from '../components';
import {
  heroHeadline,
  heroContainer,
  fadeIn,
  getAccessibleVariant
} from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';

/**
 * Phase 1 Foundation Demo Datasets
 * Note: Purely for visual structure and component verification.
 * Dynamic database connectivity is scheduled for subsequent phases.
 */
const DEMO_BRANDS = [
  {
    name: 'Hero MotoCorp',
    category: 'Flagship Commuter & Sport',
    showrooms: '1,200+ Outlets',
    tag: 'Official',
    highlight: 'World Largest 2-Wheeler Maker'
  },
  {
    name: 'Hero Premia',
    category: 'Luxury & Premium Experience',
    showrooms: '80+ Flagship Stores',
    tag: 'Premium Tier',
    highlight: 'Curated Customer Lounge & VIP Service'
  },
  {
    name: 'Vida Electric',
    category: 'Next-Gen EV Mobility',
    showrooms: '150+ Experience Hubs',
    tag: 'Electric',
    highlight: 'Removable Batteries & Fast Charging'
  },
  {
    name: 'Harley-Davidson X',
    category: 'Co-Developed Performance',
    showrooms: 'Select Premia Stores',
    tag: 'Co-Branded',
    highlight: '440cc Torquey Single-Cylinder'
  }
];

const DEMO_CITIES = [
  { name: 'Bengaluru', state: 'Karnataka', showrooms: 48, status: 'Metro Hub' },
  { name: 'Delhi NCR', state: 'Delhi', showrooms: 62, status: 'Capital Region' },
  { name: 'Mumbai', state: 'Maharashtra', showrooms: 39, status: 'Metro Hub' },
  { name: 'Hyderabad', state: 'Telangana', showrooms: 31, status: 'High Growth' },
  { name: 'Pune', state: 'Maharashtra', showrooms: 27, status: 'Regional Hub' },
  { name: 'Chennai', state: 'Tamil Nadu', showrooms: 25, status: 'Coastal Hub' }
];

const DEMO_BIKES = [
  {
    name: 'Karizma XMR 210',
    segment: 'Flagship Sport',
    power: '25.5 PS @ 9,250 RPM',
    engine: '210cc DOHC 4V Liquid-Cooled',
    price: '₹1,79,900',
    priceType: 'Ex-Showroom Est.',
    badge: 'Flagship',
    badgeVariant: 'brand'
  },
  {
    name: 'Mavrick 440',
    segment: 'Neo-Retro Roadster',
    power: '27.3 PS @ 6,000 RPM',
    engine: '440cc Air/Oil-Cooled',
    price: '₹1,99,000',
    priceType: 'Ex-Showroom Est.',
    badge: 'Torque Monster',
    badgeVariant: 'warning'
  },
  {
    name: 'Xtreme 125R',
    segment: 'Street Fighter',
    power: '11.5 PS @ 8,250 RPM',
    engine: '125cc Sprint-EBT Engine',
    price: '₹95,000',
    priceType: 'Ex-Showroom Est.',
    badge: 'Best in Class ABS',
    badgeVariant: 'info'
  },
  {
    name: 'Vida V1 Pro',
    segment: 'Connected EV Scooter',
    power: '3.9 kWh Battery Pack',
    engine: '110 km True Range',
    price: '₹1,26,000',
    priceType: 'Ex-Showroom Est.',
    badge: 'Zero Emission',
    badgeVariant: 'success'
  }
];

const DEMO_SHOWROOMS = [
  {
    name: 'Hero Premia Flagship Koramangala',
    city: 'Bengaluru',
    address: '80 Feet Road, 4th Block, Koramangala',
    verified: true,
    testRidesAvailable: true,
    timing: '9:30 AM - 8:00 PM'
  },
  {
    name: 'Apex Grand Hero World',
    city: 'New Delhi',
    address: 'Outer Circle, Connaught Place',
    verified: true,
    testRidesAvailable: true,
    timing: '10:00 AM - 8:30 PM'
  },
  {
    name: 'South Coast Motors & Premia Lounge',
    city: 'Mumbai',
    address: 'Link Road, Andheri West',
    verified: true,
    testRidesAvailable: true,
    timing: '9:00 AM - 8:00 PM'
  }
];

const DEMO_BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Verified Showroom Discovery',
    description: 'Find official authorized dealerships with verified physical addresses, verified staff, and active test ride fleets.'
  },
  {
    icon: SlidersHorizontal,
    title: 'Side-by-Side Model Comparison',
    description: 'Evaluate technical specifications, power outputs, estimated mileage, and on-road pricing diffs head-to-head.'
  },
  {
    icon: Calendar,
    title: 'Direct Test Ride Scheduling',
    description: 'Explore upcoming availability and connect directly with preferred dealership branches for priority test drives.'
  },
  {
    icon: Zap,
    title: 'Transparent Pricing Insights',
    description: 'Understand ex-showroom baselines, indicative RTO, and state-wise insurance estimates without showroom markup surprises.'
  }
];

const HomePage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessibleHeroContainer = getAccessibleVariant(heroContainer, shouldReduceMotion);
  const accessibleHeadline = getAccessibleVariant(heroHeadline, shouldReduceMotion);
  const accessibleFadeIn = getAccessibleVariant(fadeIn, shouldReduceMotion);

  const [activeSearchTab, setActiveSearchTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useSEO({
    title: 'Hero Showroom — Discover Authorized Showrooms & Flagship Bikes',
    description: 'Explore verified dealer showrooms, flagship motorcycle catalogues, specs comparison, and transparent automotive discovery.'
  });

  return (
    <div className="space-y-6 md:space-y-12">
      {/* ================================================== */}
      {/* 1. CINEMATIC HERO SECTION                          */}
      {/* ================================================== */}
      <section className="relative overflow-hidden pt-6 pb-16 md:py-24">
        {/* Layered Cinematic Backdrop Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] md:w-[900px] md:h-[500px] bg-brand-red/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-0 right-10 w-72 h-72 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#1F2430_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none" />

        <Container className="relative z-10">
          <motion.div
            variants={accessibleHeroContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6 md:space-y-8"
          >
            {/* Eyebrow Pill */}
            <motion.div variants={accessibleHeadline}>
              <Badge variant="brand" size="md" dot>
                Commercial Automotive Discovery Platform
              </Badge>
            </motion.div>

            {/* Staggered Cinematic Headline */}
            <motion.h1
              variants={accessibleHeadline}
              className="typography-display text-surface-50 font-black tracking-tight"
            >
              The Definitive{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-surface-50 via-white to-surface-200">
                Automotive Showroom
              </span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red via-rose-500 to-orange-400">
                Experience
              </span>
            </motion.h1>

            {/* Supporting Subtitle */}
            <motion.p
              variants={accessibleHeadline}
              className="typography-body text-surface-200 text-lg md:text-xl max-w-2xl leading-relaxed"
            >
              Connect with verified dealership showrooms, explore official motorcycle catalogues, compare technical specifications, and discover your next ride.
            </motion.p>

            {/* Hero Action CTAs */}
            <motion.div
              variants={accessibleHeadline}
              className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto"
            >
              <NavLink to="/showrooms" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  icon={Compass}
                  fullWidth
                  className="sm:w-auto"
                >
                  Explore Showrooms
                </Button>
              </NavLink>
              <NavLink to="/bikes" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  icon={Bike}
                  fullWidth
                  className="sm:w-auto"
                >
                  Browse Catalogue
                </Button>
              </NavLink>
            </motion.div>

            {/* Highlight Telemetry Stats */}
            <motion.div
              variants={accessibleFadeIn}
              className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full border-t border-border/60"
            >
              <div className="text-center space-y-1">
                <div className="font-display font-black text-2xl md:text-3xl text-surface-50">1,500+</div>
                <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Authorized Outlets</div>
              </div>
              <div className="text-center space-y-1">
                <div className="font-display font-black text-2xl md:text-3xl text-brand-red">40+</div>
                <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Flagship Models</div>
              </div>
              <div className="text-center space-y-1">
                <div className="font-display font-black text-2xl md:text-3xl text-surface-50">100%</div>
                <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Verified Locations</div>
              </div>
              <div className="text-center space-y-1">
                <div className="font-display font-black text-2xl md:text-3xl text-emerald-400">Zero Markup</div>
                <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Transparent Specs</div>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* ================================================== */}
      {/* 2. SMART SEARCH FOUNDATION SHELL                   */}
      {/* ================================================== */}
      <section className="relative z-20 -mt-6 md:-mt-10">
        <Container>
          <div className="glass-surface p-4 sm:p-6 md:p-8 rounded-card-lg border border-border/80 shadow-card-hover max-w-4xl mx-auto space-y-5">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/60">
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'bikes', label: 'Bikes' },
                { id: 'brands', label: 'Brands' },
                { id: 'cities', label: 'Cities' },
                { id: 'showrooms', label: 'Showrooms' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSearchTab(tab.id)}
                  className={`
                    px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer
                    ${
                      activeSearchTab === tab.id
                        ? 'bg-brand-red text-white shadow-glow-red'
                        : 'text-surface-200 hover:text-white hover:bg-surface-800'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full flex-1">
                <Input
                  icon={Search}
                  placeholder={`Search ${
                    activeSearchTab === 'all'
                      ? 'models, cities, or authorized dealer showrooms...'
                      : `${activeSearchTab}...`
                  }`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background-deep border-border/80 text-base"
                />
              </div>
              <Button
                variant="primary"
                size="md"
                icon={Search}
                className="w-full sm:w-auto shrink-0"
              >
                Search Directory
              </Button>
            </div>

            {/* Quick Filter Tag Shells */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
              <span className="font-semibold text-surface-200">Popular Queries:</span>
              {['Karizma XMR', 'Hero Premia Bengaluru', 'Mavrick 440', 'Vida V1 EV', 'Delhi Showrooms'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSearchQuery(chip)}
                  className="px-2.5 py-1 rounded-md bg-surface-800/80 hover:bg-surface-700 text-surface-200 hover:text-white border border-border/60 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ================================================== */}
      {/* 3. TOP BRANDS SECTION                              */}
      {/* ================================================== */}
      <Section
        id="brands"
        eyebrow="Portfolio & Divisions"
        title="Official Brand Divisions"
        description="Explore authorized brand lines from world-leading commuter flagships to premium luxury outlets."
        actions={
          <NavLink to="/showrooms">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              View All Divisions
            </Button>
          </NavLink>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEMO_BRANDS.map((brand) => (
            <Card
              key={brand.name}
              interactive
              variant="elevated"
              className="flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="brand" size="sm">
                    {brand.tag}
                  </Badge>
                  <Building2 className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="typography-h3 text-surface-50">{brand.name}</h3>
                  <p className="typography-small text-brand-red text-xs font-semibold">{brand.category}</p>
                </div>
                <p className="typography-small text-surface-200 text-xs leading-relaxed">
                  {brand.highlight}
                </p>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>{brand.showrooms}</span>
                <span className="text-brand-red font-semibold hover:underline flex items-center gap-1">
                  Explore <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ================================================== */}
      {/* 4. POPULAR CITIES SECTION                          */}
      {/* ================================================== */}
      <Section
        id="cities"
        eyebrow="Dealership Network"
        title="Popular Dealer Cities"
        description="Find official showrooms in major metropolitan centers with verified test ride fleets."
        actions={
          <NavLink to="/showrooms">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              All 100+ Cities
            </Button>
          </NavLink>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {DEMO_CITIES.map((city) => (
            <Card
              key={city.name}
              interactive
              variant="glass"
              className="p-5 text-center flex flex-col items-center justify-between space-y-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-surface-800 border border-border group-hover:border-brand-red/40 flex items-center justify-center text-brand-red transition-colors">
                <MapPin className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-display font-bold text-surface-50 text-base">{city.name}</h4>
                <p className="typography-small text-[11px] text-muted-foreground">{city.state}</p>
              </div>
              <Badge variant="default" size="sm">
                {city.showrooms} Outlets
              </Badge>
            </Card>
          ))}
        </div>
      </Section>

      {/* ================================================== */}
      {/* 5. FEATURED BIKES SECTION                          */}
      {/* ================================================== */}
      <Section
        id="featured-bikes"
        eyebrow="Flagship Lineup"
        title="Featured Motorcycles"
        description="Precision-engineered performance machines, roadsters, and connected electric mobility."
        actions={
          <NavLink to="/bikes">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              Full Catalogue
            </Button>
          </NavLink>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEMO_BIKES.map((bike) => (
            <Card
              key={bike.name}
              interactive
              variant="elevated"
              className="flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                {/* Header & Badges */}
                <div className="flex items-center justify-between">
                  <Badge variant={bike.badgeVariant} size="sm">
                    {bike.badge}
                  </Badge>
                  <span className="typography-label text-[10px] text-muted-foreground">
                    {bike.segment}
                  </span>
                </div>

                {/* Bike Representation Shell */}
                <div className="w-full h-36 rounded-card bg-surface-900 border border-border/70 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group-hover:border-brand-red/30 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-red/5 to-transparent pointer-events-none" />
                  <Bike className="w-12 h-12 text-surface-200 group-hover:text-brand-red transition-colors mb-2" />
                  <span className="font-display font-bold text-surface-50 text-sm">{bike.name}</span>
                </div>

                {/* Technical Specs Indicators */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between text-surface-200">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Gauge className="w-3.5 h-3.5 text-brand-red" /> Power
                    </span>
                    <span className="font-medium text-surface-100">{bike.power}</span>
                  </div>
                  <div className="flex items-center justify-between text-surface-200">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Fuel className="w-3.5 h-3.5 text-brand-red" /> Engine / Spec
                    </span>
                    <span className="font-medium text-surface-100">{bike.engine}</span>
                  </div>
                </div>
              </div>

              {/* Pricing & CTA */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-surface-50 text-lg leading-none">
                    {bike.price}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{bike.priceType}</span>
                </div>
                <NavLink to="/bikes">
                  <Button variant="primary" size="sm" className="text-xs">
                    Details
                  </Button>
                </NavLink>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ================================================== */}
      {/* 6. FEATURED SHOWROOMS SECTION                      */}
      {/* ================================================== */}
      <Section
        id="featured-showrooms"
        eyebrow="Authorized Network"
        title="Featured Showrooms"
        description="Visit certified showroom locations featuring dedicated test ride tracks and VIP service lounges."
        actions={
          <NavLink to="/showrooms">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              Locate Showroom
            </Button>
          </NavLink>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_SHOWROOMS.map((showroom) => (
            <Card
              key={showroom.name}
              interactive
              variant="default"
              className="flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="success" size="sm" dot>
                    Verified Outlet
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-red" />
                    {showroom.city}
                  </span>
                </div>

                <h3 className="typography-h3 text-surface-50 text-lg">{showroom.name}</h3>

                <p className="typography-small text-surface-200 text-xs">
                  {showroom.address}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-surface-800 border border-border">
                    Test Rides Active
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-800 border border-border">
                    {showroom.timing}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Open Today
                </span>
                <NavLink to="/showrooms">
                  <Button variant="secondary" size="sm" className="text-xs">
                    View Dealer
                  </Button>
                </NavLink>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* ================================================== */}
      {/* 7. BENEFITS SECTION                                */}
      {/* ================================================== */}
      <Section
        id="benefits"
        eyebrow="Why Choose Platform"
        title="Built for the Discerning Rider"
        description="Experience transparent automotive discovery powered by verified dealer data and commercial-grade engineering."
        align="center"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEMO_BENEFITS.map((benefit) => (
            <Card
              key={benefit.title}
              variant="glass"
              className="p-6 space-y-4 text-left border-border/70"
            >
              <div className="w-12 h-12 rounded-card bg-brand-red-subtle border border-brand-red/30 flex items-center justify-center text-brand-red">
                <benefit.icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="typography-h3 text-surface-50 text-base">{benefit.title}</h3>
              <p className="typography-small text-xs leading-relaxed text-surface-200">
                {benefit.description}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ================================================== */}
      {/* 8. FINAL CTA SECTION                               */}
      {/* ================================================== */}
      <section className="py-12 md:py-20">
        <Container>
          <div className="relative overflow-hidden rounded-card-lg border border-brand-red/40 bg-gradient-to-r from-background-deep via-background-card to-background-elevated p-8 md:p-14 shadow-card-hover text-center md:text-left">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-brand-red/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
              <div className="space-y-3 max-w-xl">
                <Badge variant="brand" size="sm" dot>
                  Take the Next Step
                </Badge>
                <h2 className="typography-h2 text-surface-50">
                  Ready to Experience Official Dealership Excellence?
                </h2>
                <p className="typography-body text-surface-200 text-sm md:text-base">
                  Locate official authorized showrooms in your city or explore detailed technical specifications and walkarounds across the full lineup.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                <NavLink to="/showrooms" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={Compass}
                    fullWidth
                    className="sm:w-auto"
                  >
                    Find Showrooms
                  </Button>
                </NavLink>
                <NavLink to="/bikes" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    icon={Bike}
                    fullWidth
                    className="sm:w-auto"
                  >
                    Browse Models
                  </Button>
                </NavLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;
