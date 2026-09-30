import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { checkApiHealth } from './services/api';

const App = () => {
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;
    checkApiHealth()
      .then((res) => {
        if (isMounted) {
          if (res?.success) {
            setApiStatus('connected');
          } else {
            setApiStatus('unreachable');
          }
        }
      })
      .catch(() => {
        if (isMounted) setApiStatus('unreachable');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>

        {/* Development-Only API Connectivity Status Indicator */}
        {import.meta.env.DEV && (
          <aside
            aria-live="polite"
            className="fixed bottom-4 right-4 z-50 pointer-events-none"
          >
            <div className="glass-surface px-3 py-1.5 rounded-full text-xs flex items-center gap-2 border border-border shadow-card-dark">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : apiStatus === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-muted'
                }`}
              />
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Dev API: {apiStatus}
              </span>
            </div>
          </aside>
        )}
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
