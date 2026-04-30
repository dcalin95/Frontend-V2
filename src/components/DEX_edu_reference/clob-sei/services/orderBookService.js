/**
 * orderBookService.js – citire order book Mangrove pe Sei (read-only).
 * Folosește MgvReader; nu necesită wallet. Pentru write (trade) vezi clobTradeService.js.
 *
 * Eșecurile RPC/ABI nu sunt mascate ca „piață goală”: se aruncă OrderBookReadError.
 */

import { ethers } from 'ethers';
import { MANGROVE_SEI, CLOB_SEI_RPC, CLOB_SEI_RPC_FALLBACKS, CLOB_SEI_CHAIN_ID } from '../config';
import { MgvReaderABI } from '../abi/MgvReaderABI';

const DEFAULT_DEPTH = 50;

/** Eroare explicită la citire order book (RPC, ABI, contract). */
export class OrderBookReadError extends Error {
  /**
   * @param {string} message
   * @param {{ asksDetail?: string, bidsDetail?: string, cause?: Error }} [meta]
   */
  constructor(message, meta = {}) {
    super(message);
    this.name = 'OrderBookReadError';
    this.asksDetail = meta.asksDetail;
    this.bidsDetail = meta.bidsDetail;
    this.cause = meta.cause;
  }
}

/** URL-uri Sei EVM: primul din env/config, apoi listă canonică (vezi `CLOB_SEI_RPC_FALLBACKS` în config). */
export function buildSeiEvmRpcUrlList() {
  const primary = (typeof CLOB_SEI_RPC === 'string' && CLOB_SEI_RPC.trim()) || CLOB_SEI_RPC_FALLBACKS[0];
  const out = [];
  for (const u of [primary, ...CLOB_SEI_RPC_FALLBACKS]) {
    if (u && !out.includes(u)) out.push(u);
  }
  return out;
}

let _cachedReadProvider = null;

/**
 * Provider read-only Sei EVM:
 * - `StaticJsonRpcProvider` + rețea fixă (1329) evită eșecul „could not detect network” (noNetwork) de la auto-detect.
 * - `FallbackProvider` cu quorum 1: încearcă noduri alternative la citire dacă primul nu răspunde.
 * @returns {ethers.providers.Provider}
 */
export function getClobSeiProvider() {
  if (_cachedReadProvider) return _cachedReadProvider;
  const chainId = Number(CLOB_SEI_CHAIN_ID) || 1329;
  const network = { chainId, name: 'sei-evm' };
  const urls = buildSeiEvmRpcUrlList();
  if (urls.length === 1) {
    _cachedReadProvider = new ethers.providers.StaticJsonRpcProvider(urls[0], network);
    return _cachedReadProvider;
  }
  const configs = urls.map((url, index) => ({
    provider: new ethers.providers.StaticJsonRpcProvider(url, network),
    priority: index,
    weight: 1,
    stallTimeout: 2000,
  }));
  _cachedReadProvider = new ethers.providers.FallbackProvider(configs, 1);
  return _cachedReadProvider;
}

/**
 * Construiește OLKey pentru Mangrove (outbound_tkn, inbound_tkn, tickSpacing).
 * @param {string} outboundAddress – token dat de maker
 * @param {string} inboundAddress – token cerut de maker
 * @param {number} tickSpacing
 * @returns {[string, string, ethers.BigNumber]}
 */
export function buildOLKey(outboundAddress, inboundAddress, tickSpacing = 1) {
  if (!ethers.utils.isAddress(outboundAddress) || !ethers.utils.isAddress(inboundAddress)) {
    throw new Error('Invalid token address for OLKey');
  }
  return [outboundAddress, inboundAddress, ethers.BigNumber.from(tickSpacing)];
}

/**
 * @param {object} params
 * @param {'asks'|'bids'} params.sideLabel – pentru mesaje de eroare
 */
export async function getOfferList({
  outboundAddress,
  inboundAddress,
  tickSpacing = 1,
  fromId = 0,
  maxOffers = DEFAULT_DEPTH,
  sideLabel = 'book',
}) {
  const olKey = buildOLKey(outboundAddress, inboundAddress, tickSpacing);
  const chainId = Number(CLOB_SEI_CHAIN_ID) || 1329;
  const network = { chainId, name: 'sei-evm' };
  const urls = buildSeiEvmRpcUrlList();

  let lastError = null;
  for (const url of urls) {
    try {
      const provider = new ethers.providers.StaticJsonRpcProvider(url, network);
      const reader = new ethers.Contract(MANGROVE_SEI.MgvReader, MgvReaderABI, provider);

      let emptyOb = false;
      try {
        emptyOb = await reader.isEmptyOB(olKey);
      } catch {
        emptyOb = false;
      }

      if (emptyOb) {
        return { nextId: '0', offerIds: [], offers: [] };
      }

      const [nextId, offerIds, offers, details] = await reader.offerList(olKey, fromId, maxOffers);
      const list = (offerIds || []).map((id, i) => ({
        offerId: id.toString(),
        gives: offers && offers[i] && offers[i].gives != null ? offers[i].gives.toString() : '0',
        tick: offers && offers[i] && offers[i].tick != null ? offers[i].tick.toString() : '0',
        gasreq: details && details[i] ? details[i].gasreq?.toString() : '0',
      }));
      return { nextId: nextId.toString(), offerIds: (offerIds || []).map((x) => x.toString()), offers: list };
    } catch (e) {
      lastError = e;
    }
  }

  const msg = lastError?.message || String(lastError);
  throw new OrderBookReadError(`MgvReader.offerList failed (${sideLabel}): ${msg}`, {
    asksDetail: sideLabel === 'asks' ? msg : undefined,
    bidsDetail: sideLabel === 'bids' ? msg : undefined,
    cause: lastError,
  });
}

/**
 * Citește bids și asks pentru o pereche base/quote (adrese token).
 * Asks = oferte care dau base, primesc quote. Bids = oferte care dau quote, primesc base.
 *
 * @returns {Promise<{ asks: Array, bids: Array }>}
 * @throws {OrderBookReadError}
 */
export async function getOrderBook({ baseAddress, quoteAddress, tickSpacing = 1, depth = DEFAULT_DEPTH }) {
  const asksP = getOfferList({
    outboundAddress: baseAddress,
    inboundAddress: quoteAddress,
    tickSpacing,
    fromId: 0,
    maxOffers: depth,
    sideLabel: 'asks',
  });
  const bidsP = getOfferList({
    outboundAddress: quoteAddress,
    inboundAddress: baseAddress,
    tickSpacing,
    fromId: 0,
    maxOffers: depth,
    sideLabel: 'bids',
  });

  const results = await Promise.allSettled([asksP, bidsP]);
  const asksRes = results[0];
  const bidsRes = results[1];

  const parts = [];
  if (asksRes.status === 'rejected') {
    const r = asksRes.reason;
    parts.push(r?.message || String(r));
  }
  if (bidsRes.status === 'rejected') {
    const r = bidsRes.reason;
    parts.push(r?.message || String(r));
  }

  if (parts.length > 0) {
    throw new OrderBookReadError(parts.join(' | '), {
      asksDetail: asksRes.status === 'rejected' ? asksRes.reason?.message : undefined,
      bidsDetail: bidsRes.status === 'rejected' ? bidsRes.reason?.message : undefined,
      cause: asksRes.status === 'rejected' ? asksRes.reason : bidsRes.reason,
    });
  }

  return {
    asks: asksRes.value.offers || [],
    bids: bidsRes.value.offers || [],
  };
}

export default {
  getClobSeiProvider,
  buildSeiEvmRpcUrlList,
  buildOLKey,
  getOfferList,
  getOrderBook,
  OrderBookReadError,
};
