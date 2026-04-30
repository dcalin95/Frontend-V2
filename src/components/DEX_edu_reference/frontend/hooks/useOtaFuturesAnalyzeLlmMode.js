import { useState, useEffect } from 'react';
import {
  getOtaFuturesAnalyzeLlmMode,
  OTA_FUTURES_ANALYZE_LLM_CHANGE,
} from '../utils/otaAnalysisModePreference';

/**
 * Modul comutatorului „Cu OpenAI” / „Doar OTA BITS” din short-ops (localStorage + eveniment).
 */
export function useOtaFuturesAnalyzeLlmMode() {
  const [mode, setMode] = useState(() => getOtaFuturesAnalyzeLlmMode());
  useEffect(() => {
    const onChange = (e) => {
      setMode(e?.detail?.mode ?? getOtaFuturesAnalyzeLlmMode());
    };
    window.addEventListener(OTA_FUTURES_ANALYZE_LLM_CHANGE, onChange);
    return () => window.removeEventListener(OTA_FUTURES_ANALYZE_LLM_CHANGE, onChange);
  }, []);
  return mode;
}
