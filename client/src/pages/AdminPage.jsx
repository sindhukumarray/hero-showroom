import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Server,
  Layers,
  MapPin,
  Building2,
  Bike,
  Mail,
  Star,
  Activity,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services';
import Container from '../components/Container';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';

/**
 * Admin Console Foundation Page
 * Serves as the administrative entry point, verifying RBAC authorization against
 * /api/admin/status and laying the foundation for upcoming Phase 4 management modules.
 */
const AdminPage = () => {
  const { user } = useAuth();
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Admin Console | Hero Showroom',
    description: 'Platform administrative control center for catalogue management, lead distribution, and review moderation.'
  });

  const [adminStatus, setAdminStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const verifyAccess = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminService.getAdminStatus();
      setAdminStatus(res?.data || null);
    } catch (err) {
      setError(err?.message || 'Failed to verify administrative engine status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifyAccess();
  }, []);

  const adminModules = [
    {
      title: 'Brand & City Management',
      description: 'Manage manufacturer entities, state registrations, geographical tiers, and city coordinates.',
      icon: Layers,
      step: 'Step 2',
      status: 'Ready for Foundation'
    },
    {
      title: 'Showroom & Dealer Operations',
      description: 'Authorized dealer onboarding, Premia flagship tags, geospatial coordinates, and facility lists.',
      icon: Building2,
      step: 'Step 3',
      status: 'Ready for Foundation'
    },
    {
      title: 'Motorcycle & Variant Catalogue',
      description: 'Flagship bikes, technical specifications, variants, colorways, and ex-showroom price brackets.',
      icon: Bike,
      step: 'Step 4',
      status: 'Ready for Foundation'
    },
    {
      title: 'Customer Lead Management',
      description: 'Track dealership enquiries, lead qualification pipeline, dealer allocation, and conversion states.',
      icon: Mail,
      step: 'Step 5',
      status: 'Ready for Foundation'
    },
    {
      title: 'Review Moderation Pipeline',
      description: 'Audit customer showroom reviews, approve or reject ratings, and manage moderation notes.',
      icon: Star,
      step: 'Step 6',
      status: 'Ready for Foundation'
    },
    {
      title: 'Platform Telemetry & Audit',
      description: 'System health indicators, database connection metrics, and access security monitoring.',
      icon: Activity,
      step: 'Step 7',
      status: 'Active'
    }
  ];

  return (
    <Container className="space-y-10">
      <motion.div
        variants={accessiblePageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-10"
      >
        {/* ============================================================ */}
        {/* 1. Header & Admin Welcome                                     */}
        {/* ============================================================ */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" size="sm" className="font-semibold tracking-wider">
                ADMIN CONSOLE
              </Badge>
              <Badge variant="outline" size="sm" className="font-mono text-xs">
                RBAC ACTIVE
              </Badge>
            </div>

            <h1 className="typography-h1 text-surface-50 font-bold tracking-tight">
              Administrative Control Center
            </h1>

            <p className="typography-body text-surface-200 text-sm md:text-base max-w-2xl">
              Welcome back, {user?.name || 'Administrator'}. This portal oversees dealership operations, vehicle catalogue curation, lead management, and platform compliance.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={verifyAccess}
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? 'Checking...' : 'Refresh Status'}
            </Button>
          </div>
        </header>

        {/* ============================================================ */}
        {/* 2. Admin Engine Verification Card                            */}
        {/* ============================================================ */}
        <section aria-labelledby="status-heading" className="space-y-3">
          <h2 id="status-heading" className="typography-h3 text-surface-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-brand-red" aria-hidden="true" />
            <span>Admin Engine Status</span>
          </h2>

          {isLoading ? (
            <Card variant="elevated" className="p-8 flex justify-center border-border/80">
              <Loading text="Verifying administrative privileges against /api/admin/status..." size="md" />
            </Card>
          ) : error ? (
            <Card variant="default" className="p-6 border-rose-800/80 bg-rose-950/20 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" aria-hidden="true" />
              <p className="text-rose-200 text-sm">{error}</p>
              <Button variant="secondary" size="sm" onClick={verifyAccess}>
                Retry Verification
              </Button>
            </Card>
          ) : (
            <Card variant="elevated" className="p-6 md:p-8 border-border/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-card bg-surface-800 border border-border flex items-center justify-center text-brand-red">
                    <ShieldCheck className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="typography-h3 text-surface-50 font-bold">
                        {adminStatus?.system || 'Hero Showroom Administrative Engine'}
                      </h3>
                      <Badge variant="brand" size="sm" className="font-mono text-[10px]">
                        v{adminStatus?.version || '1.0.0'}
                      </Badge>
                    </div>
                    <p className="typography-small text-muted-foreground text-xs">
                      Server Timestamp: <span className="font-mono text-surface-200">{adminStatus?.serverTime || 'Live'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>RBAC Authorized: ADMIN</span>
                  </div>
                </div>
              </div>

              {/* Status Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium uppercase tracking-wider">Active Admin</span>
                  <p className="font-semibold text-surface-100 text-sm">{adminStatus?.admin?.name || user?.name || 'Administrator'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium uppercase tracking-wider">Email Address</span>
                  <p className="font-semibold text-surface-100 text-sm truncate">{adminStatus?.admin?.email || user?.email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium uppercase tracking-wider">Assigned Role</span>
                  <p className="font-semibold text-surface-100 text-sm font-mono text-brand-red uppercase">
                    {adminStatus?.admin?.role || user?.role || 'ADMIN'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium uppercase tracking-wider">Endpoint Guard</span>
                  <p className="font-semibold text-emerald-400 text-sm font-mono">/api/admin (RBAC)</p>
                </div>
              </div>
            </Card>
          )}
        </section>

        {/* ============================================================ */}
        {/* 3. Phase 4 Modules Overview Grid                             */}
        {/* ============================================================ */}
        <section aria-labelledby="modules-heading" className="space-y-4">
          <div className="space-y-1">
            <h2 id="modules-heading" className="typography-h3 text-surface-100">
              Phase 4 Management Modules
            </h2>
            <p className="typography-small text-muted-foreground text-xs md:text-sm">
              Architectural modules established under the Admin foundation. Features will be enabled iteratively in subsequent Phase 4 steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {adminModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Card
                  key={mod.title}
                  variant="default"
                  className="p-5 border-border/80 flex flex-col justify-between space-y-4 group hover:border-brand-red/40 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-card bg-surface-800 border border-border flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                        {mod.step}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <h3 className="typography-body font-semibold text-surface-100 group-hover:text-brand-red transition-colors">
                        {mod.title}
                      </h3>
                      <p className="typography-small text-surface-200 text-xs leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{mod.status}</span>
                    <span className="text-brand-red font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Inspect &rarr;
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </motion.div>
    </Container>
  );
};

export default AdminPage;
