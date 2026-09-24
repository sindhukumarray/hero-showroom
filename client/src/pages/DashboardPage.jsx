import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bike,
  Compass,
  GitCompare,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  ArrowUpRight,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';
import { leadService, testRideService } from '../services';
import Container from '../components/Container';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import LeadActivityList from '../components/dashboard/LeadActivityList';
import TestRideActivityList from '../components/dashboard/TestRideActivityList';

/**
 * Customer Dashboard Page
 * Provides authenticated profile summary, immediate catalogue quick actions, and active lead & test ride tracking.
 */
const DashboardPage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Customer Dashboard',
    description: 'Access your profile summary, authorized dealerships, and flagship motorbike discovery tools.'
  });

  // Recent Activity State
  const [leads, setLeads] = useState([]);
  const [testRides, setTestRides] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);
  const [activeTab, setActiveTab] = useState('testRides'); // 'testRides' | 'leads'

  const fetchUserActivity = async () => {
    try {
      setActivityLoading(true);
      setActivityError(null);
      const [leadsRes, ridesRes] = await Promise.all([
        leadService.getMyLeads(),
        testRideService.getMyTestRides()
      ]);
      setLeads(leadsRes?.data || []);
      setTestRides(ridesRes?.data || []);
    } catch (err) {
      setActivityError(err?.message || 'Failed to load your recent activity. Please try again.');
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserActivity();
    }
  }, [user]);

  if (isLoading) {
    return (
      <Container className="py-24 flex items-center justify-center min-h-[50vh]">
        <Loading text="Loading your dashboard..." size="lg" />
      </Container>
    );
  }

  // Safe user presentation properties
  const displayName = user?.name || 'Rider';
  const firstName = displayName.split(' ')[0];
  const userEmail = user?.email || 'Not provided';
  const userPhone = user?.phone && user.phone.trim() ? user.phone.trim() : 'Not provided';
  const userRole = user?.role ? user.role.toUpperCase() : 'CUSTOMER';
  const accountStatus = user?.isActive !== false ? 'Active' : 'Inactive';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric'
      })
    : 'Recent Member';

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
    }
  ];

  const totalActivityCount = leads.length + testRides.length;

  return (
    <Container className="py-10 md:py-16">
      <motion.div
        variants={accessiblePageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-10"
      >
        {/* ============================================================== */}
        {/* 1. Hero / Welcome Summary */}
        {/* ============================================================== */}
        <section aria-labelledby="welcome-heading" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand" size="sm" className="font-semibold tracking-wider">
              SHOWROOM ACCOUNT
            </Badge>
            <Badge variant="outline" size="sm" className="font-mono text-xs">
              {userRole}
            </Badge>
          </div>

          <h1 id="welcome-heading" className="typography-h1 text-surface-50 font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>

          <p className="typography-body text-surface-200 text-sm md:text-base max-w-2xl">
            Manage your motorcycle discovery journey, view scheduled dealership test rides, and track price quotes across authorized hubs.
          </p>
        </section>

        {/* ============================================================== */}
        {/* 2. Account Profile & Summary Card */}
        {/* ============================================================== */}
        <section aria-labelledby="account-details-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="account-details-heading" className="typography-h3 text-surface-100">
              Account Overview
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{accountStatus}</span>
            </div>
          </div>

          <Card variant="elevated" className="border-border/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Name field */}
              <div className="space-y-1.5">
                <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                  Full Name
                </span>
                <p className="font-sans font-semibold text-surface-100 text-sm md:text-base">
                  {displayName}
                </p>
              </div>

              {/* Email field */}
              <div className="space-y-1.5">
                <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                  Email Address
                </span>
                <p className="font-sans font-semibold text-surface-100 text-sm md:text-base truncate">
                  {userEmail}
                </p>
              </div>

              {/* Phone field */}
              <div className="space-y-1.5">
                <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                  Phone Number
                </span>
                <p className="font-sans font-semibold text-surface-100 text-sm md:text-base">
                  {userPhone}
                </p>
              </div>

              {/* Member Since field */}
              <div className="space-y-1.5">
                <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                  Member Since
                </span>
                <p className="font-sans font-semibold text-surface-100 text-sm md:text-base">
                  {memberSince}
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* ============================================================== */}
        {/* 3. Quick Actions Grid */}
        {/* ============================================================== */}
        <section aria-labelledby="quick-actions-heading" className="space-y-4">
          <div className="space-y-1">
            <h2 id="quick-actions-heading" className="typography-h3 text-surface-100">
              Quick Actions
            </h2>
            <p className="typography-small text-muted-foreground">
              Direct access to live catalogue features and vehicle comparison.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                    className="h-full flex flex-col justify-between p-6 border-border/80 group-hover:border-brand-red/50 transition-colors"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-card bg-surface-800 border border-border flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-colors">
                          <ActionIcon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <Badge variant="outline" size="sm">
                          {action.badge}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="typography-h3 text-surface-100 group-hover:text-brand-red transition-colors flex items-center gap-1.5">
                          <span>{action.title}</span>
                          <ArrowUpRight
                            className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            aria-hidden="true"
                          />
                        </h3>
                        <p className="typography-small text-surface-200 text-xs leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border/40 flex items-center text-xs font-semibold text-brand-red">
                      <span>Launch</span>
                      <ArrowUpRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. Real Activity Area: Test Rides & Leads */}
        {/* ============================================================== */}
        <section aria-labelledby="recent-activity-heading" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 id="recent-activity-heading" className="typography-h3 text-surface-100">
                Recent Activity
              </h2>
              <p className="typography-small text-muted-foreground">
                Scheduled test rides, showroom queries, and saved vehicle builds.
              </p>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchUserActivity}
              disabled={activityLoading}
              className="self-start sm:self-auto text-xs"
            >
              {activityLoading ? 'Updating...' : 'Refresh Activity'}
            </Button>
          </div>

          {/* Activity State Container */}
          {!activityLoading && totalActivityCount === 0 && !activityError ? (
            <EmptyState
              icon={Clock}
              title="No activity yet"
              message="You have not scheduled any test rides or saved bike models yet. Explore authorized showrooms and flagship motorcycles to start your journey."
              actionLabel="Explore Motorcycles"
              onAction={() => navigate('/bikes')}
              className="border-dashed max-w-full py-12"
            />
          ) : (
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-border/60 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('testRides')}
                  className={`
                    px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2
                    ${activeTab === 'testRides'
                      ? 'bg-surface-800 text-brand-red border-b-2 border-brand-red'
                      : 'text-muted-foreground hover:text-surface-100 hover:bg-surface-900'}
                  `}
                >
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span>Test Rides</span>
                  <Badge variant={activeTab === 'testRides' ? 'brand' : 'outline'} size="sm" className="text-[10px] px-1.5 py-0">
                    {testRides.length}
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('leads')}
                  className={`
                    px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors flex items-center gap-2
                    ${activeTab === 'leads'
                      ? 'bg-surface-800 text-brand-red border-b-2 border-brand-red'
                      : 'text-muted-foreground hover:text-surface-100 hover:bg-surface-900'}
                  `}
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>Dealership Enquiries</span>
                  <Badge variant={activeTab === 'leads' ? 'brand' : 'outline'} size="sm" className="text-[10px] px-1.5 py-0">
                    {leads.length}
                  </Badge>
                </button>
              </div>

              {/* Active Tab Content */}
              {activeTab === 'testRides' ? (
                <TestRideActivityList
                  testRides={testRides}
                  isLoading={activityLoading}
                  error={activityError}
                  onRetry={fetchUserActivity}
                  onExplore={() => navigate('/bikes')}
                />
              ) : (
                <LeadActivityList
                  leads={leads}
                  isLoading={activityLoading}
                  error={activityError}
                  onRetry={fetchUserActivity}
                  onExplore={() => navigate('/bikes')}
                />
              )}
            </div>
          )}
        </section>
      </motion.div>
    </Container>
  );
};

export default DashboardPage;
