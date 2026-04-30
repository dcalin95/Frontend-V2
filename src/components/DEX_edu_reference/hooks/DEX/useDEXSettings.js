/**
 * useDEXSettings - Custom Hook for DEX Settings
 * 
 * Hook for managing user preferences:
 * - Theme (Dark/Light)
 * - Trade Panel Position (Left/Right)
 * - Orderbook Position (Left/Right)
 * - Language
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dex_settings';
export const DEX_SETTINGS_CHANGE_EVENT = 'dex_settings_changed';

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  tradePanelPosition: 'right',
  orderbookPosition: 'right',
  language: 'en',
  country: 'US',
  defaultChartTimeframe: 'D',
  interfaceDensity: 'comfortable',
  soundEnabled: true,
  soundVolume: 0.7
};

const ALLOWED_TIMEFRAMES = new Set(['1', '5', '15', '30', '60', '240', 'D', 'W']);
const ALLOWED_DENSITIES = new Set(['comfortable', 'compact']);

const normalizeSoundVolume = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SETTINGS.soundVolume;
  return Math.min(1, Math.max(0, parsed));
};

const normalizeSettings = (settings = {}) => ({
  ...DEFAULT_SETTINGS,
  ...settings,
  // Display theme is controlled by DEXThemeContext. Keep this legacy key dark
  // so old saved "light" values do not partially override the black DEX.
  theme: 'dark',
  defaultChartTimeframe: ALLOWED_TIMEFRAMES.has(settings.defaultChartTimeframe)
    ? settings.defaultChartTimeframe
    : DEFAULT_SETTINGS.defaultChartTimeframe,
  interfaceDensity: ALLOWED_DENSITIES.has(settings.interfaceDensity)
    ? settings.interfaceDensity
    : DEFAULT_SETTINGS.interfaceDensity,
  soundEnabled: typeof settings.soundEnabled === 'boolean'
    ? settings.soundEnabled
    : DEFAULT_SETTINGS.soundEnabled,
  soundVolume: normalizeSoundVolume(settings.soundVolume),
});

/**
 * Load settings from localStorage
 */
const loadSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return normalizeSettings(JSON.parse(stored));
    }
  } catch (error) {
    console.error('[DEX Settings] Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
};

/**
 * Save settings to localStorage
 */
const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSettings(settings)));
  } catch (error) {
    console.error('[DEX Settings] Error saving settings:', error);
  }
};

const notifySettingsChanged = (settings) => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(DEX_SETTINGS_CHANGE_EVENT, { detail: settings }));
  }, 0);
};

/**
 * Apply theme to document
 */
const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark-theme');
    root.classList.remove('light-theme');
  } else {
    root.classList.add('light-theme');
    root.classList.remove('dark-theme');
  }
  // Set data attribute for CSS selectors
  root.setAttribute('data-theme', theme);
};

/**
 * Custom hook for DEX Settings.
 * @returns {Object} { settings, updateSetting, updateSettings, resetSettings }
 */
export function useDEXSettings() {
  const [settings, setSettings] = useState(() => loadSettings());
  const [isLoading, setIsLoading] = useState(true);

  // Load and apply settings on mount
  useEffect(() => {
    const loadedSettings = loadSettings();
    setSettings(loadedSettings);
    applyTheme(loadedSettings.theme);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncSettings = (event) => {
      const next = event?.detail && typeof event.detail === 'object'
        ? normalizeSettings(event.detail)
        : loadSettings();
      setSettings(next);
      applyTheme(next.theme);
    };
    const syncFromStorage = (event) => {
      if (event?.key && event.key !== STORAGE_KEY) return;
      syncSettings();
    };
    window.addEventListener(DEX_SETTINGS_CHANGE_EVENT, syncSettings);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener(DEX_SETTINGS_CHANGE_EVENT, syncSettings);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (!isLoading) {
      applyTheme(settings.theme);
      saveSettings(settings);
    }
  }, [settings.theme, isLoading]);

  // Save settings when they change
  useEffect(() => {
    if (!isLoading) {
      saveSettings(settings);
    }
  }, [settings, isLoading]);

  /**
   * Update a single setting
   */
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const updated = normalizeSettings({ ...prev, [key]: value });
      // Apply theme immediately if changed
      if (key === 'theme') {
        applyTheme(updated.theme);
      }
      saveSettings(updated);
      notifySettingsChanged(updated);
      return updated;
    });
  }, []);

  /**
   * Update multiple settings at once
   */
  const updateSettings = useCallback((updates) => {
    setSettings(prev => {
      const updated = normalizeSettings({ ...prev, ...updates });
      // Apply theme immediately if changed
      if (updates.theme) {
        applyTheme(updated.theme);
      }
      saveSettings(updated);
      notifySettingsChanged(updated);
      return updated;
    });
  }, []);

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    applyTheme(DEFAULT_SETTINGS.theme);
    localStorage.removeItem(STORAGE_KEY);
    notifySettingsChanged(DEFAULT_SETTINGS);
  }, []);

  /**
   * Toggle theme between dark and light
   */
  const toggleTheme = useCallback(() => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSetting('theme', newTheme);
  }, [settings.theme, updateSetting]);

  return {
    settings,
    isLoading,
    updateSetting,
    updateSettings,
    resetSettings,
    toggleTheme
  };
}

export default useDEXSettings;
