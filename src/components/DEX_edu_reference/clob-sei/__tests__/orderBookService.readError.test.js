/**
 * RPC inaccesibil în test + mock Contract — fără eth_call real către Sei (retry pe mai multe URL).
 */
jest.mock('../config', () => {
  const actual = jest.requireActual('../config');
  return {
    ...actual,
    CLOB_SEI_RPC: 'https://127.0.0.1:9',
    CLOB_SEI_RPC_FALLBACKS: ['https://127.0.0.1:9'],
  };
});

jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    Contract: function MockContract() {
      return {
        isEmptyOB: () => Promise.resolve(false),
        offerList: () => Promise.reject(new Error('simulated RPC failure')),
      };
    },
  };
});

import { getOfferList, getOrderBook, OrderBookReadError } from '../services/orderBookService';

const WSEI = '0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7';
const USDC = '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392';

describe('orderBookService — errors are not masked as empty book', () => {
  it('getOfferList throws OrderBookReadError when offerList fails', async () => {
    await expect(
      getOfferList({
        outboundAddress: WSEI,
        inboundAddress: USDC,
        sideLabel: 'asks',
      }),
    ).rejects.toThrow(OrderBookReadError);
  });

  it('getOrderBook throws when a side fails', async () => {
    await expect(
      getOrderBook({
        baseAddress: WSEI,
        quoteAddress: USDC,
        depth: 5,
      }),
    ).rejects.toThrow(OrderBookReadError);
  });
});
