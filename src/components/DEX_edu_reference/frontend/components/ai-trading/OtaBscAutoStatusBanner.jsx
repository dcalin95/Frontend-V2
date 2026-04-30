/**
 * BSC banner: OTAPolicyManager policy (getPolicy.enabled) = OTA executor switch on BSC.
 * - bsc variant: shows only when EVM wallet exists and Auto is off.
 * - crossChain variant: on SEI/STX/swap pages, warns if EVM + Auto is off; otherwise informational when no EVM wallet is connected.
 * Includes explicit read: contract, chain, getPolicy result, with no "changed by itself" ambiguity.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { AlertTriangle, Info } from 'lucide-react';
import { getPolicy, getOTAPolicyManagerAddress } from '../../services/otaPolicyService.jsx';
import { useWallet } from '../../hooks/useWallet';
import { pickEvmProvider } from '../../../utils/evmProviderResolver.js';

const DEFAULT_POLL_MS = 45000;

function shortAddr(a) {
  if (!a || typeof a !== 'string') return '—';
  const s = a.trim();
  if (s.length < 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function bscScanAddressUrl(chainId, address) {
  if (!address) return null;
  const host = Number(chainId) === 97 ? 'https://testnet.bscscan.com' : 'https://bscscan.com';
  return `${host}/address/${address}`;
}

/** @typedef {'bsc' | 'crossChain'} OtaBscBannerVariant */

/**
 * @typedef {{ autoOn: boolean | null, policy: object | null, meta: { walletAddress?: string, contractAddress?: string, chainId?: number | null } | null, readError: string | null }} PolicySnapshot
 */

export default function OtaBscAutoStatusBanner({ pollIntervalMs = DEFAULT_POLL_MS, variant = 'bsc' }) {
  const { walletAddress } = useWallet();
  /** @type {[PolicySnapshot | null, function]} */
  const [snap, setSnap] = useState(null);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setSnap(null);
      return;
    }
    const contractAddress = getOTAPolicyManagerAddress();
    let chainId = null;
    const raw = pickEvmProvider();
    if (raw) {
      try {
        const prov = new ethers.providers.Web3Provider(raw, 'any');
        const net = await prov.getNetwork();
        chainId = net.chainId;
      } catch (_) {
        chainId = null;
      }
    }
    try {
      const p = await getPolicy(walletAddress);
      setSnap({
        autoOn: Boolean(p?.enabled),
        policy: p,
        readError: null,
        meta: { walletAddress, contractAddress, chainId },
      });
    } catch (e) {
      setSnap({
        autoOn: null,
        policy: null,
        readError: e?.message || String(e),
        meta: { walletAddress, contractAddress, chainId },
      });
    }
  }, [walletAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!walletAddress || !pollIntervalMs) return undefined;
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [walletAddress, pollIntervalMs, refresh]);

  const warnOff = Boolean(walletAddress) && snap?.autoOn === false;
  const crossChain = variant === 'crossChain';

  if (crossChain) {
    if (warnOff) {
      return <WarningBanner snap={snap} />;
    }
    if (!walletAddress) {
      return <CrossChainInfoBanner />;
    }
    return null;
  }

  if (!walletAddress || snap?.autoOn !== false) return null;

  return <WarningBanner snap={snap} />;
}

/** @param {{ snap: PolicySnapshot | null }} props */
function WarningBanner({ snap }) {
  const policy = snap?.policy;
  const meta = snap?.meta;
  const chainId = meta?.chainId;
  const contractAddress = meta?.contractAddress;
  const wallet = meta?.walletAddress;
  const exp = policy?.expiresAt != null ? Number(policy.expiresAt) : 0;
  const expLabel =
    exp > 0 && exp < 1e12
      ? new Date(exp * 1000).toLocaleString()
      : exp > 0
        ? String(exp)
        : '—';

  const explorer = bscScanAddressUrl(chainId, contractAddress);

  return (
    <div
      role="status"
      className="ota-bsc-auto-status-banner ota-bsc-auto-status-banner--warn"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 10,
        margin: '0 0 12px 0',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid rgba(251, 191, 36, 0.45)',
        background: 'rgba(251, 191, 36, 0.08)',
        color: '#fef3c7',
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '10px 14px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, fontWeight: 800 }}>
          <AlertTriangle size={16} style={{ color: '#fbbf24', flexShrink: 0 }} aria-hidden />
          OTA Auto (BSC) is off
        </span>
        <span style={{ color: '#e7e5e4', fontWeight: 500, flex: '1 1 220px' }}>
          The executor uses <strong>only</strong> what the contract returns from <code style={{ fontSize: 11, color: '#fcd34d' }}>OTAPolicyManager.getPolicy(yourWallet)</code>.
          Current value: <code style={{ fontSize: 11, color: '#fcd34d' }}>enabled=false</code>. The app is not "turning itself off"; the value stays in the contract until a <code style={{ fontSize: 11 }}>setPolicy</code> transaction from your wallet.
        </span>
        <Link
          to="/dex-edu/ota?mode=auto&brainTab=governance"
          style={{
            flexShrink: 0,
            alignSelf: 'center',
            padding: '6px 12px',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 12,
            background: '#fbbf24',
            color: '#0a0a0a',
            textDecoration: 'none',
            border: 'none',
          }}
        >
          Open Governance (BSC)
        </Link>
      </div>

      <div
        style={{
          margin: 0,
          padding: '10px 10px',
          borderRadius: 6,
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#e7e5e4',
          fontSize: 11,
        }}
      >
        <strong style={{ color: '#fef3c7', display: 'block', marginBottom: 8 }}>
          What the site is reading now (no assumptions):
        </strong>
        <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'disc' }}>
          <li>
            <strong>Checked wallet:</strong> <code style={{ fontSize: 10 }}>{shortAddr(wallet)}</code>{' '}
            <span style={{ opacity: 0.85 }}>({wallet || '—'})</span>
          </li>
          <li>
            <strong>Network (wallet RPC):</strong> chainId={chainId != null ? String(chainId) : 'unread'}{' '}
            {chainId === 56 ? '(expected BSC Mainnet)' : chainId === 97 ? '(BSC Testnet)' : ''}
          </li>
          <li>
            <strong>OTAPolicyManager contract (read by UI):</strong>{' '}
            <code style={{ fontSize: 10 }}>{shortAddr(contractAddress)}</code>
            {explorer ? (
              <>
                {' '}
                <a href={explorer} target="_blank" rel="noopener noreferrer" style={{ color: '#93c5fd' }}>
                  BscScan
                </a>
              </>
            ) : null}
            <span style={{ display: 'block', opacity: 0.85, marginTop: 4 }}>
              If this address changed (redeploy / env <code>REACT_APP_OTA_POLICY_MANAGER_ADDRESS</code>), the{' '}
              <strong>new contract</strong> policy may be off by default even if the old contract was on.
            </span>
          </li>
          <li>
            <strong>getPolicy → enabled:</strong> {policy ? (policy.enabled ? 'true' : 'false') : '—'} ·{' '}
            <strong>expiresAt:</strong> {expLabel} · <strong>minDelaySeconds:</strong> {policy?.minDelaySeconds ?? '—'}
          </li>
        </ul>
        <p style={{ margin: '10px 0 0', opacity: 0.9 }}>
          The app <strong>cannot</strong> rewrite <code>enabled</code> without your signature. If you did not send{' '}
          <code>setPolicy(false)</code>, possible explanations are another device/extension, another selected wallet address, an old transaction,
          or a <strong>new contract/policy</strong> after deploy (default state).
        </p>
      </div>

      {snap?.readError ? (
        <p style={{ margin: 0, color: '#fca5a5', fontSize: 11 }} role="alert">
          Last read error: {snap.readError}
        </p>
      ) : null}
    </div>
  );
}

function CrossChainInfoBanner() {
  return (
    <div
      role="note"
      className="ota-bsc-auto-status-banner ota-bsc-auto-status-banner--info"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: '10px 14px',
        margin: '0 0 12px 0',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid rgba(96, 165, 250, 0.35)',
        background: 'rgba(59, 130, 246, 0.08)',
        color: '#dbeafe',
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, fontWeight: 700 }}>
        <Info size={16} style={{ color: '#60a5fa', flexShrink: 0 }} aria-hidden />
        OTA Auto on BSC (BNB)
      </span>
      <span style={{ color: '#e2e8f0', fontWeight: 500, flex: '1 1 220px' }}>
        Turn it on/off from the Auto page with an <strong>EVM wallet</strong> connected in the header (MetaMask etc.) and the OTAPolicyManager contract on BSC.
        This page is on another network and does not replace that switch.
      </span>
      <Link
        to="/dex-edu/ota?mode=auto"
        style={{
          flexShrink: 0,
          alignSelf: 'center',
          padding: '6px 12px',
          borderRadius: 6,
          fontWeight: 700,
          fontSize: 12,
          background: '#3b82f6',
          color: '#fff',
          textDecoration: 'none',
          border: 'none',
        }}
      >
        Open OTA Auto (BSC)
      </Link>
    </div>
  );
}
