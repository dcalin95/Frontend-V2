/**
 * A4: One-time toast when runtime-config.json failed and app uses fallback (env/default).
 * Renders children; shows toast once per session when getConfigSource() !== 'runtime-config.json'.
 */

import React, { useEffect } from 'react';
import { loadRuntimeConfig, getConfigSource } from '../../../config/runtimeConfig.js';
import { useToastContext } from '../../context/ToastContext';

let didShowFallbackToast = false;

export function FallbackConfigToast({ children }) {
  const { warning } = useToastContext();

  useEffect(() => {
    if (didShowFallbackToast) return;
    loadRuntimeConfig().then(() => {
      const source = getConfigSource();
      if (source !== 'runtime-config.json') {
        didShowFallbackToast = true;
        warning(
          `Using fallback config (${source}). Load runtime-config.json for production.`,
          'Config fallback',
          8000
        );
      }
    });
  }, [warning]);

  return <>{children}</>;
}

export default FallbackConfigToast;
