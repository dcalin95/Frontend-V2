/**
 * Buget timp History (crypto): analytics axios 120s; fallback browser strict limitat dacă e activat.
 */
import {
  VAULT_HISTORY_BROWSER_PATH_MAX_MS,
  VAULT_CHAIN_HISTORY_BACKEND_RACE_MS,
  getAlchemyAdjustedVaultScanParams,
} from '../useVaultTransactionHistory';

describe('useVaultTransactionHistory time budget', () => {
  it('fallback browser (dacă e activat) rămâne sub ~30s — nu ține UI captiv minute întregi', () => {
    expect(VAULT_HISTORY_BROWSER_PATH_MAX_MS).toBeLessThanOrEqual(30000);
  });

  it('constantă legacy aliniată la timeout axios vault-chain-history (120s)', () => {
    expect(VAULT_CHAIN_HISTORY_BACKEND_RACE_MS).toBeLessThanOrEqual(120000);
  });

  it('getAlchemyAdjustedVaultScanParams: fără Alchemy păstrează chunk 250 și 800 pași', () => {
    const p = getAlchemyAdjustedVaultScanParams(['https://bsc-dataseed1.binance.org']);
    expect(p.blockChunk).toBe(250);
    expect(p.chunksToScan).toBe(800);
  });

  it('getAlchemyAdjustedVaultScanParams: Alchemy Free → chunk 9 și scalează pașii (adâncime țintă cap la 20000 pași)', () => {
    const p = getAlchemyAdjustedVaultScanParams(['https://bnb-mainnet.g.alchemy.com/v2/x']);
    expect(p.blockChunk).toBe(9);
    expect(p.chunksToScan).toBe(20000);
  });
});
