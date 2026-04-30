/**
 * BackendStatusContext – un singur strat de „stare backend” pentru DEX/OTA.
 * Expune: isReachable, error, lastCheck, triggerCheck.
 * Consumat de OTAPage (banner), optional de AutoTradePanel / TradingHistoryModal.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getOTAHealth } from '../services/aiTradingApiService';

const BackendStatusContext = createContext(null);

export function BackendStatusProvider({ children }) {
  const [isReachable, setIsReachable] = useState(null); // null = not checked, true = ok, false = unavailable
  const [error, setError] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const triggerCheck = useCallback(() => {
    setIsReachable(null);
    setError(null);
    getOTAHealth()
      .then(() => {
        setIsReachable(true);
        setError(null);
        setLastCheck(Date.now());
      })
      .catch((err) => {
        setIsReachable(false);
        setError(err?.message || 'Backend unavailable');
        setLastCheck(Date.now());
      });
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test' || typeof getOTAHealth !== 'function') return;
    triggerCheck();
  }, [triggerCheck]);

  const value = {
    isReachable,
    error,
    lastCheck,
    triggerCheck
  };

  return (
    <BackendStatusContext.Provider value={value}>
      {children}
    </BackendStatusContext.Provider>
  );
}

export function useBackendStatus() {
  const ctx = useContext(BackendStatusContext);
  if (!ctx) {
    throw new Error('useBackendStatus must be used within BackendStatusProvider');
  }
  return ctx;
}

/** Safe hook: returns context or null if outside provider (for tests that don't wrap). */
export function useBackendStatusOptional() {
  return useContext(BackendStatusContext);
}

export default BackendStatusContext;
