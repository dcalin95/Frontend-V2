/**
 * Layout Component - Main Layout for Frontend
 * 
 * Main layout component for BitSwapDEX AI Trading Frontend:
 * - Header
 * - Sidebar
 * - Main content area
 * - Responsive design
 * 
 * @module Layout
 */

/**
 * Layout Component - Main Layout for Frontend
 * 
 * Main layout component for BitSwapDEX AI Trading Frontend:
 * - Header
 * - Sidebar
 * - Main content area
 * - Responsive design
 * 
 * @module Layout
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from './Header';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal/SettingsModal';
import { ToastProvider } from '../frontend/context/ToastContext';
import { BackendStatusProvider } from '../frontend/context/BackendStatusContext';
import { NetworkStatusProvider } from '../frontend/context/NetworkStatusContext';
import { FallbackConfigToast } from '../frontend/components/common/FallbackConfigToast';
import NetworkStatusBanner from '../frontend/components/common/NetworkStatusBanner';
import DexSupportFab from './DexSupportFab';
import { useDEXWallet } from '../hooks/DEX/useDEXWallet';
import { useDEXSettings } from '../hooks/DEX/useDEXSettings';
import { playDexToastSound } from '../frontend/utils/dexSound';
import '../../../styles/DEX/layout.css';
import '../../../styles/DEX/layout-settings.css';

const Layout = ({ children, selectedChain = 'evm', onChainChange = null }) => {
  const { pathname } = useLocation();
  const isSwapPage = pathname.includes('swap');
  /** OTA Chat: one scroll area (thread), not the entire main; otherwise input looks "up" and history does not fit visibly. */
  const isOtaChatPage = pathname.includes('/dex-edu/ota/chat');

  const { 
    walletAddress, 
    connectWallet, 
    disconnectWallet, 
    error, 
    isLoading
  } = useDEXWallet();
  
  const { settings } = useDEXSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const soundedToastKeysRef = useRef(new Set());

  // Apply layout settings to document root for global CSS
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-trade-panel-position', settings.tradePanelPosition);
    root.setAttribute('data-orderbook-position', settings.orderbookPosition);
    root.setAttribute('data-dex-density', settings.interfaceDensity || 'comfortable');
  }, [settings.tradePanelPosition, settings.orderbookPosition, settings.interfaceDensity]);

  useEffect(() => {
    const unsubscribe = toast.onChange((toastItem) => {
      if (!toastItem || toastItem.status === 'removed') return;
      const soundKey = `${toastItem.id}:${toastItem.type}:${toastItem.status}`;
      if (soundedToastKeysRef.current.has(soundKey)) return;
      soundedToastKeysRef.current.add(soundKey);
      playDexToastSound(toastItem);
    });

    return unsubscribe;
  }, []);

  return (
    <ToastProvider>
      <BackendStatusProvider>
      <NetworkStatusProvider>
      <FallbackConfigToast>
      <div className="ai-trading-layout" data-mobile-menu-open={sidebarMobileOpen ? 'true' : undefined}>
        <NetworkStatusBanner />
        <Header 
          walletAddress={walletAddress}
          onConnectWallet={connectWallet}
          onDisconnectWallet={disconnectWallet}
          isConnecting={isLoading}
          error={error}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMenu={() => setSidebarMobileOpen(true)}
          selectedChain={selectedChain}
          onChainChange={onChainChange}
        />
        {error && (
          <div className="ai-trading-wallet-error" role="alert">
            <span>{error}</span>
            <button 
              type="button" 
              onClick={() => connectWallet(selectedChain)} 
              className="ai-trading-retry-btn"
              aria-label="Retry wallet connection"
            >
              Retry
            </button>
          </div>
        )}
        <div className="ai-trading-content-wrapper">
          <Sidebar isMobileOpen={sidebarMobileOpen} onClose={() => setSidebarMobileOpen(false)} />
          <div className="dex-sidebar-backdrop" onClick={() => setSidebarMobileOpen(false)} aria-hidden="true" role="presentation" />
          <main
            className={`ai-trading-main-content ${isSwapPage ? 'ai-trading-main-content--swap' : ''} ${isOtaChatPage ? 'ai-trading-main-content--ota-chat' : ''}`}
          >
            {children}
          </main>
        </div>
        {/* Unified Wallet Modal is available globally from App.js; no need to import it here. */}
        
        {/* Settings Modal - for user preferences, inspired by Oxium. */}
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
        <DexSupportFab />
      </div>
      </FallbackConfigToast>
      </NetworkStatusProvider>
      </BackendStatusProvider>
    </ToastProvider>
  );
};

export default Layout;

