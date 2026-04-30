/**
 * Open orders + istoric Mangrove core (getLogs) + MangroveOrder — reconciliere la poll/refresh.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { scanUserOpenOffers, fetchRecentMangroveOrderTakerEvents } from '../services/clobUserOrdersService';
import {
  fetchMangroveCoreUserActivity,
  annotateOpenOrdersRestingStatus,
  fetchLastOfferWriteGivesByOffer,
  keyOffer,
} from '../services/clobMangroveHistoryService';
import { executeRetractOffer, getEvmSigner } from '../services/clobTradeService';
import { getClobSeiProvider } from '../services/orderBookService';
import { CLOB_SEI_LOG_LOOKBACK_BLOCKS, CLOB_SEI_LOG_CHUNK_BLOCKS } from '../config';
import { tagSessionEntriesReconciled } from '../utils/clobSeiLifecycleMerge';

export function useClobSeiUserLifecycle(walletAddress, markets, options = {}) {
  const {
    pollMs = 20000,
    lookbackBlocks = CLOB_SEI_LOG_LOOKBACK_BLOCKS,
    chunkBlocks = CLOB_SEI_LOG_CHUNK_BLOCKS,
    enabled = true,
    sessionEntries = [],
  } = options;

  const [openOrders, setOpenOrders] = useState([]);
  const [mangroveCoreActivity, setMangroveCoreActivity] = useState([]);
  const [mangroveOrderEvents, setMangroveOrderEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState({});

  const refresh = useCallback(async () => {
    if (!enabled || !walletAddress || !markets?.length) {
      setOpenOrders([]);
      setMangroveCoreActivity([]);
      setMangroveOrderEvents([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const provider = getClobSeiProvider();
      const latest = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latest - lookbackBlocks);

      const oo = await scanUserOpenOffers(walletAddress, markets);
      const extraOfferKeys = new Set(oo.map((r) => keyOffer(r.olKeyHash, r.offerId)));

      const [lastWriteMap, coreAct, moEv] = await Promise.all([
        fetchLastOfferWriteGivesByOffer(provider, walletAddress, fromBlock, latest, chunkBlocks),
        fetchMangroveCoreUserActivity(walletAddress, markets, {
          lookbackBlocks,
          chunkBlocks,
          extraOfferKeys,
        }),
        fetchRecentMangroveOrderTakerEvents(walletAddress, markets, lookbackBlocks),
      ]);

      const annotated = annotateOpenOrdersRestingStatus(oo, lastWriteMap);
      setOpenOrders(annotated);
      setMangroveCoreActivity(coreAct);
      setMangroveOrderEvents(moEv);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [enabled, walletAddress, markets, lookbackBlocks, chunkBlocks]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !walletAddress) return undefined;
    const id = setInterval(() => {
      refresh();
    }, pollMs);
    return () => clearInterval(id);
  }, [enabled, walletAddress, pollMs, refresh]);

  const chainTxHashes = useMemo(() => {
    const s = new Set();
    for (const x of mangroveCoreActivity || []) {
      if (x.txHash) s.add(x.txHash.toLowerCase());
    }
    for (const x of mangroveOrderEvents || []) {
      if (x.txHash) s.add(x.txHash.toLowerCase());
    }
    return s;
  }, [mangroveCoreActivity, mangroveOrderEvents]);

  const sessionTagged = useMemo(
    () => tagSessionEntriesReconciled(sessionEntries, chainTxHashes),
    [sessionEntries, chainTxHashes],
  );

  const retractOpenOffer = useCallback(
    async (row) => {
      const market = markets.find((m) => m.id === row.marketId);
      if (!market) throw new Error('Unknown market');
      setCancelling((c) => ({ ...c, [row.offerId]: true }));
      try {
        const signer = await getEvmSigner();
        const r = await executeRetractOffer({
          market,
          side: row.side,
          offerId: row.offerId,
          signer,
          deprovision: true,
        });
        await refresh();
        return r;
      } finally {
        setCancelling((c) => ({ ...c, [row.offerId]: false }));
      }
    },
    [markets, refresh],
  );

  return {
    openOrders,
    mangroveCoreActivity,
    mangroveOrderEvents,
    sessionTagged,
    chainTxHashes,
    loading,
    error,
    refresh,
    retractOpenOffer,
    cancelling,
  };
}

export default useClobSeiUserLifecycle;
