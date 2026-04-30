/**
 * PersonalAccountHeaderBadge – badge compact în Header pentru contul personal (UserVault).
 * Afișează icon Landmark și suma totală în USD din Vault (toate tokenurile evaluate în USD).
 * Aliniat cu PersonalAccountPage: prețuri după ce soldurile s-au încărcat + refetch la visibility ca să nu rămână în urmă față de Total (USD) din pagină.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { ethers } from 'ethers';
import { useVaultDeposit } from '../../hooks/useVaultDeposit';
import tokenPriceService from '../../services/tokenPriceService';
import '../../styles/components/personal-account-header-badge.css';

export default function PersonalAccountHeaderBadge() {
  const {
    tokenOptions,
    balances,
    loading,
    isConnected,
    vaultReady,
    refetch,
  } = useVaultDeposit();

  const [prices, setPrices] = useState({});
  const lastVisibilityRefetchRef = useRef(0);
  const VISIBILITY_REFETCH_MS = 15000;

  const symbolsKey = tokenOptions?.length ? tokenOptions.map((t) => t.symbol).sort().join(',') : '';
  // Ca pe PersonalAccountPage: așteaptă să termine încărcarea soldurilor, apoi cere prețuri – altfel multe simboluri rămân la 0 și totalul e subevaluat ($101 vs $124).
  useEffect(() => {
    if (loading || !symbolsKey) return;
    const symbols = symbolsKey.split(',');
    tokenPriceService.getAllTokenPrices(symbols).then((p) => setPrices(p || {})).catch(() => {});
  }, [loading, symbolsKey]);

  // Refetch solduri când userul revine pe tab – același ritm ca pagina Account (după swap OTA headerul se aliniază fără refresh manual).
  useEffect(() => {
    if (!isConnected || !vaultReady || typeof refetch !== 'function') return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastVisibilityRefetchRef.current < VISIBILITY_REFETCH_MS) return;
      lastVisibilityRefetchRef.current = now;
      refetch();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isConnected, vaultReady, refetch]);

  // Când pagina Account apasă Refresh, eveniment custom – headerul refetch imediat (fără așteptat 15s).
  useEffect(() => {
    if (typeof refetch !== 'function') return;
    const onVaultRefetch = () => {
      lastVisibilityRefetchRef.current = 0;
      refetch();
      const symbols = symbolsKey ? symbolsKey.split(',') : [];
      if (symbols.length) tokenPriceService.getAllTokenPrices(symbols).then((p) => setPrices(p || {})).catch(() => {});
    };
    window.addEventListener('bits-vault-balances-refetch', onVaultRefetch);
    return () => window.removeEventListener('bits-vault-balances-refetch', onVaultRefetch);
  }, [refetch, symbolsKey]);

  const totalVaultUsd = useMemo(() => {
    if (!tokenOptions?.length) return null;
    let total = 0;
    for (const t of tokenOptions) {
      const raw = balances[t.address] ?? balances[String(t.address || '').toLowerCase()] ?? (t.symbol === 'BNB' ? balances['BNB'] : null) ?? (t.symbol === 'DOGE' ? (balances['DOGE'] ?? balances['0xba2ae424d960c26247dd6c32edc70b295c744c43'] ?? balances['0xba2ae424d960c26247dd6c32edc70b295c744c43'.toLowerCase()]) : null) ?? '0';
      if (!raw || raw === '0' || raw === '0x0') continue;
      let num;
      try {
        num = parseFloat(ethers.utils.formatUnits(raw, t.decimals ?? 18));
      } catch {
        continue;
      }
      if (!Number.isFinite(num) || num <= 0) continue;
      const isStable = (t.symbol || '').match(/USDT|USDC|BUSD|EURS|EURC/i);
      const isPresaleToken = (t.symbol || '').toUpperCase() === 'BITS';
      if (isPresaleToken) continue;
      const priceUsd = isStable ? 1 : (prices[t.symbol] ?? 0);
      total += num * priceUsd;
    }
    return total;
  }, [tokenOptions, balances, prices]);

  if (!vaultReady || !tokenOptions.length) return null;

  const displayTotal = totalVaultUsd != null && Number.isFinite(totalVaultUsd)
    ? (totalVaultUsd >= 0.01 ? `$${totalVaultUsd.toFixed(2)}` : totalVaultUsd > 0 ? '<$0.01' : '$0.00')
    : null;

  return (
    <Link
      to="/dex-edu/account"
      className="personal-account-header-badge"
      aria-label="Personal Account - total USD from Vault"
      title="Personal Account - total USD from Vault (only you can withdraw)"
    >
      <Landmark size={18} className="personal-account-header-badge-icon" aria-hidden />
      {isConnected && (
        <span className="personal-account-header-badge-balance" aria-live="polite">
          {loading ? '…' : displayTotal ?? '…'}
        </span>
      )}
    </Link>
  );
}
