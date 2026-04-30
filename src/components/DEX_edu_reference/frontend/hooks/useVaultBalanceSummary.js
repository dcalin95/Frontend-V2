/**
 * useVaultBalanceSummary: current balance, totals, and USD value per token from UserVault.
 * Uses only eth_call (getUserTokens + getVault): zero eth_getLogs, zero -32005.
 */
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_MAP, getActiveNetwork } from '../../../../contract/contractMap';
import { TOKEN_REGISTRY } from '../services/tokenRegistry';
import tokenPriceService from '../services/tokenPriceService';

const BSC_CHAIN = Object.freeze({ chainId: 56, name: 'bsc' });

const BSC_RPC_FREE = [
  'https://bsc-dataseed1.binance.org',
  'https://bsc-dataseed2.binance.org',
  'https://bsc-dataseed3.binance.org',
];

function createReadProvider() {
  let url = (getActiveNetwork?.()?.rpcUrl || '').trim().replace(/\/$/, '');
  if (!url || /1rpc\.io|llamarpc\.com/i.test(url)) url = BSC_RPC_FREE[0];
  return new ethers.providers.StaticJsonRpcProvider(url, BSC_CHAIN);
}

/** Build an address→token index from TOKEN_REGISTRY for quick lookup. */
function buildAddressIndex() {
  const idx = {};
  for (const [sym, info] of Object.entries(TOKEN_REGISTRY || {})) {
    if (info?.address) {
      idx[String(info.address).toLowerCase()] = { ...info, symbol: sym };
    }
  }
  // Native BNB (address zero)
  idx[ethers.constants.AddressZero.toLowerCase()] = TOKEN_REGISTRY.BNB
    ? { ...TOKEN_REGISTRY.BNB, symbol: 'BNB' }
    : { symbol: 'BNB', name: 'Binance Coin', decimals: 18, logoUrl: null };
  return idx;
}

const ADDRESS_INDEX = buildAddressIndex();

/** Common addresses that may appear but are not in TOKEN_REGISTRY. */
const KNOWN_EXTRAS = {
  '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', name: 'Tether USD', decimals: 18 },
  '0xe9e7cea3dedca5984780bafc599bd69add087d56': { symbol: 'BUSD', name: 'Binance USD', decimals: 18 },
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', name: 'USD Coin', decimals: 18 },
};

function getTokenMeta(addr) {
  const a = String(addr || '').toLowerCase();
  if (a === ethers.constants.AddressZero.toLowerCase()) {
    return { symbol: 'BNB', name: 'Binance Coin', decimals: 18, logoUrl: getCoinGeckoLogo('BNB') };
  }
  const fromRegistry = ADDRESS_INDEX[a];
  if (fromRegistry) {
    return {
      symbol: fromRegistry.symbol,
      name: fromRegistry.name ?? fromRegistry.symbol,
      decimals: fromRegistry.decimals ?? 18,
      logoUrl: fromRegistry.logoUrl || getCoinGeckoLogo(fromRegistry.symbol),
    };
  }
  const extra = KNOWN_EXTRAS[a];
  if (extra) {
    return { ...extra, logoUrl: getCoinGeckoLogo(extra.symbol) };
  }
  return {
    symbol: `${a.slice(0, 6)}…`,
    name: `Token ${a.slice(0, 8)}…`,
    decimals: 18,
    logoUrl: null,
  };
}

/** CoinGecko CDN logo URL for known symbols. */
const COINGECKO_LOGO_IDS = {
  BNB:   'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  WBNB:  'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  BTC:   'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:   'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDT:  'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  USDC:  'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  BUSD:  'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',
  SOL:   'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  CAKE:  'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo_%281%29.png',
  DOGE:  'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  SHIB:  'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  XRP:   'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA:   'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  LINK:  'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  STX:   'https://assets.coingecko.com/coins/images/2069/small/Stacks_logo_full.png',
  BITS:  null,
};

function getCoinGeckoLogo(symbol) {
  return COINGECKO_LOGO_IDS[String(symbol || '').toUpperCase()] ?? null;
}

function isStable(symbol) {
  const s = String(symbol || '').toUpperCase();
  return s === 'USDT' || s === 'USDC' || s === 'BUSD' || s === 'DAI' || s === 'EURS' || s === 'EURC';
}

function formatAmt(bn, decimals) {
  try {
    const n = parseFloat(ethers.utils.formatUnits(bn, decimals));
    if (!Number.isFinite(n)) return '0';
    return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
  } catch { return '0'; }
}

function formatUsd(usd) {
  if (!Number.isFinite(usd) || usd === 0) return null;
  return usd.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

/**
 * @param {string|null} walletAddress
 * @returns {{ rows: Array, loading: boolean, error: string|null, refetch: function }}
 */
export function useVaultBalanceSummary(walletAddress) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    if (!walletAddress || !CONTRACT_MAP?.USER_VAULT?.address) return;
    setLoading(true);
    setError(null);
    try {
      const userAddr = ethers.utils.getAddress(String(walletAddress).trim());
      const uv = CONTRACT_MAP.USER_VAULT;
      const provider = createReadProvider();
      const contract = new ethers.Contract(uv.address, uv.abi, provider);

      let tokenList = [];
      try {
        tokenList = await contract.getUserTokens(userAddr);
      } catch {
        setError('Could not read the token list from the contract.');
        setRows([]);
        return;
      }

      if (!tokenList || tokenList.length === 0) {
        setRows([]);
        return;
      }

      // Read all balances in one getUserBalances call, avoiding corrupted getVault data.
      let balanceAddrs = [];
      let balanceAmounts = [];
      try {
        [balanceAddrs, balanceAmounts] = await contract.getUserBalances(userAddr);
      } catch {
        setError('Could not read balances from the contract.');
        setRows([]);
        return;
      }

      const rawRows = [];
      for (let i = 0; i < balanceAddrs.length; i++) {
        const tokenAddr = balanceAddrs[i];
        const balance = ethers.BigNumber.from(balanceAmounts[i] ?? 0);
        const meta = getTokenMeta(tokenAddr);
        const balanceNum = parseFloat(ethers.utils.formatUnits(balance, meta.decimals)) || 0;
        if (balanceNum <= 0) continue;

        rawRows.push({
          token: tokenAddr,
          symbol: meta.symbol,
          name: meta.name,
          decimals: meta.decimals,
          logoUrl: meta.logoUrl,
          balance,
          balanceFmt: formatAmt(balance, meta.decimals),
          balanceNum,
          balanceUsd: null,
        });
      }

      // Batch prices for all symbols.
      const symbols = [...new Set(rawRows.map(r => r.symbol))];
      let prices = {};
      try {
        prices = await tokenPriceService.getAllTokenPrices(symbols);
      } catch { prices = {}; }

      const result = rawRows.map(r => {
        const price = isStable(r.symbol)
          ? 1
          : (prices[r.symbol] != null && Number.isFinite(prices[r.symbol]) ? prices[r.symbol] : 0);
        const balanceUsd = r.balanceNum * price;
        return {
          ...r,
          price,
          balanceUsd,
          balanceUsdFmt: formatUsd(balanceUsd),
        };
      });

      // Sort descending by USD value.
      result.sort((a, b) => (b.balanceUsd ?? 0) - (a.balanceUsd ?? 0));
      setRows(result);
    } catch (e) {
      setError(String(e?.message || 'Error reading the vault.'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  return { rows, loading, error, refetch: fetchSummary };
}
