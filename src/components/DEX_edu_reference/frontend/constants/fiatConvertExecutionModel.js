/**
 * SSOT UI — aliniat cu backend-server/scripts/lib/fiatConvertProcessOne.js
 * BNB nativ din relayer → wallet user BSC. Nu LeverageTradingV2, nu „contract de alimentat” pentru acest pas.
 */
export const FIAT_BNB_DESTINATION = 'user_bsc_wallet';

export const FIAT_CONVERT_WALLET_VS_VAULT = {
  /** BNB din conversie ajunge în wallet-ul userului, nu în UserVault automat. */
  bnbGoesToUserWallet: true,
  /** USDT BEP20 din relayer → același wallet user BSC (nu UserVault automat). */
  usdtGoesToUserWallet: true,
  /** Pentru trading din vault e nevoie de pas separat (deposit). */
  vaultRequiresSeparateDeposit: true,
};

export const FIAT_CONVERT_UI_COPY = {
  /** Lângă quote — model tehnic complet */
  headline:
    'BNB is sent to your connected BSC wallet (native transfer from the platform relayer). It does not go into UserVault automatically.',
  /** După convert reușit (BNB în wallet) — formulări explicite, fără „funds available” vag */
  walletArrivalLine: 'BNB sent to your connected BSC wallet.',
  notInVaultYetLine: 'Not deposited into UserVault yet.',
  depositCtaLabel: 'Deposit BNB to UserVault',
  /** Pas separat, on-chain — nu auto-deposit */
  completedBnbReminder:
    'This BNB is in your wallet only. To trade from vault margin, move it into UserVault with a separate deposit.',
  nextStep: 'To use funds in Trade with Leverage, deposit from your wallet into the vault.',
  depositCtaPath: '/dex-edu/leverage?tab=deposit',
  pendingNormal:
    'Processing — when this completes, native BNB is sent to your wallet (not into UserVault).',
  pendingRelayerInsufficientBnb:
    'Waiting to send — the platform wallet needs more BNB to complete your transfer. Your order stays pending; nothing is finished until it is marked completed.',
  failedOrder:
    'This conversion did not complete. If your fiat balance looks wrong, contact support with this order.',
  submitSuccessToast:
    'Order queued. When processing finishes, BNB goes to your connected wallet — not into UserVault until you deposit separately.',
  submitSuccessToastUsdt:
    'Order queued. When processing finishes, USDT (BEP20 on BSC) goes to your connected wallet — not into UserVault until you deposit separately.',
  walletUsdtArrivalLine: 'USDT (BEP20) sent to your connected BSC wallet.',
  pendingNormalUsdt:
    'Processing — when this completes, USDT (BEP20 on BSC) is sent to your wallet (not into UserVault).',
  pendingRelayerInsufficientUsdt:
    'Waiting to send — the platform wallet needs more USDT (BEP20) to complete your transfer. Your order stays pending; nothing is finished until it is marked completed.',
  pendingRelayerInsufficientGas:
    'Waiting to send — the platform wallet needs more BNB on BSC for gas to complete your USDT transfer. Your order stays pending.',
  /** Rând completed USDT — fonduri în wallet; vault e pas separat (deposit), fără auto-credit */
  completedUsdtWalletLine:
    'USDT (BEP20) was sent to your connected BSC wallet — not into UserVault. Deposit from wallet if you need margin in the vault.',
  /** @deprecated folosiți pendingRelayerInsufficientBnb */
  relayerQueued:
    'Waiting to send — the platform wallet needs more BNB to complete your transfer. Your order stays pending; nothing is finished until it is marked completed.',
};
