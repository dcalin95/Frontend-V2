/**
 * Fetch swap details from blockchain by tx hash.
 * Decodes PancakeSwap/BitSwap Pair Swap events to get amountIn, amountOut.
 * Used when backend doesn't return amount/value for Trading History.
 */

import { ethers } from 'ethers';

const BSC_RPC = 'https://bsc-dataseed1.binance.org';

// PancakeSwap V2 Pair Swap event
const PAIR_SWAP_ABI = [
  'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
  'function token0() view returns (address)',
  'function token1() view returns (address)'
];

// Known token addresses for symbol lookup (BSC) – lowercase for addr()
const TOKEN_ADDRESSES = {
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': { symbol: 'BNB', decimals: 18 },
  '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', decimals: 18 },
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', decimals: 18 },
  '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82': { symbol: 'CAKE', decimals: 18 },
  '0xe9e7cea3dedca5984780bafc599bd69add087d56': { symbol: 'BUSD', decimals: 18 },
  '0x570a5d26f7765ecb712c0924e4de545b89fd43df': { symbol: 'SOL', decimals: 18 },
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8': { symbol: 'ETH', decimals: 18 },
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': { symbol: 'BTC', decimals: 18 },
  '0xba2ae424d960c26247dd6c32edc70b295c744c43': { symbol: 'DOGE', decimals: 8 },
  '0xcc42724c6683b7e57334c4e856f4c9965ed682bd': { symbol: 'MATIC', decimals: 18 },
  '0x2859e4544c4bb03966803b044a93563bd2d0dd4d': { symbol: 'SHIB', decimals: 18 }
};

const addr = (a) => (a || '').toLowerCase();

/**
 * Fetch swap amounts from tx receipt (Swap events from Pair contracts).
 * @param {string} txHash
 * @returns {Promise<{ amountIn: number, amountOut: number, tokenIn: string, tokenOut: string, price: number }|null>}
 */
export async function fetchSwapDetailsFromTx(txHash) {
  if (!txHash || typeof txHash !== 'string') return null;
  const hash = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
  try {
    const provider = new ethers.providers.JsonRpcProvider(BSC_RPC);
    const receipt = await provider.getTransactionReceipt(hash);
    if (!receipt || !receipt.logs?.length) return null;

    const swapIface = new ethers.utils.Interface(PAIR_SWAP_ABI);
    const swapTopic = swapIface.getEventTopic('Swap');

    /** Collect all Swap events; return the one with largest amountOut (final hop, e.g. CAKE→WBNB→USDT → USDT amount). */
    const candidates = [];
    for (const log of receipt.logs) {
      if (log.topics?.[0] !== swapTopic) continue;
      try {
        const parsed = swapIface.parseLog(log);
        const { amount0In, amount1In, amount0Out, amount1Out } = parsed.args;

        const pairContract = new ethers.Contract(log.address, PAIR_SWAP_ABI, provider);
        const [token0Addr, token1Addr] = await Promise.all([
          pairContract.token0(),
          pairContract.token1()
        ]);

        const t0 = TOKEN_ADDRESSES[addr(token0Addr)] || { symbol: '?', decimals: 18 };
        const t1 = TOKEN_ADDRESSES[addr(token1Addr)] || { symbol: '?', decimals: 18 };

        let amountIn, amountOut, tokenInSymbol, tokenOutSymbol;
        if (amount0In.gt(0) && amount1Out.gt(0)) {
          amountIn = parseFloat(ethers.utils.formatUnits(amount0In, t0.decimals));
          amountOut = parseFloat(ethers.utils.formatUnits(amount1Out, t1.decimals));
          tokenInSymbol = t0.symbol;
          tokenOutSymbol = t1.symbol;
        } else if (amount1In.gt(0) && amount0Out.gt(0)) {
          amountIn = parseFloat(ethers.utils.formatUnits(amount1In, t1.decimals));
          amountOut = parseFloat(ethers.utils.formatUnits(amount0Out, t0.decimals));
          tokenInSymbol = t1.symbol;
          tokenOutSymbol = t0.symbol;
        } else continue;

        if (amountOut <= 0) continue;

        candidates.push({
          amountIn,
          amountOut,
          tokenIn: tokenInSymbol,
          tokenOut: tokenOutSymbol,
          price: 0,
          value: 0
        });
      } catch (_) {
        continue;
      }
    }
    if (candidates.length === 0) return null;
    // Multi-hop: prefer the hop with largest amountOut (final output, e.g. USDT not WBNB)
    const best = candidates.reduce((a, b) => (a.amountOut >= b.amountOut ? a : b));
    return best;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[swapDetailsFromTx]', err?.message);
    }
    return null;
  }
}
