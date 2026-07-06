/**
 * AutoTradeDirectEntry - Direct Entry block (used as child of AutoTradeStartStop)
 */
import React, { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ArrowRightLeft, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmationModal from '../common/ConfirmationModal';
import TokenLogo from '../common/TokenLogo';
import { formatNumber } from '../../utils/formatters';
import { getOtaPositionOpenAiSuspendList } from '../../services/aiTradingApiService';
import OtaLlmSuspendControl from './OtaLlmSuspendControl';

function formatDirectEntryPrice(price, quoteToken) {
  if (price == null || !Number.isFinite(price)) return '';
  const qt = String(quoteToken || '').toUpperCase();
  if (qt !== 'USDT' && qt !== 'BNB' && qt !== 'ETH') return '';
  let decimals = 2;
  if (price >= 1) decimals = 2;
  else if (price >= 0.0001) decimals = 6;
  else if (price >= 0.0000001) decimals = 8;
  else decimals = 10;
  const num = formatNumber(price, decimals);
  if (qt === 'USDT') return `$${num}`;
  if (qt === 'BNB') return `${num} BNB`;
  if (qt === 'ETH') return `${num} ETH`;
  return '';
}

/** Regex for amount input – only digits and dot */
const AMOUNT_INPUT_REGEX = /[^0-9.]/g;
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
const DE_DEBUG = false; // set true to re-enable [DE] console logs in this component

function buildConfirmMessage(advisoryToken, amount, quoteToken, tokenPrice, pricePending, slippagePercent, bnbAmountUsd) {
  const base = advisoryToken || 'BNB';
  const amt = amount?.trim() || '—';
  const entryStr = (base !== quoteToken && !pricePending && tokenPrice != null && Number.isFinite(tokenPrice))
    ? `Entry: ~${formatDirectEntryPrice(tokenPrice, quoteToken)}`
    : null;
  const bnbUsdStr = (quoteToken === 'BNB' && bnbAmountUsd != null && bnbAmountUsd > 0)
    ? `BNB ≈ $${formatNumber(bnbAmountUsd, bnbAmountUsd >= 1 ? 2 : 4)}`
    : null;
  const slip = slippagePercent != null ? `Slippage: ${slippagePercent}%` : null;
  const lines = [
    `Token: ${base}`,
    `Amount: ${amt} ${quoteToken}`,
    bnbUsdStr,
    entryStr,
    slip,
    '—',
    'You pay from your Personal Account. One on-chain transaction.',
    'Gas: ~$0.20–0.50 per tx on BSC (open + close ≈ $0.40–1). Small positions: profit may be eaten by fees.'
  ].filter(Boolean);
  return lines.join('\n');
}

function AutoTradeDirectEntry({
  advisoryToken,
  directEntryAmount,
  setDirectEntryAmount,
  directEntryQuoteToken,
  setDirectEntryQuoteToken,
  directEntryQuoteOptions,
  directEntryQuoteOpen,
  setDirectEntryQuoteOpen,
  directEntryQuoteRef,
  getVaultBalanceNumber,
  getAuthorizedForQuote,
  getVaultBalanceForQuote,
  directEntryLoading,
  hasOpenPosition,
  openPositionData = null,
  closePositionLoading = false,
  handleDirectEntryClose,
  policyLoading,
  directEntryTokenPrice,
  directEntryPricePending,
  handleDirectEntryOpen,
  handleDirectEntryConfirm,
  directEntryConfirmOpen,
  setDirectEntryConfirmOpen,
  setDirectEntryAmountPercent,
  directEntrySlippagePercent = 10,
  setDirectEntrySlippagePercent,
  allowlistReadyForDirectEntry = true,
  onGoToAllowlist,
  bnbPriceUsd = null,
  walletAddress = null,
}) {
  const navigate = useNavigate();
  const [llmSuspendSymbols, setLlmSuspendSymbols] = useState(() => new Set());
  const refreshLlmSuspendList = useCallback(async () => {
    if (!walletAddress) {
      setLlmSuspendSymbols(new Set());
      return;
    }
    try {
      const r = await getOtaPositionOpenAiSuspendList(walletAddress, { lane: 'long' });
      setLlmSuspendSymbols(new Set((r.symbols || []).map((s) => String(s).trim().toUpperCase())));
    } catch {
      setLlmSuspendSymbols(new Set());
    }
  }, [walletAddress]);
  useEffect(() => {
    if (!hasOpenPosition || !walletAddress) {
      setLlmSuspendSymbols(new Set());
      return;
    }
    refreshLlmSuspendList();
  }, [hasOpenPosition, walletAddress, openPositionData, refreshLlmSuspendList]);
  const vaultBalance = getVaultBalanceForQuote(directEntryQuoteToken);
  const amountNum = directEntryAmount ? parseFloat(String(directEntryAmount).replace(/[^0-9.]/g, '')) : NaN;
  const bnbAmountUsd = (directEntryQuoteToken === 'BNB' && Number.isFinite(amountNum) && amountNum > 0 && bnbPriceUsd != null && bnbPriceUsd > 0)
    ? amountNum * bnbPriceUsd
    : null;
  const quoteOptions = directEntryQuoteOptions ?? [];
  useEffect(() => {
    if (DE_DEBUG && isDev) console.log('[DE] AutoTradeDirectEntry MOUNT/UPDATE', { advisoryToken, directEntryAmount, directEntryQuoteToken, hasOpenPosition, directEntryLoading, policyLoading, directEntryPricePending, allowlistReadyForDirectEntry });
  }, [advisoryToken, directEntryAmount, directEntryQuoteToken, hasOpenPosition, directEntryLoading, policyLoading, directEntryPricePending, allowlistReadyForDirectEntry]);
  const slippagePresets = [1, 2, 3, 5, 10, 20, 30];
  const amountPlaceholder = directEntryQuoteToken === 'BNB' ? '0.01' : '0.00';
  const amountDisplayLen = (directEntryAmount || amountPlaceholder).length;
  const amountInputWidthCh = Math.max(10, Math.min(24, amountDisplayLen + 2));

  const firstPosition = Array.isArray(openPositionData) ? openPositionData[0] : openPositionData;
  const positionToken = firstPosition?.tokenIn || firstPosition?.token || null;
  const positionPair = firstPosition
    ? [firstPosition.tokenIn, firstPosition.tokenOut].filter(Boolean).join('→') || positionToken || '—'
    : null;
  const positionCount = Array.isArray(openPositionData) ? openPositionData.length : (openPositionData ? 1 : 0);

  return (
    <div className="auto-trade-panel-direct-entry" role="group" aria-label="Direct Entry">
      {hasOpenPosition && (
        <div className="auto-trade-panel-close-position-bar" role="alert" aria-live="polite">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%' }}>
            <span className="auto-trade-panel-close-position-info">
              <XCircle size={16} aria-hidden className="auto-trade-panel-close-position-icon" />
              <span>
                Open position{positionCount > 1 ? `s (${positionCount}/3)` : ''}{positionPair ? `: ${positionPair}` : ''}. Manage in Open Orders or close below.
              </span>
            </span>
            <button
              type="button"
              className="auto-trade-panel-btn-close-position"
              onClick={handleDirectEntryClose}
              disabled={closePositionLoading}
              aria-label="Close open position manually"
              title="Close the open position – sends close request to backend"
            >
              {closePositionLoading ? (
                <span className="auto-trade-panel-close-position-spinner" aria-busy="true">Closing…</span>
              ) : (
                <>
                  <XCircle size={16} aria-hidden />
                  <span>Close Position</span>
                </>
              )}
            </button>
          </div>
          {walletAddress && (() => {
            const list = Array.isArray(openPositionData) ? openPositionData : openPositionData ? [openPositionData] : [];
            if (list.length === 0) return null;
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
                {list.map((pos) => {
                  const tok = pos?.token || pos?.tokenOut || pos?.tokenIn;
                  if (!tok) return null;
                  const tUp = String(tok).toUpperCase();
                  return (
                    <span key={`${tUp}-${pos.id ?? pos.positionId ?? ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--dex-text-secondary, #888)', fontWeight: 600 }}>{tUp}</span>
                      <OtaLlmSuspendControl
                        walletAddress={walletAddress}
                        token={tok}
                        suspended={llmSuspendSymbols.has(tUp)}
                        onChanged={refreshLlmSuspendList}
                        suspendLane="long"
                        compact
                      />
                    </span>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
      <div className="auto-trade-panel-direct-entry-card">
        {/* Single row: Amount (dynamic width) + Quote + 50% 75% MAX + Authorized + Vault + Direct */}
        <div className="auto-trade-panel-direct-entry-single-line">
          <input
            id="direct-entry-amount"
            type="text"
            inputMode="decimal"
            className="auto-trade-panel-direct-entry-amount"
            value={directEntryAmount}
            onChange={(e) => { const v = e.target.value.replace(AMOUNT_INPUT_REGEX, ''); if (DE_DEBUG && isDev) console.log('[DE] amount onChange', { from: directEntryAmount, to: v }); setDirectEntryAmount(v); }}
            placeholder={amountPlaceholder}
            aria-label="Amount in quote token"
            title={directEntryQuoteToken === 'BNB' ? 'Amount in BNB (min ~0.01 recommended)' : 'Amount in quote token'}
            style={{ width: `${amountInputWidthCh}ch` }}
          />
          <div ref={directEntryQuoteRef} className="auto-trade-panel-direct-entry-quote-wrap">
            <button
              type="button"
              className="auto-trade-panel-direct-entry-quote-btn"
              onClick={() => { if (DE_DEBUG && isDev) console.log('[DE] quote dropdown toggle'); setDirectEntryQuoteOpen((o) => !o); }}
              aria-label="Quote token"
              aria-haspopup="listbox"
              aria-expanded={directEntryQuoteOpen}
            >
              <TokenLogo symbol={directEntryQuoteToken} size="lg" showBorder className="auto-trade-panel-direct-entry-quote-logo" />
              <span>{directEntryQuoteToken}</span>
              <ChevronDown size={14} className={directEntryQuoteOpen ? 'auto-trade-panel-direct-entry-quote-chevron-open' : ''} aria-hidden />
            </button>
            {directEntryQuoteOpen && (
              <div className="auto-trade-panel-direct-entry-quote-dropdown" role="listbox">
                {quoteOptions.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    role="option"
                    aria-selected={directEntryQuoteToken === sym}
                    className={`auto-trade-panel-direct-entry-quote-option ${directEntryQuoteToken === sym ? 'auto-trade-panel-direct-entry-quote-option-selected' : ''}`}
                    onClick={() => {
                      if (DE_DEBUG && isDev) console.log('[DE] quote selected', { from: directEntryQuoteToken, to: sym });
                      setDirectEntryQuoteToken(sym);
                      setDirectEntryQuoteOpen(false);
                    }}
                  >
                    <TokenLogo symbol={sym} size="lg" showBorder className="auto-trade-panel-direct-entry-quote-option-logo" />
                    <span>{sym}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="auto-trade-panel-direct-entry-percent-btns">
            {[50, 75].map((p) => (
              <button
                key={p}
                type="button"
                className="auto-trade-panel-direct-entry-percent-btn"
                onClick={() => { if (DE_DEBUG && isDev) console.log('[DE] percent clicked', p); setDirectEntryAmountPercent(p); }}
                disabled={getVaultBalanceNumber(directEntryQuoteToken) <= 0}
                aria-label={`${p}% of vault balance`}
                title={`${p}% of vault`}
              >
                {p}%
              </button>
            ))}
            <button
              type="button"
              className="auto-trade-panel-direct-entry-percent-btn"
              onClick={() => { if (DE_DEBUG && isDev) console.log('[DE] MAX clicked'); setDirectEntryAmountPercent(100); }}
              disabled={getVaultBalanceNumber(directEntryQuoteToken) <= 0}
              aria-label="Max – 100% of vault balance"
              title="Max (100% of vault)"
            >
              MAX
            </button>
          </div>
          <span className="auto-trade-panel-direct-entry-authorized-badge" aria-live="polite" title="Authorized amount for bot">
            Authorized: <strong>{getAuthorizedForQuote(directEntryQuoteToken)}</strong>
          </span>
          {vaultBalance != null && (
            <span className="auto-trade-panel-direct-entry-vault-badge" aria-live="polite" title="Balance in Personal Account (UserVault)">
              Vault: <strong>{vaultBalance}</strong>
            </span>
          )}
        </div>

        <div className="auto-trade-panel-direct-entry-slippage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <span className="auto-trade-panel-direct-entry-slippage-label" style={{ fontSize: 12, color: 'var(--dex-text-secondary, #aaa)' }} title="Reverts often? Use 20–30%">Slippage:</span>
          {slippagePresets.map((p) => (
            <button
              key={p}
              type="button"
              className="auto-trade-panel-preset-btn"
              onClick={() => { if (DE_DEBUG && isDev) console.log('[DE] slippage clicked', p); setDirectEntrySlippagePercent(p); }}
              style={{
                minWidth: 44,
                padding: '4px 8px',
                fontSize: 12,
                ...(directEntrySlippagePercent === p ? { background: 'var(--ds-accent, rgba(76, 175, 80, 0.25))', borderColor: 'var(--ds-accent, #4caf50)' } : {})
              }}
              aria-pressed={directEntrySlippagePercent === p}
              aria-label={`Slippage ${p}%`}
              title="Increase slippage if you get revert (0x)"
            >
              {p}%
            </button>
          ))}
        </div>

        {/* Buton Direct Entry */}
        <button
          type="button"
          className="auto-trade-panel-btn-direct-entry"
          onClick={() => { if (DE_DEBUG && isDev) console.log('[DE] Direct Entry button clicked', { token: advisoryToken, amount: directEntryAmount, quote: directEntryQuoteToken }); handleDirectEntryOpen(); }}
          disabled={directEntryLoading || (hasOpenPosition && positionCount >= 3) || policyLoading || !(advisoryToken || 'BNB') || !directEntryAmount?.trim() || (advisoryToken || 'BNB') === directEntryQuoteToken}
          aria-label="Direct Entry – open position with selected token"
          title={`Open position: ${advisoryToken || 'BNB'}/${directEntryQuoteToken}${directEntryAmount ? ` (${directEntryAmount} ${directEntryQuoteToken})` : ''}`}
        >
          {directEntryLoading ? (
            <LoadingSpinner size={18} />
          ) : (
            <span className="auto-trade-panel-btn-direct-entry-inner">
              <span className="auto-trade-panel-btn-direct-entry-row1">
                <ArrowRightLeft size={18} aria-hidden className="auto-trade-panel-btn-direct-entry-icon" />
                <span className="auto-trade-panel-btn-direct-entry-label">Direct Entry</span>
              </span>
              <span className="auto-trade-panel-btn-direct-entry-row2">
                <TokenLogo symbol={advisoryToken || 'BNB'} size="sm" showBorder className="auto-trade-panel-btn-direct-entry-logo" aria-hidden />
                <span className="auto-trade-panel-direct-entry-token">{(advisoryToken || 'BNB')}</span>
                <span className="auto-trade-panel-btn-direct-entry-pair-sep" aria-hidden>/</span>
                <TokenLogo symbol={directEntryQuoteToken} size="sm" showBorder className="auto-trade-panel-btn-direct-entry-logo" aria-hidden />
                <span className="auto-trade-panel-direct-entry-token">{directEntryQuoteToken}</span>
                {(advisoryToken || 'BNB') !== directEntryQuoteToken && (
                  directEntryPricePending || !(directEntryTokenPrice != null && Number.isFinite(directEntryTokenPrice)) ? (
                    <span className="auto-trade-panel-direct-entry-price-loading" aria-busy="true" aria-live="polite" title="Loading price…">
                      <LoadingSpinner size="small" message="" />
                    </span>
                  ) : (
                    <span className="auto-trade-panel-direct-entry-price" aria-hidden title={`1 ${advisoryToken || 'BNB'} = ${formatDirectEntryPrice(directEntryTokenPrice, directEntryQuoteToken)}`}>
                      @ {formatDirectEntryPrice(directEntryTokenPrice, directEntryQuoteToken)}
                    </span>
                  )
                )}
                {bnbAmountUsd != null && (
                  <span className="auto-trade-panel-direct-entry-usd-badge" aria-hidden title="USD value of BNB amount">
                    ≈ ${formatNumber(bnbAmountUsd, bnbAmountUsd >= 1 ? 2 : 4)}
                  </span>
                )}
              </span>
            </span>
          )}
        </button>

        {/* Linie 6: Hint text – div allows LoadingSpinner (div) inside without validateDOMNesting */}
        <div className="auto-trade-panel-direct-entry-hint">
          Open a position manually (no AI signal). <strong>Buy</strong>: token from header (for example LINK or SOL). <strong>Pay with</strong>: BNB, USDT, or ETH from your Personal Account (quote ≠ token).{directEntryQuoteToken === 'BNB' && ' Min ~0.01 BNB.'} {positionCount >= 3 ? 'Maximum 3 positions – close one in Open Orders first.' : hasOpenPosition ? `${positionCount}/3 positions – you can open more.` : (
            <>
              Buy <strong>{advisoryToken || 'BNB'}</strong> with <strong>{directEntryAmount || '…'} {directEntryQuoteToken}</strong>
              {bnbAmountUsd != null && (
                <> <span className="auto-trade-panel-direct-entry-usd-hint">(≈ ${formatNumber(bnbAmountUsd, bnbAmountUsd >= 1 ? 2 : 4)})</span></>
              )}
              {(advisoryToken || 'BNB') !== directEntryQuoteToken && (
                  directEntryPricePending || !(directEntryTokenPrice != null && Number.isFinite(directEntryTokenPrice)) ? (
                    <> • <span className="auto-trade-panel-direct-entry-price-loading-inline"><LoadingSpinner size="small" message="" /></span></>
                  ) : (
                    <> • Entry: ~{formatDirectEntryPrice(directEntryTokenPrice, directEntryQuoteToken)}</>
                  )
              )}
              {(advisoryToken || 'BNB') === directEntryQuoteToken && (
                <> • <em>Select different quote (USDT/ETH) – cannot buy {advisoryToken || 'BNB'} with same token</em></>
              )}
            </>
          )}
        </div>
        {(advisoryToken || 'BNB') === 'BNB' && directEntryQuoteToken === 'BNB' && (
          <p className="auto-trade-panel-direct-entry-vault-hint" role="status">
            <strong>To buy BNB:</strong> select USDT or ETH as quote (pay with USDT/ETH from your Personal Account).
          </p>
        )}
        {directEntryQuoteToken === 'BNB' && !allowlistReadyForDirectEntry && onGoToAllowlist && (advisoryToken || 'BNB') !== 'BNB' && (
          <p className="auto-trade-panel-direct-entry-vault-hint" role="status" style={{ background: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.3)', borderRadius: 6, padding: 8 }}>
            <strong>First-time setup:</strong> Clicking Direct Entry will automatically authorize BNB and {advisoryToken} in OTA policy (1–3 MetaMask signatures). Already done?{' '}
            <button type="button" className="auto-trade-panel-direct-entry-link" onClick={onGoToAllowlist}>View Allowlist tab →</button>
          </p>
        )}
        <p className="auto-trade-panel-direct-entry-vault-hint">
          <strong>BSC gas:</strong> Each open and close pays a transaction fee (~$0.20–0.50 in BNB). On small positions, gas can eat most or all profit. Prefer larger size (e.g. $50+) so fees are a smaller share of PnL.
        </p>
        <p className="auto-trade-panel-direct-entry-vault-hint">
          <strong>Have only BNB in wallet?</strong> <strong>Deposit first</strong> – transfer BNB to your Personal Account (real tx): <button type="button" className="auto-trade-panel-direct-entry-link" onClick={() => navigate('/dex-edu/leverage?tab=deposit')}>Leverage → Deposit</button>. Then <strong>Authorize</strong> – sets limit bot can use <em>from your account</em> (no transfer; account must have balance). <strong>Changed your mind?</strong> <button type="button" className="auto-trade-panel-direct-entry-link" onClick={() => navigate('/dex-edu/leverage?tab=withdraw')}>Withdraw</button> anytime. Then here: select a baseline token (for example LINK), quote BNB, amount.
        </p>
        <ConfirmationModal
          isOpen={directEntryConfirmOpen}
          onClose={() => { if (DE_DEBUG && isDev) console.log('[DE] Confirm modal CLOSE'); setDirectEntryConfirmOpen(false); }}
          onConfirm={() => { if (DE_DEBUG && isDev) console.log('[DE] Confirm modal CONFIRM clicked – calling handleDirectEntryConfirm'); handleDirectEntryConfirm(); }}
          title="Confirm Direct Entry"
          message={buildConfirmMessage(advisoryToken, directEntryAmount, directEntryQuoteToken, directEntryTokenPrice, directEntryPricePending, directEntrySlippagePercent, bnbAmountUsd)}
          confirmLabel="Open position"
          cancelLabel="Cancel"
          variant="default"
          isLoading={directEntryLoading}
          className="confirmation-modal-direct-entry"
        />
      </div>
    </div>
  );
}

export default React.memo(AutoTradeDirectEntry);
