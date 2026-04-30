import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import '../../../styles/DEX/chain-toggle.css';

/**
 * 🔄 ChainToggle.jsx - Blockchain Chain Toggle
 * 
 * Component for switching between blockchains:
 * - EVM (BSC)
 * - Solana
 * - Stacks (Bitcoin Layer)
 * - Chain selection state management
 * 
 * @module ChainToggle
 */

const CHAINS = [
  { id: 'evm', label: 'EVM', color: '#4facfe' },
  { id: 'solana', label: 'SOL', color: '#14f195' },
  { id: 'stacks', label: 'STX', color: '#f7931a' },
  { id: 'sei', label: 'SEI', color: '#7c3aed' }
];

const HEADER_DROPDOWN_Z_INDEX = 100020;

export default function ChainToggle({ selectedChain = "evm", onChainChange, variant = "default" }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);
  const selected = CHAINS.find(c => c.id === selectedChain) || CHAINS[0];

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const desiredWidth = Math.max(rect.width, 80);
    const viewportPadding = 8;
    const maxWidth = Math.max(80, window.innerWidth - viewportPadding * 2);
    const width = Math.min(desiredWidth, maxWidth);

    // align right edge with button
    let left = rect.right - width;
    let top = rect.bottom + 6;
    left = Math.min(Math.max(left, viewportPadding), window.innerWidth - width - viewportPadding);

    const estimatedHeight = 170; // dropdown + padding
    if (top + estimatedHeight > window.innerHeight && rect.top - estimatedHeight > viewportPadding) {
      top = rect.top - 6 - estimatedHeight;
    }

    setMenuPos({ top, left, width });
  }, []);

  const handleChainChange = (chain) => {
    if (onChainChange) {
      onChainChange(chain);
    }
    setIsOpen(false);
  };

  // Portal-safe outside click
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (event) => {
      const inAnchor = rootRef.current && rootRef.current.contains(event.target);
      const inMenu = menuRef.current && menuRef.current.contains(event.target);
      if (!inAnchor && !inMenu) setIsOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen]);

  // Keep menu positioned correctly
  useEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
    const onResize = () => updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen, updateMenuPosition]);

  if (variant === "compact" || variant === "header") {
    // Minimal header variant.
    return (
      <div ref={rootRef} className="chain-toggle-header">
        <button
          type="button"
          ref={buttonRef}
          className="chain-toggle-header-button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsOpen((v) => !v);
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="Select active chain"
          style={{ borderColor: selected.color }}
        >
          <span className="chain-toggle-header-label" style={{ color: selected.color }}>
            {selected.label}
          </span>
          <ChevronDown size={14} className={`chain-toggle-chevron ${isOpen ? 'open' : ''}`} />
        </button>
        {isOpen && typeof document !== 'undefined' && createPortal(
          <>
            <div className="chain-toggle-backdrop" onClick={() => setIsOpen(false)} />
            <div
              ref={menuRef}
              className="chain-toggle-dropdown"
              role="listbox"
              aria-label="Available chains"
              style={{
                position: 'fixed',
                top: menuPos?.top ?? 0,
                left: menuPos?.left ?? 0,
                width: menuPos?.width,
                zIndex: HEADER_DROPDOWN_Z_INDEX
              }}
            >
              {CHAINS.map(chain => (
                <button
                  key={chain.id}
                  type="button"
                  role="option"
                  aria-selected={selectedChain === chain.id}
                  className={`chain-toggle-option ${selectedChain === chain.id ? 'active' : ''}`}
                  onClick={() => handleChainChange(chain.id)}
                  style={{
                    borderColor: chain.color,
                    backgroundColor: selectedChain === chain.id ? `${chain.color}20` : 'transparent'
                  }}
                >
                  <span style={{ color: chain.color }}>{chain.label}</span>
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
      </div>
    );
  }

  // Default original variant for backwards compatibility.
  return (
    <div className="chain-toggle-default">
      <h2>Chain Toggle</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        {CHAINS.map(chain => (
          <button
            key={chain.id}
            onClick={() => handleChainChange(chain.id)}
            style={{
              padding: "8px 16px",
              backgroundColor: selectedChain === chain.id ? chain.color : "#16182e",
              color: "#ffffff",
              border: `1px solid ${chain.color}`,
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            {chain.label}
          </button>
        ))}
      </div>
      <p>Selected chain: {selectedChain.toUpperCase()}</p>
    </div>
  );
}
