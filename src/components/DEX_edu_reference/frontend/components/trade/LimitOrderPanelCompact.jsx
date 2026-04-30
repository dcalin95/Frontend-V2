/**
 * 📊 LimitOrderPanelCompact - Limit Orders cu Dropdown
 * 
 * Wrapper pentru LimitOrderPanel care funcționează fără swapData:
 * - Buton compact care deschide dropdown cu LimitOrderPanel
 * - Nu depinde de swapData pentru afișare
 * 
 * @module LimitOrderPanelCompact
 */

import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import LimitOrderPanel from './LimitOrderPanel';
import '../../styles/components/limit-order-panel-compact.css';

const LimitOrderPanelCompact = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="limit-order-panel-compact">
      <button
        className="limit-order-panel-compact-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open limit orders panel"
      >
        <span className="limit-order-panel-compact-label">Limit Orders</span>
        <ChevronDown size={14} className={`limit-order-panel-compact-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="limit-order-panel-compact-backdrop" onClick={() => setIsOpen(false)} />
          <div className="limit-order-panel-compact-menu">
            <LimitOrderPanel />
          </div>
        </>
      )}
    </div>
  );
};

export default LimitOrderPanelCompact;
