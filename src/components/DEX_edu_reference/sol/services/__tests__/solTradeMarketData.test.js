import { buildQuoteDepthRows, fetchJupiterQuoteDepth, parseSolPair } from '../solTradeMarketData';
import { getQuote } from '../jupiterService';

jest.mock('../jupiterService', () => {
  const actual = jest.requireActual('../jupiterService');
  return {
    ...actual,
    getQuote: jest.fn(),
  };
});

describe('solTradeMarketData', () => {
  beforeEach(() => {
    getQuote.mockReset();
  });

  it('parses supported Solana pairs', () => {
    expect(parseSolPair('SOL/USDC')).toEqual({ base: 'SOL', quote: 'USDC' });
    expect(parseSolPair('SOL/UNKNOWN')).toBeNull();
  });

  it('builds bid and ask rows from Jupiter quote responses', () => {
    const depth = buildQuoteDepthRows({
      pair: 'SOL/USDC',
      sellQuotes: [
        {
          baseSize: 1,
          quote: {
            outAmount: '150000000',
            routePlan: [{ swapInfo: { label: 'Meteora' } }],
          },
        },
      ],
      buyQuotes: [
        {
          quoteSize: 150,
          quote: {
            outAmount: '1000000000',
            routePlan: [{ swapInfo: { label: 'Orca' } }],
          },
        },
      ],
    });

    expect(depth.source).toBe('Jupiter quote depth');
    expect(depth.bids).toHaveLength(1);
    expect(depth.asks).toHaveLength(1);
    expect(depth.bids[0]).toMatchObject({
      side: 'bid',
      price: 150,
      venue: 'Meteora',
    });
    expect(depth.asks[0]).toMatchObject({
      side: 'ask',
      price: 150,
      venue: 'Orca',
    });
    expect(depth.recent).toHaveLength(2);
  });

  it('keeps partial quote depth when one Jupiter request is rate limited', async () => {
    getQuote
      .mockResolvedValueOnce({
        outAmount: '15000000',
        routePlan: [{ swapInfo: { label: 'SolFi V2' } }],
      })
      .mockRejectedValueOnce(new Error('rate limited'))
      .mockResolvedValueOnce({
        outAmount: '150000000',
        routePlan: [{ swapInfo: { label: 'Meteora' } }],
      })
      .mockResolvedValueOnce({
        outAmount: '100000000',
        routePlan: [{ swapInfo: { label: 'Orca' } }],
      })
      .mockRejectedValueOnce(new Error('rate limited'))
      .mockResolvedValueOnce({
        outAmount: '1000000000',
        routePlan: [{ swapInfo: { label: 'Raydium' } }],
      });

    const depth = await fetchJupiterQuoteDepth({ pair: 'SOL/USDC' });

    expect(getQuote).toHaveBeenCalledTimes(6);
    expect(depth.bids).toHaveLength(2);
    expect(depth.asks).toHaveLength(2);
    expect(depth.source).toBe('Jupiter quote depth');
  });
});
