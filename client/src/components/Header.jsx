import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Compass, Bike, GitCompare, LogIn, UserPlus, LogOut, User as UserIcon, Home, Tag, Search, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Container from './Container';
import Button from './Button';
import NotificationBell from './notifications/NotificationBell';
import { useCompare } from '../context/CompareContext';

/**
 * Refined Global Header Component
 * Compact professional navbar with Hero logo, navigation, search, notifications, favorites, and profile state.
 */
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { compareCount } = useCompare();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/showrooms', label: 'Showrooms', icon: Compass },
    { to: '/bikes', label: 'Bikes', icon: Bike },
    { to: '/offers', label: 'Offers', icon: Tag },
    { to: '/compare', label: 'Compare', icon: GitCompare }
  ];

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-surface border-b border-border/80 backdrop-blur-md transition-all">
      <Container className="h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-2.5 text-surface-50 focus-visible:ring-2 focus-visible:ring-brand-red rounded-lg p-1 group"
        >
          <div className="w-8 h-8 rounded-md bg-brand-red flex items-center justify-center font-display font-black text-white text-base shadow-glow-red tracking-wider group-hover:scale-105 transition-transform">
            H
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-base tracking-wider uppercase text-surface-50 leading-none">
              HERO<span className="text-brand-red">.</span>
            </span>
            <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-muted-foreground leading-tight">
              Showroom
            </span>
          </div>
        </NavLink>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'text-brand-red bg-brand-red-subtle border border-brand-red/20 shadow-xs'
                    : 'text-surface-100 hover:text-brand-red hover:bg-surface-800'
                }`
              }
            >
              <span>{item.label}</span>
              {item.to === '/compare' && compareCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-brand-red text-white leading-none">
                  {compareCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Search, Favorites & Authentication / Session Links */}
        <div className="hidden md:flex items-center gap-2">
          {/* Quick Search Trigger */}
          <NavLink
            to="/bikes"
            className="p-2 rounded-lg text-surface-200 hover:text-surface-50 hover:bg-surface-800 transition-colors focus-visible:ring-2 focus-visible:ring-brand-red"
            title="Search Motorcycle Catalogue"
            aria-label="Search Motorcycle Catalogue"
          >
            <Search className="w-4 h-4" />
          </NavLink>

          {/* Favorites Link */}
          <NavLink
            to="/dashboard"
            className="p-2 rounded-lg text-surface-200 hover:text-brand-red hover:bg-surface-800 transition-colors focus-visible:ring-2 focus-visible:ring-brand-red"
            title="Saved Favorites"
            aria-label="Saved Favorites"
          >
            <Heart className="w-4 h-4" />
          </NavLink>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              <NotificationBell />
              <NavLink to="/dashboard">
                <Button variant="ghost" size="sm" icon={UserIcon} className="text-xs h-8 px-2.5">
                  {user?.name?.split(' ')[0] || 'Profile'}
                </Button>
              </NavLink>
              <Button
                variant="secondary"
                size="sm"
                icon={LogOut}
                onClick={handleLogout}
                className="text-xs h-8 px-2.5"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-border/60">
              <NavLink
                to="/register"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-200 hover:text-surface-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </NavLink>
              <NavLink to="/login">
                <Button
                  variant="primary"
                  size="sm"
                  icon={LogIn}
                  iconPosition="right"
                  className="text-xs h-8 px-3.5 font-bold rounded-lg shadow-glow-red"
                >
                  Sign In
                </Button>
              </NavLink>
            </div>
          )}
        </div>

        {/* Mobile Navigation Trigger */}
        <div className="md:hidden flex items-center gap-2">
          {isAuthenticated && <NotificationBell />}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-card text-surface-200 hover:text-surface-50 hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </Container>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-surface border-b border-border px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-card text-base font-semibold transition-all ${
                  isActive
                    ? 'text-brand-red bg-brand-red-subtle border border-brand-red/20 shadow-sm'
                    : 'text-surface-200 hover:text-surface-50 hover:bg-surface-800/80'
                }`
              }
            >
              <item.icon className="w-4 h-4 text-brand-red" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {item.to === '/compare' && compareCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-brand-red text-white">
                  {compareCount}
                </span>
              )}
            </NavLink>
          ))}

          <div className="pt-4 border-t border-border/80 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="ghost" fullWidth size="md" icon={UserIcon}>
                    Dashboard ({user?.name || 'User'})
                  </Button>
                </NavLink>
                <Button
                  variant="secondary"
                  fullWidth
                  size="md"
                  icon={LogOut}
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="primary" fullWidth size="md" icon={LogIn}>
                    Sign In
                  </Button>
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="secondary" fullWidth size="md" icon={UserPlus}>
                    Create Account
                  </Button>
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
