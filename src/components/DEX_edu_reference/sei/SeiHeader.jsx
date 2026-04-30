/**
 * SeiHeader – Header pentru zona SEI Trade. Afișează wallet SEI (Connect / adresă + disconnect).
 * Nu folosește wagmi/ethers.
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Wallet, LogOut, Loader2 } from 'lucide-react';
import { useSeiWallet } from './context/SeiWalletContext';
import { useSeiPair } from './context/SeiPairContext';
import TokenSelectorSei from './TokenSelector.sei';
import WalletConnector from './WalletConnector.sei';

function useSeiUsdPrice() {
  const [price, setPrice] = useState(null);
  useEffect(() => {
    const fetch_ = async () => {
      // Încearcă OKX (fără geo-block), fallback CoinGecko
      try {
        const r = await fetch('https://www.okx.com/api/v5/market/ticker?instId=SEI-USDT');
        const d = await r.json();
        const p = parseFloat(d?.data?.[0]?.last);
        if (p > 0) { setPrice(p); return; }
      } catch (_) {}
      try {
        const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=sei-network&vs_currencies=usd');
        const d = await r.json();
        const p = d?.['sei-network']?.usd;
        if (p > 0) setPrice(p);
      } catch (_) {}
    };
    fetch_();
    const id = setInterval(fetch_, 60000);
    return () => clearInterval(id);
  }, []);
  return price;
}

/** Nume prietenos pentru rețea */
function networkLabel(chainId) {
  if (chainId === 'atlantic-2') return 'Testnet';
  if (chainId === 'pacific-1') return 'Mainnet';
  return chainId || 'SEI';
}

/** Culoare badge rețea */
function networkColor(chainId) {
  if (chainId === 'pacific-1') return { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' };
  if (chainId === 'atlantic-2') return { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' };
  return { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' };
}

export default function SeiHeader() {
  const { isConnected, address, shortAddress, balance, balanceLoading, chainId, disconnect } = useSeiWallet();
  const seiPrice = useSeiUsdPrice();
  const { pair, setPair } = useSeiPair();
  const location = useLocation();
  const base = '/dex-edu/sei';
  const isTradePage = location.pathname === `${base}/trade`;
  const isTestnet = chainId && chainId !== 'pacific-1';

  const walletBlock = (
    <div className={`chain-header-wallet${!isConnected ? ' chain-header-wallet--not-connected' : ''}`} style={{ marginRight: '32px' }} aria-label="SEI wallet status">
      {isConnected ? (
        <>
          <Wallet size={14} style={{ color: isTestnet ? '#fbbf24' : 'var(--ds-success)', flexShrink: 0 }} aria-hidden />
          <span style={{ fontWeight: 600, fontSize: '12px' }}>SEI</span>
          {/* Badge rețea wallet utilizator */}
          <span
            title={`Wallet conectat la: ${chainId}`}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '1px 7px',
              borderRadius: '20px',
              ...networkColor(chainId),
            }}
          >
            {networkLabel(chainId)}
          </span>
          <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace' }} title={address}>{shortAddress}</span>
          <button type="button" onClick={disconnect} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 6px', border: '1px solid var(--ds-border-color)', borderRadius: '6px', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '12px' }} aria-label="Disconnect SEI wallet">
            <LogOut size={12} />
          </button>
          {/* Connected wallet balance + USD equivalent */}
          <span
            title={balanceLoading ? 'Reading balance from RPC...' : seiPrice ? `1 SEI = $${seiPrice.toFixed(4)} USDT (Binance)` : 'SEI balance'}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: '#4ade80' }}>
              {balanceLoading ? (
                <>
                  <Loader2 size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} aria-hidden />
                  Loading…
                </>
              ) : balance !== null && balance !== undefined ? (
                `${Number(balance).toFixed(4)} SEI`
              ) : (
                <span title="Could not read balance (RPC). Reload the page.">— SEI</span>
              )}
            </span>
            {seiPrice && balance != null && (
              <span style={{ fontSize: '10px', fontFamily: 'ui-monospace, monospace', color: '#94a3b8' }}>
                ≈ ${(Number(balance) * seiPrice).toFixed(2)}
              </span>
            )}
          </span>
        </>
      ) : (
        <>
          <span style={{ fontWeight: 600, fontSize: '12px' }}>SEI</span>
          <span style={{ fontSize: '11px', color: 'var(--ds-text-secondary)' }}>not connected</span>
          <WalletConnector />
        </>
      )}
    </div>
  );

  return (
    <header role="banner" className="sei-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      borderBottom: '1px solid rgba(124, 58, 237, 0.25)',
      background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
      color: 'var(--ds-text-primary, #1e293b)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {walletBlock}
        <Activity size={24} aria-hidden="true" />
        <span style={{ fontWeight: 600 }}>SEI Trade</span>
        {isTradePage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} aria-label="Select pair">
            <TokenSelectorSei value={pair} onChange={(v) => setPair(v)} label="Pair" variant="pair" />
          </div>
        )}
        <nav style={{ display: 'flex', gap: '8px', marginLeft: isTradePage ? '8px' : '16px' }}>
          <Link
            to={`${base}/trade`}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: location.pathname === `${base}/trade` ? 'var(--ds-accent, #6366f1)' : 'inherit',
              fontWeight: location.pathname === `${base}/trade` ? 600 : 400,
            }}
          >
            Trade
          </Link>
          <Link
            to={`${base}/swap`}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: location.pathname === `${base}/swap` ? 'var(--ds-accent, #6366f1)' : 'inherit',
              fontWeight: location.pathname === `${base}/swap` ? 600 : 400,
            }}
          >
            Swap
          </Link>
          <Link
            to="/dex-edu/ota/sei"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: location.pathname === '/dex-edu/ota/sei' ? 'var(--ds-accent, #6366f1)' : 'inherit',
              fontWeight: location.pathname === '/dex-edu/ota/sei' ? 600 : 400,
            }}
          >
            OTA AI · Micro-Profit
          </Link>
        </nav>
      </div>
    </header>
  );
}
