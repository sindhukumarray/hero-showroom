import React from 'react';
import { NavLink } from 'react-router-dom';
import Container from './Container';

/**
 * Refined Global Footer Component
 * Standardized project navigation, copyright, and platform architecture signals.
 */
const Footer = () => {
  const footerNavigation = {
    platform: [
      { label: 'Explore Showrooms', to: '/showrooms' },
      { label: 'Motorcycle Catalogue', to: '/bikes' },
      { label: 'Model Comparison', to: '/compare' },
    ],
    account: [
      { label: 'Portal Sign In', to: '/login' },
      { label: 'Create Account', to: '/register' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
    system: [
      { label: 'Admin Console', to: '/admin' },
      { label: 'API Health Status', to: '/#health' },
      { label: 'Architecture Guide', to: '/#architecture' },
    ]
  };

  return (
    <footer className="w-full border-t border-border bg-white text-surface-200 mt-auto">
      <Container className="py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 pb-12 border-b border-border">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-card bg-brand-red flex items-center justify-center font-display font-black text-white text-base shadow-glow-red">
                H
              </div>
              <span className="font-display font-bold text-surface-50 text-base tracking-wider uppercase">
                HERO SHOWROOM
              </span>
            </div>
            <p className="typography-small text-xs leading-relaxed">
              Premium automotive showroom discovery platform connecting riders with authorized dealerships and specifications.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-800 border border-border text-[11px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Verified Dealership Platform
            </div>
          </div>

          {/* Navigation Columns */}
          <div>
            <h4 className="typography-label text-surface-50 mb-4 font-bold">Discovery</h4>
            <ul className="space-y-2.5 text-sm">
              {footerNavigation.platform.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className="text-surface-200 hover:text-brand-red transition-colors"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="typography-label text-surface-100 mb-4">Portals</h4>
            <ul className="space-y-2.5 text-sm">
              {footerNavigation.account.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className="text-surface-200 hover:text-white transition-colors"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="typography-label text-surface-100 mb-4">Foundation</h4>
            <ul className="space-y-2.5 text-sm">
              {footerNavigation.system.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className="text-surface-200 hover:text-white transition-colors"
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 Hero Showroom Platform. Commercial Automotive Architecture.</p>
          <div className="flex items-center gap-4">
            <span>React 18 + Vite</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Framer Motion</span>
            <span>•</span>
            <span>Express REST API</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
