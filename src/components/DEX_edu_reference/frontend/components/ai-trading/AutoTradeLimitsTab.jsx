/**
 * AutoTradeLimitsTab - Token Limits sub-component
 * Addresses from TOKEN_REGISTRY = BSC mainnet (Binance-Peg / verified contracts).
 */
import React from 'react';
import { DollarSign, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import TokenLogo from '../common/TokenLogo';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

function AutoTradeLimitsTab({
  tokenLimits,
  setTokenLimits,
  usdTradeLimits,
  setUsdTradeLimits,
  saving,
  savingTokenLimits = false,
  handleSaveTokenLimits,
  handleSaveUsdTradeLimits,
  handleForceOpenNow,
  forceOpenMaxLossPct,
  setForceOpenMaxLossPct,
  savedTokenLimitsFromBackend = [],
  savedUsdLimitsFromBackend = null,
  limitsFromBackendLoading = false,
  onRefreshLimitsFromBackend,
  otapolicyManagerAddress = '',
  tokenLimitPresets = [],
  newTradesDisabled = false
}) {
  const shortAddr = otapolicyManagerAddress ? `${otapolicyManagerAddress.slice(0, 6)}…${otapolicyManagerAddress.slice(-4)}` : '';
  const tokenConfiguredCount = savedTokenLimitsFromBackend.filter((t) => t.configured).length;
  const trackedSymbols = tokenLimitPresets.map((p) => p.symbol);
  const trackedWithoutLimit = trackedSymbols.filter(
    (sym) => !savedTokenLimitsFromBackend.some((t) => t.symbol === sym && t.configured)
  );
  const showTokenWarning = trackedWithoutLimit.length > 0 && tokenLimitPresets.length > 0;

  return (
    <div className="auto-trade-panel-content">
      {/* Token limits warning: only shown when missing; USD only appears in the backend-registered block. */}
      {showTokenWarning && (
        <div className="auto-trade-panel-limits-warning" role="alert" style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <AlertTriangle size={18} style={{ color: '#eab308', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: '#e2e8f0' }}>
            <strong>Token limits not set for:</strong> {trackedWithoutLimit.join(', ')}. The executor will skip these tokens. Set limits (or 0 = unlimited) and press Save Limits.
          </div>
        </div>
      )}

      {/* Token limits = on-chain (contract). USD limits = backend (Render). */}
      <div className="auto-trade-panel-section" style={{ marginBottom: 16 }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          {savedUsdLimitsFromBackend != null || tokenConfiguredCount > 0 ? <CheckCircle size={16} style={{ color: '#22c55e' }} /> : null}
          Saved limits (on-chain + backend)
          {typeof onRefreshLimitsFromBackend === 'function' && (
            <button
              type="button"
              onClick={onRefreshLimitsFromBackend}
              disabled={limitsFromBackendLoading}
              style={{ marginLeft: 'auto', padding: '6px 10px', fontSize: 12, background: 'rgba(148, 163, 184, 0.2)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: 6, color: '#e2e8f0', cursor: limitsFromBackendLoading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              aria-label="Reload token limits (contract) and USD limits (backend)"
              title="Token limits = read from contract (BSC). USD limits = from backend (Render)."
            >
              <RefreshCw size={14} className={limitsFromBackendLoading ? 'spin' : ''} />
              {limitsFromBackendLoading ? 'Loading...' : 'Show saved'}
            </button>
          )}
        </h5>
        {limitsFromBackendLoading ? (
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Loading...</p>
        ) : (
          <>
            <p style={{ margin: '0 0 4px 0', fontSize: 11, color: '#94a3b8' }}>Token limits = from contract (BSC, on-chain). USD limits = from backend (Render). Press the button to refresh.</p>
            <p style={{ margin: '0 0 8px 0', fontSize: 11, color: '#64748b' }}>
              <strong>Token limits:</strong> read from the Policy contract (BSC) <code style={{ fontSize: 10 }} title={otapolicyManagerAddress}>{shortAddr}</code>. If you redeploy OTAPolicyManager, put the new address in <code>.env</code> (<code>REACT_APP_OTA_POLICY_MANAGER_ADDRESS</code>) and rebuild.
            </p>
            {savedTokenLimitsFromBackend.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Token limits: </span>
                {savedTokenLimitsFromBackend.map((t) => (
                  <span key={t.symbol} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 8, marginBottom: 4, fontSize: 12 }}>
                    <TokenLogo symbol={t.symbol} size="xs" showBorder aria-hidden />
                    <span style={{ color: t.configured ? '#e2e8f0' : '#64748b' }}>
                      {t.symbol} {t.configured ? `(max/trade: ${t.maxPerTrade === '0' || t.maxPerTrade == null ? '0=skip' : t.maxPerTrade}, daily: ${t.dailyMax === '0' || t.dailyMax == null ? '0=skip' : t.dailyMax})` : '(not set)'}
                    </span>
                  </span>
                ))}
              </div>
            )}
            {savedUsdLimitsFromBackend != null ? (
              <div style={{ fontSize: 12, color: '#e2e8f0', marginBottom: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>USD limits (saved in backend-server / Render): </span>
                Min {savedUsdLimitsFromBackend.minUsd ?? '—'}, Max {savedUsdLimitsFromBackend.maxUsd ?? '—'}, Daily cap {savedUsdLimitsFromBackend.dailyCapUsd ?? '—'}, Max/12h {savedUsdLimitsFromBackend.maxTradesPer12h ?? '—'}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#64748b' }}>USD limits: not set in backend. Set them below and press Save USD Limits.</div>
            )}
          </>
        )}
      </div>

      <div className="auto-trade-panel-section">
        <h4 className="auto-trade-panel-section-title">
          <DollarSign size={18} />
          Token Limits
        </h4>
        <p className="auto-trade-panel-hint" style={{ marginTop: 4, marginBottom: 12, color: '#94a3b8', fontSize: 12 }}>
          Set limits for tracked tokens and the <strong>quote tokens</strong> used for opens: <strong>USDT, BNB, ETH</strong> (Binance-Peg). Otherwise the executor reports maxPerTrade=0 for that quote. Production tracked tokens are loaded from backend; current baseline is BTC, ETH, BNB, LINK, XRP, ADA, AVAX, SOL, DOGE. <strong>0 = the executor skips that token/quote</strong>. For "unlimited", use a large value (for example 1000000).
        </p>

        <div className="auto-trade-panel-form-group">
          <label className="auto-trade-panel-label">
            Token Address
            <span className="auto-trade-panel-required">*</span>
          </label>
          <div className="auto-trade-panel-preset-buttons">
            {tokenLimitPresets.map((p) => (
              <button
                key={p.symbol}
                type="button"
                className="auto-trade-panel-preset-btn auto-trade-panel-preset-btn-with-logo"
                onClick={() => setTokenLimits((prev) => ({ ...prev, token: p.address }))}
              >
                <TokenLogo symbol={p.symbol} size="sm" showBorder aria-hidden />
                <span>{p.label || p.symbol}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={tokenLimits.token}
            onChange={(e) => setTokenLimits((prev) => ({ ...prev, token: e.target.value }))}
            className="auto-trade-panel-input"
            placeholder="0x..."
          />
        </div>

        <div className="auto-trade-panel-form-group">
          <label className="auto-trade-panel-label">Max Per Trade (in token units, not USD)</label>
          <input
            type="text"
            value={tokenLimits.maxPerTrade}
            onChange={(e) => setTokenLimits((prev) => ({ ...prev, maxPerTrade: e.target.value }))}
            className="auto-trade-panel-input"
            placeholder="e.g. 4 for 4 BNB (0 = skip)"
          />
        </div>

        <div className="auto-trade-panel-form-group">
          <label className="auto-trade-panel-label">Daily Max (in token units, not USD)</label>
          <input
            type="text"
            value={tokenLimits.dailyMax}
            onChange={(e) => setTokenLimits((prev) => ({ ...prev, dailyMax: e.target.value }))}
            className="auto-trade-panel-input"
            placeholder="e.g. 10 for 10 BNB (0 = skip)"
          />
        </div>
        <p className="auto-trade-panel-hint" style={{ marginTop: -4, marginBottom: 10, color: '#94a3b8', fontSize: 11 }}>
          Values are in <strong>token</strong> units: for BNB enter 4 or 3.5 (BNB), not USD. 0 = the executor skips the token. Save Limits = on-chain signature (MetaMask).
        </p>

        <button
          onClick={handleSaveTokenLimits}
          disabled={savingTokenLimits}
          className="auto-trade-panel-button primary"
        >
          {savingTokenLimits ? <LoadingSpinner size={16} /> : 'Save Limits'}
        </button>
        <p className="auto-trade-panel-hint" style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
          Save Limits opens your wallet (MetaMask) to sign. If no popup: disconnect in header, then Connect and choose MetaMask.
        </p>

        <div style={{ marginTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.2)', paddingTop: 14 }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#e2e8f0' }}>USD Safety Limits (Auto Mode)</h5>
          <p style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: 12 }}>
            Saved in <strong>backend-server (Render)</strong>. <strong>Max Trade USD</strong> and <strong>Daily USD Cap</strong> are required before real Auto/Force Open can run. These are per-trade risk caps, separate from the bot authorization amount.
          </p>

          <div className="auto-trade-panel-form-group">
            <label className="auto-trade-panel-label">Min Trade USD (optional)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={usdTradeLimits.minUsd}
              onChange={(e) => setUsdTradeLimits((prev) => ({ ...prev, minUsd: e.target.value }))}
              className="auto-trade-panel-input"
              placeholder="optional"
            />
          </div>

          <div className="auto-trade-panel-form-group">
            <label className="auto-trade-panel-label">Max trades / positions in 12h (optional)</label>
            <p style={{ margin: '0 0 6px 0', color: '#94a3b8', fontSize: 11 }}>
              Max trades per 12h (default 6, safety max 12). Ex: 6 = up to 6 auto trades in 12 hours.
            </p>
            <input
              type="number"
              min="1"
              max="12"
              step="1"
              value={usdTradeLimits.maxTradesPer12h}
              onChange={(e) => setUsdTradeLimits((prev) => ({ ...prev, maxTradesPer12h: e.target.value }))}
              className="auto-trade-panel-input"
              placeholder="6"
            />
          </div>

          <div className="auto-trade-panel-form-group">
            <label className="auto-trade-panel-label">Max Trade USD (required)</label>
            <p style={{ margin: '0 0 6px 0', color: '#94a3b8', fontSize: 11 }}>
              Required per-trade cap from backend policy. This is not the on-chain bot authorization limit.
            </p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={usdTradeLimits.maxUsd}
              onChange={(e) => setUsdTradeLimits((prev) => ({ ...prev, maxUsd: e.target.value }))}
              className="auto-trade-panel-input"
              placeholder="required, e.g. 10"
            />
          </div>

          <div className="auto-trade-panel-form-group">
            <label className="auto-trade-panel-label">Daily USD Cap (required)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={usdTradeLimits.dailyCapUsd}
              onChange={(e) => setUsdTradeLimits((prev) => ({ ...prev, dailyCapUsd: e.target.value }))}
              className="auto-trade-panel-input"
              placeholder="required, e.g. 30"
            />
          </div>

          <button
            onClick={handleSaveUsdTradeLimits}
            disabled={saving}
            className="auto-trade-panel-button primary"
          >
            {saving ? <LoadingSpinner size={16} /> : 'Save USD Limits'}
          </button>

          <div className="auto-trade-panel-form-group" style={{ marginTop: 12 }}>
            <label className="auto-trade-panel-label">Close at % loss (this position)</label>
            <p style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: 11 }}>
              Optional. Only for the next Force Open. Default = no percent-loss auto-close unless Policy tab has a loss limit. Choose a value and it saves automatically.
            </p>
            <div className="auto-trade-panel-preset-buttons" style={{ flexWrap: 'wrap', gap: 6 }}>
              {[
                { value: '', label: 'Default (Policy / off)' },
                { value: '3', label: '3%' },
                { value: '5', label: '5%' },
                { value: '10', label: '10%' }
              ].map((opt) => {
                const isSelected = (forceOpenMaxLossPct === '' && opt.value === '') || (opt.value !== '' && String(forceOpenMaxLossPct) === opt.value);
                return (
                  <button
                    key={opt.value || 'default'}
                    type="button"
                    onClick={() => setForceOpenMaxLossPct(opt.value)}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: `1px solid ${isSelected ? 'rgba(34, 197, 94, 0.6)' : 'rgba(148, 163, 184, 0.3)'}`,
                      background: isSelected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.08)',
                      color: isSelected ? '#22c55e' : '#e2e8f0',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 600 : 400
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleForceOpenNow}
            disabled={saving || newTradesDisabled}
            className="auto-trade-panel-button secondary"
            style={{ marginTop: 8 }}
          >
            {saving ? <LoadingSpinner size={16} /> : newTradesDisabled ? 'Force Open Disabled' : 'Force Open Test Trade Now (One-Shot)'}
          </button>
          {newTradesDisabled && (
            <p className="auto-trade-panel-hint" style={{ marginTop: 8, fontSize: 11, color: '#fca5a5' }}>
              Emergency safety lock is active: new real trades are disabled.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AutoTradeLimitsTab;
