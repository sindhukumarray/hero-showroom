import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, X, ShieldCheck, Compass, Bike, GitCompare, LayoutDashboard, UserCheck } from 'lucide-react';

const RootLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/showrooms', label: 'Showrooms', icon: Compass },
    { to: '/bikes', label: 'Bikes', icon: Bike },
    { to: '/compare', label: 'Compare', icon: GitCompare },
  ];

  const authLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin', label: 'Admin', icon: ShieldCheck },
    { to: '/login', label: 'Sign In', icon: UserCheck }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-surface-100 overflow-x-hidden w-full selection:bg-brand-red selection:text-white">
      {/* Top Architectural Header */}
      <header className="sticky top-0 z-50 w-full glass-surface border-b border-border/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-3 text-surface-50 focus-visible:ring-2 focus-visible:ring-brand-red rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-card bg-brand-red flex items-center justify-center font-display font-black text-white text-xl shadow-glow-red tracking-wider">
              H
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg tracking-wider uppercase text-surface-50 leading-none">
                HERO<span className="text-brand-red">.</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-muted-foreground leading-tight">
                Showroom
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white bg-surface-800 border border-border shadow-sm'
                      : 'text-surface-200 hover:text-white hover:bg-surface-800/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Action/Auth Links */}
          <div className="hidden md:flex items-center gap-3">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive ? 'text-white' : 'text-muted-foreground hover:text-white'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive ? 'text-white' : 'text-muted-foreground hover:text-white'
                }`
              }
            >
              Admin
            </NavLink>
            <NavLink
              to="/login"
              className="typography-button px-4 py-2 rounded-card bg-brand-red hover:bg-brand-red-hover text-white text-sm shadow-glow-red transition-all"
            >
              Sign In
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-surface-200 hover:text-white hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-surface border-b border-border/80 px-4 pt-2 pb-6 space-y-2">
            {[...navLinks, ...authLinks].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                    isActive
                      ? 'text-white bg-surface-800 border border-border'
                      : 'text-surface-200 hover:text-white hover:bg-surface-800/60'
                  }`
                }
              >
                {item.icon && <item.icon className="w-4 h-4 text-brand-red" />}
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main Page Layout Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Outlet />
      </main>

      {/* Architectural Footer */}
      <footer className="w-full border-t border-border/60 bg-background-deep text-surface-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-surface-50 text-sm tracking-wider uppercase">
                HERO SHOWROOM
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-800 text-muted-foreground border border-border">
                Phase 1 Foundation
              </span>
            </div>
            <p className="typography-small text-xs">
              Commercial-grade automotive showroom discovery platform.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>React + Vite</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Framer Motion</span>
            <span>•</span>
            <span>Express API</span>
          </div>

          <p className="text-xs text-muted-foreground text-center md:text-right">
            © 2026 Hero Showroom Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;
