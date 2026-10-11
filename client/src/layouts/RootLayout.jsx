import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CompareBar from '../components/compare/CompareBar';
import { useCompare } from '../context/CompareContext';

/**
 * Root Application Layout
 * Provides global chrome, responsive navigation header, content container, footer,
 * and persistent bottom motorcycle comparison drawer.
 */
const RootLayout = () => {
  const { compareCount } = useCompare();

  return (
    <div className="min-h-screen flex flex-col bg-background text-surface-100 overflow-x-hidden w-full selection:bg-brand-red selection:text-white">
      {/* Global Header */}
      <Header />

      {/* Main Routed Page Content with dynamic bottom clearance for CompareBar */}
      <main className={`flex-1 w-full overflow-x-hidden ${compareCount > 0 ? 'pb-24 sm:pb-28' : ''}`}>
        <Outlet />
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Persistent Compare Bar */}
      <CompareBar />

      {/* Reference Status Signal */}
      <div className="fixed bottom-3 right-3 z-40 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-border shadow-md text-[11px] font-mono text-surface-200 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>DEV API: CONNECTED</span>
      </div>
    </div>
  );
};

export default RootLayout;
