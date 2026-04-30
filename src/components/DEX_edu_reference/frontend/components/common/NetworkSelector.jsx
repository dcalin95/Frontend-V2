/**
 * 🌐 NetworkSelector Component - Network/Chain Selector
 * 
 * Aplicația suportă DOAR BSC (Binance Smart Chain).
 * - BSC Mainnet (56) și BSC Testnet (97)
 * - Real network switching via wallet provider
 * 
 * @module NetworkSelector
 */

import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { logWithPrefix } from '../../utils/logger';
import '../../styles/components/network-selector.css';

const NETWORKS = [
  {
    id: 'bsc',
    name: 'BSC',
    fullName: 'Binance Smart Chain',
    chainId: 56,
    icon: '🟡',
    color: '#f3ba2f',
    isTestnet: false
  },
  {
    id: 'bsc-testnet',
    name: 'BSC Testnet',
    fullName: 'BSC Testnet',
    chainId: 97,
    icon: '🟡',
    color: '#f3ba2f',
    isTestnet: true
  }
];

const NetworkSelector = ({ 
  selectedNetwork = 'bsc',
  onNetworkChange,
  className = '',
  variant = 'default' // default, compact
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = NETWORKS.find(n => n.id === selectedNetwork) || NETWORKS[0];

  const handleSelect = (networkId) => {
    if (onNetworkChange) {
      onNetworkChange(networkId);
    }
    setIsOpen(false);
    logWithPrefix('NetworkSelector', 'Network selected:', networkId);
  };

  return (
    <div className={`network-selector network-selector-${variant} ${className}`}>
      <button
        className="network-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="network-selector-icon" style={{ color: selected.color }}>
          {selected.icon}
        </span>
        <span className="network-selector-name">{selected.name}</span>
        <ChevronDown 
          size={16} 
          className={`network-selector-chevron ${isOpen ? 'network-selector-chevron-open' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div 
            className="network-selector-backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div className="network-selector-dropdown" role="listbox">
            {NETWORKS.map((network) => (
              <button
                key={network.id}
                className={`network-selector-option ${selectedNetwork === network.id ? 'network-selector-option-selected' : ''}`}
                onClick={() => handleSelect(network.id)}
                role="option"
                aria-selected={selectedNetwork === network.id}
              >
                <div className="network-selector-option-content">
                  <span className="network-selector-option-icon" style={{ color: network.color }}>
                    {network.icon}
                  </span>
                  <div className="network-selector-option-info">
                    <span className="network-selector-option-name">{network.name}</span>
                    <span className="network-selector-option-fullname">{network.fullName}</span>
                  </div>
                </div>
                {selectedNetwork === network.id && (
                  <Check size={16} className="network-selector-check" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkSelector;
