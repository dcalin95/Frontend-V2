/**
 * ABI Mangrove core — topic0 trebuie să coincidă cu mangrove-core (HasMgvEvents).
 * Reconciliere market / session (unit).
 */
import { ethers } from 'ethers';
import { MangroveCoreEventsABI } from '../abi/MangroveCoreEventsABI';
import { annotateOpenOrdersRestingStatus } from '../services/clobMangroveHistoryService';
import { filterLifecycleByMarket, tagSessionEntriesReconciled } from '../utils/clobSeiLifecycleMerge';

describe('MangroveCoreEventsABI topic0 (vs canonical mangrove-core signatures)', () => {
  const iface = new ethers.utils.Interface(MangroveCoreEventsABI);

  it('OfferSuccess(bytes32,address,uint256,uint256,uint256)', () => {
    expect(iface.getEventTopic('OfferSuccess')).toBe(
      ethers.utils.id('OfferSuccess(bytes32,address,uint256,uint256,uint256)'),
    );
  });

  it('OrderStart(bytes32,address,int256,uint256,bool)', () => {
    expect(iface.getEventTopic('OrderStart')).toBe(
      ethers.utils.id('OrderStart(bytes32,address,int256,uint256,bool)'),
    );
  });

  it('OfferWrite(bytes32,address,int256,uint256,uint256,uint256,uint256)', () => {
    expect(iface.getEventTopic('OfferWrite')).toBe(
      ethers.utils.id('OfferWrite(bytes32,address,int256,uint256,uint256,uint256,uint256)'),
    );
  });

  it('OfferRetract(bytes32,address,uint256,bool)', () => {
    expect(iface.getEventTopic('OfferRetract')).toBe(
      ethers.utils.id('OfferRetract(bytes32,address,uint256,bool)'),
    );
  });
});

describe('annotateOpenOrdersRestingStatus (partial fill)', () => {
  it('marks partial_fill when remaining gives < last OfferWrite gives', () => {
    const olKeyHash = '0x' + '11'.repeat(32);
    const openOrders = [
      {
        key: '1',
        olKeyHash,
        offerId: '7',
        givesRaw: ethers.utils.parseEther('0.5'),
        side: 'buy',
        baseDecimals: 18,
        quoteDecimals: 6,
      },
    ];
    const lastWriteMap = new Map();
    lastWriteMap.set(`${olKeyHash.toLowerCase()}:7`, {
      gives: ethers.utils.parseEther('1'),
    });
    const out = annotateOpenOrdersRestingStatus(openOrders, lastWriteMap);
    expect(out[0].restingStatus).toBe('partial_fill');
  });

  it('open when gives equals last write', () => {
    const olKeyHash = '0x' + '22'.repeat(32);
    const full = ethers.utils.parseEther('1');
    const openOrders = [
      {
        key: '1',
        olKeyHash,
        offerId: '1',
        givesRaw: full,
        side: 'buy',
        baseDecimals: 18,
        quoteDecimals: 6,
      },
    ];
    const lastWriteMap = new Map([[`${olKeyHash.toLowerCase()}:1`, { gives: full }]]);
    const out = annotateOpenOrdersRestingStatus(openOrders, lastWriteMap);
    expect(out[0].restingStatus).toBe('open');
  });
});

describe('clobSeiLifecycleMerge', () => {
  it('filterLifecycleByMarket isolates rows (strict marketId)', () => {
    const rows = [{ marketId: 'a', x: 1 }, { marketId: 'b', x: 2 }, { x: 3 }];
    expect(filterLifecycleByMarket(rows, 'a')).toHaveLength(1);
    expect(filterLifecycleByMarket(rows, 'b').map((r) => r.marketId)).toEqual(['b']);
    expect(filterLifecycleByMarket(rows, 'a').map((r) => r.x)).toEqual([1]);
  });

  it('tagSessionEntriesReconciled marks tx seen on chain', () => {
    const tagged = tagSessionEntriesReconciled(
      [{ txHash: '0xABC', at: 1 }],
      new Set(['0xabc']),
    );
    expect(tagged[0].reconciledOnChain).toBe(true);
  });
});
