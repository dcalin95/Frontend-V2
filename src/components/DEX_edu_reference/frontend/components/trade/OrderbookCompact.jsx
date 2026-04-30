/**
 * 📊 OrderbookCompact - Orderbook cu Dropdown (doar când există date)
 * 
 * Wrapper minimalist pentru Orderbook:
 * - Buton compact când nu există date
 * - Dropdown cu Orderbook complet când există date
 * 
 * @module OrderbookCompact
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { getOrderbook as getOrderbookApi } from '../../services/dexApiService';
import Orderbook from './Orderbook';
import { errorWithPrefix } from '../../utils/logger';
import '../../styles/components/orderbook-compact.css';

const OrderbookCompact = () => {
  const [hasData, setHasData] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const checkData = async () => {
      try {
        setLoading(true);
        const data = await getOrderbookApi('BITS', 'USDT', 5);
        
        if (data.success && data.bids && data.asks) {
          const hasOrders = (data.bids.length > 0 || data.asks.length > 0);
          setHasData(hasOrders);
        } else {
          setHasData(false);
        }
      } catch (err) {
        errorWithPrefix('OrderbookCompact', 'Check data error:', err);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };

    checkData();
    const interval = setInterval(checkData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
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

  if (loading) {
    return (
      <div className="orderbook-compact">
        <span className="orderbook-compact-loading">Loading...</span>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="orderbook-compact">
        <span className="orderbook-compact-empty">Orderbook (No data)</span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="orderbook-compact">
      <button
        className="orderbook-compact-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open orderbook"
      >
        <span className="orderbook-compact-label">Orderbook</span>
        <ChevronDown size={14} className={`orderbook-compact-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="orderbook-compact-backdrop" onClick={() => setIsOpen(false)} />
          <div className="orderbook-compact-menu">
            <Orderbook />
          </div>
        </>
      )}
    </div>
  );
};

export default OrderbookCompact;
