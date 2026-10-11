import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Layers,
  MapPin,
  Building2,
  Bike,
  Mail,
  Star,
  ArrowLeft,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Container from '../components/Container';
import Badge from '../components/Badge';
import Button from '../components/Button';

/**
 * Admin Console Navigation Items for Phase 4 modules
 */
const ADMIN_NAV_ITEMS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Brands', href: '/admin/brands', icon: Layers, exact: true },
  { label: 'Cities', href: '/admin/cities', icon: MapPin, exact: true },
  { label: 'Showrooms', href: '/admin/showrooms', icon: Building2, exact: true },
  { label: 'Bikes', href: '/admin/bikes', icon: Bike, exact: true },
  { label: 'Leads', href: '/admin/leads', icon: Mail, exact: true },
  { label: 'Reviews', href: '/admin/reviews', icon: Star, exact: true }
];

/**
 * Admin Layout Shell
 * Provides unified administrative chrome, role verification banner,
 * module navigation, and privileged outlet container.
 */
const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-surface-100 overflow-x-hidden w-full selection:bg-brand-red selection:text-white">
      {/* Top Administrative Chrome */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <Container className="py-3 flex items-center justify-between gap-4">
          {/* Brand & Portal Label */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="font-display font-extrabold text-lg tracking-wider text-surface-50 group-hover:text-brand-red transition-colors">
                HERO
              </span>
            </Link>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs tracking-wider text-surface-200 uppercase">
                Admin Console
              </span>
              <Badge variant="brand" size="sm" className="font-mono text-[10px] uppercase">
                PROD
              </Badge>
            </div>
          </div>

          {/* User Status & Exit Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-800 border border-border text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span className="text-surface-100 font-medium">{user?.name || 'Administrator'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                icon={ExternalLink}
                className="text-xs text-muted-foreground hover:text-surface-50"
              >
                Public Site
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              icon={LogOut}
              onClick={handleLogout}
              className="text-xs border-border/80 hover:border-brand-red hover:text-brand-red"
            >
              Sign Out
            </Button>
          </div>
        </Container>

        {/* Admin Navigation Sub-Bar */}
        <div className="border-t border-border/40 bg-surface-900/40">
          <Container className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`
                    px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap
                    ${isActive
                      ? 'bg-surface-800 text-brand-red shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-surface-100 hover:bg-surface-800/50'}
                  `}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-red' : 'text-muted-foreground'}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </Container>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 w-full py-8 md:py-12">
        <Outlet />
      </main>

      {/* Subtle Admin Footer */}
      <footer className="border-t border-border/40 py-4 bg-surface-950/60 text-center text-xs text-muted-foreground">
        <Container>
          Hero Showroom Administrative Console &bull; Role-Based Access Control Active
        </Container>
      </footer>
    </div>
  );
};

export default AdminLayout;
