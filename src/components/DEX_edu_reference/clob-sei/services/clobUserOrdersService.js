/**
 * Surse de adevăr:
 * - Open orders: scan offerList + MangroveOrder.ownerOf(olKeyHash, offerId) === user (on-chain).
 * - Evenimente recente: eth_getLogs pe MangroveOrder (MangroveOrderStart, taker indexat).
 * Nu backend propriu; RPC Sei EVM. Istoricul complet poate necesita subgraph dacă lookback e depășit.
 */

import { ethers } from 'ethers';
import { getOfferList, getClobSeiProvider } from './orderBookService';
import { MANGROVE_SEI } from '../config';
import { computeOlKeyHash } from '../utils/olKeyHash';
import { MangroveOrderFullABI } from '../abi/MangroveOrderFullABI';
import { olKeyHashToMarketId } from './clobMangroveHistoryService';

const PAGE = 50;
const MAX_PAGES = 25;

/**
 * @param {string} userAddress
 * @param {Array<object>} markets – CLOB_SEI_MARKETS entries
 * @returns {Promise<Array<object>>}
 */
export async function scanUserOpenOffers(userAddress, markets) {
  if (!userAddress || !markets?.length) return [];
  const provider = getClobSeiProvider();
  const mo = new ethers.Contract(MANGROVE_SEI.MangroveOrder, MangroveOrderFullABI, provider);
  const u = userAddress.toLowerCase();
  const out = [];

  for (const m of markets) {
    const {
      id: marketId,
      outboundAddress,
      inboundAddress,
      tickSpacing,
      baseDecimals,
      quoteDecimals,
      base: baseSymbol,
      quote: quoteSymbol,
    } = m;

    const legs = [
      {
        label: 'limit-buy-resting',
        outbound: outboundAddress,
        inbound: inboundAddress,
        uiSide: 'buy',
        sideLabel: 'asks',
      },
      {
        label: 'limit-sell-resting',
        outbound: inboundAddress,
        inbound: outboundAddress,
        uiSide: 'sell',
        sideLabel: 'bids',
      },
    ];

    for (const leg of legs) {
      const { outbound, inbound, uiSide, sideLabel } = leg;
      const h = computeOlKeyHash(outbound, inbound, tickSpacing);
      let fromId = 0;

      for (let page = 0; page < MAX_PAGES; page++) {
        let res;
        try {
          res = await getOfferList({
            outboundAddress: outbound,
            inboundAddress: inbound,
            tickSpacing,
            fromId,
            maxOffers: PAGE,
            sideLabel,
          });
        } catch {
          break;
        }

        for (const o of res.offers || []) {
          const oid = o.offerId;
          let owner;
          try {
            owner = await mo.ownerOf(h, oid);
          } catch {
            continue;
          }
          if (owner && ethers.utils.getAddress(owner) === ethers.utils.getAddress(userAddress)) {
            out.push({
              key: `${marketId}-${uiSide}-${oid}`,
              marketId,
              side: uiSide,
              offerId: String(oid),
              tick: String(o.tick),
              givesRaw: o.gives,
              olKeyHash: h,
              olKeyTuple: [outbound, inbound, tickSpacing],
              baseSymbol,
              quoteSymbol,
              baseDecimals,
              quoteDecimals,
              source: 'chain_scan',
            });
          }
        }

        const next = ethers.BigNumber.from(res.nextId || 0);
        if (!res.offers || res.offers.length === 0 || next.isZero()) break;
        fromId = next.toNumber();
      }
    }
  }

  return out;
}

/**
 * Evenimente MangroveOrder unde user este taker (market/limit ca inițiator).
 * @param {string} userAddress
 * @param {Array<object>|undefined} markets – pentru mapare olKeyHash → marketId
 * @param {number} lookbackBlocks
 */
export async function fetchRecentMangroveOrderTakerEvents(userAddress, markets, lookbackBlocks = 50_000) {
  const provider = getClobSeiProvider();
  const latest = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latest - lookbackBlocks);
  const iface = new ethers.utils.Interface(MangroveOrderFullABI);
  let topic0;
  try {
    topic0 = iface.getEventTopic('MangroveOrderStart');
  } catch {
    return [];
  }
  const takerPad = ethers.utils.hexZeroPad(userAddress, 32);
  let logs = [];
  try {
    logs = await provider.getLogs({
      address: MANGROVE_SEI.MangroveOrder,
      fromBlock,
      toBlock: latest,
      topics: [topic0, null, takerPad],
    });
  } catch {
    return [];
  }

  return logs
    .map((log) => {
      try {
        const ev = iface.parseLog(log);
        return {
          kind: 'MangroveOrderStart',
          olKeyHash: ev.args.olKeyHash,
          marketId: markets?.length ? olKeyHashToMarketId(ev.args.olKeyHash, markets) : null,
          taker: ev.args.taker,
          tick: ev.args.tick?.toString?.() ?? String(ev.args.tick),
          orderType: ev.args.orderType,
          fillVolume: ev.args.fillVolume?.toString?.() ?? String(ev.args.fillVolume),
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
          source: 'eth_getLogs',
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function mergeByKey(chainRows, localRows, keyFn) {
  const map = new Map();
  for (const r of chainRows || []) {
    map.set(keyFn(r), { ...r, reconciled: true });
  }
  for (const r of localRows || []) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, { ...r, reconciled: false });
  }
  return [...map.values()];
}
