import {
  tickToPrice,
  priceToTick,
  assertMarketReferencePrices,
} from '../services/clobTradeService';
import {
  CLOB_SEI_CHART_SOURCE_DESCRIPTION,
  CLOB_SEI_BOOK_SOURCE_BADGE,
} from '../clobSeiLabels';
import { buildOLKey, OrderBookReadError } from '../services/orderBookService';
import { appendClobSeiActivity, loadClobSeiActivity } from '../services/clobSeiActivityStorage';

describe('clob-sei pricing', () => {
  it('tickToPrice and priceToTick are inverse within tick rounding', () => {
    const t = 100;
    const p = tickToPrice(t);
    expect(p).toBeGreaterThan(0);
    const back = priceToTick(p);
    expect(Math.abs(back - t)).toBeLessThanOrEqual(1);
  });

  it('assertMarketReferencePrices allows buy with positive ask', () => {
    expect(() => assertMarketReferencePrices('buy', 0.5, null)).not.toThrow();
  });

  it('assertMarketReferencePrices throws for market buy without ask', () => {
    expect(() => assertMarketReferencePrices('buy', null, 0.4)).toThrow(/MARKET_PRICE_UNAVAILABLE/);
    expect(() => assertMarketReferencePrices('buy', 0, 0.4)).toThrow(/MARKET_PRICE_UNAVAILABLE/);
  });

  it('assertMarketReferencePrices throws for market sell without bid', () => {
    expect(() => assertMarketReferencePrices('sell', 0.5, null)).toThrow(/MARKET_PRICE_UNAVAILABLE/);
  });
});

describe('clob-sei labels (chart vs book)', () => {
  it('chart copy states external proxy; book badge names Mangrove', () => {
    expect(CLOB_SEI_CHART_SOURCE_DESCRIPTION).toMatch(/TradingView|proxy|not the Mangrove/i);
    expect(CLOB_SEI_BOOK_SOURCE_BADGE).toMatch(/MgvReader|Sei EVM/i);
  });
});

describe('buildOLKey', () => {
  it('throws on invalid address', () => {
    expect(() => buildOLKey('0xdead', '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392', 1)).toThrow(/Invalid token/);
  });
});

describe('OrderBookReadError', () => {
  it('is identifiable', () => {
    const e = new OrderBookReadError('test', { asksDetail: 'x' });
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('OrderBookReadError');
    expect(e.asksDetail).toBe('x');
  });
});

describe('clobSeiActivityStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('append and load roundtrip', () => {
    const next = appendClobSeiActivity({
      txHash: '0xabc123',
      marketId: 'wSEI-USDC',
      side: 'buy',
      orderType: 'market',
      baseSymbol: 'wSEI',
      quoteSymbol: 'USDC',
    });
    expect(next.length).toBe(1);
    expect(loadClobSeiActivity()[0].txHash).toBe('0xabc123');
  });
});
