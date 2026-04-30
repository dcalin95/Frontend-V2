/**
 * Swap Settings – doar ce afectează tranzacția: slippage și deadline.
 * Expert mode, multihops, show recipient eliminate (nu erau folosite în execuția swap).
 * @module SwapSettingsModal
 */

import React, { useState, useCallback } from 'react';
import { Modal, ModalHeader, ModalBody } from '../common/Modal';
import { Button, Input } from '../ui';
import { AlertCircle, Info } from 'lucide-react';
import '../../styles/components/swap-settings-modal.css';

const SwapSettingsModal = ({
  isOpen,
  onClose,
  slippage,
  onSlippageChange,
  deadline,
  onDeadlineChange
}) => {
  const [customSlippage, setCustomSlippage] = useState(slippage);
  const [customDeadline, setCustomDeadline] = useState(deadline);

  const slippagePresets = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0]; // CAKE→BNB needs 3%+ to avoid "couldn't be completed"

  const handleSlippagePreset = useCallback((preset) => {
    setCustomSlippage(preset);
    onSlippageChange(preset);
  }, [onSlippageChange]);

  const handleSlippageCustom = useCallback((value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      setCustomSlippage(numValue);
      onSlippageChange(numValue);
    }
  }, [onSlippageChange]);

  const handleDeadlineChange = useCallback((value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 4320) {
      setCustomDeadline(numValue);
      onDeadlineChange(numValue);
    }
  }, [onDeadlineChange]);

  const isHighSlippage = customSlippage > 5;
  const isVeryHighSlippage = customSlippage > 10;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Swap Settings"
      size="small"
      className="swap-settings-modal"
    >
      <ModalBody>
        <div className="swap-settings-content">
          {/* Slippage Tolerance */}
          <div className="swap-settings-section">
            <div className="swap-settings-label">
              <span>Slippage Tolerance</span>
              <span className="swap-settings-label-info" title="Maximum price movement before your transaction reverts">
                <Info size={14} />
              </span>
            </div>
            
            <div className="swap-settings-slippage-presets">
              {slippagePresets.map((preset) => (
                <Button
                  key={preset}
                  variant={customSlippage === preset ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleSlippagePreset(preset)}
                >
                  {preset}%
                </Button>
              ))}
              <Input
                type="number"
                placeholder="Custom"
                value={customSlippage}
                onChange={(e) => handleSlippageCustom(e.target.value)}
                min="0"
                max="50"
                step="0.1"
                size="sm"
                className="swap-settings-custom-input"
              />
            </div>

            {/* Slippage Warnings */}
            {isHighSlippage && (
              <div className={`swap-settings-warning ${isVeryHighSlippage ? 'swap-settings-error' : ''}`}>
                <AlertCircle size={14} />
                <span>
                  {isVeryHighSlippage 
                    ? 'Your transaction may be frontrun and result in an unfavorable trade'
                    : 'Your transaction may fail'}
                </span>
              </div>
            )}
          </div>

          {/* Transaction Deadline */}
          <div className="swap-settings-section">
            <div className="swap-settings-label">
              <span>Transaction Deadline</span>
              <span className="swap-settings-label-info" title="Transaction will revert if it is pending for more than this period">
                <Info size={14} />
              </span>
            </div>
            
            <div className="swap-settings-deadline">
              <Input
                type="number"
                placeholder="20"
                value={customDeadline}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                min="1"
                max="4320"
                step="1"
                size="md"
                className="swap-settings-deadline-input"
              />
              <span className="swap-settings-deadline-unit">minutes</span>
            </div>
          </div>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--ds-border-color, rgba(255,255,255,0.1))' }}>
            <p style={{ fontSize: '12px', color: 'var(--token-text-secondary)', marginBottom: '12px' }}>
              Settings apply immediately.
            </p>
            <Button variant="primary" size="md" fullWidth onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default SwapSettingsModal;
