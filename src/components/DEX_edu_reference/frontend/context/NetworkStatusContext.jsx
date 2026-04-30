/**
 * NetworkStatusContext – detectează rețea lentă (ca la Binance).
 * - La timeout din useVaultDeposit / alte hook-uri: se emite eveniment 'network-slow'.
 * - Ping periodic către backend: dacă latența > prag sau eșec → rețea lentă.
 * - Banner-ul afișează un mesaj discret; utilizatorul poate închide sau aștepta recuperarea.
 * - Ping folosește același endpoint ca restul app: /api/auth/me (nu /api/dex/v1/auth/me).
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getBackendUrl } from '../../config/apiEndpoints.js';

const PING_INTERVAL_MS = 60000;   // la fiecare 60s
const SLOW_LATENCY_MS = 8000;     // peste 8s = rețea lentă (evită fals pozitive pe Render)
const OK_LATENCY_MS = 4500;       // sub 4.5s = rețea OK – un singur răspuns bun resetează bannerul
const PING_URL_SUFFIX = '/api/auth/me'; // același endpoint ca auth check (GET – 200 sau 401 e răspuns rapid)
const NetworkStatusContext = createContext(null);

export function NetworkStatusProvider({ children }) {
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const okCountRef = useRef(0);

  const markSlow = useCallback((source = 'event') => {
    setSlowNetwork(true);
    setDismissed(false);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Ascultă evenimente 'network-slow' de la useVaultDeposit / alții
  useEffect(() => {
    const handler = (e) => {
      const src = e?.detail?.source || 'vault';
      markSlow(`event:${src}`);
    };
    window.addEventListener('network-slow', handler);
    return () => window.removeEventListener('network-slow', handler);
  }, [markSlow]);

  // Ping periodic: măsoară latența către backend (același URL ca auth)
  useEffect(() => {
    let cancelled = false;
    const url = `${getBackendUrl()}${PING_URL_SUFFIX}`;

    const ping = () => {
      if (cancelled) return;
      const start = Date.now();
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      fetch(url, { method: 'GET', credentials: 'include', signal: ctrl.signal })
        .then((res) => {
          clearTimeout(t);
          if (cancelled) return;
          const latency = Date.now() - start;
          if (latency >= SLOW_LATENCY_MS) {
            okCountRef.current = 0;
            setSlowNetwork(true);
            setDismissed(false);
          } else if (latency < OK_LATENCY_MS) {
            okCountRef.current += 1;
            if (okCountRef.current >= 1) {
              okCountRef.current = 0;
              setSlowNetwork(false);
            }
          }
        })
        .catch((err) => {
          clearTimeout(t);
          if (cancelled) return;
          okCountRef.current = 0;
          setSlowNetwork(true);
          setDismissed(false);
        });
    };

    const id = setInterval(ping, PING_INTERVAL_MS);
    ping(); // primul ping la mount

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const value = {
    slowNetwork,
    dismissed,
    markSlow,
    dismiss,
    showBanner: slowNetwork && !dismissed,
  };

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus() {
  const ctx = useContext(NetworkStatusContext);
  return ctx;
}
