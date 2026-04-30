/**
 * 💰 Wallet Balance Service
 * 
 * Service pentru obținerea balanțelor reale ale tokenilor din blockchain:
 * - Native BNB balance
 * - ERC20 token balances (BTC, USDT, BITS, etc.)
 * - Folosește ethers.js cu provider din window.ethereum (MetaMask)
 * 
 * @module walletBalanceService
 */

import { ethers } from 'ethers';
import { TOKEN_ADDRESSES, getTokenAddress } from './tokenRegistry';
import { pickEvmProvider } from '../../utils/evmProviderResolver.js';

// ERC20 ABI minimal pentru balanceOf și decimals
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

function getProvider() {
  const ethereum = pickEvmProvider();
  if (ethereum) return new ethers.providers.Web3Provider(ethereum);
  console.warn('[walletBalanceService] EVM provider not available');
  return null;
}

// Session cache: when MetaMask RPC returns "Invalid RPC URL" for a chain, skip provider and use fallback directly on next calls (avoids error spam on poll).
const providerRpcInvalidForChainId = {};

function runBscFallback(walletAddress, chainId) {
  const bscRpcEndpoints = chainId === 56 ? [
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc.publicnode.com'
  ] : [
    'https://data-seed-prebsc-1-s1.binance.org:8545',
    'https://data-seed-prebsc-2-s1.binance.org:8545',
    'https://bsc-testnet.publicnode.com'
  ];
  return (async () => {
    for (const rpcUrl of bscRpcEndpoints) {
      try {
        const fallbackProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const balance = await fallbackProvider.getBalance(walletAddress);
        return ethers.utils.formatEther(balance);
      } catch (rpcErr) {
        continue;
      }
    }
    throw new Error('All BSC fallback RPCs failed');
  })();
}

/**
 * Get native BNB balance for a wallet address
 * @param {string} walletAddress - Wallet address
 * @param {number} [chainId] - Optional chainId (56 = BSC Mainnet, 97 = BSC Testnet). When 56 or 97, balance is read from BSC RPC so it's correct regardless of provider's current chain.
 * @returns {Promise<string>} Balance in BNB (formatted string)
 */
async function getNativeBalance(walletAddress, chainId) {
  try {
    const resolvedChainId = chainId ?? null;
    // Când se cere explicit BSC (56/97), citim mereu de pe RPC BSC ca soldul să fie corect indiferent de rețeaua curentă a provider-ului.
    if (resolvedChainId === 56 || resolvedChainId === 97) {
      return runBscFallback(walletAddress, resolvedChainId);
    }

    const ethereum = pickEvmProvider();
    if (!ethereum) {
      console.warn('[walletBalanceService] MetaMask not available');
      throw new Error('MetaMask not available');
    }

    if (providerRpcInvalidForChainId[56] || providerRpcInvalidForChainId[97]) {
      const c = resolvedChainId ?? 56;
      return runBscFallback(walletAddress, c);
    }

    try {
      const balanceHex = await ethereum.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest']
      });
      const balanceWei = ethers.BigNumber.from(balanceHex);
      return ethers.utils.formatEther(balanceWei);
    } catch (requestError) {
      const isInvalidRpcError = requestError?.message?.includes('Invalid RPC URL') || requestError?.code === -32603;
      if (isInvalidRpcError) {
        if (!providerRpcInvalidForChainId[56] && !providerRpcInvalidForChainId[97]) {
          console.warn('[walletBalanceService] MetaMask RPC invalid (e.g. custom/expired URL), using BSC fallback for this session.');
        }
        let fallbackChainId = resolvedChainId;
        if (fallbackChainId === null) {
          try {
            const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
            fallbackChainId = parseInt(chainIdHex, 16);
          } catch (_) {
            fallbackChainId = 56;
          }
        }
        if (fallbackChainId === 56 || fallbackChainId === 97) {
          providerRpcInvalidForChainId[fallbackChainId] = true;
          return runBscFallback(walletAddress, fallbackChainId);
        }
      }
      throw requestError;
    }
  } catch (error) {
    console.error('[walletBalanceService] Error getting native balance:', error);
    throw error;
  }
}

/**
 * Get ERC20 token balance for a wallet address
 * @param {string} walletAddress - Wallet address
 * @param {string} tokenAddress - ERC20 token contract address (or lowercase – normalizat la checksum)
 * @returns {Promise<{balance: string, decimals: number, symbol: string}>} Token balance info
 */
async function getTokenBalance(walletAddress, tokenAddress) {
  try {
    // Normalizează la checksum EIP-55 ca ethers să nu arunce "bad address checksum" (ex. WBNB pe BSC)
    const tokenAddr = (() => {
      try {
        const raw = String(tokenAddress || '').trim();
        if (!raw || !raw.startsWith('0x')) return tokenAddress;
        return ethers.utils.getAddress(raw.toLowerCase());
      } catch (_) {
        return tokenAddress;
      }
    })();
    const walletAddr = (() => {
      try {
        const raw = String(walletAddress || '').trim();
        if (!raw || !raw.startsWith('0x')) return walletAddress;
        return ethers.utils.getAddress(raw.toLowerCase());
      } catch (_) {
        return walletAddress;
      }
    })();

    // Use ONE selected provider (do not fan out to multiple injected providers).
    const ethereum = pickEvmProvider();
    if (!ethereum) {
      throw new Error('MetaMask not available');
    }

    // Create provider from ethereum
    const provider = new ethers.providers.Web3Provider(ethereum);
    const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
    
    const [balance, decimals, symbol] = await Promise.all([
      tokenContract.balanceOf(walletAddr),
      tokenContract.decimals(),
      tokenContract.symbol()
    ]);

    const formattedBalance = ethers.utils.formatUnits(balance, decimals);

    return {
      balance: formattedBalance,
      decimals,
      symbol
    };
  } catch (error) {
    console.error(`Error getting token balance for ${tokenAddress}:`, error);
    throw error;
  }
}

/**
 * Get all token balances for a wallet address
 * @param {string} walletAddress - Wallet address
 * @param {Array<string>} tokenSymbols - Array of token symbols to fetch (e.g., ['BTC', 'USDT', 'BITS'])
 * @returns {Promise<Object>} Object with token balances: { BTC: '0.5', USDT: '1000', ... }
 */
async function getAllTokenBalances(walletAddress, tokenSymbols = ['BTC', 'USDT', 'USDC', 'BITS', 'ETH', 'BUSD']) {
  try {
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const balances = {};
    const provider = getProvider();

    if (!provider) {
      // Return zero balances if MetaMask not available
      tokenSymbols.forEach(symbol => {
        balances[symbol] = '0';
      });
      return balances;
    }

    // Get native BNB balance
    if (tokenSymbols.includes('BNB')) {
      try {
        balances.BNB = await getNativeBalance(walletAddress);
      } catch (error) {
        console.warn('Error getting BNB balance:', error);
        balances.BNB = '0';
      }
    }

    // Get ERC20 token balances
    const tokenPromises = tokenSymbols
      .filter(symbol => symbol !== 'BNB' && TOKEN_ADDRESSES[symbol])
      .map(async (symbol) => {
        try {
          const tokenAddress = TOKEN_ADDRESSES[symbol];
          const tokenInfo = await getTokenBalance(walletAddress, tokenAddress);
          return { symbol, balance: tokenInfo.balance };
        } catch (error) {
          console.warn(`Error getting ${symbol} balance:`, error);
          return { symbol, balance: '0' };
        }
      });

    const tokenResults = await Promise.all(tokenPromises);
    tokenResults.forEach(({ symbol, balance }) => {
      balances[symbol] = balance;
    });

    // Set zero for tokens that failed or don't exist
    tokenSymbols.forEach(symbol => {
      if (!balances.hasOwnProperty(symbol)) {
        balances[symbol] = '0';
      }
    });

    return balances;
  } catch (error) {
    console.error('Error getting all token balances:', error);
    // Return zero balances on error
    const balances = {};
    tokenSymbols.forEach(symbol => {
      balances[symbol] = '0';
    });
    return balances;
  }
}

/**
 * Get balance for a specific token symbol
 * @param {string} walletAddress - Wallet address
 * @param {string} tokenSymbol - Token symbol (e.g., 'BTC', 'USDT', 'BITS')
 * @returns {Promise<string>} Token balance (formatted string)
 */
async function getBalanceForToken(walletAddress, tokenSymbol) {
  try {
    if (!walletAddress) {
      console.warn('[walletBalanceService] getBalanceForToken: No wallet address provided');
      return '0';
    }

    // Normalize token symbol (uppercase)
    const normalizedSymbol = tokenSymbol.toUpperCase();

    // Handle native BNB
    if (normalizedSymbol === 'BNB') {
      console.log('[walletBalanceService] getBalanceForToken: Fetching native BNB balance');
      return await getNativeBalance(walletAddress);
    }

    const tokenAddress = TOKEN_ADDRESSES[normalizedSymbol];
    if (!tokenAddress) {
      console.warn(`[walletBalanceService] Token address not found for ${normalizedSymbol}`);
      return '0';
    }

    console.log(`[walletBalanceService] getBalanceForToken: Fetching ERC20 balance for ${normalizedSymbol} at ${tokenAddress}`);
    const tokenInfo = await getTokenBalance(walletAddress, tokenAddress);
    console.log(`[walletBalanceService] getBalanceForToken: Balance for ${normalizedSymbol}:`, tokenInfo.balance);
    return tokenInfo.balance;
  } catch (error) {
    console.error(`[walletBalanceService] Error getting balance for ${tokenSymbol}:`, error);
    return '0';
  }
}

const walletBalanceService = {
  getNativeBalance,
  getTokenBalance,
  getAllTokenBalances,
  getBalanceForToken,
  TOKEN_ADDRESSES
};

export default walletBalanceService;
