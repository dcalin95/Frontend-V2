/**
 * Reconciliere jurnal local vs tx-uri văzute on-chain — fără a suprascrie intrări mai noi locale cu citiri vechi.
 */

/**
 * @param {Array<{ txHash?: string }>} sessionEntries
 * @param {Iterable<string>} chainTxHashes – hash-uri normalizate lowercase
 */
export function tagSessionEntriesReconciled(sessionEntries, chainTxHashes) {
  const set =
    chainTxHashes instanceof Set
      ? chainTxHashes
      : new Set([...(chainTxHashes || [])].map((h) => (h || '').toLowerCase()));
  return (sessionEntries || []).map((e) => ({
    ...e,
    reconciledOnChain: Boolean(e.txHash && set.has((e.txHash || '').toLowerCase())),
  }));
}

/**
 * @param {Array<object>} items – evenimente cu marketId opțional
 * @param {string|null|undefined} selectedMarketId
 */
export function filterLifecycleByMarket(items, selectedMarketId) {
  if (!selectedMarketId) return [...(items || [])];
  return (items || []).filter((x) => x.marketId === selectedMarketId);
}
