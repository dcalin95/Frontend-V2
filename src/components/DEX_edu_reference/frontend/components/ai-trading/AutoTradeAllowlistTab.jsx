/**
 * AutoTradeAllowlistTab - Token & Pair Allowlist
 *
 * - Normalizes BNB: 0x0, WBNB, 0xeee → ADDRESS_ZERO (user has BNB only)
 * - Deduplication via normalizeAllowlistAddress in parent
 * - Display: addressToSymbol maps known tokens; unknown show truncated address
 * - Pair dropdowns: factorized token select with TokenLogo (Direct Entry style), Portal in document.body
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { List, ArrowRight, Star, CheckCircle, AlertCircle, ChevronDown, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import TokenLogo from '../common/TokenLogo';
import { TOKEN_REGISTRY } from '../../services/tokenRegistry';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
const WBNB_BSC = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const ADDRESS_ETH_SENTINEL = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const CAKE_BSC = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';
const SOL_BSC = TOKEN_REGISTRY.SOL?.address || '0x570a5d26f7765ecb712c0924e4de545b89fd43df';
const OTA_PRODUCTION_BASELINE_SYMBOLS = ['BTC', 'ETH', 'LINK', 'XRP', 'ADA', 'AVAX', 'SOL', 'DOGE'];

// Production baseline first; legacy BSC tokens stay selectable for manual/direct-entry cleanup only.
const ALLOWLIST_TOKEN_OPTIONS = [
  { symbol: 'BNB', address: ADDRESS_ZERO },
  { symbol: 'USDT', address: TOKEN_REGISTRY.USDT?.address },
  ...OTA_PRODUCTION_BASELINE_SYMBOLS.map(symbol => ({ symbol, address: TOKEN_REGISTRY[symbol]?.address })),
  { symbol: 'BUSD', address: TOKEN_REGISTRY.BUSD?.address },
  { symbol: 'CAKE', address: TOKEN_REGISTRY.CAKE?.address || CAKE_BSC },
  { symbol: 'MATIC', address: TOKEN_REGISTRY.MATIC?.address },
  { symbol: 'SHIB', address: TOKEN_REGISTRY.SHIB?.address },
  { symbol: 'STX', address: TOKEN_REGISTRY.STX?.address }
].filter(p => p.address);

/** All token addresses used for full on-chain scan, exported for the Panel. */
export const ALLOWLIST_TOKEN_ADDRESSES = ALLOWLIST_TOKEN_OPTIONS.map(p => p.address).filter(Boolean);

/** WBNB (0xbb4…) and 0xeee sentinel are invalid – user has BNB (0x0) only. Normalize to ADDRESS_ZERO. */
const BNB_ALIASES_TO_NORMALIZE = new Set([
  WBNB_BSC.toLowerCase(),
  ADDRESS_ETH_SENTINEL.toLowerCase()
]);

/** Normalize EVM address for comparison & storage. 0x0, WBNB, 0xeee, native, bnb → ADDRESS_ZERO. Supports objects with .address. */
export function normalizeAllowlistAddress(addr) {
  if (!addr) return null;
  const raw = (typeof addr === 'object' && addr?.address) ? String(addr.address) : String(addr);
  const v = raw.trim().toLowerCase();
  if (v === 'native' || v === 'bnb') return ADDRESS_ZERO;
  const s = v.replace(/^0x/i, '');
  if (!s || /^0+$/.test(s)) return ADDRESS_ZERO;
  const out = '0x' + s.toLowerCase();
  if (BNB_ALIASES_TO_NORMALIZE.has(out)) return ADDRESS_ZERO;
  return out;
}

function normalizeAddr(addr) {
  const n = normalizeAllowlistAddress(addr);
  return n ? n.toLowerCase() : null;
}

function addressToSymbol(addr) {
  if (!addr) return null;
  const a = normalizeAddr(addr);
  if (!a) return null;
  if (a === ADDRESS_ZERO.toLowerCase()) return 'BNB';
  const found = ALLOWLIST_TOKEN_OPTIONS.find(p => normalizeAddr(p.address) === a);
  return found?.symbol || null;
}

const USDT_BSC = TOKEN_REGISTRY.USDT?.address || '0x55d398326f99059fF775485246999027B3197955';

/** Quote tokens OTA uses (vault balance). Need quote→token (Open) and token→quote (Close) for each. */
const OTA_QUOTE_SYMBOLS = ['USDT', 'BNB'];
function getAddressForSymbol(symbol) {
  const opt = ALLOWLIST_TOKEN_OPTIONS.find(p => (p.symbol || '').toUpperCase() === (symbol || '').toUpperCase());
  return opt?.address || null;
}

/** Factorized token dropdown: logo + symbol, Portal in document.body (Allowlist style, not Header). */
function AllowlistTokenSelect({ value, onChange, placeholder, options, id }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, minWidth: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const selected = value ? options.find(p => p.address && normalizeAddr(p.address) === normalizeAddr(value)) : null;

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      const inside = buttonRef.current?.contains(e.target) || dropdownRef.current?.contains(e.target);
      if (!inside) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="auto-trade-panel-allowlist-token-select-wrap">
      <button
        ref={buttonRef}
        type="button"
        id={id}
        className="auto-trade-panel-allowlist-token-select-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        aria-label={placeholder}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <TokenLogo symbol={selected.symbol} size="sm" showBorder className="auto-trade-panel-allowlist-token-select-logo" />
            <span>{selected.symbol}</span>
          </>
        ) : (
          <span className="auto-trade-panel-allowlist-token-select-placeholder">{placeholder}</span>
        )}
        <ChevronDown size={14} className={open ? 'auto-trade-panel-allowlist-token-select-chevron-open' : ''} aria-hidden />
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="auto-trade-panel-allowlist-token-select-dropdown"
          role="listbox"
          style={{
            position: 'fixed',
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            minWidth: dropdownStyle.minWidth,
            zIndex: 99999
          }}
        >
          {options.map((p) => (
            <button
              key={p.symbol + (p.address || '')}
              type="button"
              role="option"
              aria-selected={selected && normalizeAddr(selected.address) === normalizeAddr(p.address)}
              className={`auto-trade-panel-allowlist-token-select-option ${selected && normalizeAddr(selected.address) === normalizeAddr(p.address) ? 'auto-trade-panel-allowlist-token-select-option-selected' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(p.address);
                setOpen(false);
              }}
            >
              <TokenLogo symbol={p.symbol} size="sm" showBorder className="auto-trade-panel-allowlist-token-select-option-logo" />
              <span>{p.symbol}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function AutoTradeAllowlistTab({
  tokenAllowlist,
  pairAllowlist,
  allowlistTokenInput,
  allowlistPairIn,
  allowlistPairOut,
  allowlistStatusMessage,
  saving,
  verifyingAllowlist,
  walletAddress,
  onVerifyApprovals,
  onAddToken,
  onRemoveToken,
  onAddPair,
  onRemovePair,
  onAddAllRecommended,
  onAddCakeForDirectEntry,
  onAddUsdtForDirectEntry,
  onAddSolForDirectEntry,
  onAddAllPairsForTokens,
  onCleanDuplicates,
  setAllowlistTokenInput,
  setAllowlistPairIn,
  setAllowlistPairOut,
  fetchTokenAllowedOnChain,
  fetchPairAllowedOnChain,
  onLoadTokensFromChain,
  onLoadPairsFromChain
}) {
  const [fetchedTokensResult, setFetchedTokensResult] = useState(null);
  const [fetchedPairsResult, setFetchedPairsResult] = useState(null);
  const [loadingFetchTokens, setLoadingFetchTokens] = useState(false);
  const [loadingFetchPairs, setLoadingFetchPairs] = useState(false);
  const recommendedBaselineAddresses = OTA_PRODUCTION_BASELINE_SYMBOLS
    .map(symbol => TOKEN_REGISTRY[symbol]?.address)
    .filter(Boolean);
  const recommendedTokens = [ADDRESS_ZERO, USDT_BSC, ...recommendedBaselineAddresses].filter(Boolean);
  const recommendedPairs = [
    { tokenIn: ADDRESS_ZERO, tokenOut: USDT_BSC },
    { tokenIn: USDT_BSC, tokenOut: ADDRESS_ZERO },
    ...recommendedBaselineAddresses.map(tokenOut => ({ tokenIn: USDT_BSC, tokenOut }))
  ].filter(p => p.tokenIn && p.tokenOut);
  const addrMatches = (a, b) => { const na = normalizeAddr(a); const nb = normalizeAddr(b); return na && nb && na === nb; };
  const tokensToAdd = recommendedTokens.filter(addr => !tokenAllowlist.some(t => addrMatches(t, addr)));
  const pairsToAdd = recommendedPairs.filter(
    p => !pairAllowlist.some(ex => addrMatches(ex.tokenIn, p.tokenIn) && addrMatches(ex.tokenOut, p.tokenOut))
  );
  const tokensAlreadyApproved = recommendedTokens.filter(addr => tokenAllowlist.some(t => addrMatches(t, addr)));
  const pairsAlreadyApproved = recommendedPairs.filter(
    p => pairAllowlist.some(ex => addrMatches(ex.tokenIn, p.tokenIn) && addrMatches(ex.tokenOut, p.tokenOut))
  );
  const recommendedPendingCount = tokensToAdd.length + pairsToAdd.length;
  const baseTokens = tokenAllowlist.filter(t => t && !addrMatches(t, ADDRESS_ZERO));
  const hasBaseTokens = baseTokens.length > 0;
  const pairsToAddForTokensCount = baseTokens.filter(t =>
    !pairAllowlist.some(p => addrMatches(p.tokenIn, ADDRESS_ZERO) && addrMatches(p.tokenOut, t))
  ).length;
  const cakeFullyApproved = tokensAlreadyApproved.some(a => addrMatches(a, CAKE_BSC)) &&
    pairsAlreadyApproved.some(p => addrMatches(p.tokenIn, ADDRESS_ZERO) && addrMatches(p.tokenOut, CAKE_BSC));
  const usdtFullyApproved = tokensAlreadyApproved.some(a => addrMatches(a, USDT_BSC)) &&
    pairsAlreadyApproved.some(p => addrMatches(p.tokenIn, ADDRESS_ZERO) && addrMatches(p.tokenOut, USDT_BSC)) &&
    pairsAlreadyApproved.some(p => addrMatches(p.tokenIn, USDT_BSC) && addrMatches(p.tokenOut, ADDRESS_ZERO));
  const solFullyApproved = SOL_BSC && tokenAllowlist.some(t => addrMatches(t, SOL_BSC)) &&
    pairAllowlist.some(p => addrMatches(p.tokenIn, USDT_BSC) && addrMatches(p.tokenOut, SOL_BSC));

  // Missing OTA pairs (Open + Close): for each allowlisted token, quote->token and token->quote for USDT, BNB, ETH.
  const tokensWithSymbol = tokenAllowlist
    .map(addr => ({ addr, symbol: addressToSymbol(addr) }))
    .filter(t => t.symbol);
  const missingOtaPairs = [];
  for (const { addr, symbol } of tokensWithSymbol) {
    for (const quoteSym of OTA_QUOTE_SYMBOLS) {
      if (quoteSym === symbol) continue;
      const qAddr = getAddressForSymbol(quoteSym);
      if (!qAddr) continue;
      const pairOpen = { tokenIn: qAddr, tokenOut: addr, label: `${quoteSym} → ${symbol}` };
      const pairClose = { tokenIn: addr, tokenOut: qAddr, label: `${symbol} → ${quoteSym}` };
      if (!pairAllowlist.some(p => addrMatches(p.tokenIn, pairOpen.tokenIn) && addrMatches(p.tokenOut, pairOpen.tokenOut))) {
        missingOtaPairs.push(pairOpen);
      }
      if (!pairAllowlist.some(p => addrMatches(p.tokenIn, pairClose.tokenIn) && addrMatches(p.tokenOut, pairClose.tokenOut))) {
        missingOtaPairs.push(pairClose);
      }
    }
  }

  const handleSuggestPair = (tokenIn, tokenOut) => {
    setAllowlistPairIn(tokenIn);
    setAllowlistPairOut(tokenOut);
    document.getElementById('allowlist-pair-in')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFetchApprovedTokens = async () => {
    if (!walletAddress || typeof fetchTokenAllowedOnChain !== 'function') return;
    setLoadingFetchTokens(true);
    setFetchedTokensResult(null);
    try {
      const tokensToCheck = [];
      for (const p of ALLOWLIST_TOKEN_OPTIONS) {
        if (!tokensToCheck.some(a => addrMatches(a, p.address))) tokensToCheck.push(p.address);
      }
      for (const addr of tokenAllowlist) {
        const n = normalizeAllowlistAddress(addr);
        if (n && !tokensToCheck.some(a => addrMatches(a, n))) tokensToCheck.push(n);
      }
      const allowed = [];
      for (const addr of tokensToCheck) {
        if (await fetchTokenAllowedOnChain(walletAddress, addr)) allowed.push(addr);
      }
      const allowedSet = new Set(allowed.map(a => normalizeAddr(a)));
      const missingInList = allowed.filter(addr => !tokenAllowlist.some(t => addrMatches(t, addr)));
      const inListNotApproved = tokenAllowlist.filter(addr => !allowedSet.has(normalizeAddr(addr)));
      setFetchedTokensResult({ allowed, missingInList, inListNotApproved });
    } catch (e) {
      setFetchedTokensResult({ error: e?.message || 'Failed to fetch' });
    } finally {
      setLoadingFetchTokens(false);
    }
  };

  const handleFetchApprovedPairs = async () => {
    if (!walletAddress || typeof fetchPairAllowedOnChain !== 'function') return;
    setLoadingFetchPairs(true);
    setFetchedPairsResult(null);
    try {
      const addrs = ALLOWLIST_TOKEN_OPTIONS.map(p => p.address).filter(Boolean);
      const allPairs = [];
      for (let i = 0; i < addrs.length; i++) {
        for (let j = 0; j < addrs.length; j++) {
          if (i !== j && normalizeAddr(addrs[i]) !== normalizeAddr(addrs[j])) {
            allPairs.push({ tokenIn: addrs[i], tokenOut: addrs[j] });
          }
        }
      }
      const allowed = [];
      for (const { tokenIn, tokenOut } of allPairs) {
        if (await fetchPairAllowedOnChain(walletAddress, tokenIn, tokenOut)) allowed.push({ tokenIn, tokenOut });
      }
      const allowedKey = (ti, to) => [normalizeAddr(ti), normalizeAddr(to)].sort().join('|');
      const allowedSet = new Set(allowed.map(p => allowedKey(p.tokenIn, p.tokenOut)));
      const missingInList = allowed.filter(p => !pairAllowlist.some(ex => addrMatches(ex.tokenIn, p.tokenIn) && addrMatches(ex.tokenOut, p.tokenOut)));
      const inListNotApproved = pairAllowlist.filter(p => !allowedSet.has(allowedKey(p.tokenIn, p.tokenOut)));
      setFetchedPairsResult({ allowed, missingInList, inListNotApproved });
    } catch (e) {
      setFetchedPairsResult({ error: e?.message || 'Failed to fetch' });
    } finally {
      setLoadingFetchPairs(false);
    }
  };

  return (
    <div className="auto-trade-panel-content">
      <div className="auto-trade-panel-section">
        {onAddAllRecommended && (
          <div className="auto-trade-panel-allowlist-recommended">
            <h5 className="auto-trade-panel-allowlist-recommended-title">
              <Star size={16} aria-hidden />
              Recommended for most users
            </h5>
            <p className="auto-trade-panel-allowlist-recommended-desc">
              One click adds the production OTA baseline: BTC, ETH, BNB, LINK, XRP, ADA, AVAX, SOL, DOGE plus USDT quote pairs.
            </p>
            <p className={`auto-trade-panel-allowlist-recommended-hint ${(tokensAlreadyApproved.length > 0 || pairsAlreadyApproved.length > 0) ? 'has-approved' : ''}`}>
              <strong>One-time setup:</strong> You sign <strong>once per token and once per pair</strong> in MetaMask for missing baseline items. After that, each Direct Entry is only <strong>1 signature</strong>. Items already approved below do <strong>not</strong> need to be approved again.
            </p>
            {(tokensAlreadyApproved.length > 0 || pairsAlreadyApproved.length > 0) && (
              <p className="auto-trade-panel-allowlist-already-approved">
                <CheckCircle size={14} aria-hidden />
                <span><strong>Already approved (no action needed):</strong>{' '}
                {[
                  ...tokensAlreadyApproved.map(a => addressToSymbol(a) || '?'),
                  ...pairsAlreadyApproved.map(p => `${addressToSymbol(p.tokenIn)}→${addressToSymbol(p.tokenOut)}`)
                ].join(', ')}</span>
              </p>
            )}
            <div className="auto-trade-panel-allowlist-buttons-row">
            {onVerifyApprovals && (
              <button
                type="button"
                className="auto-trade-panel-button auto-trade-panel-btn-verify"
                onClick={onVerifyApprovals}
                disabled={saving || verifyingAllowlist || !walletAddress}
                title={walletAddress ? 'Read approved on-chain items from the OTAPolicyManager contract and update the displayed list.' : 'Connect wallet to verify'}
              >
                {verifyingAllowlist ? <LoadingSpinner size={14} /> : null}
                {verifyingAllowlist ? ' Verifying…' : 'Verify approvals'}
              </button>
            )}
            {onCleanDuplicates && (
              <button
                type="button"
                className="auto-trade-panel-button auto-trade-panel-btn-clean"
                onClick={onCleanDuplicates}
                disabled={saving || verifyingAllowlist}
                title="Normalize BNB addresses and remove duplicate pairs"
              >
                Clean duplicates
              </button>
            )}
            <button
              type="button"
              className="auto-trade-panel-button primary"
              onClick={onAddAllRecommended}
              disabled={saving || verifyingAllowlist || recommendedPendingCount === 0}
              style={{ minWidth: 200 }}
              aria-label={recommendedPendingCount === 0 ? 'All recommended items already added' : `Add ${recommendedPendingCount} recommended items`}
            >
              {saving ? <LoadingSpinner size={14} /> : null}
              {saving ? ' Adding… Sign in MetaMask' : recommendedPendingCount === 0 ? 'Recommended already set' : `Add all recommended (${recommendedPendingCount} items)`}
            </button>
            {onAddCakeForDirectEntry && (
              <button
                type="button"
                className={`auto-trade-panel-button primary ${cakeFullyApproved ? 'is-approved' : ''}`}
                onClick={onAddCakeForDirectEntry}
                disabled={saving || verifyingAllowlist || cakeFullyApproved}
                style={{ minWidth: 180 }}
                title={cakeFullyApproved ? 'CAKE already approved' : 'Add CAKE token and BNB→CAKE pairs for Direct Entry'}
                aria-label={cakeFullyApproved ? 'CAKE already approved' : 'Add CAKE token and pairs'}
              >
                {saving ? <LoadingSpinner size={14} /> : null}
                {saving ? ' Adding…' : cakeFullyApproved ? 'CAKE approved' : 'Add CAKE (token + pairs)'}
              </button>
            )}
            {onAddUsdtForDirectEntry && (
              <button
                type="button"
                className={`auto-trade-panel-button primary ${usdtFullyApproved ? 'is-approved' : ''}`}
                onClick={onAddUsdtForDirectEntry}
                disabled={saving || verifyingAllowlist || usdtFullyApproved}
                style={{ minWidth: 180 }}
                title={usdtFullyApproved ? 'USDT already approved' : 'Add USDT token and BNB↔USDT pairs for Direct Entry'}
                aria-label={usdtFullyApproved ? 'USDT already approved' : 'Add USDT token and pairs'}
              >
                {saving ? <LoadingSpinner size={14} /> : null}
                {saving ? ' Adding…' : usdtFullyApproved ? 'USDT approved' : 'Add USDT (token + pairs)'}
              </button>
            )}
            {onAddSolForDirectEntry && SOL_BSC && (
              <button
                type="button"
                className={`auto-trade-panel-button primary ${solFullyApproved ? 'is-approved' : ''}`}
                onClick={onAddSolForDirectEntry}
                disabled={saving || verifyingAllowlist || solFullyApproved}
                style={{ minWidth: 180 }}
                title={solFullyApproved ? 'SOL already approved' : 'Add SOL token and USDT→SOL pair (OTA analyzes SOL)'}
                aria-label={solFullyApproved ? 'SOL already approved' : 'Add SOL token and USDT→SOL pair'}
              >
                {saving ? <LoadingSpinner size={14} /> : null}
                {saving ? ' Adding…' : solFullyApproved ? 'SOL approved' : 'Add SOL (token + USDT→SOL)'}
              </button>
            )}
            {onAddAllPairsForTokens && (
              <button
                type="button"
                className="auto-trade-panel-button primary"
                onClick={onAddAllPairsForTokens}
                disabled={saving || verifyingAllowlist || !hasBaseTokens || pairsToAddForTokensCount === 0}
                style={{ minWidth: 200 }}
                title={!hasBaseTokens ? 'Add at least one baseline token below first' : pairsToAddForTokensCount === 0 ? 'All BNB→token pairs already in allowlist' : `Add ${pairsToAddForTokensCount} BNB→token pair(s)`}
              >
                {saving ? <LoadingSpinner size={14} /> : null}
                {saving ? ' Adding…' : pairsToAddForTokensCount === 0 ? 'Pairs complete' : `Add all pairs (${pairsToAddForTokensCount})`}
              </button>
            )}
            </div>
          </div>
        )}
        <h4 className="auto-trade-panel-section-title">
          <List size={18} />
          Token & Pair Allowlist
        </h4>
        <p className="auto-trade-panel-hint">
          Enable &quot;Only tokens/pairs from allowlist&quot; in Policy tab to enforce. Adding a token below also adds the required BNB→token pairs. Use &quot;Add all pairs for tokens&quot; if you already have tokens but pairs are missing.
        </p>
        <div className="auto-trade-panel-allowlist-explainer" role="status" style={{ marginTop: 8, marginBottom: 8, padding: '10px 12px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: 8, fontSize: 13 }}>
          <strong>The list does not disappear; it only depends on where you read it</strong>
          <ul style={{ margin: '6px 0 0 0', paddingLeft: 18 }}>
            <li><strong>Your approvals are on-chain</strong> in the contract. What you signed in MetaMask is there; you do not need to approve again.</li>
            <li><strong>The displayed list</strong> is read from <strong>contract (OTAPolicyManager)</strong> when the tab opens and also saved locally in the browser. Visible data is the on-chain saved data.</li>
            <li>To refresh: press <strong>Verify approvals</strong>. It reads on-chain approvals again, <strong>without a new signature</strong>.</li>
          </ul>
        </div>
        <div className="auto-trade-panel-allowlist-section">
          <h5 className="auto-trade-panel-allowlist-subtitle">Token Allowlist</h5>
          <div className="auto-trade-panel-allowlist-add">
            <div className="auto-trade-panel-preset-buttons">
              {ALLOWLIST_TOKEN_OPTIONS.map((p) => (
                <button
                  key={p.symbol + (p.address || '')}
                  type="button"
                  className="auto-trade-panel-preset-btn auto-trade-panel-preset-btn-with-logo"
                  onClick={() => onAddToken(p.address)}
                  disabled={saving || tokenAllowlist.some(t => addrMatches(t, p.address))}
                >
                  <TokenLogo symbol={p.symbol} size="xs" showBorder />
                  <span>+ {p.symbol}</span>
                </button>
              ))}
            </div>
            <div className="auto-trade-panel-allowlist-input-row">
              <input
                type="text"
                value={allowlistTokenInput}
                onChange={(e) => setAllowlistTokenInput(e.target.value)}
                className="auto-trade-panel-input"
                placeholder="Or paste token address 0x..."
              />
              <button
                type="button"
                className="auto-trade-panel-button primary"
                onClick={() => {
                  onAddToken(allowlistTokenInput);
                  setAllowlistTokenInput('');
                }}
                disabled={saving || !allowlistTokenInput.trim()}
              >
                {saving ? <LoadingSpinner size={14} /> : 'Add'}
              </button>
            </div>
          </div>
          {tokenAllowlist.length > 0 && (
            <ul className="auto-trade-panel-allowlist-list auto-trade-panel-allowlist-list--three-cols">
              {tokenAllowlist.map((addr, i) => (
                <li key={`token-${addr}-${i}`} className="auto-trade-panel-allowlist-item auto-trade-panel-allowlist-item-with-logo">
                  <span className="auto-trade-panel-allowlist-item-content">
                    <TokenLogo symbol={addressToSymbol(addr) || 'DEFAULT'} size="sm" showBorder className="auto-trade-panel-allowlist-item-logo" />
                    <span>{addressToSymbol(addr) || (addr.length >= 42 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr.slice(0, 12) + '…')}</span>
                  </span>
                  <button
                    type="button"
                    className="auto-trade-panel-allowlist-remove"
                    onClick={() => onRemoveToken(addr)}
                    disabled={saving}
                    aria-label={`Remove ${addressToSymbol(addr) || addr}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tokenAllowlist.length === 0 && (
            <p className="auto-trade-panel-allowlist-empty">No tokens yet. Add above.</p>
          )}
          {fetchTokenAllowedOnChain && walletAddress && (
            <div className="auto-trade-panel-allowlist-fetch-onchain" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="auto-trade-panel-button"
                onClick={handleFetchApprovedTokens}
                disabled={loadingFetchTokens}
                title="Read from contract which tokens are already approved on-chain"
              >
                {loadingFetchTokens ? <LoadingSpinner size={14} /> : <RefreshCw size={14} />}
                {loadingFetchTokens ? ' Loading...' : ' Show on-chain approvals'}
              </button>
              {fetchedTokensResult && (
                <div className="auto-trade-panel-allowlist-fetch-result" style={{ marginTop: 8, padding: 10, background: 'rgba(0,0,0,0.15)', borderRadius: 8, fontSize: 13 }}>
                  {fetchedTokensResult.error ? (
                    <p style={{ color: 'var(--dex-error, #ef4444)' }}>{fetchedTokensResult.error}</p>
                  ) : (
                    <>
                      <p><strong>Approved on-chain:</strong> {fetchedTokensResult.allowed.length === 0 ? 'none' : fetchedTokensResult.allowed.map(a => addressToSymbol(a) || (a.slice(0, 8) + '…')).join(', ')}</p>
                      {fetchedTokensResult.missingInList.length > 0 && (
                        <p style={{ color: 'var(--dex-warning, #f59e0b)' }}><strong>Missing from this list:</strong> {fetchedTokensResult.missingInList.map(a => addressToSymbol(a) || (a.slice(0, 8) + '…')).join(', ')}</p>
                      )}
                      {fetchedTokensResult.inListNotApproved.length > 0 && (
                        <p style={{ color: 'var(--dex-error, #ef4444)' }}><strong>In list but not approved on-chain:</strong> {fetchedTokensResult.inListNotApproved.map(a => addressToSymbol(a) || (a.slice(0, 8) + '…')).join(', ')}</p>
                      )}
                      {fetchedTokensResult.allowed.length > 0 && onLoadTokensFromChain && (
                        <p style={{ marginTop: 6 }}>
                          <button
                            type="button"
                            className="auto-trade-panel-button primary"
                            style={{ fontSize: 12 }}
                            onClick={() => onLoadTokensFromChain(fetchedTokensResult.allowed)}
                            title="Fill the list with tokens approved on-chain"
                          >
                            Load into list from on-chain
                          </button>
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="auto-trade-panel-allowlist-section">
          <h5 className="auto-trade-panel-allowlist-subtitle">Pair Allowlist</h5>
          <div className="auto-trade-panel-allowlist-add">
            <div className="auto-trade-panel-allowlist-pair-row">
              <AllowlistTokenSelect
                value={allowlistPairIn}
                onChange={setAllowlistPairIn}
                placeholder="Token In"
                options={ALLOWLIST_TOKEN_OPTIONS}
                id="allowlist-pair-in"
              />
              <ArrowRight size={16} className="auto-trade-panel-allowlist-arrow" aria-hidden />
              <AllowlistTokenSelect
                value={allowlistPairOut}
                onChange={setAllowlistPairOut}
                placeholder="Token Out"
                options={ALLOWLIST_TOKEN_OPTIONS}
                id="allowlist-pair-out"
              />
              <button
                type="button"
                className="auto-trade-panel-button primary"
                onClick={() => {
                  onAddPair(allowlistPairIn, allowlistPairOut);
                  setAllowlistPairIn('');
                  setAllowlistPairOut('');
                }}
                disabled={saving || !allowlistPairIn || !allowlistPairOut || (allowlistPairIn && allowlistPairOut && addrMatches(allowlistPairIn, allowlistPairOut))}
              >
                {saving ? <LoadingSpinner size={14} /> : 'Select & Add Pair'}
              </button>
              {allowlistStatusMessage && (
                <div
                  className="auto-trade-panel-allowlist-status-message"
                  role="alert"
                  style={{
                    marginTop: 10,
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    color: 'var(--dex-text, #e5e7eb)',
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: 1.4
                  }}
                >
                  {allowlistStatusMessage}
                </div>
              )}
            </div>
          </div>
          {pairAllowlist.length > 0 && (
            <ul className="auto-trade-panel-allowlist-list auto-trade-panel-allowlist-list--three-cols">
              {pairAllowlist.map((p, i) => (
                <li key={`${p.tokenIn}-${p.tokenOut}-${i}`} className="auto-trade-panel-allowlist-item auto-trade-panel-allowlist-item-with-logo">
                  <span className="auto-trade-panel-allowlist-pair-row-display">
                    <span className="auto-trade-panel-allowlist-pair-display">
                      <TokenLogo symbol={addressToSymbol(p.tokenIn) || 'DEFAULT'} size="sm" showBorder className="auto-trade-panel-allowlist-item-logo" />
                      <span>{addressToSymbol(p.tokenIn) || '?'}</span>
                    </span>
                    <ArrowRight size={12} className="auto-trade-panel-allowlist-pair-arrow" aria-hidden />
                    <span className="auto-trade-panel-allowlist-pair-display">
                      <TokenLogo symbol={addressToSymbol(p.tokenOut) || 'DEFAULT'} size="sm" showBorder className="auto-trade-panel-allowlist-item-logo" />
                      <span>{addressToSymbol(p.tokenOut) || '?'}</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    className="auto-trade-panel-allowlist-remove"
                    onClick={() => onRemovePair(p.tokenIn, p.tokenOut)}
                    disabled={saving}
                    aria-label={`Remove pair ${addressToSymbol(p.tokenIn)}/${addressToSymbol(p.tokenOut)}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          {pairAllowlist.length === 0 && (
            <p className="auto-trade-panel-allowlist-empty">No pairs yet. Add above.</p>
          )}
          {fetchPairAllowedOnChain && walletAddress && (
            <div className="auto-trade-panel-allowlist-fetch-onchain" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="auto-trade-panel-button"
                onClick={handleFetchApprovedPairs}
                disabled={loadingFetchPairs}
                title="Read from contract which pairs are already approved on-chain"
              >
                {loadingFetchPairs ? <LoadingSpinner size={14} /> : <RefreshCw size={14} />}
                {loadingFetchPairs ? ' Loading...' : ' Show on-chain approved pairs'}
              </button>
              {fetchedPairsResult && (
                <div className="auto-trade-panel-allowlist-fetch-result" style={{ marginTop: 8, padding: 10, background: 'rgba(0,0,0,0.15)', borderRadius: 8, fontSize: 13 }}>
                  {fetchedPairsResult.error ? (
                    <p style={{ color: 'var(--dex-error, #ef4444)' }}>{fetchedPairsResult.error}</p>
                  ) : (
                    <>
                      <p><strong>On-chain approved pairs:</strong> {fetchedPairsResult.allowed.length === 0 ? 'none' : fetchedPairsResult.allowed.length + ' pairs'}</p>
                      {fetchedPairsResult.missingInList.length > 0 && (
                        <p style={{ color: 'var(--dex-warning, #f59e0b)' }}><strong>Missing from list:</strong> {fetchedPairsResult.missingInList.length} pairs</p>
                      )}
                      {fetchedPairsResult.allowed.length > 0 && onLoadPairsFromChain && (
                        <p style={{ marginTop: 6 }}>
                          <button
                            type="button"
                            className="auto-trade-panel-button primary"
                            style={{ fontSize: 12 }}
                            onClick={() => onLoadPairsFromChain(fetchedPairsResult.allowed)}
                            title="Fill the list with pairs approved on-chain"
                          >
                            Load into list from on-chain
                          </button>
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {tokenAllowlist.length > 0 && (
            <div className="auto-trade-panel-allowlist-missing-ota">
              <h5 className="auto-trade-panel-allowlist-subtitle" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} aria-hidden />
                Missing pairs for OTA (Open + Close)
              </h5>
              <p className="auto-trade-panel-hint" style={{ marginBottom: 8 }}>
                OTA uses USDT, BNB, or ETH as quote depending on vault balance. For each token, you need quote→token (Open) and token→quote (Close). Click a pair to fill the form, then Select & Add Pair and sign.
              </p>
              {missingOtaPairs.length === 0 ? (
                <p className="auto-trade-panel-allowlist-already-approved" style={{ margin: 0 }}>
                  <CheckCircle size={14} aria-hidden />
                  <span>All recommended pairs are already in the allowlist.</span>
                </p>
              ) : (
                <>
                  <p className="auto-trade-panel-hint" style={{ fontWeight: 600, marginBottom: 6 }}>
                    Missing {missingOtaPairs.length} pairs:
                  </p>
                  <div className="auto-trade-panel-allowlist-missing-list">
                    {missingOtaPairs.map((p, i) => (
                      <button
                        key={`missing-${p.tokenIn}-${p.tokenOut}-${i}`}
                        type="button"
                        className="auto-trade-panel-preset-btn auto-trade-panel-allowlist-missing-btn"
                        onClick={() => handleSuggestPair(p.tokenIn, p.tokenOut)}
                        title="Fill Token In / Token Out and press Select & Add Pair"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(AutoTradeAllowlistTab);
