/**
 * Modal add/remove collateral pentru poziții spot live (UserVault → poziție).
 */
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function LeverageSpotCollateralModal({
  open,
  onClose,
  position,
  collateralSymbol = 'Token',
  collateralDecimals = 18,
  vaultBalanceFormatted = '0',
  liveTradingBlocked = false,
  chainGatePending = false,
  txPending = false,
  onSubmitAdd,
  onSubmitRemove,
}) {
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useState('add');

  useEffect(() => {
    if (open) {
      setAmount('');
      setTab('add');
    }
  }, [open, position?.positionId]);

  if (!open || !position) return null;

  const disabled = liveTradingBlocked || txPending;
  const collHuman = (() => {
    try {
      return parseFloat(ethers.utils.formatUnits(position.collateralAmount || '0', collateralDecimals)).toString();
    } catch {
      return '—';
    }
  })();

  const submit = async () => {
    try {
      if (tab === 'add') await onSubmitAdd?.(position.positionId, amount);
      else await onSubmitRemove?.(position.positionId, amount);
    } catch (_) {
      /* Parent sets txError */
    }
  };

  return (
    <div className="leverage-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="lev-collateral-title">
      <div className="leverage-modal leverage-modal--collateral">
        <h3 id="lev-collateral-title" className="leverage-modal-title">
          Collateral · position {String(position.positionId).length > 12 ? String(position.positionId).slice(-8) : position.positionId}
        </h3>
        <p className="leverage-modal-meta">
          Collateral token: <strong>{collateralSymbol}</strong> · Locked: <strong>{collHuman}</strong> · Vault available:{' '}
          <strong>{vaultBalanceFormatted}</strong>
        </p>
        <div className="leverage-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'add'}
            className={tab === 'add' ? 'is-active' : ''}
            onClick={() => setTab('add')}
            disabled={disabled}
          >
            Add
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'remove'}
            className={tab === 'remove' ? 'is-active' : ''}
            onClick={() => setTab('remove')}
            disabled={disabled}
          >
            Remove
          </button>
        </div>
        <p className="leverage-modal-hint" role="note">
          {tab === 'add'
            ? 'Adds from your UserVault balance into this position (on-chain).'
            : 'Removes part of locked collateral to your wallet. Amount must be less than total locked; use Close to exit fully.'}
        </p>
        <label className="leverage-label" htmlFor="lev-collateral-amt">
          Amount ({collateralSymbol})
        </label>
        <input
          id="lev-collateral-amt"
          className="leverage-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          disabled={disabled}
          autoComplete="off"
        />
        <div className="leverage-modal-actions">
          <button type="button" className="leverage-btn leverage-btn-outline" onClick={onClose} disabled={txPending}>
            Cancel
          </button>
          <button
            type="button"
            className="leverage-btn leverage-btn-primary"
            onClick={() => submit()}
            disabled={disabled || !amount.trim() || chainGatePending}
          >
            {txPending ? 'Submitting…' : tab === 'add' ? 'Add collateral' : 'Remove collateral'}
          </button>
        </div>
        {liveTradingBlocked && (
          <p className="leverage-modal-warn" role="alert">
            {chainGatePending ? 'Checking network…' : 'Switch to BSC to manage collateral.'}
          </p>
        )}
      </div>
    </div>
  );
}
