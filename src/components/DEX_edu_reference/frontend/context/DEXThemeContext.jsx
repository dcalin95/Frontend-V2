/**
 * DEX Theme Context – tema globală de afișare (Sonnet / Claude / Gemini)
 *
 * Persistă tema în localStorage (dex-theme) și o expune la tot arborele DEX.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'dex-theme';

const DEXThemeContext = createContext(null);

export const DEXThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'sonnet';
    const saved = localStorage.getItem(STORAGE_KEY) || 'sonnet';
    return ['sonnet', 'claude', 'gemini'].includes(saved) ? saved : 'sonnet';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}
  }, [theme]);

  const setTheme = useCallback((value) => {
    const allowed = ['sonnet', 'claude', 'gemini'];
    const next = allowed.includes(value) ? value : 'sonnet';
    setThemeState(next);
  }, []);

  return (
    <DEXThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </DEXThemeContext.Provider>
  );
};

export const useDEXTheme = () => {
  const ctx = useContext(DEXThemeContext);
  if (!ctx) {
    return { theme: 'sonnet', setTheme: () => {} };
  }
  return ctx;
};

export default DEXThemeContext;
