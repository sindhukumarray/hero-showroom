import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Compass, Bike, GitCompare, LogIn, UserPlus } from 'lucide-react';
import Container from './Container';
import Button from './Button';

/**
 * Refined Global Header Component
 * Provides responsive navigation, active route styling, and accessible mobile controls.
 */
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/showrooms', label: 'Showrooms', icon: Compass },
    { to: '/bikes', label: 'Bikes', icon: Bike },
    { to: '/compare', label: 'Compare', icon: GitCompare },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-surface border-b border-border/80 transition-all">
      <Container className="h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-3 text-surface-50 focus-visible:ring-2 focus-visible:ring-brand-red rounded-lg p-1 group"
        >
          <div className="w-10 h-10 rounded-card bg-brand-red flex items-center justify-center font-display font-black text-white text-xl shadow-glow-red tracking-wider group-hover:scale-105 transition-transform">
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

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white bg-surface-800/90 border border-border shadow-sm'
                    : 'text-surface-200 hover:text-white hover:bg-surface-800/40'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Authentication / Entry Links */}
        <div className="hidden md:flex items-center gap-3">
          <NavLink to="/register">
            <Button variant="ghost" size="sm" icon={UserPlus} className="text-xs">
              Register
            </Button>
          </NavLink>
          <NavLink to="/login">
            <Button variant="primary" size="sm" icon={LogIn} className="text-xs">
              Sign In
            </Button>
          </NavLink>
        </div>

        {/* Mobile Navigation Trigger */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-card text-surface-200 hover:text-white hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
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
                `flex items-center gap-3 px-3.5 py-3 rounded-card text-base font-medium transition-all ${
                  isActive
                    ? 'text-white bg-surface-800 border border-border'
                    : 'text-surface-200 hover:text-white hover:bg-surface-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 text-brand-red" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-4 border-t border-border/80 flex flex-col gap-2.5">
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
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
