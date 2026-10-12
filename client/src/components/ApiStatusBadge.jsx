import React, { useState, useEffect } from 'react';
import { checkApiHealth } from '../services/api';

/**
 * ApiStatusBadge Component
 * Displays live backend connectivity status signal.
 *
 * In production:
 * - Displays "LIVE API: CONNECTED" when the production API health endpoint responds.
 * - Displays "LIVE API: CONNECTING" while verifying.
 * - Displays "LIVE API: DISCONNECTED" when the backend is unreachable.
 *
 * In local development:
 * - Displays "DEV API: CONNECTED", "DEV API: CONNECTING", or "DEV API: DISCONNECTED".
 *
 * Safe: Does not expose internal secrets, tokens, or technical stack traces.
 */
const ApiStatusBadge = () => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'connected' | 'disconnected'
  const isProd = Boolean(import.meta.env.PROD);

  useEffect(() => {
    let isMounted = true;

    const verifyLiveness = async () => {
      try {
        const response = await checkApiHealth();
        if (isMounted) {
          if (response && (response.success === true || response.status === 200 || response.message)) {
            setStatus('connected');
          } else {
            setStatus('disconnected');
          }
        }
      } catch {
        if (isMounted) {
          setStatus('disconnected');
        }
      }
    };

    verifyLiveness();

    // Periodic liveness polling every 45 seconds to keep status accurate
    const interval = setInterval(verifyLiveness, 45000);

    // Online/offline window events
    const handleOnline = () => verifyLiveness();
    const handleOffline = () => setStatus('disconnected');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const envPrefix = isProd ? 'LIVE API' : 'DEV API';

  let dotColor = 'bg-amber-500 animate-pulse';
  let label = `${envPrefix}: CONNECTING`;
  let titleAttr = `Connecting to ${isProd ? 'production' : 'development'} API...`;

  if (status === 'connected') {
    dotColor = 'bg-emerald-500 animate-pulse';
    label = `${envPrefix}: CONNECTED`;
    titleAttr = `Connected to ${isProd ? 'production' : 'development'} API`;
  } else if (status === 'disconnected') {
    dotColor = 'bg-rose-500';
    label = `${envPrefix}: DISCONNECTED`;
    titleAttr = `Unable to reach ${isProd ? 'production' : 'development'} API`;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      title={titleAttr}
      className="fixed bottom-3 right-3 z-40 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-border shadow-md text-[11px] font-mono text-surface-200 pointer-events-none transition-all duration-300"
    >
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </div>
  );
};

export default ApiStatusBadge;
