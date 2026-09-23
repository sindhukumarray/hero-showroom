import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

/**
 * Root Application Layout
 * Provides global chrome, responsive navigation header, content container, and footer.
 */
const RootLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-surface-100 overflow-x-hidden w-full selection:bg-brand-red selection:text-white">
      {/* Global Header */}
      <Header />

      {/* Main Routed Page Content */}
      <main className="flex-1 w-full overflow-x-hidden">
        <Outlet />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default RootLayout;
