/**
 * 🎯 useOTAMode Hook - Trading Mode Management
 *
 * - Persistă selecția în URL + sessionStorage (mode=auto nu se pierde la refresh/navigare).
 * - Validează disponibilitatea mode-ului bazat pe access level.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOTAAccess } from './useOTAAccess';
import {
  TRADING_MODES,
  getDefaultTradingMode,
  getAvailableTradingModes,
  isTradingModeAvailable,
  isBotAuthorized
} from '../utils/otaTradingModes';

const OTA_MODE_STORAGE_KEY = 'ota_trading_mode';

/**
 * useOTAMode Hook
 *
 * Single source: useOTAAccess (registration + botAuthorizations). No direct context.
 * @returns {object} currentMode, setMode, availableModes, isCurrentModeAvailable, botAuthorized, accessLevel
 */
export const useOTAMode = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessLevel, botAuthorizations, executorBotAddress } = useOTAAccess();
  
  // Mode din URL, sau sessionStorage (auto), sau default – ca să nu apară iar Start după refresh
  const urlMode = searchParams.get('mode');
  const defaultMode = getDefaultTradingMode(accessLevel);
  const rawMode = urlMode && Object.values(TRADING_MODES).includes(urlMode) ? urlMode : defaultMode;
  let initialMode = rawMode === TRADING_MODES.ASSISTED ? defaultMode : rawMode;
  if (!urlMode && typeof sessionStorage !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(OTA_MODE_STORAGE_KEY);
      if (stored === TRADING_MODES.AUTO && accessLevel === 'full') initialMode = TRADING_MODES.AUTO;
    } catch (_) {}
  }
  const [currentMode, setCurrentMode] = useState(initialMode);
  
  const botAuthorized = useMemo(
    () => isBotAuthorized(botAuthorizations, executorBotAddress),
    [botAuthorizations, executorBotAddress]
  );

  const availableModes = useMemo(
    () => getAvailableTradingModes(accessLevel, botAuthorized),
    [accessLevel, botAuthorized]
  );

  const isCurrentModeAvailable = useMemo(() => {
    return isTradingModeAvailable(currentMode, accessLevel, botAuthorized);
  }, [currentMode, accessLevel, botAuthorized]);
  
  // Update mode in URL, state and sessionStorage (auto nu se pierde)
  const setMode = useCallback((mode) => {
    if (!Object.values(TRADING_MODES).includes(mode)) {
      console.warn(`Invalid trading mode: ${mode}`);
      return;
    }

    if (!isTradingModeAvailable(mode, accessLevel, botAuthorized)) {
      console.warn(`Trading mode ${mode} not available for access level ${accessLevel}`);
      const fallbackMode = getDefaultTradingMode(accessLevel);
      setCurrentMode(fallbackMode);
      try { sessionStorage.removeItem(OTA_MODE_STORAGE_KEY); } catch (_) {}
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('mode', fallbackMode);
        return newParams;
      });
      return;
    }

    setCurrentMode(mode);
    try {
      if (mode === TRADING_MODES.AUTO) sessionStorage.setItem(OTA_MODE_STORAGE_KEY, TRADING_MODES.AUTO);
      else sessionStorage.removeItem(OTA_MODE_STORAGE_KEY);
    } catch (_) {}
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('mode', mode);
      return newParams;
    });
  }, [accessLevel, botAuthorized, setSearchParams]);
  
  // Sync mode with URL; dacă URL nu are mode, refă mode=auto din sessionStorage ca să nu apară iar Start
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    const mode = urlMode === TRADING_MODES.ASSISTED ? getDefaultTradingMode(accessLevel) : urlMode;
    if (mode && Object.values(TRADING_MODES).includes(mode)) {
      if (isTradingModeAvailable(mode, accessLevel, botAuthorized) && mode !== TRADING_MODES.ASSISTED) {
        setCurrentMode(mode);
      } else if (mode === TRADING_MODES.ASSISTED || !isTradingModeAvailable(mode, accessLevel, botAuthorized)) {
        const defaultMode = getDefaultTradingMode(accessLevel);
        setCurrentMode(defaultMode);
        try { sessionStorage.removeItem(OTA_MODE_STORAGE_KEY); } catch (_) {}
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.set('mode', defaultMode);
          return newParams;
        });
      }
    } else if (!urlMode) {
      // URL fără mode: păstrăm auto dacă user l-a ales (sessionStorage) – nu revenim la Start
      let modeToSet = getDefaultTradingMode(accessLevel);
      try {
        const stored = sessionStorage.getItem(OTA_MODE_STORAGE_KEY);
        if (stored === TRADING_MODES.AUTO && accessLevel === 'full' && isTradingModeAvailable(TRADING_MODES.AUTO, accessLevel, botAuthorized)) {
          modeToSet = TRADING_MODES.AUTO;
        }
      } catch (_) {}
      setCurrentMode(modeToSet);
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('mode', modeToSet);
        return newParams;
      });
    }
  }, [searchParams, accessLevel, botAuthorized, setSearchParams]);
  
  // Reset la default doar dacă modul curent chiar nu e disponibil (nu la flicker-uri)
  useEffect(() => {
    if (!isCurrentModeAvailable) {
      const defaultMode = getDefaultTradingMode(accessLevel);
      setMode(defaultMode);
    }
  }, [accessLevel, isCurrentModeAvailable, setMode]);
  
  return {
    currentMode,
    setMode,
    availableModes,
    isCurrentModeAvailable,
    botAuthorized,
    accessLevel
  };
};

export default useOTAMode;
