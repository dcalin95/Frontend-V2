/**
 * OTA Trading Mode Header Dropdown – compact în header cu popover pentru info completă
 * Stil AI Sonnet | iconițe AI 2026
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Zap, ChevronDown, Lock, AlertCircle } from 'lucide-react';
import { useOTAMode } from '../../hooks/useOTAMode';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import {
  TRADING_MODES,
  TRADING_MODE_NAMES,
  TRADING_MODE_DESCRIPTIONS,
  TRADING_MODES_VISIBLE,
  isTradingModeAvailable
} from '../../utils/otaTradingModes';
import '../../styles/components/ota-trading-mode-header-dropdown.css';

const OTATradingModeHeaderDropdown = () => {
  const { currentMode, setMode } = useOTAMode();
  const { accessLevel, botAuthorized } = useOTAAccess();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const modeIcons = {
    [TRADING_MODES.ADVISORY]: Sparkles,
    [TRADING_MODES.AUTO]: Zap
  };

  const getModeGatingMessage = (mode) => {
    if (isTradingModeAvailable(mode, accessLevel, botAuthorized)) return null;
    if (mode === TRADING_MODES.AUTO) {
      if (accessLevel !== 'full') return 'Full access required';
      if (!botAuthorized) return 'Bot authorization required';
    }
    return 'Not available';
  };

  const handleModeSelect = (mode) => {
    if (isTradingModeAvailable(mode, accessLevel, botAuthorized)) {
      setMode(mode);
      setOpen(false);
    }
  };

  const currentLabel = TRADING_MODE_NAMES[currentMode] || currentMode;
  const CurrentIcon = modeIcons[currentMode];

  return (
    <div className="ota-trading-mode-header-dropdown" ref={containerRef} aria-label="Trading mode">
      <button
        type="button"
        className="ota-trading-mode-header-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Trading mode: ${currentLabel}. Click to change.`}
        title="Choose how OTA executes trades"
      >
        {CurrentIcon && <CurrentIcon size={16} className="ota-trading-mode-header-trigger-icon" aria-hidden />}
        <span className="ota-trading-mode-header-trigger-label">{currentLabel}</span>
        <ChevronDown size={14} className={`ota-trading-mode-header-chevron ${open ? 'open' : ''}`} aria-hidden />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="ota-trading-mode-header-popover"
          role="listbox"
          aria-label="Trading modes"
        >
          <div className="ota-trading-mode-header-popover-title">
            Trading Mode: how OTA executes trades
          </div>
          {TRADING_MODES_VISIBLE.map((mode) => {
            const Icon = modeIcons[mode];
            const isAvailable = isTradingModeAvailable(mode, accessLevel, botAuthorized);
            const isActive = currentMode === mode;
            const gatingMessage = getModeGatingMessage(mode);
            return (
              <button
                key={mode}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`ota-trading-mode-header-option ${isActive ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                onClick={() => handleModeSelect(mode)}
                disabled={!isAvailable}
                title={gatingMessage || TRADING_MODE_DESCRIPTIONS[mode]}
              >
                <div className="ota-trading-mode-header-option-main">
                  {Icon && <Icon size={18} className="ota-trading-mode-header-option-icon" aria-hidden />}
                  <div className="ota-trading-mode-header-option-text">
                    <span className="ota-trading-mode-header-option-name">{TRADING_MODE_NAMES[mode]}</span>
                    <span className="ota-trading-mode-header-option-desc">{TRADING_MODE_DESCRIPTIONS[mode]}</span>
                  </div>
                  {!isAvailable && <Lock size={14} className="ota-trading-mode-header-option-lock" aria-hidden />}
                </div>
                {gatingMessage && !isAvailable && (
                  <div className="ota-trading-mode-header-option-gating">
                    <AlertCircle size={12} />
                    <span>{gatingMessage}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

OTATradingModeHeaderDropdown.displayName = 'OTATradingModeHeaderDropdown';

export default OTATradingModeHeaderDropdown;
