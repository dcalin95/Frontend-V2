import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, History, X, Home } from 'lucide-react';
import SwapPanel from '../components/trade/SwapPanel';
import LimitOrderPanel from '../components/trade/LimitOrderPanel';
import HeaderTokenSelector from '../components/common/HeaderTokenSelector';
import { useHeaderToken } from '../context/HeaderTokenContext';
import '../styles/pages.css';
import '../styles/components/swap-page.css';
import '../styles/components/swap-header-toolbar.css';
import '../styles/components/header-token-selector.css';

const Swap = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('swap'); // 'swap' or 'limit'
  const [selectedToken, setSelectedToken] = useHeaderToken();
  const [selectedPair, setSelectedPair] = useState(`BINANCE:${selectedToken}USDT`);
  const prevTabRef = useRef(activeTab);
  const [headerSlotEl, setHeaderSlotEl] = useState(null);
  
  // SSOT for tokens handled by HeaderTokenSelector

  // Find header slot element
  useEffect(() => {
    const el = document.getElementById('dex-header-center-slot');
    setHeaderSlotEl(el);
  }, []);

  // Reset amounts when switching tabs (but keep token synchronized)
  useEffect(() => {
    // Only reset if tab actually changed (not on initial mount)
    if (prevTabRef.current !== activeTab && prevTabRef.current !== null) {
      // Token remains synchronized, but amounts will be reset by components
      // when they detect selectedPair change or tab change
      console.log('[Swap] Tab changed, amounts will be reset:', { from: prevTabRef.current, to: activeTab });
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);
  
  useEffect(() => {
    setSelectedPair(`BINANCE:${selectedToken}USDT`);
  }, [selectedToken]);

  const handleTokenChange = (token) => {
    setSelectedToken(token);
    setSelectedPair(`BINANCE:${token}USDT`);
  };

  return (
    <div className="swap-page">
      {/* Token Selector Portal - injected into Header (same as Trade page) */}
      {headerSlotEl && typeof document !== 'undefined' && createPortal(
        <div className="swap-header-toolbar">
          <HeaderTokenSelector 
            selectedToken={selectedToken}
            onTokenChange={handleTokenChange}
            ariaLabel="Select token for swap"
          />
          <button
            type="button"
            className="swap-header-toolbar-btn"
            onClick={() => navigate('/dex-edu/open-orders')}
            aria-label="Open Orders"
            title="Open Orders (Trade page)"
          >
            <ClipboardList size={18} />
            <span>Open Orders</span>
          </button>
          <button
            type="button"
            className="swap-header-toolbar-btn"
            onClick={() => navigate('/dex-edu/order-history')}
            aria-label="Order History"
            title="Order History (Trade page)"
          >
            <History size={18} />
            <span>Order History</span>
          </button>
          <button
            type="button"
            className="swap-header-toolbar-btn"
            onClick={() => navigate('/dex-edu/trade')}
            aria-label="Close"
            title="Close (go to Trade)"
          >
            <X size={18} />
            <span>Close</span>
          </button>
          <button
            type="button"
            className="swap-header-toolbar-btn"
            onClick={() => navigate('/dex-edu/dashboard')}
            aria-label="Home"
            title="Home (Dashboard)"
          >
            <Home size={18} />
            <span>Home</span>
          </button>
        </div>,
        headerSlotEl
      )}
      
      {/* Tabs Header (like Oxium) */}
      <div className="swap-page-tabs">
        <button
          className={`swap-page-tab ${activeTab === 'swap' ? 'active' : ''}`}
          onClick={() => setActiveTab('swap')}
          aria-label="Swap tab"
        >
          Swap
        </button>
        <button
          className={`swap-page-tab ${activeTab === 'limit' ? 'active' : ''}`}
          onClick={() => setActiveTab('limit')}
          aria-label="Limit tab"
        >
          Limit
        </button>
      </div>

      {/* Content */}
      <div className="swap-page-content">
        {activeTab === 'swap' ? (
          <SwapPanel 
            key={`swap-${selectedPair}`} // Force remount when pair changes to reset amounts
            selectedPair={selectedPair}
          />
        ) : (
          <LimitOrderPanel 
            key={`limit-${selectedPair}`} // Force remount when pair changes to reset amounts
            selectedPair={selectedPair}
          />
        )}
      </div>
    </div>
  );
};

export default Swap;
