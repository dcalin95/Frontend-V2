/**
 * Form deschidere poziție CFD.
 * Direction: toggle colorat Long (verde) / Short (roșu) — ca XTB.
 * Leverage: pill buttons (2x/3x/5x/10x), nu dropdown.
 * Payment: toggle Crypto (din vault) / Fiat (Stripe EUR/USD).
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Wallet, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { LEVERAGE_OPTIONS, CFD_ASSETS, CFD_NAV_GROUPS } from '../../constants/leverageConstants';
import TokenSelect from './TokenSelect';
import LeverageDropdown from './LeverageDropdown';
import LeverageFiatPanel from './LeverageFiatPanel';

/** Procente din soldul vault pentru câmpul Margin amount (crypto path) */
const CFD_MARGIN_PCT_OPTIONS = [25, 50, 75, 100];

export default function LeverageCFDForm({
  settlementToken,
  setSettlementToken,
  assetId,
  setAssetId,
  amount,
  setAmount,
  leverageBps,
  setLeverageBps,
  isLong,
  setIsLong,
  vaultBalanceFormatted,
  onMax,
  isConnected,
  connectWallet,
  marginOptions,
  onOpen,
  contractReady,
  txPending,
  walletAddress,
  isDemoMode,
  liveTradingBlocked = false,
  chainGatePending = false,
}) {
  // În demo mode: forțăm crypto (nu Stripe real)
  const [payMethod, setPayMethod] = useState('crypto');
  // Dacă intrăm în demo mode, revenim la crypto automat
  React.useEffect(() => { if (isDemoMode) setPayMethod('crypto'); }, [isDemoMode]);

  const assetOptions = CFD_ASSETS.map((a) => ({
    value: a.id,
    label: a.label,
    symbol: a.priceToken,
  }));

  const assetGroups = useMemo(
    () =>
      CFD_NAV_GROUPS.map((g) => ({
        domainId: g.id,
        groupLabel: g.label,
        tabLabel: g.shortTabLabel,
        tabHint: g.tabHint,
        options: g.assetIds
          .map((id) => {
            const a = CFD_ASSETS.find((x) => x.id === id);
            return a
              ? { value: a.id, label: a.label, symbol: a.priceToken }
              : null;
          })
          .filter(Boolean),
      })).filter((g) => g.options.length > 0),
    []
  );

  const selectedAsset = CFD_ASSETS.find((a) => a.id === assetId);
  const leverageLabel = LEVERAGE_OPTIONS.find((o) => o.value === leverageBps)?.label || `${leverageBps / 10000}x`;
  const tradeLabel = `CFD · ${selectedAsset?.label || `Asset ${assetId}`} · ${leverageLabel} · ${isLong ? 'Long' : 'Short'}`;

  const tradeParams = useMemo(() => ({
    tradeType: 'cfd',
    assetId,
    leverageBps,
    isLong,
    settlementToken,
  }), [assetId, leverageBps, isLong, settlementToken]);

  const vaultNumeric = useMemo(() => {
    const raw = String(vaultBalanceFormatted ?? '').replace(/,/g, '').trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : NaN;
  }, [vaultBalanceFormatted]);

  const applyMarginVaultPercent = useCallback(
    (pct) => {
      if (!Number.isFinite(vaultNumeric) || vaultNumeric <= 0) return;
      const next = (vaultNumeric * pct) / 100;
      if (!Number.isFinite(next) || next <= 0) return;
      setAmount(parseFloat(next.toFixed(6)).toString());
    },
    [vaultNumeric, setAmount]
  );

  if (!isConnected) {
    return (
      <div className="leverage-connect-inline">
        <Wallet size={32} className="leverage-connect-icon" aria-hidden />
        <p className="leverage-connect-desc">Connect your wallet to open CFD positions.</p>
        <button type="button" onClick={connectWallet} className="leverage-btn leverage-btn-primary">Connect wallet</button>
      </div>
    );
  }

  return (
    <div className="leverage-form-inner">
      {/* DEMO badge — vizibil când user este în mod demo */}
      {isDemoMode && (
        <div className="lev-demo-notice" role="note" aria-label="Demo mode active">
          <span className="lev-demo-badge">DEMO</span>
          <span>
            Same live quotes as Real · virtual margin · balance {vaultBalanceFormatted} (USDT)
          </span>
        </div>
      )}

      {/* Toggle Crypto / Fiat — ascuns în demo (Stripe nu funcționează cu fonduri demo) */}
      {!isDemoMode && (
        <div className="lev-pay-toggle" role="group" aria-label="Payment method">
          <button
            type="button"
            className={`lev-pay-toggle-btn${payMethod === 'crypto' ? ' active' : ''}`}
            onClick={() => setPayMethod('crypto')}
            aria-pressed={payMethod === 'crypto'}
          >
            <Wallet size={13} aria-hidden /> Crypto
          </button>
          <button
            type="button"
            className={`lev-pay-toggle-btn${payMethod === 'fiat' ? ' active' : ''}`}
            onClick={() => setPayMethod('fiat')}
            aria-pressed={payMethod === 'fiat'}
          >
            <CreditCard size={13} aria-hidden /> Fiat (EUR/USD)
          </button>
        </div>
      )}

      {/* Asset CFD – custom dropdown cu logo */}
      <LeverageDropdown
        label="Asset"
        value={assetId}
        onChange={(v) => setAssetId(Number(v))}
        groups={assetGroups}
        options={assetOptions}
        domainTabs
        ariaLabel="CFD Asset"
      />

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
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Direction – Long / Short colorat */}
      <div className="leverage-field">
        <label className="leverage-label">Direction</label>
        <div className="lev-direction" role="group" aria-label="Position direction">
          <button
            type="button"
            className={`lev-dir-btn lev-dir-long${isLong ? ' active' : ''}`}
            onClick={() => setIsLong(true)}
            aria-pressed={isLong}
          >
            <TrendingUp size={14} aria-hidden />
            Long
          </button>
          <button
            type="button"
            className={`lev-dir-btn lev-dir-short${!isLong ? ' active' : ''}`}
            onClick={() => setIsLong(false)}
            aria-pressed={!isLong}
          >
            <TrendingDown size={14} aria-hidden />
            Short
          </button>
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
          {marginOptions.length > 0 && (
            <TokenSelect
              label="Margin token"
              value={settlementToken}
              onChange={setSettlementToken}
              options={marginOptions}
            />
          )}
          <div className="leverage-field">
            <div className="leverage-amount-row">
              <label className="leverage-label">Margin amount</label>
              {settlementToken && (
                <span className="leverage-vault-balance">
                  Vault: {vaultBalanceFormatted}
                  <button type="button" onClick={onMax} className="leverage-max-btn" title="Use max">Max</button>
                </span>
              )}
            </div>
            <div className="lev-margin-pct" role="group" aria-label="Margin as percent of vault">
              {CFD_MARGIN_PCT_OPTIONS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className="lev-margin-pct-btn"
                  disabled={!settlementToken || !Number.isFinite(vaultNumeric) || vaultNumeric <= 0}
                  onClick={() => applyMarginVaultPercent(pct)}
                  title={`Use ${pct}% of vault balance`}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              aria-label="CFD margin amount"
              className="leverage-input"
            />
          </div>
          <button
            type="button"
            onClick={onOpen}
            disabled={
              !contractReady ||
              txPending ||
              !amount.trim() ||
              !settlementToken ||
              liveTradingBlocked
            }
            className={`leverage-btn leverage-btn-full leverage-btn-open${isLong ? ' leverage-btn-long' : ' leverage-btn-short'}`}
            aria-disabled={liveTradingBlocked ? true : undefined}
          >
            {!contractReady
              ? 'Loading…'
              : chainGatePending
                ? 'Checking network…'
                : liveTradingBlocked
                  ? 'Switch to BSC to trade'
                  : txPending
                    ? 'Opening…'
                    : isDemoMode
                      ? `Open ${isLong ? 'Long' : 'Short'} (Demo)`
                      : `Open ${isLong ? 'Long' : 'Short'}`}
          </button>
        </>
      )}
    </div>
  );
}
