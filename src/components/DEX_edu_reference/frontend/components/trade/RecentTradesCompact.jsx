/**
 * 📊 RecentTradesCompact - Recent Trades cu Dropdown (doar când există date)
 * 
 * Wrapper minimalist pentru RecentTrades:
 * - Buton compact când nu există date
 * - Dropdown cu RecentTrades complet când există date
 * 
 * @module RecentTradesCompact
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { getTrades as getTradesApi } from '../../services/dexApiService';
import { useDexAuth } from '../../context/DexAuthContext';
import RecentTrades from './RecentTrades';
import { errorWithPrefix, warnWithPrefix } from '../../utils/logger';
import '../../styles/components/recent-trades-compact.css';

const RecentTradesCompact = () => {
  const [hasData, setHasData] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const { isAuthenticated } = useDexAuth();

  useEffect(() => {
    // Skip API calls if user is not authenticated (endpoint requires auth)
    if (!isAuthenticated) {
      setHasData(false);
      setLoading(false);
      return;
    }

    const checkData = async () => {
      try {
        setLoading(true);
        const response = await getTradesApi({ 
          base_token: 'BITS', 
          quote_token: 'USDT', 
          limit: 5 
        });
        
        if (response.success && response.trades) {
          setHasData(response.trades.length > 0);
        } else {
          setHasData(false);
        }
      } catch (err) {
        // Check if it's a 401 error - stop retrying if unauthenticated
        const isUnauthorized = err?.message?.includes('No session found') || 
                               err?.message?.includes('Unauthorized') ||
                               err?.message?.includes('authenticate');
        
        if (isUnauthorized) {
          // Stop polling if unauthenticated - don't log, this is expected
          setHasData(false);
          setLoading(false);
          return;
        }
        
        // Only log unexpected errors (not auth errors)
        warnWithPrefix('RecentTradesCompact', 'Trades API error:', err);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };

    checkData();
    
    // Refresh every 10 seconds (only if authenticated)
    const interval = setInterval(() => {
      // Double-check auth before each call
      if (isAuthenticated) {
        checkData();
      }
    }, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated]);

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
      <div className="recent-trades-compact">
        <span className="recent-trades-compact-loading">Loading...</span>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="recent-trades-compact">
        <span className="recent-trades-compact-empty">Recent Trades (No data)</span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="recent-trades-compact">
      <button
        className="recent-trades-compact-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open recent trades"
      >
        <span className="recent-trades-compact-label">Recent Trades</span>
        <ChevronDown size={14} className={`recent-trades-compact-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="recent-trades-compact-backdrop" onClick={() => setIsOpen(false)} />
          <div className="recent-trades-compact-menu">
            <RecentTrades />
          </div>
        </>
      )}
    </div>
  );
};

export default RecentTradesCompact;
