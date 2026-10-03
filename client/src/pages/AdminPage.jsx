import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mail,
  Calendar,
  Star,
  Building2,
  Bike,
  Tag,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  MapPin,
  XCircle
} from 'lucide-react';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import { adminService } from '../services';
import Container from '../components/Container';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';

/**
 * Admin Dashboard & Platform Intelligence Page
 * Presents real-time aggregate metrics across users, leads, test rides, reviews,
 * catalogue inventory, and dealership network without loading entire collections.
 */
const AdminPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Admin Dashboard & Metrics | Hero Showroom',
    description: 'Centralized operational analytics, lead status pipeline, review moderation queue, and vehicle catalogue telemetry.'
  });

  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const res = await adminService.getDashboardMetrics();
      if (res?.data) {
        setMetrics(res.data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid dashboard payload received from server.');
      }
    } catch (err) {
      console.error('Failed to load admin dashboard metrics:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch operational metrics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Safe destructuring of metrics with guaranteed default fallbacks
  const overview = metrics?.overview || {
    totalUsers: 0,
    totalLeads: 0,
    totalTestRides: 0,
    totalReviews: 0,
    totalShowrooms: 0,
    totalBikes: 0,
    totalOffers: 0
  };

  const leads = metrics?.leads || {
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    closed: 0
  };

  const reviews = metrics?.reviews || {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageRating: 0
  };

  const testRides = metrics?.testRides || {
    total: 0,
    requested: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  };

  const catalogue = metrics?.catalogue || {
    totalBrands: 0,
    activeBrands: 0,
    totalCities: 0,
    activeCities: 0,
    totalShowrooms: 0,
    activeShowrooms: 0,
    totalBikes: 0,
    activeBikes: 0,
    featuredBikes: 0,
    totalVariants: 0,
    activeVariants: 0
  };

  const offers = metrics?.offers || {
    total: 0,
    active: 0
  };

  // Primary KPI Overview configuration
  const overviewCards = [
    {
      id: 'kpi-users',
      label: 'Registered Users',
      value: overview.totalUsers,
      subtext: 'Platform customer accounts',
      icon: Users,
      color: 'text-sky-400',
      bgColor: 'bg-sky-950/40 border-sky-800/50'
    },
    {
      id: 'kpi-leads',
      label: 'Total Leads',
      value: overview.totalLeads,
      subtext: `${leads.new} awaiting response`,
      icon: Mail,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40 border-amber-800/50'
    },
    {
      id: 'kpi-test-rides',
      label: 'Test Rides',
      value: overview.totalTestRides,
      subtext: `${testRides.confirmed} bookings confirmed`,
      icon: Calendar,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40 border-emerald-800/50'
    },
    {
      id: 'kpi-reviews',
      label: 'Reviews',
      value: overview.totalReviews,
      subtext: `${reviews.pending} pending audit`,
      icon: Star,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/40 border-purple-800/50'
    },
    {
      id: 'kpi-showrooms',
      label: 'Showrooms',
      value: overview.totalShowrooms,
      subtext: `${catalogue.activeShowrooms} active dealerships`,
      icon: Building2,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-950/40 border-indigo-800/50'
    },
    {
      id: 'kpi-bikes',
      label: 'Motorcycles',
      value: overview.totalBikes,
      subtext: `${catalogue.featuredBikes} featured models`,
      icon: Bike,
      color: 'text-brand-red',
      bgColor: 'bg-rose-950/40 border-brand-red/40'
    },
    {
      id: 'kpi-offers',
      label: 'Active Offers',
      value: offers.active,
      subtext: `${offers.total} total campaigns`,
      icon: Tag,
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-950/30 border-emerald-700/50'
    }
  ];

  // Quick Action Navigation items
  const quickActions = [
    {
      title: 'Manage Brands',
      description: 'Configure motorcycle manufacturers, divisions, logos, and country origins.',
      href: '/admin/brands',
      icon: Layers,
      countLabel: `${catalogue.activeBrands} / ${catalogue.totalBrands} Active`
    },
    {
      title: 'Manage Cities',
      description: 'Geographic tiers, state divisions, and localized dealership zones.',
      href: '/admin/cities',
      icon: MapPin,
      countLabel: `${catalogue.activeCities} / ${catalogue.totalCities} Active`
    },
    {
      title: 'Manage Showrooms',
      description: 'Dealership outlets, Premia flagships, facilities, contacts, and coordinates.',
      href: '/admin/showrooms',
      icon: Building2,
      countLabel: `${catalogue.activeShowrooms} / ${catalogue.totalShowrooms} Active`
    },
    {
      title: 'Manage Bikes & Variants',
      description: 'Vehicle models, categories, engine specs, pricing, and colorway trims.',
      href: '/admin/bikes',
      icon: Bike,
      countLabel: `${catalogue.activeBikes} / ${catalogue.totalBikes} Active`
    },
    {
      title: 'Manage Leads',
      description: 'Customer inquiries, qualification stages, dealer allocation, and status funnel.',
      href: '/admin/leads',
      icon: Mail,
      countLabel: `${leads.new} New Inquiries`
    },
    {
      title: 'Moderate Reviews',
      description: 'Customer ratings audit, approval/rejection moderation, and verified feedback.',
      href: '/admin/reviews',
      icon: Star,
      countLabel: `${reviews.pending} Pending Audit`
    }
  ];

  return (
    <Container className="space-y-10 py-6">
      <motion.div
        variants={accessiblePageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-10"
      >
        {/* ============================================================ */}
        {/* 1. Header & Live Telemetry Bar                                */}
        {/* ============================================================ */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" size="sm" className="font-semibold tracking-wider">
                ADMIN CONSOLE
              </Badge>
              <Badge variant="outline" size="sm" className="font-mono text-xs text-emerald-400 border-emerald-800/60 bg-emerald-950/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
                LIVE METRICS
              </Badge>
            </div>

            <h1 className="typography-h1 text-surface-50 font-bold tracking-tight">
              Administrative Dashboard
            </h1>

            <p className="typography-body text-surface-200 text-sm md:text-base max-w-3xl">
              Platform-wide operational telemetry, customer acquisition pipeline, review moderation queues, and catalogue inventory health.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {lastUpdated && (
              <span className="text-[11px] text-muted-foreground font-mono">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              id="admin-dashboard-refresh-btn"
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchMetrics(true)}
              disabled={isLoading || isRefreshing}
              className={`text-xs ${isRefreshing ? 'opacity-80' : ''}`}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}
            </Button>
          </div>
        </header>

        {/* ============================================================ */}
        {/* 2. Loading & Error States                                     */}
        {/* ============================================================ */}
        {isLoading ? (
          <Card variant="elevated" className="p-12 flex justify-center border-border/80">
            <Loading text="Compiling administrative intelligence metrics from database..." size="lg" />
          </Card>
        ) : error ? (
          <Card variant="default" className="p-8 border-rose-800/80 bg-rose-950/20 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" aria-hidden="true" />
            <div className="space-y-1">
              <h3 className="typography-h3 text-rose-200 font-semibold">Failed to Load Dashboard Metrics</h3>
              <p className="text-rose-300/80 text-sm max-w-lg mx-auto">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => fetchMetrics(false)}>
              Retry Loading Dashboard
            </Button>
          </Card>
        ) : (
          <>
            {/* ============================================================ */}
            {/* 3. Overview KPI Cards Grid                                   */}
            {/* ============================================================ */}
            <section aria-labelledby="kpi-overview-heading" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="kpi-overview-heading" className="typography-h3 text-surface-100 flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-brand-red" aria-hidden="true" />
                  <span>Platform Overview</span>
                </h2>
                <span className="text-xs text-muted-foreground font-mono">Real-time counts</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
                {overviewCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card
                      key={card.id}
                      id={card.id}
                      variant="elevated"
                      className="p-4 border-border/80 flex flex-col justify-between hover:border-border transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                          {card.label}
                        </span>
                        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${card.bgColor} ${card.color}`}>
                          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-2xl sm:text-3xl font-display font-bold text-surface-50">
                          {card.value}
                        </p>
                        <p className="text-[11px] text-surface-200 truncate">
                          {card.subtext}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* ============================================================ */}
            {/* 4. Leads & Review Pipeline Split Grid                        */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* --- Lead Status Funnel --- */}
              <Card variant="elevated" className="p-6 border-border/80 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <h3 className="typography-h3 text-surface-50 font-bold flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-400" aria-hidden="true" />
                      <span>Lead Distribution Pipeline</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Customer enquiries tracked by dealership follow-up status
                    </p>
                  </div>
                  <Link
                    to="/admin/leads"
                    className="text-xs text-brand-red font-medium hover:underline flex items-center gap-1 shrink-0"
                  >
                    View All Leads &rarr;
                  </Link>
                </div>

                {/* Lead Status Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-surface-900 border border-sky-800/40 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-sky-400">
                      <span>New</span>
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                    </div>
                    <p className="text-xl font-bold text-surface-50">{leads.new}</p>
                    <p className="text-[10px] text-muted-foreground">Awaiting initial action</p>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-900 border border-amber-800/40 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-amber-400">
                      <span>Contacted</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <p className="text-xl font-bold text-surface-50">{leads.contacted}</p>
                    <p className="text-[10px] text-muted-foreground">Dealership in touch</p>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-900 border border-purple-800/40 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-purple-400">
                      <span>Qualified</span>
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                    </div>
                    <p className="text-xl font-bold text-surface-50">{leads.qualified}</p>
                    <p className="text-[10px] text-muted-foreground">Purchase intent verified</p>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-900 border border-emerald-800/40 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-emerald-400">
                      <span>Converted</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <p className="text-xl font-bold text-surface-50">{leads.converted}</p>
                    <p className="text-[10px] text-muted-foreground">Booking completed</p>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-900 border border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Closed</span>
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                    </div>
                    <p className="text-xl font-bold text-surface-50">{leads.closed}</p>
                    <p className="text-[10px] text-muted-foreground">Resolved / Inactive</p>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-900/60 border border-border/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-surface-300">
                      <span>Total Volume</span>
                      <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <p className="text-xl font-bold text-surface-50">{leads.total}</p>
                    <p className="text-[10px] text-muted-foreground">Total platform leads</p>
                  </div>
                </div>

                {/* Proportional Funnel Progress Bar */}
                {leads.total > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Pipeline Distribution</span>
                      <span>{leads.total} total</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-800 flex overflow-hidden">
                      {leads.new > 0 && (
                        <div
                          style={{ width: `${(leads.new / leads.total) * 100}%` }}
                          className="bg-sky-400 transition-all duration-500"
                          title={`New: ${leads.new}`}
                        />
                      )}
                      {leads.contacted > 0 && (
                        <div
                          style={{ width: `${(leads.contacted / leads.total) * 100}%` }}
                          className="bg-amber-400 transition-all duration-500"
                          title={`Contacted: ${leads.contacted}`}
                        />
                      )}
                      {leads.qualified > 0 && (
                        <div
                          style={{ width: `${(leads.qualified / leads.total) * 100}%` }}
                          className="bg-purple-400 transition-all duration-500"
                          title={`Qualified: ${leads.qualified}`}
                        />
                      )}
                      {leads.converted > 0 && (
                        <div
                          style={{ width: `${(leads.converted / leads.total) * 100}%` }}
                          className="bg-emerald-400 transition-all duration-500"
                          title={`Converted: ${leads.converted}`}
                        />
                      )}
                      {leads.closed > 0 && (
                        <div
                          style={{ width: `${(leads.closed / leads.total) * 100}%` }}
                          className="bg-slate-500 transition-all duration-500"
                          title={`Closed: ${leads.closed}`}
                        />
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* --- Review Moderation & Rating Overview --- */}
              <Card variant="elevated" className="p-6 border-border/80 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <h3 className="typography-h3 text-surface-50 font-bold flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-400" aria-hidden="true" />
                      <span>Review Moderation Queue</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Customer ratings audit, compliance moderation, and sentiment
                    </p>
                  </div>
                  <Link
                    to="/admin/reviews"
                    className="text-xs text-brand-red font-medium hover:underline flex items-center gap-1 shrink-0"
                  >
                    Moderate Reviews &rarr;
                  </Link>
                </div>

                {/* Score & Moderation Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rating Highlight */}
                  <div className="p-5 rounded-lg bg-surface-900 border border-border/80 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        Platform Rating
                      </span>
                      <Badge variant="brand" size="sm" className="font-mono text-xs">
                        APPROVED
                      </Badge>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display font-bold text-amber-400">
                        {reviews.averageRating.toFixed(1)}
                      </span>
                      <span className="text-surface-300 text-sm font-medium">/ 5.0</span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(reviews.averageRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-surface-700'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({reviews.approved} live reviews)
                      </span>
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg bg-surface-900 border border-amber-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-medium text-surface-200">Pending Audit</span>
                      </div>
                      <span className="text-sm font-bold text-amber-400 font-mono">
                        {reviews.pending}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-900 border border-emerald-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-surface-200">Live & Approved</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {reviews.approved}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-900 border border-rose-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-medium text-surface-200">Rejected / Spam</span>
                      </div>
                      <span className="text-sm font-bold text-rose-400 font-mono">
                        {reviews.rejected}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total review submissions logged</span>
                  <span className="font-mono text-surface-100 font-semibold">{reviews.total}</span>
                </div>
              </Card>
            </div>

            {/* ============================================================ */}
            {/* 5. Catalogue Health & Test Rides Grid                        */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* --- Catalogue Health (2 cols) --- */}
              <Card variant="elevated" className="p-6 border-border/80 space-y-6 lg:col-span-2">
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <h3 className="typography-h3 text-surface-50 font-bold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-red" aria-hidden="true" />
                      <span>Catalogue & Dealership Network Health</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Verification status across manufacturers, regional cities, outlets, and models
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Brands */}
                  <div className="p-4 rounded-lg bg-surface-900 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Brands</span>
                      <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-surface-50">
                      {catalogue.activeBrands}
                      <span className="text-xs font-normal text-muted-foreground ml-1.5">
                        / {catalogue.totalBrands}
                      </span>
                    </p>
                    <p className="text-[11px] text-emerald-400">
                      Active automotive divisions
                    </p>
                  </div>

                  {/* Cities */}
                  <div className="p-4 rounded-lg bg-surface-900 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Cities</span>
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-surface-50">
                      {catalogue.activeCities}
                      <span className="text-xs font-normal text-muted-foreground ml-1.5">
                        / {catalogue.totalCities}
                      </span>
                    </p>
                    <p className="text-[11px] text-emerald-400">
                      Covered territories
                    </p>
                  </div>

                  {/* Showrooms */}
                  <div className="p-4 rounded-lg bg-surface-900 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Showrooms</span>
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-surface-50">
                      {catalogue.activeShowrooms}
                      <span className="text-xs font-normal text-muted-foreground ml-1.5">
                        / {catalogue.totalShowrooms}
                      </span>
                    </p>
                    <p className="text-[11px] text-emerald-400">
                      Authorized outlets online
                    </p>
                  </div>

                  {/* Bikes */}
                  <div className="p-4 rounded-lg bg-surface-900 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Motorcycles</span>
                      <Bike className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-surface-50">
                      {catalogue.activeBikes}
                      <span className="text-xs font-normal text-muted-foreground ml-1.5">
                        / {catalogue.totalBikes}
                      </span>
                    </p>
                    <p className="text-[11px] text-brand-red">
                      {catalogue.featuredBikes} featured models
                    </p>
                  </div>

                  {/* Variants */}
                  <div className="p-4 rounded-lg bg-surface-900 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Trims & Variants</span>
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-surface-50">
                      {catalogue.activeVariants}
                      <span className="text-xs font-normal text-muted-foreground ml-1.5">
                        / {catalogue.totalVariants}
                      </span>
                    </p>
                    <p className="text-[11px] text-emerald-400">
                      Active price configurations
                    </p>
                  </div>

                  {/* Offers */}
                  <div className="p-4 rounded-lg bg-surface-900 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Promotions</span>
                      <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-surface-50">
                      {offers.active}
                      <span className="text-xs font-normal text-muted-foreground ml-1.5">
                        / {offers.total}
                      </span>
                    </p>
                    <p className="text-[11px] text-emerald-400">
                      Active campaign offers
                    </p>
                  </div>
                </div>
              </Card>

              {/* --- Test Ride Bookings --- */}
              <Card variant="elevated" className="p-6 border-border/80 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <h3 className="typography-h3 text-surface-50 font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                      <span>Test Ride Bookings</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Appointment status telemetry
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-surface-900 border border-sky-800/40 flex items-center justify-between">
                    <span className="text-xs text-surface-200">Requested</span>
                    <span className="font-mono font-bold text-sky-400 text-sm">{testRides.requested}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-900 border border-amber-800/40 flex items-center justify-between">
                    <span className="text-xs text-surface-200">Confirmed</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{testRides.confirmed}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-900 border border-emerald-800/40 flex items-center justify-between">
                    <span className="text-xs text-surface-200">Completed</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{testRides.completed}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-900 border border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs text-surface-200">Cancelled</span>
                    <span className="font-mono font-bold text-slate-400 text-sm">{testRides.cancelled}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total bookings logged</span>
                  <span className="font-mono text-surface-100 font-semibold">{testRides.total}</span>
                </div>
              </Card>
            </div>

            {/* ============================================================ */}
            {/* 6. Quick Action Navigation Shortcuts                          */}
            {/* ============================================================ */}
            <section aria-labelledby="quick-actions-heading" className="space-y-4 pt-2">
              <div className="space-y-1">
                <h2 id="quick-actions-heading" className="typography-h3 text-surface-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-red" aria-hidden="true" />
                  <span>Administrative Management Modules</span>
                </h2>
                <p className="typography-small text-muted-foreground text-xs md:text-sm">
                  Quick navigation shortcuts to manage catalogue entities, customer leads, and review pipelines.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon || ArrowRight;
                  return (
                    <Link
                      key={action.title}
                      to={action.href}
                      className="group block focus:outline-none"
                    >
                      <Card
                        variant="default"
                        className="p-5 border-border/80 h-full flex flex-col justify-between group-hover:border-brand-red/50 group-hover:bg-surface-900/60 transition-all duration-200"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-lg bg-surface-800 border border-border flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-colors">
                              <Icon className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground bg-surface-800/80 px-2 py-0.5 rounded border border-border/60">
                              {action.countLabel}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h3 className="typography-body font-semibold text-surface-100 group-hover:text-brand-red transition-colors flex items-center gap-1.5">
                              <span>{action.title}</span>
                            </h3>
                            <p className="typography-small text-surface-200 text-xs leading-relaxed">
                              {action.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between text-xs text-brand-red font-medium">
                          <span>Open Management Module</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </motion.div>
    </Container>
  );
};

export default AdminPage;
