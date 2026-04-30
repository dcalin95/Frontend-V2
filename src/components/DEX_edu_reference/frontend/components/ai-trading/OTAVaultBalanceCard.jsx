/**
 * OTAVaultBalanceCard – afișează balanța UserVault (profit OTA Auto + depuneri).
 * Profitul din tranzacțiile OTA AI rămâne în UserVault – utilizatorul poate withdraw aici.
 * @see docs/OTA_AUTO_UX_START_STOP_PROFIT_2026-02-14.md
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, ArrowUpCircle } from 'lucide-react';
import { ethers } from 'ethers';
import { useVaultDeposit } from '../../hooks/useVaultDeposit';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import '../../styles/components/ota-vault-balance-card.css';
import '../../styles/components/personal-account-header-badge.css';

/** Tokeni relevanți pentru profit OTA: quote (USDT, BNB) + tokeni cumpărați de Auto (ex. MATIC după Buy USDT→MATIC) */
const PROFIT_TOKENS = ['USDT', 'BNB', 'MATIC'];

export default function OTAVaultBalanceCard() {
  const navigate = useNavigate();
  const {
    tokenOptions,
    balances,
    loading,
    error,
    refetch,
    isConnected,
    connectWallet,
    vaultReady,
    walletAddress,
  } = useVaultDeposit();
  const { executorBotAddress } = useOTAAccess();
  const isSameWalletAsBot = Boolean(
    walletAddress &&
    executorBotAddress &&
    String(walletAddress).toLowerCase() === String(executorBotAddress).toLowerCase()
  );

  const visibleTokens = tokenOptions.filter((t) => PROFIT_TOKENS.includes(t.symbol));

  const handleWithdraw = () => {
    navigate('/dex-edu/leverage?tab=withdraw');
  };

  if (!vaultReady || !tokenOptions.length) return null;

  if (!isConnected) {
    return (
      <section className="ota-vault-balance-card ota-vault-balance-card--connect" aria-label="Personal Account balance">
        <h3 className="ota-vault-balance-card-title">
          <Landmark size={18} className="personal-account-header-badge-icon" aria-hidden />
          Personal Account
        </h3>
        <p className="ota-vault-balance-card-desc">Your funds, only you can withdraw. Connect wallet to see balance.</p>
        <button type="button" onClick={connectWallet} className="ota-vault-balance-card-btn">
          Connect
        </button>
      </section>
    );
  }

  return (
    <section className="ota-vault-balance-card" aria-label="Personal Account balance and profit">
      <h3 className="ota-vault-balance-card-title">
        <Landmark size={18} className="personal-account-header-badge-icon" aria-hidden />
        Personal Account
      </h3>
      <p className="ota-vault-balance-card-desc">
        Profits stay in your Personal Account. Withdraw to wallet.
      </p>
      {isSameWalletAsBot && (
        <p className="ota-vault-balance-card-same-bot-note" role="note">
          Acest wallet este și wallet-ul botului OTA – fondurile și autorizația sunt pentru același cont.
        </p>
      )}
      {loading ? (
        <p className="ota-vault-balance-card-loading" aria-busy="true">Loading…</p>
      ) : error ? (
        <p className="ota-vault-balance-card-error">
          {error}
          <button type="button" onClick={refetch} className="ota-vault-balance-card-retry">Refresh</button>
        </p>
      ) : (
        <ul className="ota-vault-balance-card-list">
          {visibleTokens.map((t) => {
            const raw = balances[t.address] || '0';
            const formatted = ethers.utils.formatUnits(raw, t.decimals ?? 18);
            const num = parseFloat(formatted);
            const display = num >= 0.000001 ? (num < 0.01 ? '<0.01' : num.toFixed(4)) : '0';
            return (
              <li key={t.symbol} className="ota-vault-balance-card-item">
                <span className="ota-vault-balance-card-token">{t.symbol}</span>
                <span className="ota-vault-balance-card-amount">{display}</span>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={handleWithdraw}
        disabled={loading}
        className="ota-vault-balance-card-btn ota-vault-balance-card-btn--withdraw"
        title="Withdraw from Personal Account to wallet (Leverage → Withdraw tab)"
      >
        <ArrowUpCircle size={16} aria-hidden />
        Withdraw to wallet
      </button>
    </section>
  );
}
