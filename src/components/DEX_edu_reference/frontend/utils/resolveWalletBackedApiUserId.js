/**
 * Cheie user pentru API-uri OTA / analytics / vault: backend-ul așteaptă adresa wallet (vezi servicii + aiTradingRoutes).
 * Nu folosi user.id cont (MongoDB etc.) pentru aceste apeluri — întoarce gol DB / tokens [] / $0 fără eroare.
 *
 * @param {{ connectedWalletAddress?: string|null, fallbackUserId?: string|null, walletType?: string|null }} p
 * @returns {{ apiUserId: string|null, keySource: 'wallet'|'fallback_evm'|'fallback_sol'|'none' }}
 */
export function resolveWalletBackedApiUserId(p) {
  const { connectedWalletAddress, fallbackUserId, walletType } = p || {};
  const w = connectedWalletAddress != null ? String(connectedWalletAddress).trim() : '';
  if (w) {
    return { apiUserId: w, keySource: 'wallet' };
  }

  const f = fallbackUserId != null ? String(fallbackUserId).trim() : '';
  if (!f) {
    return { apiUserId: null, keySource: 'none' };
  }

  if (/^0x[a-fA-F0-9]{40}$/.test(f)) {
    return { apiUserId: f, keySource: 'fallback_evm' };
  }

  if (walletType === 'SOLANA' && /^[1-9A-HJ-NP-Za-km-z]{32,48}$/.test(f)) {
    return { apiUserId: f, keySource: 'fallback_sol' };
  }

  return { apiUserId: null, keySource: 'none' };
}
