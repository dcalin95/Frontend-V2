/**
 * Istoric Mangrove core (Mangrove.sol) — getLogs + parse conform ABI HasMgvEvents / MgvLib.sol.
 * Combinație: evenimente pe Mangrove + MangroveOrder (apel separat) pentru acoperire maker/taker.
 */

import { ethers } from 'ethers';
import { MANGROVE_SEI } from '../config';
import { computeOlKeyHash } from '../utils/olKeyHash';
import { MangroveCoreEventsABI } from '../abi/MangroveCoreEventsABI';
import { getClobSeiProvider } from './orderBookService';

/** Perechi OLKey pentru fiecare piață (aceleași picioare ca scanUserOpenOffers). */
export function enumerateMarketOlKeyHashes(markets) {
  const rows = [];
  if (!markets?.length) return rows;
  for (const m of markets) {
    const ts = m.tickSpacing ?? 1;
    const { id: marketId, outboundAddress, inboundAddress } = m;
    rows.push({
      marketId,
      olKeyHash: computeOlKeyHash(outboundAddress, inboundAddress, ts),
      uiSide: 'buy',
    });
    rows.push({
      marketId,
      olKeyHash: computeOlKeyHash(inboundAddress, outboundAddress, ts),
      uiSide: 'sell',
    });
  }
  return rows;
}

export function olKeyHashToMarketId(olKeyHash, markets) {
  const h = (olKeyHash || '').toLowerCase();
  for (const row of enumerateMarketOlKeyHashes(markets)) {
    if (row.olKeyHash.toLowerCase() === h) return row.marketId;
  }
  return null;
}

function makeIface() {
  return new ethers.utils.Interface(MangroveCoreEventsABI);
}

/**
 * @param {ethers.providers.Provider} provider
 * @param {object} filter – address + topics (fără from/to)
 * @param {number} fromBlock
 * @param {number} toBlock
 * @param {number} chunkBlocks
 */
export async function getLogsChunked(provider, filter, fromBlock, toBlock, chunkBlocks) {
  const out = [];
  let chunk = Math.max(256, chunkBlocks);
  let start = fromBlock;
  while (start <= toBlock) {
    const end = Math.min(toBlock, start + chunk - 1);
    try {
      const part = await provider.getLogs({
        ...filter,
        fromBlock: start,
        toBlock: end,
      });
      out.push(...part);
      start = end + 1;
      chunk = Math.max(256, chunkBlocks);
    } catch {
      if (chunk <= 512) {
        const endAttempt = Math.min(toBlock, start + chunk - 1);
        throw new Error(
          `getLogs failed for Mangrove core (blocks ${start}-${endAttempt}). RPC may limit range — try lowering CLOB_SEI_LOG_CHUNK_BLOCKS.`,
        );
      }
      chunk = Math.floor(chunk / 2);
    }
  }
  return out;
}

export function keyOffer(olKeyHash, id) {
  return `${(olKeyHash || '').toLowerCase()}:${String(id)}`;
}

/**
 * Ultimul `gives` din OfferWrite per (olKeyHash, id) în fereastra de loguri (pentru comparație cu gives curent = partial).
 * @param {ethers.providers.Provider} provider
 * @param {string} userAddress
 * @param {number} fromBlock
 * @param {number} toBlock
 * @param {number} chunkBlocks
 */
export async function fetchLastOfferWriteGivesByOffer(provider, userAddress, fromBlock, toBlock, chunkBlocks) {
  const iface = makeIface();
  const makerPad = ethers.utils.hexZeroPad(userAddress, 32);
  const topicOfferWrite = iface.getEventTopic('OfferWrite');
  const logs = await getLogsChunked(
    provider,
    {
      address: MANGROVE_SEI.Mangrove,
      topics: [topicOfferWrite, null, makerPad],
    },
    fromBlock,
    toBlock,
    chunkBlocks,
  );
  const map = new Map();
  const sorted = logs.sort((a, b) => a.blockNumber - b.blockNumber || (a.logIndex || 0) - (b.logIndex || 0));
  for (const log of sorted) {
    try {
      const ev = iface.parseLog(log);
      if (ev.name !== 'OfferWrite') continue;
      const k = keyOffer(ev.args.olKeyHash, ev.args.id);
      map.set(k, {
        gives: ev.args.gives,
        tick: ev.args.tick,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
      });
    } catch {
      /* skip */
    }
  }
  return map;
}

/**
 * @returns {Promise<Array<object>>} evenimente normalizate, sortate desc după block
 */
export async function fetchMangroveCoreUserActivity(userAddress, markets, options = {}) {
  const {
    lookbackBlocks = 50_000,
    chunkBlocks = 2500,
    extraOfferKeys = null,
  } = options;

  if (!userAddress || !markets?.length) return [];

  const provider = getClobSeiProvider();
  const latest = await provider.getBlockNumber();
  const toBlock = latest;
  const fromBlock = Math.max(0, latest - lookbackBlocks);
  const iface = makeIface();
  const userLc = userAddress.toLowerCase();
  const makerPad = ethers.utils.hexZeroPad(userAddress, 32);
  const takerPad = ethers.utils.hexZeroPad(userAddress, 32);

  const tOrderStart = iface.getEventTopic('OrderStart');
  const tOrderComplete = iface.getEventTopic('OrderComplete');
  const tOfferWrite = iface.getEventTopic('OfferWrite');
  const tOfferRetract = iface.getEventTopic('OfferRetract');
  const tOfferSuccess = iface.getEventTopic('OfferSuccess');
  const tOfferSuccessPh = iface.getEventTopic('OfferSuccessWithPosthookData');
  const tOfferFail = iface.getEventTopic('OfferFail');
  const tOfferFailPh = iface.getEventTopic('OfferFailWithPosthookData');

  const addr = MANGROVE_SEI.Mangrove;
  const mk = enumerateMarketOlKeyHashes(markets);

  const batch = await Promise.all([
    getLogsChunked(provider, { address: addr, topics: [tOrderStart, null, takerPad] }, fromBlock, toBlock, chunkBlocks),
    getLogsChunked(provider, { address: addr, topics: [tOrderComplete, null, takerPad] }, fromBlock, toBlock, chunkBlocks),
    getLogsChunked(provider, { address: addr, topics: [tOfferWrite, null, makerPad] }, fromBlock, toBlock, chunkBlocks),
    getLogsChunked(provider, { address: addr, topics: [tOfferRetract, null, makerPad] }, fromBlock, toBlock, chunkBlocks),
    ...mk.map((row) =>
      getLogsChunked(provider, { address: addr, topics: [tOfferSuccess, row.olKeyHash] }, fromBlock, toBlock, chunkBlocks),
    ),
    ...mk.map((row) =>
      getLogsChunked(provider, { address: addr, topics: [tOfferSuccessPh, row.olKeyHash] }, fromBlock, toBlock, chunkBlocks),
    ),
    ...mk.map((row) =>
      getLogsChunked(provider, { address: addr, topics: [tOfferFail, row.olKeyHash] }, fromBlock, toBlock, chunkBlocks),
    ),
    ...mk.map((row) =>
      getLogsChunked(provider, { address: addr, topics: [tOfferFailPh, row.olKeyHash] }, fromBlock, toBlock, chunkBlocks),
    ),
  ]);

  const logsOrderStart = batch[0];
  const logsOrderComplete = batch[1];
  const logsOfferWrite = batch[2];
  const logsOfferRetract = batch[3];
  const n = mk.length;
  const base = 4;
  const logsOfferSuccFlat = batch.slice(base, base + n).flat();
  const logsOfferSuccPhFlat = batch.slice(base + n, base + 2 * n).flat();
  const logsOfferFailFlat = batch.slice(base + 2 * n, base + 3 * n).flat();
  const logsOfferFailPhFlat = batch.slice(base + 3 * n, base + 4 * n).flat();

  const offerKeysFromWrites = new Set();
  for (const log of logsOfferWrite) {
    try {
      const ev = iface.parseLog(log);
      offerKeysFromWrites.add(keyOffer(ev.args.olKeyHash, ev.args.id));
    } catch {
      /* */
    }
  }
  if (extraOfferKeys && typeof extraOfferKeys.forEach === 'function') {
    extraOfferKeys.forEach((k) => offerKeysFromWrites.add(k));
  }

  const dedupeLogs = (arr) => {
    const out = [];
    const seen = new Set();
    for (const log of arr) {
      const lid = `${log.transactionHash}-${log.logIndex}`;
      if (seen.has(lid)) continue;
      seen.add(lid);
      out.push(log);
    }
    return out;
  };

  const offerSuccessFiltered = [];
  for (const log of dedupeLogs([...logsOfferSuccFlat, ...logsOfferSuccPhFlat])) {
    try {
      const ev = iface.parseLog(log);
      if (ev.name !== 'OfferSuccess' && ev.name !== 'OfferSuccessWithPosthookData') continue;
      const oid = ev.args.id;
      const olh = ev.args.olKeyHash;
      const taker = ev.args.taker?.toLowerCase?.() || '';
      const k = keyOffer(olh, oid);
      const isUserTaker = taker === userLc;
      const isUserMakerOffer = offerKeysFromWrites.has(k);
      if (isUserTaker || isUserMakerOffer) {
        offerSuccessFiltered.push({
          log,
          ev,
          role: isUserTaker ? 'taker' : 'maker',
        });
      }
    } catch {
      /* */
    }
  }

  const offerFailFiltered = [];
  for (const log of dedupeLogs([...logsOfferFailFlat, ...logsOfferFailPhFlat])) {
    try {
      const ev = iface.parseLog(log);
      if (ev.name !== 'OfferFail' && ev.name !== 'OfferFailWithPosthookData') continue;
      const oid = ev.args.id;
      const olh = ev.args.olKeyHash;
      const taker = ev.args.taker?.toLowerCase?.() || '';
      const k = keyOffer(olh, oid);
      const isUserTaker = taker === userLc;
      const isUserMakerOffer = offerKeysFromWrites.has(k);
      if (isUserTaker || isUserMakerOffer) {
        offerFailFiltered.push({
          log,
          ev,
          role: isUserTaker ? 'taker' : 'maker',
        });
      }
    } catch {
      /* */
    }
  }

  const normalized = [];

  const pushNorm = (base) => {
    normalized.push({
      source: 'Mangrove',
      chain: 'sei_evm',
      ...base,
    });
  };

  for (const log of logsOrderStart) {
    try {
      const ev = iface.parseLog(log);
      pushNorm({
        kind: 'order_start',
        olKeyHash: ev.args.olKeyHash,
        marketId: olKeyHashToMarketId(ev.args.olKeyHash, markets),
        role: 'taker',
        taker: ev.args.taker,
        maxTick: ev.args.maxTick?.toString?.(),
        fillVolume: ev.args.fillVolume?.toString?.(),
        fillWants: ev.args.fillWants,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
      });
    } catch {
      /* */
    }
  }

  for (const log of logsOrderComplete) {
    try {
      const ev = iface.parseLog(log);
      pushNorm({
        kind: 'order_complete',
        olKeyHash: ev.args.olKeyHash,
        marketId: olKeyHashToMarketId(ev.args.olKeyHash, markets),
        role: 'taker',
        taker: ev.args.taker,
        fee: ev.args.fee?.toString?.(),
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
      });
    } catch {
      /* */
    }
  }

  for (const log of logsOfferWrite) {
    try {
      const ev = iface.parseLog(log);
      pushNorm({
        kind: 'offer_write',
        olKeyHash: ev.args.olKeyHash,
        marketId: olKeyHashToMarketId(ev.args.olKeyHash, markets),
        role: 'maker',
        maker: ev.args.maker,
        offerId: ev.args.id?.toString?.(),
        tick: ev.args.tick?.toString?.(),
        gives: ev.args.gives?.toString?.(),
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
      });
    } catch {
      /* */
    }
  }

  for (const log of logsOfferRetract) {
    try {
      const ev = iface.parseLog(log);
      pushNorm({
        kind: 'offer_retract',
        olKeyHash: ev.args.olKeyHash,
        marketId: olKeyHashToMarketId(ev.args.olKeyHash, markets),
        role: 'maker',
        maker: ev.args.maker,
        offerId: ev.args.id?.toString?.(),
        deprovision: ev.args.deprovision,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
        logIndex: log.logIndex,
      });
    } catch {
      /* */
    }
  }

  for (const row of offerSuccessFiltered) {
    const { log, ev, role } = row;
    const name = ev.name;
    pushNorm({
      kind: name === 'OfferSuccessWithPosthookData' ? 'offer_success_posthook' : 'offer_success',
      olKeyHash: ev.args.olKeyHash,
      marketId: olKeyHashToMarketId(ev.args.olKeyHash, markets),
      role,
      offerId: ev.args.id?.toString?.(),
      taker: ev.args.taker,
      takerWants: ev.args.takerWants?.toString?.(),
      takerGives: ev.args.takerGives?.toString?.(),
      blockNumber: log.blockNumber,
      txHash: log.transactionHash,
      logIndex: log.logIndex,
    });
  }

  for (const row of offerFailFiltered) {
    const { log, ev, role } = row;
    const name = ev.name;
    pushNorm({
      kind: name === 'OfferFailWithPosthookData' ? 'offer_fail_posthook' : 'offer_fail',
      olKeyHash: ev.args.olKeyHash,
      marketId: olKeyHashToMarketId(ev.args.olKeyHash, markets),
      role,
      offerId: ev.args.id?.toString?.(),
      taker: ev.args.taker,
      takerWants: ev.args.takerWants?.toString?.(),
      takerGives: ev.args.takerGives?.toString?.(),
      penalty: ev.args.penalty?.toString?.(),
      mgvData: ev.args.mgvData,
      blockNumber: log.blockNumber,
      txHash: log.transactionHash,
      logIndex: log.logIndex,
    });
  }

  normalized.sort((a, b) => b.blockNumber - a.blockNumber || (b.logIndex || 0) - (a.logIndex || 0));

  return normalized;
}

/**
 * Stare resting: compară gives curent (scan) cu ultimul OfferWrite pentru aceeași ofertă.
 * @param {Array<object>} openOrders – rânduri din scanUserOpenOffers
 * @param {Map<string, {gives: ethers.BigNumber}>} lastWriteMap – din fetchLastOfferWriteGivesByOffer
 */
export function annotateOpenOrdersRestingStatus(openOrders, lastWriteMap) {
  return (openOrders || []).map((row) => {
    const k = keyOffer(row.olKeyHash, row.offerId);
    const last = lastWriteMap?.get?.(k);
    let restingStatus = 'open';
    if (last?.gives != null && row.givesRaw != null) {
      const cur = ethers.BigNumber.from(row.givesRaw);
      const initial = ethers.BigNumber.from(last.gives);
      if (cur.lt(initial) && cur.gt(0)) restingStatus = 'partial_fill';
      else if (cur.isZero()) restingStatus = 'filled'; // ar trebui absent din book — defensive
    }
    return { ...row, restingStatus };
  });
}
