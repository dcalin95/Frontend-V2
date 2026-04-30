/**
 * Form deschidere poziție Spot Leverage.
 * Leverage: pill buttons. Payment toggle: Crypto / Fiat (Stripe).
 */
import React, { useState, useMemo } from 'react';
import { Wallet, CreditCard } from 'lucide-react';
import { LEVERAGE_OPTIONS, SPOT_LEVERAGE_DISABLED_NOTICE } from '../../constants/leverageConstants';
import TokenSelect from './TokenSelect';
import LeverageFiatPanel from './LeverageFiatPanel';

export default function LeverageSpotForm({
  collateralToken,
  setCollateralToken,
  borrowedToken,
  setBorrowedToken,
  amount,
  setAmount,
  leverageBps,
  setLeverageBps,
  vaultBalanceFormatted,
  onMax,
  sameToken,
  isConnected,
  connectWallet,
  tokenOptions,
  onOpen,
  contractReady,
  spotAvailable = true,
  txPending,
  walletAddress,
  isDemoMode,
  liveTradingBlocked = false,
  chainGatePending = false,
  /** Când true: spot închis la nivel de produs (lipsește pool ILendingPool compatibil); CFD rămâne activ */
  spotUiDisabled = false,
}) {
  const [payMethod, setPayMethod] = useState('crypto');
  // În demo mode: revenim la crypto automat (Stripe nu funcționează cu fonduri demo)
  React.useEffect(() => { if (isDemoMode) setPayMethod('crypto'); }, [isDemoMode]);
  React.useEffect(() => {
    if (spotUiDisabled) setPayMethod('crypto');
  }, [spotUiDisabled]);

  const collateralSymbol = tokenOptions?.find((o) => o.address === collateralToken)?.symbol || 'USDT';
  const borrowedSymbol   = tokenOptions?.find((o) => o.address === borrowedToken)?.symbol || 'BNB';
  const leverageLabel    = LEVERAGE_OPTIONS.find((o) => o.value === leverageBps)?.label || `${leverageBps / 10000}x`;
  const tradeLabel = `Spot · ${collateralSymbol} → ${borrowedSymbol} · ${leverageLabel}`;

  const tradeParams = useMemo(() => ({
    tradeType: 'spot',
    collateralToken,
    borrowedToken,
    leverageBps,
  }), [collateralToken, borrowedToken, leverageBps]);

  if (!isConnected) {
    return (
      <div className="leverage-connect-inline">
        <Wallet size={32} className="leverage-connect-icon" aria-hidden />
        <p className="leverage-connect-desc">
          Connect your BSC wallet. Collateral is withdrawn from UserVault.
        </p>
        <button type="button" onClick={connectWallet} className="leverage-btn leverage-btn-primary">
          Connect wallet
        </button>
      </div>
    );
  }

  return (
    <>
      {/* DEMO badge */}
      {isDemoMode && (
        <div className="lev-demo-notice" role="note" aria-label="Demo mode active">
          <span className="lev-demo-badge">DEMO</span>
          <span>Virtual funds · no real money. Balance: {vaultBalanceFormatted}</span>
        </div>
      )}

      {/* Toggle Crypto / Fiat — ascuns în demo */}
      {!isDemoMode && (
        <div className="lev-pay-toggle" role="group" aria-label="Payment method">
          <button
            type="button"
            className={`lev-pay-toggle-btn${payMethod === 'crypto' ? ' active' : ''}`}
            onClick={() => setPayMethod('crypto')}
            aria-pressed={payMethod === 'crypto'}
            disabled={spotUiDisabled}
          >
            <Wallet size={13} aria-hidden /> Crypto
          </button>
          <button
            type="button"
            className={`lev-pay-toggle-btn${payMethod === 'fiat' ? ' active' : ''}`}
            onClick={() => setPayMethod('fiat')}
            aria-pressed={payMethod === 'fiat'}
            disabled={spotUiDisabled}
          >
            <CreditCard size={13} aria-hidden /> Fiat (EUR/USD)
          </button>
        </div>
      )}

      {spotUiDisabled && (
        <div className="leverage-spot-ui-disabled-banner" role="status" aria-live="polite">
          <p className="leverage-hint lev-hint-warn">{SPOT_LEVERAGE_DISABLED_NOTICE}</p>
        </div>
      )}

      {contractReady && !spotAvailable && !isDemoMode && !spotUiDisabled && (
        <div className="leverage-spot-unavailable" role="alert">
          <p className="leverage-hint lev-hint-warn">
            Spot leverage is not available yet. The lending pool is not configured on the contract (owner must call setLendingPool). Use <strong>CFD</strong> or <strong>Demo</strong> to open positions.
          </p>
        </div>
      )}

      <TokenSelect label="Collateral token" value={collateralToken} onChange={setCollateralToken} options={tokenOptions} disabled={spotUiDisabled} />
      <TokenSelect label="Borrowed token"   value={borrowedToken}   onChange={setBorrowedToken}   options={tokenOptions} disabled={spotUiDisabled} />

      {/* Leverage – pill buttons */}
      <div className="leverage-field">
        <label className="leverage-label">Leverage</label>
        <div className="lev-pills" role="group" aria-label="Leverage multiplier">
          {LEVERAGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`lev-pill${leverageBps === o.value ? ' active' : ''}`}
              onClick={() => setLeverageBps(o.value)}
              aria-pressed={leverageBps === o.value}
              disabled={spotUiDisabled}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {payMethod === 'fiat' ? (
        <LeverageFiatPanel
          tradeParams={tradeParams}
          tradeLabel={tradeLabel}
          walletAddress={walletAddress}
          isConnected={isConnected}
          connectWallet={connectWallet}
        />
      ) : (
        <>
          <p className="leverage-hint">
            Collateral from UserVault. Deposit USDT/USDC/EURS/EURC above.
          </p>
          <div className="leverage-field">
            <div className="leverage-amount-row">
              <label className="leverage-label">Collateral amount</label>
              {collateralToken && (
                <span className="leverage-vault-balance">
                  Vault: {vaultBalanceFormatted}
                  <button type="button" onClick={onMax} className="leverage-max-btn" title="Use max" disabled={spotUiDisabled}>Max</button>
                </span>
              )}
            </div>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              aria-label="Collateral amount"
              className="leverage-input"
              disabled={spotUiDisabled}
            />
          </div>
          {sameToken && (
            <p className="leverage-hint lev-hint-warn" role="alert">
              Collateral and borrowed must be different tokens.
            </p>
          )}
          <button
            type="button"
            onClick={onOpen}
            disabled={
              spotUiDisabled ||
              !contractReady ||
              !spotAvailable ||
              txPending ||
              !amount.trim() ||
              sameToken ||
              liveTradingBlocked
            }
            className="leverage-btn leverage-btn-long leverage-btn-full leverage-btn-open"
            aria-disabled={liveTradingBlocked || spotUiDisabled ? true : undefined}
          >
            {spotUiDisabled
              ? 'Spot temporarily unavailable'
              : !contractReady
              ? 'Loading…'
              : !spotAvailable
                ? 'Spot not configured'
                : chainGatePending
                  ? 'Checking network…'
                  : liveTradingBlocked
                    ? 'Switch to BSC to trade'
                    : txPending
                      ? 'Opening…'
                      : isDemoMode
                        ? 'Open position (Demo)'
                        : 'Open position'}
          </button>
        </>
      )}
    </>
  );
}
