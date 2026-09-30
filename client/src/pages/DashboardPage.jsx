import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Bike,
  Compass,
  GitCompare,
  Heart,
  Star,
  User as UserIcon,
  Mail,
  Calendar,
  ArrowUpRight,
  Clock,
  Sparkles,
  RefreshCw,
  Bell,
  Tag,
  Calculator,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  leadService,
  testRideService,
  favoriteService,
  reviewService,
  offerService
} from '../services';
import Container from '../components/Container';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import LeadActivityList from '../components/dashboard/LeadActivityList';
import TestRideActivityList from '../components/dashboard/TestRideActivityList';
import FavoritesActivityList from '../components/dashboard/FavoritesActivityList';
import ReviewActivityList from '../components/dashboard/ReviewActivityList';
import NotificationsActivityList from '../components/dashboard/NotificationsActivityList';
import DashboardSummaryCard from '../components/dashboard/DashboardSummaryCard';
import OffersActivityList from '../components/dashboard/OffersActivityList';
import ProfileSection from '../components/dashboard/ProfileSection';

/**
 * Valid dashboard section/tab identifiers
 */
const VALID_TABS = [
  'overview',
  'leads',
  'testRides',
  'offers',
  'favorites',
  'reviews',
  'notifications',
  'profile'
];

/**
 * Customer Dashboard Page
 * Central authenticated activity hub integrating Leads, Test Rides, Offers, Favorites, Reviews, Notifications, and Account Profile.
 */
const DashboardPage = () => {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { notifications, unreadCount, fetchNotifications } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Customer Dashboard | Hero Showroom',
    description: 'Manage your motorcycle discovery journey, view scheduled dealership test rides, track offers, and access authorized Hero hub services.'
  });

  // Recent Activity State
  const [leads, setLeads] = useState([]);
  const [testRides, setTestRides] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);

  // Active tab state initialized from query param if valid, defaulting to 'overview'
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview'
  );

  // Synchronize activeTab when URL searchParams changes externally
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam && activeTab !== 'overview') {
      setActiveTab('overview');
    }
  }, [searchParams]);

  /**
   * Switch active tab and synchronize URL query parameter (?tab=...)
   */
  const handleTabChange = useCallback(
    (tabId) => {
      if (VALID_TABS.includes(tabId)) {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
      }
    },
    [setSearchParams]
  );

  /**
   * Fetch customer activity across all integrated services
   */
  const fetchUserActivity = useCallback(async () => {
    try {
      setActivityLoading(true);
      setActivityError(null);

      const [leadsRes, ridesRes, favsRes, reviewsRes, offersRes] = await Promise.allSettled([
        leadService.getMyLeads(),
        testRideService.getMyTestRides(),
        favoriteService.getMyFavorites(),
        reviewService.getMyReviews(),
        offerService.getOffers({ active: 'true' })
      ]);

      if (leadsRes.status === 'fulfilled') setLeads(leadsRes.value?.data || []);
      if (ridesRes.status === 'fulfilled') setTestRides(ridesRes.value?.data || []);
      if (favsRes.status === 'fulfilled') setFavorites(favsRes.value?.data || []);
      if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value?.data || []);
      if (offersRes.status === 'fulfilled') setOffers(offersRes.value?.data || []);

      fetchNotifications();
    } catch (err) {
      setActivityError(err?.message || 'Failed to load your recent activity. Please try again.');
    } finally {
      setActivityLoading(false);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    if (user) {
      fetchUserActivity();
    }
  }, [user, fetchUserActivity]);

  if (authLoading) {
    return (
      <Container className="py-24 flex items-center justify-center min-h-[50vh]">
        <Loading text="Authenticating customer session..." size="lg" />
      </Container>
    );
  }

  // Safe user presentation properties
  const displayName = user?.name || 'Rider';
  const firstName = displayName.split(' ')[0];
  const userRole = user?.role ? user.role.toUpperCase() : 'CUSTOMER';

  const quickActions = [
    {
      title: 'Explore Bikes',
      description: 'Discover commuter, sports, and electric bikes across all price ranges.',
      href: '/bikes',
      icon: Bike,
      badge: 'Flagship Models'
    },
    {
      title: 'Find Showrooms',
      description: 'Locate authorized Premia, Arena, and standard dealers near your city.',
      href: '/showrooms',
      icon: Compass,
      badge: 'Authorized Hubs'
    },
    {
      title: 'Compare Models',
      description: 'Evaluate technical specifications, variants, and ex-showroom prices side-by-side.',
      href: '/compare',
      icon: GitCompare,
      badge: 'Spec Matrix'
    },
    {
      title: 'Promotional Offers',
      description: 'Review active festive discounts, exchange bonuses, and special finance rates.',
      href: '/offers',
      icon: Tag,
      badge: 'Exclusive Deals'
    }
  ];

  // Tab navigation configuration
  const tabConfig = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'leads',
      label: 'My Leads',
      icon: Mail,
      badge: leads.length
    },
    {
      id: 'testRides',
      label: 'Test Rides',
      icon: Calendar,
      badge: testRides.length
    },
    {
      id: 'offers',
      label: 'Offers',
      icon: Tag,
      badge: offers.length
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Heart,
      badge: favorites.length
    },
    {
      id: 'reviews',
      label: 'My Reviews',
      icon: Star,
      badge: reviews.length
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : notifications.length,
      badgeVariant: unreadCount > 0 ? 'brand' : 'outline'
    },
    {
      id: 'profile',
      label: 'Profile / Account',
      icon: UserIcon,
      badge: null
    }
  ];

  // Most recent activity items for quick overview cards
  const nextUpcomingRide = testRides.find(
    (r) => r.status === 'confirmed' || r.status === 'requested'
  ) || testRides[0];

  const latestLead = leads[0];
  const latestOffer = offers[0];

  const hasAnyActivity =
    leads.length > 0 ||
    testRides.length > 0 ||
    favorites.length > 0 ||
    reviews.length > 0 ||
    notifications.length > 0;

  return (
    <Container className="py-10 md:py-16">
      <motion.div
        variants={accessiblePageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-8"
      >
        {/* ============================================================== */}
        {/* 1. Header / Welcome Section                                    */}
        {/* ============================================================== */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" size="sm" className="font-semibold tracking-wider">
                HERO SHOWROOM HUB
              </Badge>
              <Badge variant="outline" size="sm" className="font-mono text-xs">
                {userRole}
              </Badge>
            </div>

            <h1 className="typography-h1 text-surface-50 font-bold tracking-tight">
              Welcome back, {firstName}
            </h1>

            <p className="typography-body text-surface-200 text-sm md:text-base max-w-2xl">
              Your personal motorcycle discovery command center. Manage scheduled test rides, dealership enquiries, exclusive offers, and vehicle wishlists.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchUserActivity}
              disabled={activityLoading}
              className="text-xs"
              aria-label="Refresh dashboard data"
            >
              {activityLoading ? 'Updating...' : 'Refresh Hub'}
            </Button>
          </div>
        </header>

        {/* Global Activity Error Alert */}
        {activityError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 flex items-center justify-between gap-4 text-xs text-rose-200"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />
              <span>{activityError}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchUserActivity}
              className="shrink-0 text-xs"
            >
              Retry
            </Button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. Navigation Tabs (8 distinct sections)                       */}
        {/* ============================================================== */}
        <nav
          role="tablist"
          aria-label="Customer dashboard sections"
          className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border/60 select-none"
        >
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-controls={`tabpanel-${tab.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`
                  px-3.5 py-2.5 text-xs md:text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red
                  ${isActive
                    ? 'bg-surface-800 text-brand-red border-b-2 border-brand-red shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-surface-100 hover:bg-surface-900/60'}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-red' : 'text-muted-foreground'}`} aria-hidden="true" />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <Badge
                    variant={tab.badgeVariant || (isActive ? 'brand' : 'outline')}
                    size="sm"
                    className="text-[10px] px-1.5 py-0 min-w-[20px] text-center"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* ============================================================== */}
        {/* 3. Tab Panel Contents                                          */}
        {/* ============================================================== */}
        <main
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="space-y-8"
        >
          {/* ============================================================ */}
          {/* TAB 1: OVERVIEW                                              */}
          {/* ============================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-10">
              {/* Summary Cards Grid */}
              <section aria-labelledby="summary-cards-heading" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 id="summary-cards-heading" className="typography-h3 text-surface-100">
                    Activity Overview
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    Click any card to inspect full records
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {/* Card 1: My Leads */}
                  <DashboardSummaryCard
                    title="My Leads"
                    count={leads.length}
                    subtitle="Dealership quotes"
                    icon={Mail}
                    badge={leads.length > 0 ? `${leads.length} Active` : '0 Active'}
                    badgeVariant="info"
                    isLoading={activityLoading}
                    onClick={() => handleTabChange('leads')}
                  />

                  {/* Card 2: Test Rides */}
                  <DashboardSummaryCard
                    title="Test Rides"
                    count={testRides.length}
                    subtitle="Booked appointments"
                    icon={Calendar}
                    badge={testRides.length > 0 ? `${testRides.length} Scheduled` : '0 Booked'}
                    badgeVariant="brand"
                    isLoading={activityLoading}
                    onClick={() => handleTabChange('testRides')}
                  />

                  {/* Card 3: Offers */}
                  <DashboardSummaryCard
                    title="Live Offers"
                    count={offers.length}
                    subtitle="Promotions & savings"
                    icon={Tag}
                    badge={offers.length > 0 ? `${offers.length} Live` : 'No Offers'}
                    badgeVariant="warning"
                    isLoading={activityLoading}
                    onClick={() => handleTabChange('offers')}
                  />

                  {/* Card 4: Favorites */}
                  <DashboardSummaryCard
                    title="Wishlist"
                    count={favorites.length}
                    subtitle="Bikes & showrooms"
                    icon={Heart}
                    badge={favorites.length > 0 ? `${favorites.length} Saved` : '0 Saved'}
                    badgeVariant="brand"
                    isLoading={activityLoading}
                    onClick={() => handleTabChange('favorites')}
                  />

                  {/* Card 5: Reviews */}
                  <DashboardSummaryCard
                    title="My Reviews"
                    count={reviews.length}
                    subtitle="Showroom feedback"
                    icon={Star}
                    badge={reviews.length > 0 ? `${reviews.length} Given` : '0 Given'}
                    badgeVariant="outline"
                    isLoading={activityLoading}
                    onClick={() => handleTabChange('reviews')}
                  />

                  {/* Card 6: Notifications */}
                  <DashboardSummaryCard
                    title="Notifications"
                    count={unreadCount > 0 ? unreadCount : notifications.length}
                    subtitle={unreadCount > 0 ? `${unreadCount} Unread alerts` : 'All read'}
                    icon={Bell}
                    badge={unreadCount > 0 ? `${unreadCount} Unread` : 'Up to date'}
                    badgeVariant={unreadCount > 0 ? 'brand' : 'outline'}
                    isLoading={activityLoading}
                    onClick={() => handleTabChange('notifications')}
                  />
                </div>
              </section>

              {/* Activity Highlights / Next Actions */}
              <section aria-labelledby="highlights-heading" className="space-y-4">
                <h2 id="highlights-heading" className="typography-h3 text-surface-100">
                  Key Activity Highlights
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Next Test Ride Preview */}
                  <Card variant="elevated" className="p-5 border-border/80 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                          Upcoming Test Ride
                        </span>
                        {nextUpcomingRide && (
                          <Badge variant="brand" size="sm" className="capitalize text-[10px]">
                            {nextUpcomingRide.status || 'Requested'}
                          </Badge>
                        )}
                      </div>

                      {nextUpcomingRide ? (
                        <div className="space-y-1.5">
                          <h4 className="typography-h3 text-surface-100 font-bold">
                            {nextUpcomingRide.bike?.name || 'Motorcycle Model'}
                          </h4>
                          <p className="text-xs text-surface-200">
                            Showroom: {nextUpcomingRide.showroom?.name || 'Authorized Dealership'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                            <Clock className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                            <span>
                              {nextUpcomingRide.preferredDate
                                ? new Date(nextUpcomingRide.preferredDate).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })
                                : 'Date pending'}
                              {nextUpcomingRide.preferredTime && ` at ${nextUpcomingRide.preferredTime} hrs`}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <div className="py-3 text-xs text-muted-foreground">
                          You do not have any pending or confirmed test ride bookings.
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border/40">
                      {nextUpcomingRide ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onClick={() => handleTabChange('testRides')}
                          className="text-xs"
                        >
                          View Test Rides &rarr;
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth
                          onClick={() => navigate('/bikes')}
                          className="text-xs"
                        >
                          Book a Test Ride
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Latest Lead Enquiry Preview */}
                  <Card variant="elevated" className="p-5 border-border/80 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                          Recent Enquiry
                        </span>
                        {latestLead && (
                          <Badge variant="info" size="sm" className="capitalize text-[10px]">
                            {latestLead.status || 'New'}
                          </Badge>
                        )}
                      </div>

                      {latestLead ? (
                        <div className="space-y-1.5">
                          <h4 className="typography-h3 text-surface-100 font-bold">
                            {latestLead.bike?.name || 'Selected Motorcycle'}
                          </h4>
                          <p className="text-xs text-surface-200">
                            Dealership: {latestLead.showroom?.name || 'Authorized Hub'}
                          </p>
                          <p className="text-xs text-muted-foreground pt-1">
                            Submitted on{' '}
                            {latestLead.createdAt
                              ? new Date(latestLead.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : 'Recently'}
                          </p>
                        </div>
                      ) : (
                        <div className="py-3 text-xs text-muted-foreground">
                          No dealership queries or price quotes requested yet.
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border/40">
                      {latestLead ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          onClick={() => handleTabChange('leads')}
                          className="text-xs"
                        >
                          View My Enquiries &rarr;
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          onClick={() => navigate('/bikes')}
                          className="text-xs"
                        >
                          Request Price Quote
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Promotional Offer Highlight */}
                  <Card variant="elevated" className="p-5 border-border/80 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                          Featured Campaign
                        </span>
                        <Badge variant="brand" size="sm" className="text-[10px]">
                          Live Offer
                        </Badge>
                      </div>

                      {latestOffer ? (
                        <div className="space-y-1.5">
                          <h4 className="typography-h3 text-surface-100 font-bold line-clamp-1">
                            {latestOffer.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {latestOffer.description}
                          </p>
                          {latestOffer.discountValue > 0 && (
                            <p className="text-sm font-bold text-brand-red pt-1">
                              Benefits up to ₹{Number(latestOffer.discountValue).toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="py-3 text-xs text-muted-foreground">
                          Explore authorized dealer campaigns and festival benefits.
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border/40">
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => handleTabChange('offers')}
                        className="text-xs"
                      >
                        Explore All Offers &rarr;
                      </Button>
                    </div>
                  </Card>
                </div>
              </section>

              {/* Zero Activity Full Empty State (if completely empty) */}
              {!activityLoading && !hasAnyActivity && !activityError && (
                <EmptyState
                  icon={Clock}
                  title="Your motorcycle activity hub is ready"
                  message="Schedule test rides at authorized Hero dealerships, save your favorite motorcycle builds to wishlist, or connect with showrooms for tailored price quotes."
                  actionLabel="Explore Flagship Motorcycles"
                  onAction={() => navigate('/bikes')}
                  className="border-dashed max-w-full py-10"
                />
              )}

              {/* Quick Actions Grid */}
              <section aria-labelledby="quick-actions-heading" className="space-y-4">
                <div className="space-y-1">
                  <h2 id="quick-actions-heading" className="typography-h3 text-surface-100">
                    Quick Discovery Tools
                  </h2>
                  <p className="typography-small text-muted-foreground text-xs md:text-sm">
                    Direct access to catalogue exploration, dealership locator, and side-by-side vehicle comparison.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <Link
                        key={action.title}
                        to={action.href}
                        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red rounded-card"
                      >
                        <Card
                          variant="default"
                          interactive
                          className="h-full flex flex-col justify-between p-5 border-border/80 group-hover:border-brand-red/50 transition-colors"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="w-9 h-9 rounded-card bg-surface-800 border border-border flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-colors">
                                <ActionIcon className="w-4 h-4" aria-hidden="true" />
                              </div>
                              <Badge variant="outline" size="sm" className="text-[10px]">
                                {action.badge}
                              </Badge>
                            </div>

                            <div className="space-y-1">
                              <h3 className="typography-body font-semibold text-surface-100 group-hover:text-brand-red transition-colors flex items-center gap-1.5">
                                <span>{action.title}</span>
                                <ArrowUpRight
                                  className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                  aria-hidden="true"
                                />
                              </h3>
                              <p className="typography-small text-surface-200 text-xs leading-relaxed">
                                {action.description}
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-border/40 flex items-center text-xs font-semibold text-brand-red">
                            <span>Launch Tool</span>
                            <ArrowUpRight className="w-3 h-3 ml-1" aria-hidden="true" />
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: MY LEADS                                              */}
          {/* ============================================================ */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="typography-h3 text-surface-100">
                  Dealership Enquiries & Quotes
                </h2>
                <p className="typography-small text-muted-foreground text-xs md:text-sm">
                  Track your vehicle price enquiries, finance requests, and dealer correspondence.
                </p>
              </div>

              <LeadActivityList
                leads={leads}
                isLoading={activityLoading}
                error={activityError}
                onRetry={fetchUserActivity}
                onExplore={() => navigate('/bikes')}
              />
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: TEST RIDES                                            */}
          {/* ============================================================ */}
          {activeTab === 'testRides' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="typography-h3 text-surface-100">
                  Test Ride Appointments
                </h2>
                <p className="typography-small text-muted-foreground text-xs md:text-sm">
                  Scheduled showroom visits, time slots, and motorcycle test ride bookings.
                </p>
              </div>

              <TestRideActivityList
                testRides={testRides}
                isLoading={activityLoading}
                error={activityError}
                onRetry={fetchUserActivity}
                onExplore={() => navigate('/bikes')}
              />
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: OFFERS                                                */}
          {/* ============================================================ */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="typography-h3 text-surface-100">
                  Promotional Offers & Schemes
                </h2>
                <p className="typography-small text-muted-foreground text-xs md:text-sm">
                  Live dealer bonuses, cashback opportunities, and model-specific benefits.
                </p>
              </div>

              <OffersActivityList
                offers={offers}
                isLoading={activityLoading}
                error={activityError}
                onRetry={fetchUserActivity}
                onExplore={() => navigate('/bikes')}
              />
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: FAVORITES                                             */}
          {/* ============================================================ */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="typography-h3 text-surface-100">
                  Saved Wishlist
                </h2>
                <p className="typography-small text-muted-foreground text-xs md:text-sm">
                  Motorcycles and authorized dealerships you have bookmarked for quick access.
                </p>
              </div>

              <FavoritesActivityList
                favorites={favorites}
                isLoading={activityLoading}
                error={activityError}
                onRetry={fetchUserActivity}
                onExplore={() => navigate('/bikes')}
                onRemoved={fetchUserActivity}
              />
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 6: REVIEWS                                               */}
          {/* ============================================================ */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="typography-h3 text-surface-100">
                  My Showroom Reviews
                </h2>
                <p className="typography-small text-muted-foreground text-xs md:text-sm">
                  Ratings and dealership experience feedback submitted by your account.
                </p>
              </div>

              <ReviewActivityList
                reviews={reviews}
                isLoading={activityLoading}
                error={activityError}
                onRetry={fetchUserActivity}
                onExplore={() => navigate('/showrooms')}
                onRefresh={fetchUserActivity}
              />
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 7: NOTIFICATIONS                                         */}
          {/* ============================================================ */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="typography-h3 text-surface-100">
                  Customer Notifications & Alerts
                </h2>
                <p className="typography-small text-muted-foreground text-xs md:text-sm">
                  Real-time status updates on test ride appointments, enquiry responses, and alerts.
                </p>
              </div>

              <NotificationsActivityList
                onExplore={() => navigate('/bikes')}
              />
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 8: PROFILE / ACCOUNT                                     */}
          {/* ============================================================ */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="typography-h3 text-surface-100">
                  Account Credentials & Profile
                </h2>
                <p className="typography-small text-muted-foreground text-xs md:text-sm">
                  Your registered account identity, security status, and personal details.
                </p>
              </div>

              <ProfileSection
                user={user}
                onLogout={logout}
                onExplore={() => navigate('/bikes')}
              />
            </div>
          )}
        </main>
      </motion.div>
    </Container>
  );
};

export default DashboardPage;
