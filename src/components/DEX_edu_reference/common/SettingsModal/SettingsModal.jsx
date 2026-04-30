/**
 * SettingsModal - global DEX settings with visible UI effects.
 *
 * Contains only options with a real effect:
 * - Display theme changes the DEX theme tokens.
 * - Network diagnostics runs a live speed test.
 *
 * Removed unused or placeholder controls that no current screen consumes.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, Gauge, Palette, RefreshCw, RotateCcw, Volume2, VolumeX, Wifi } from 'lucide-react';
import { Modal, ModalHeader, ModalBody } from '../../frontend/components/common/Modal';
import { useDEXTheme } from '../../frontend/context/DEXThemeContext';
import { useHeaderToken } from '../../frontend/context/HeaderTokenContext';
import { useSpeedTest } from '../../frontend/hooks/useSpeedTest';
import { playDexSound } from '../../frontend/utils/dexSound';
import { DEFAULT_SETTINGS, useDEXSettings } from '../../hooks/DEX/useDEXSettings';
import './SettingsModal.css';

const DISPLAY_THEMES = [
  { code: 'sonnet', name: 'Sonnet', description: 'Compact blue accent' },
  { code: 'claude', name: 'Claude', description: 'Warm amber accent' },
  { code: 'gemini', name: 'Gemini', description: 'Airy violet accent' },
  { code: 'default', name: 'Default', description: 'Base DEX theme' },
];

const DEFAULT_TOKENS = ['BNB', 'BTC', 'ETH', 'SOL', 'STX', 'CAKE', 'LINK', 'MATIC'];

const CHART_TIMEFRAMES = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: 'D', label: '1D' },
  { value: 'W', label: '1W' },
];

const normalizeSettings = (value) => ({
  ...DEFAULT_SETTINGS,
  ...(value || {}),
});

const SettingsModal = ({ isOpen, onClose }) => {
  const { theme: activeDisplayTheme, setTheme: setDisplayTheme } = useDEXTheme();
  const { settings, updateSettings } = useDEXSettings();
  const [selectedToken, setSelectedToken] = useHeaderToken();
  const { run, running, result, error } = useSpeedTest();
  const [draftDisplayTheme, setDraftDisplayTheme] = useState(activeDisplayTheme || 'sonnet');
  const [draftSettings, setDraftSettings] = useState(() => normalizeSettings(settings));
  const [draftDefaultToken, setDraftDefaultToken] = useState(selectedToken || 'BNB');

  useEffect(() => {
    if (isOpen) {
      setDraftDisplayTheme(activeDisplayTheme || 'sonnet');
      setDraftSettings(normalizeSettings(settings));
      setDraftDefaultToken(selectedToken || 'BNB');
    }
  }, [activeDisplayTheme, isOpen, selectedToken, settings]);

  const selectedTheme = DISPLAY_THEMES.find(item => item.code === draftDisplayTheme) || DISPLAY_THEMES[0];
  const hasChanges = useMemo(
    () => (
      (activeDisplayTheme || 'sonnet') !== draftDisplayTheme
      || (selectedToken || 'BNB') !== draftDefaultToken
      || settings.defaultChartTimeframe !== draftSettings.defaultChartTimeframe
      || settings.interfaceDensity !== draftSettings.interfaceDensity
      || settings.soundEnabled !== draftSettings.soundEnabled
      || Number(settings.soundVolume) !== Number(draftSettings.soundVolume)
    ),
    [activeDisplayTheme, draftDisplayTheme, draftDefaultToken, draftSettings, selectedToken, settings],
  );

  if (!isOpen) return null;

  const updateDraftSetting = (key, value) => {
    setDraftSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setDraftDisplayTheme('sonnet');
    setDraftSettings(DEFAULT_SETTINGS);
    setDraftDefaultToken('BNB');
  };

  const handleSave = () => {
    setDisplayTheme(draftDisplayTheme);
    updateSettings(draftSettings);
    setSelectedToken(draftDefaultToken);
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium" showHeader={false} className="settings-modal-shell">
      <ModalHeader onClose={onClose}>
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
          Global DEX Settings
        </h2>
      </ModalHeader>

      <ModalBody>
        <div className="settings-modal-content">
          <p className="settings-modal-description">
            These preferences are saved on this browser and apply globally across the DEX after you press Save changes.
          </p>

          {/* Display theme - saved explicitly */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Palette size={18} />
              <h3 className="settings-section-title">Display theme</h3>
            </div>
            <div className="settings-theme-grid" role="radiogroup" aria-label="Display theme">
              {DISPLAY_THEMES.map(item => (
                <button
                  key={item.code}
                  type="button"
                  className={`settings-theme-option settings-theme-option--${item.code} ${draftDisplayTheme === item.code ? 'active' : ''}`}
                  onClick={() => setDraftDisplayTheme(item.code)}
                  role="radio"
                  aria-checked={draftDisplayTheme === item.code}
                >
                  <span className="settings-theme-swatch" aria-hidden="true" />
                  <span className="settings-theme-copy">
                    <span className="settings-theme-name">{item.name}</span>
                    <span className="settings-theme-description">{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="settings-theme-note">
              The DEX background stays pure black by design; this changes accent color, spacing, borders, and typography.
            </p>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">
              <Gauge size={18} />
              <h3 className="settings-section-title">Global defaults</h3>
            </div>
            <div className="settings-form-grid">
              <label className="settings-field">
                <span className="settings-field-label">Default market token</span>
                <select
                  className="settings-select"
                  value={draftDefaultToken}
                  onChange={(e) => setDraftDefaultToken(e.target.value)}
                >
                  {DEFAULT_TOKENS.map(token => (
                    <option key={token} value={token}>{token}</option>
                  ))}
                </select>
              </label>
              <label className="settings-field">
                <span className="settings-field-label">Default chart timeframe</span>
                <select
                  className="settings-select"
                  value={draftSettings.defaultChartTimeframe}
                  onChange={(e) => updateDraftSetting('defaultChartTimeframe', e.target.value)}
                >
                  {CHART_TIMEFRAMES.map(item => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">
              <Clock3 size={18} />
              <h3 className="settings-section-title">Interface density</h3>
            </div>
            <div className="settings-segmented" role="radiogroup" aria-label="Interface density">
              {['comfortable', 'compact'].map(value => (
                <button
                  key={value}
                  type="button"
                  className={`settings-segmented-btn ${draftSettings.interfaceDensity === value ? 'active' : ''}`}
                  onClick={() => updateDraftSetting('interfaceDensity', value)}
                  role="radio"
                  aria-checked={draftSettings.interfaceDensity === value}
                >
                  {value === 'comfortable' ? 'Comfortable' : 'Compact'}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-header">
              {draftSettings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <h3 className="settings-section-title">Sound</h3>
            </div>
            <div className="settings-sound-row">
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={draftSettings.soundEnabled}
                  onChange={(e) => updateDraftSetting('soundEnabled', e.target.checked)}
                />
                <span className="settings-toggle-track" aria-hidden="true" />
                <span className="settings-toggle-label">DEX sounds</span>
              </label>
              <label className="settings-volume-field">
                <span className="settings-field-label">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={draftSettings.soundVolume}
                  disabled={!draftSettings.soundEnabled}
                  onChange={(e) => updateDraftSetting('soundVolume', Number(e.target.value))}
                />
                <span className="settings-volume-value">{Math.round(Number(draftSettings.soundVolume) * 100)}%</span>
              </label>
              <button
                type="button"
                className="settings-test-sound-btn"
                onClick={() => playDexSound('confirm', draftSettings)}
                disabled={!draftSettings.soundEnabled}
              >
                Test sound
              </button>
            </div>
          </div>

          {/* Network diagnostics */}
          <div className="settings-section">
            <div className="settings-section-header">
              <Wifi size={18} />
              <h3 className="settings-section-title">Network diagnostics</h3>
            </div>
            <div className="settings-speedtest-row">
              <button
                type="button"
                className="settings-speedtest-btn"
                onClick={run}
                disabled={running}
                aria-label="Run network speed test"
              >
                {running ? (
                  <><RefreshCw size={16} className="settings-speedtest-spin" /> Measuring...</>
                ) : (
                  <>Run speed test</>
                )}
              </button>
              {error && (
                <p className="settings-speedtest-result settings-speedtest-error">{error}</p>
              )}
              {result && !error && (
                <div className="settings-speedtest-result">
                  <span>Latency: <strong>{result.latencyMs != null ? `${result.latencyMs} ms` : '—'}</strong></span>
                  <span>Download: <strong>{result.downloadMbps != null ? `${result.downloadMbps} Mbps` : '—'}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Reset defaults */}
          <div className="settings-section settings-section-actions">
            <div className="settings-actions-row">
              <button
                type="button"
                className="settings-reset-btn"
                onClick={handleReset}
                aria-label="Reset settings to defaults"
              >
                <RotateCcw size={16} />
                Reset to defaults
              </button>
              <div className="settings-save-actions">
                <span className={`settings-save-status ${hasChanges ? 'settings-save-status--dirty' : ''}`}>
                  {hasChanges ? `Unsaved: ${selectedTheme.name}` : `Active: ${selectedTheme.name}`}
                </span>
                <button
                  type="button"
                  className="settings-cancel-btn"
                  onClick={onClose}
                  aria-label="Cancel settings changes"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="settings-save-btn"
                  onClick={handleSave}
                  disabled={!hasChanges}
                  aria-label="Save settings changes"
                >
                  <Check size={16} />
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default SettingsModal;
