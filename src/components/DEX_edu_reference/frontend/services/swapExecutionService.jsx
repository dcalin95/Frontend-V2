/**
 * 💱 Swap Execution Service
 * 
 * Service pentru execuția swap-urilor reale:
 * - Verificare allowance
 * - Approve token
 * - Construire și trimitere transaction
 * - Tracking tx status
 * 
 * @module swapExecutionService
 */

import { ethers } from 'ethers';
import { getApiBaseUrl, API_ENDPOINTS } from '../../config/apiEndpoints.js';
import { getUseBitSwapWrapper, getBitSwapWrapperAddress } from '../../config/runtimeConfig.js';
import { otaApiRequest } from '../utils/otaApiClient';
import { TOKEN_ADDRESSES, getTokenAddress } from './tokenRegistry';
import { executeSwapThroughWrapper } from './wrapperExecutionService';
import { getSwapRevertUserMessage } from './swapErrors';
import { getInjectedProvider } from './injectedProvider';
import { rpcHealthCheck, isInvalidRpcUrlError } from './rpcHealthCheck';
import { forcePickEvmInjectedProvider } from '../../utils/walletFilter.js';

// ERC20 ABI pentru allowance și approve
const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)'
];

// PancakeSwap Router V2 address (BSC Mainnet)
const PANCAKESWAP_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';

// BitSwapDEXWrapper: runtime-config > env > default ON (colectare 0.1%)
// BitSwapDEXWrapper ABI (minimal - doar funcțiile necesare)
const BITSWAP_WRAPPER_ABI = [
  'function swapTokensForTokens(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin, uint256 deadline) external returns (uint[] memory amounts)',
  'function swapETHForTokens(address tokenOut, uint256 amountOutMin, uint256 deadline) external payable returns (uint[] memory amounts)',
  'function swapTokensForETH(address tokenIn, uint256 amountIn, uint256 amountOutMin, uint256 deadline) external returns (uint[] memory amounts)',
  'function isConfigured() external view returns (bool)',
  'function treasury() external view returns (address)',
  'function calculateFee(uint256 amount) external pure returns (uint256 fee)'
];

// WBNB address (for swaps involving native BNB)
const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

// Recommended BSC RPC – used to force-add/switch network before send (avoids "no tx hash" with custom RPC)
const BSC_RPC_RECOMMENDED = 'https://bsc-dataseed1.binance.org';
const BSC_CHAIN_ID_HEX = '0x38';

/**
 * Ensure wallet is on BSC Mainnet with recommended RPC (add/update + switch).
 * Call before sendTransaction to reduce -32603 "no transaction hash" when MetaMask had custom RPC.
 */
async function ensureBscNetworkWithDefaultRpc(ethereum) {
  if (!ethereum?.request) return;
  try {
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: BSC_CHAIN_ID_HEX,
        chainName: 'BSC Mainnet',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: [BSC_RPC_RECOMMENDED],
        blockExplorerUrls: ['https://bscscan.com']
      }]
    });
  } catch (e) {
    if (e.code === 4001) return; // user rejected
    console.warn('[SWAP_DEBUG] wallet_addEthereumChain', e?.message);
  }
  try {
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_CHAIN_ID_HEX }] });
  } catch (e) {
    if (e.code === 4001) return;
    console.warn('[SWAP_DEBUG] wallet_switchEthereumChain', e?.message);
  }
}

/**
 * Call once when user lands on DEX/Trade with wallet connected.
 * Adds BSC with our RPC if they don't have it, so MetaMask works without manual settings.
 */
async function ensureBscForDex() {
  const ethereum = getInjectedProvider();
  if (!ethereum) return;
  await ensureBscNetworkWithDefaultRpc(ethereum);
}

function getProvider() {
  const ethereum = getInjectedProvider();
  if (ethereum) return new ethers.providers.Web3Provider(ethereum, 'any');
  return null;
}

/** For repair flow: get raw ethereum provider (EIP-1193). */
function getEthereumProvider() {
  return getInjectedProvider();
}

/**
 * Get signer from provider. Prefer current account from eth_accounts to avoid "unknown account #0" with some wallets (e.g. MetaMask+Trust).
 */
async function getSignerAsync() {
  const ethereum = getInjectedProvider();
  if (!ethereum) throw new Error('Wallet not connected');
  const provider = new ethers.providers.Web3Provider(ethereum, 'any');
  const accounts = await ethereum.request({ method: 'eth_accounts' }).catch(() => []);
  if (accounts && accounts.length > 0) {
    return provider.getSigner(accounts[0]);
  }
  return provider.getSigner();
}

/** Sync getSigner for callers that don't need account binding (e.g. read-only). */
function getSigner() {
  const provider = getProvider();
  if (!provider) throw new Error('Wallet not connected');
  return provider.getSigner();
}

/**
 * Check if BitSwapDEXWrapper is available and configured
 * @returns {Promise<boolean>} True if wrapper is available and configured
 */
async function isWrapperAvailable() {
  if (!getUseBitSwapWrapper() || !getBitSwapWrapperAddress()) {
    return false;
  }

  try {
    const provider = getProvider();
    if (!provider) {
      return false;
    }

    const wrapperContract = new ethers.Contract(
      getBitSwapWrapperAddress(),
      BITSWAP_WRAPPER_ABI,
      provider
    );

    // Check if contract is configured
    const isConfigured = await wrapperContract.isConfigured();
    return isConfigured;
  } catch (error) {
    console.warn('[SwapExecution] Wrapper not available:', error.message);
    return false;
  }
}

/**
 * Get the spender address (wrapper or PancakeSwap Router)
 * @returns {Promise<string>} Spender address
 */
async function getSpenderAddress() {
  const wrapperAvailable = await isWrapperAvailable();
  return wrapperAvailable ? getBitSwapWrapperAddress() : PANCAKESWAP_ROUTER;
}

/**
 * Check allowance for ERC20 token
 * @param {string} tokenSymbol - Token symbol (BNB, USDT, etc.)
 * @param {string} ownerAddress - Wallet address
 * @returns {Promise<string>} Allowance amount (formatted string)
 */
async function checkAllowance(tokenSymbol, ownerAddress) {
  try {
    // BNB is native, no allowance needed
    if (tokenSymbol === 'BNB') {
      return ethers.constants.MaxUint256.toString();
    }

    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol.toUpperCase()];
    if (!tokenAddress) {
      throw new Error(`Unknown token: ${tokenSymbol}`);
    }

    const provider = getProvider();
    if (!provider) {
      throw new Error('Wallet not connected');
    }

    // Get spender address (wrapper or PancakeSwap)
    const spenderAddress = await getSpenderAddress();

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);

    return allowance.toString();
  } catch (error) {
    console.error(`[SwapExecution] Error checking allowance for ${tokenSymbol}:`, error);
    throw error;
  }
}

/**
 * Approve token for swap
 * @param {string} tokenSymbol - Token symbol
 * @param {string} amount - Amount to approve (as string, will be converted to wei)
 * @returns {Promise<{hash: string, receipt: object}>} Transaction hash and receipt
 */
async function approveToken(tokenSymbol, amount) {
  try {
    if (tokenSymbol === 'BNB') {
      throw new Error('BNB is native token, no approval needed');
    }

    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol.toUpperCase()];
    if (!tokenAddress) {
      throw new Error(`Unknown token: ${tokenSymbol}`);
    }

    const signer = getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

    // Get decimals
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.utils.parseUnits(amount, decimals);

    // Approve max amount for simplicity (user can revoke later if needed)
    const maxApproval = ethers.constants.MaxUint256;

    // Get spender address (wrapper or PancakeSwap)
    const spenderAddress = await getSpenderAddress();
    const usingWrapper = spenderAddress === getBitSwapWrapperAddress();

    console.log('[SWAP] Approving token:', { 
      tokenSymbol, 
      tokenAddress, 
      amount, 
      spender: spenderAddress,
      usingWrapper,
      maxApproval: maxApproval.toString() 
    });

    const tx = await tokenContract.approve(spenderAddress, maxApproval);
    const receipt = await tx.wait();

    console.log('[SWAP] Approve confirmed:', { hash: tx.hash, receipt, usingWrapper });

    return {
      hash: tx.hash,
      receipt
    };
  } catch (error) {
    console.error(`[SwapExecution] Error approving ${tokenSymbol}:`, error);
    if (error.code === 4001) {
      throw new Error('Approval rejected by user');
    }
    throw error;
  }
}

/**
 * Get swap transaction data from backend
 * @param {string} tokenIn - Token in symbol
 * @param {string} tokenOut - Token out symbol
 * @param {string} amountIn - Amount in
 * @param {string} recipient - Recipient address
 * @param {number} slippage - Slippage percentage
 * @param {number} deadline - Deadline in minutes
 * @returns {Promise<Object>} Swap transaction data
 */
// Debug: serialize error for full log (code, message, reason, data, transaction, stack)
function debugSerializeError(err) {
  if (!err) return null;
  try {
    return {
      code: err.code,
      message: err.message,
      reason: err.reason,
      data: err.data,
      transaction: err.transaction ? {
        to: err.transaction?.to,
        value: err.transaction?.value?.toString?.(),
        dataLength: err.transaction?.data?.length,
        gasLimit: err.transaction?.gasLimit?.toString?.(),
        from: err.transaction?.from
      } : undefined,
      stack: err.stack,
      fullString: String(err)
    };
  } catch (e) {
    return { message: String(err) };
  }
}

async function getSwapTxData(tokenIn, tokenOut, amountIn, recipient, slippage = 0.5, deadline = 20, expectedMinOut = null, signerOverride = null) {
  try {
    console.log('[SWAP_DEBUG] getSwapTxData START', { tokenIn, tokenOut, amountIn, recipient, slippage, deadline, expectedMinOut, hasSignerOverride: !!signerOverride });
    console.log('[SWAP_DEBUG] Wrapper config', {
      USE_BITSWAP_WRAPPER: getUseBitSwapWrapper(),
      BITSWAP_WRAPPER_ADDRESS: getBitSwapWrapperAddress(),
      wrapperEnabled: getUseBitSwapWrapper() && !!getBitSwapWrapperAddress()
    });

    if (getUseBitSwapWrapper() && getBitSwapWrapperAddress()) {
      console.log('[SWAP_DEBUG] Using BitSwapDEXWrapper');
      return await executeSwapThroughWrapper(tokenIn, tokenOut, amountIn, recipient, slippage, deadline, expectedMinOut, signerOverride);
    }

    const normalizedRecipient =
      typeof recipient === 'string' ? recipient.trim().toLowerCase() : recipient;

    let query = `tokenIn=${encodeURIComponent(tokenIn)}&tokenOut=${encodeURIComponent(tokenOut)}&amountIn=${encodeURIComponent(amountIn)}&recipient=${encodeURIComponent(normalizedRecipient)}&slippage=${encodeURIComponent(slippage)}&deadline=${encodeURIComponent(deadline)}&useWrapper=${getUseBitSwapWrapper()}&wrapperAddress=${encodeURIComponent(getBitSwapWrapperAddress())}`;
    if (expectedMinOut != null && expectedMinOut !== '') {
      query += `&minOut=${encodeURIComponent(String(expectedMinOut))}`;
    }
    const endpoint = `${API_ENDPOINTS.OTA_SWAP_TX}?${query}`;
    console.log('[SWAP_DEBUG] swap-tx endpoint', endpoint);

    const data = await otaApiRequest(endpoint);
    console.log('[SWAP_DEBUG] swap-tx JSON keys', { success: data.success, hasSwapTx: !!data.swapTx, topLevelKeys: Object.keys(data) });

    if (!data.success || !data.swapTx) {
      console.error('[SWAP_DEBUG] Invalid swap tx response', { success: data.success, hasSwapTx: !!data.swapTx, data });
      throw new Error('Invalid swap tx response');
    }

    const stx = data.swapTx;
    const calldataPreview = stx.calldata ? `${stx.calldata.slice(0, 20)}...${stx.calldata.slice(-10)} (len=${stx.calldata.length})` : 'n/a';
    console.log('[SWAP_DEBUG] swapTx received', {
      to: stx.to,
      value: stx.value,
      valueType: typeof stx.value,
      minOut: stx.minOut,
      deadline: stx.deadline,
      gasEstimate: stx.gasEstimate,
      calldataLen: stx.calldata?.length,
      calldataPreview
    });
    if (tokenIn === 'BNB' && (!stx.value || stx.value === '0')) {
      console.error('[SWAP_DEBUG] BNB swap but value is 0 – tx would fail');
    }

    return data.swapTx;
  } catch (error) {
    console.error('[SWAP_DEBUG] getSwapTxData error', debugSerializeError(error));
    throw error;
  }
}

/**
 * Execute swap transaction
 * @param {string} tokenIn - Token in symbol
 * @param {string} tokenOut - Token out symbol
 * @param {string} amountIn - Amount in
 * @param {string} recipient - Recipient address
 * @param {number} slippage - Slippage percentage
 * @param {number} deadline - Deadline in minutes
 * @returns {Promise<{hash: string, receipt: object}>} Transaction hash and receipt
 */
async function executeSwap(tokenIn, tokenOut, amountIn, recipient, slippage = 0.5, deadline = 20, expectedMinOut = null, signerOverride = null) {
  let chainIdAtSend = null;
  let fromAddressAtSend = null;
  try {
    console.log('[SWAP_DEBUG] executeSwap START', { tokenIn, tokenOut, amountIn, recipient, slippage, deadline, expectedMinOut });

    // Force wallet matching user preference (MetaMask vs Trust) – avoids Trust opening când vrei MetaMask
    try {
      const preferred = ((typeof localStorage !== 'undefined' && localStorage.getItem('bits_evm_preferred_connector_name')) || '').toLowerCase();
      if (preferred.includes('metamask')) forcePickEvmInjectedProvider('metamask');
      else if (preferred.includes('trust')) forcePickEvmInjectedProvider('trust');
      else if (preferred.includes('binance')) forcePickEvmInjectedProvider('binance');
      else if (!preferred || preferred === 'injected') forcePickEvmInjectedProvider('metamask'); // default MetaMask când ambele instalate
    } catch (_) {}

    const swapTxData = await getSwapTxData(tokenIn, tokenOut, amountIn, recipient, slippage, deadline, expectedMinOut, signerOverride);
    console.log('[SWAP_DEBUG] swapTxData keys', Object.keys(swapTxData));

    // Când wrapper: executeSwapThroughWrapper trimite tx și așteaptă receipt; swap e deja făcut
    if (swapTxData?.hash && swapTxData?.receipt) {
      return { hash: swapTxData.hash, receipt: swapTxData.receipt };
    }

    const ethereum = getInjectedProvider();
    const providers = typeof window !== 'undefined' && window.ethereum?.providers && Array.isArray(window.ethereum.providers) ? window.ethereum.providers : null;
    if (providers?.length) {
      const providerFlags = providers.map(p => ({ isMetaMask: !!p?.isMetaMask, isTrust: !!p?.isTrust }));
      const chosenIndex = ethereum ? providers.indexOf(ethereum) : -1;
      console.log('[SWAP_NETWORK] window.ethereum.providers', providerFlags, 'chosenIndex', chosenIndex, 'chosen', ethereum ? { isMetaMask: !!ethereum?.isMetaMask, isTrust: !!ethereum?.isTrust, hasRequest: !!ethereum?.request } : null);
    } else {
      console.log('[SWAP_DEBUG] provider identity', { isMetaMask: ethereum?.isMetaMask, isTrust: ethereum?.isTrust, hasRequest: !!ethereum?.request });
    }
    // Do NOT call ensureBscNetworkWithDefaultRpc here: some wallets throw "f is not a function" on wallet_addEthereumChain when BSC already exists; repair flow handles -32603.

    const signer = signerOverride || (await getSignerAsync());
    if (ethereum?.request) {
      const health = await rpcHealthCheck(ethereum).catch(() => ({ ok: false, rpcBroken: false }));
      if (!health.ok && health.rpcBroken) {
        console.warn('[SWAP_NETWORK] Invalid RPC URL in wallet config');
        const rpcErr = new Error('Wallet RPC invalid or unreachable. Please fix BSC network in wallet settings.');
        rpcErr.kind = 'RPC_INVALID_URL';
        rpcErr.repairBscNeeded = true;
        rpcErr.rpcInvalidUrl = true;
        rpcErr.original = health.error;
        throw rpcErr;
      }
    }
    try {
      chainIdAtSend = await signer.getChainId();
      fromAddressAtSend = await signer.getAddress();
      const networkName = chainIdAtSend === 56 ? 'BSC Mainnet' : chainIdAtSend === 97 ? 'BSC Testnet' : 'unsupported network (BSC only)';
      console.log('[SWAP_NETWORK] Rețea la trimitere:', { chainId: chainIdAtSend, network: networkName, from: fromAddressAtSend });
    } catch (e) {
      console.warn('[SWAP_DEBUG] could not get chainId/address', e?.message);
    }

    // Swap-ul e doar pe BSC; dacă wallet-ul nu e pe BSC, cer comutare la BSC (chainId 56) înainte de sendTransaction
    if (ethereum?.request && chainIdAtSend !== 56 && chainIdAtSend !== 97) {
      try {
        console.log('[SWAP_NETWORK] Wallet nu e pe BSC (chainId=' + chainIdAtSend + '). Cer comutare la BSC (0x38)...');
        await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
        chainIdAtSend = 56;
        console.log('[SWAP_NETWORK] Comutat la BSC (56).');
      } catch (switchErr) {
        if (switchErr?.code === 4902) {
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'BNB Smart Chain',
                nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                rpcUrls: ['https://bsc-dataseed.bnbchain.org/', 'https://bsc-dataseed1.bnbchain.org/', 'https://bsc-dataseed2.bnbchain.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
              }]
            });
            await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
            chainIdAtSend = 56;
          } catch (addErr) {
            if (addErr?.code !== 4001) console.warn('[SWAP_NETWORK] add/switch BSC failed', addErr?.message);
            throw new Error('Swap runs on BSC. Please select BSC in your wallet (MetaMask → BSC network).');
          }
        } else if (switchErr?.code === 4001) {
          throw new Error('You declined switching to BSC. Swap requires BSC.');
        } else {
          throw new Error('Could not switch to BSC. Please select BSC in your wallet.');
        }
      }
    }

    const gasLimit = swapTxData.gasEstimate
      ? ethers.BigNumber.from(swapTxData.gasEstimate).mul(getUseBitSwapWrapper() ? 150 : 120).div(100)
      : undefined;

    const tx = {
      to: swapTxData.to,
      data: swapTxData.calldata,
      value: swapTxData.value !== '0' ? swapTxData.value : undefined,
      gasLimit: gasLimit
    };

    console.log('[SWAP_DEBUG] tx built', {
      to: tx.to,
      value: tx.value,
      valueType: typeof tx.value,
      gasLimit: tx.gasLimit?.toString(),
      dataLength: tx.data?.length,
      dataPrefix: tx.data?.slice(0, 20)
    });

    console.log('[SWAP_DEBUG] calling signer.sendTransaction...');
    console.log('[SWAP_NETWORK] Folosim DOAR window.ethereum (wallet-ul tău). Nu setăm noi niciun RPC; rețeaua e cea din wallet.', { chainId: chainIdAtSend, from: fromAddressAtSend });
    const txResponse = await signer.sendTransaction(tx);
    console.log('[SWAP_DEBUG] sendTransaction returned', {
      hash: txResponse?.hash,
      nonce: txResponse?.nonce,
      from: txResponse?.from,
      blockNumber: txResponse?.blockNumber,
      confirmations: txResponse?.confirmations,
      hasHash: !!txResponse?.hash
    });

    if (!txResponse?.hash) {
      console.error('[SWAP_DEBUG] txResponse has no hash', txResponse);
    }

    console.log('[SWAP_DEBUG] waiting for receipt...');
    const receipt = await txResponse.wait();
    console.log('[SWAP_DEBUG] receipt', {
      hash: receipt?.transactionHash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed?.toString?.(),
      status: receipt?.status,
      to: receipt?.to
    });

    return {
      hash: txResponse.hash,
      receipt
    };
  } catch (error) {
    const isCallException = error?.code === 'CALL_EXCEPTION' ||
      (error?.transactionHash && error?.receipt && Number(error.receipt.status) === 0) ||
      (error?.receipt && Number(error.receipt.status) === 0);
    if (isCallException) {
      // Tx was mined but reverted on-chain (slippage, liquidity, deadline, etc.) – NOT an RPC/network issue
      const txHash = error?.transactionHash || error?.transaction?.hash;
      console.warn('[SWAP_ONCHAIN] Tranzacția a revertit on-chain (receipt.status=0):', {
        hash: txHash,
        receiptStatus: error?.receipt?.status
      });
      console.error('[SWAP_DEBUG] executeSwap FULL ERROR', debugSerializeError(error));
      const userMessage = getSwapRevertUserMessage(error);
      const errWithHash = new Error(txHash ? `${userMessage} (tx: ${txHash})` : userMessage);
      errWithHash.transactionHash = txHash;
      throw errWithHash;
    }
    console.error('[SWAP_NETWORK] Eroare la swap – rețea/setări:', {
      chainIdLaSend: chainIdAtSend,
      fromLaSend: fromAddressAtSend,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorData: error?.data
    });
    console.error('[SWAP_DEBUG] executeSwap FULL ERROR', debugSerializeError(error));
    console.error('[SWAP_DEBUG] executeSwap error raw', error);

    if (error.code === 4001) {
      throw new Error('Transaction rejected by user');
    }
    if (error.message && error.message.includes('insufficient funds')) {
      throw new Error('Insufficient balance for swap');
    }
    const msgLow = (error.message || '').toLowerCase();
    if (error.message && (msgLow.includes('slippage') || msgLow.includes('likely to fail') || msgLow.includes('couldn\'t be completed') || msgLow.includes('canceled to save') || msgLow.includes('unnecessary gas fees'))) {
      throw new Error('Transaction would revert (slippage). Open Swap Settings (gear icon) and set slippage to 2.5% or 3%, then try again.');
    }
    // -32603 "Invalid RPC URL" (e.g. TWNodes) → wallet config error, show RpcRepairModal (Re-test, Copy RPC). Do NOT label as revert.
    if (isInvalidRpcUrlError(error)) {
      console.warn('[SWAP_NETWORK] Invalid RPC URL in wallet config');
      const rpcErr = new Error('Wallet RPC invalid or unreachable. Please fix BSC network in wallet settings.');
      rpcErr.kind = 'RPC_INVALID_URL';
      rpcErr.repairBscNeeded = true;
      rpcErr.rpcInvalidUrl = true;
      rpcErr.original = error;
      throw rpcErr;
    }
    // -32603 "transaction hash" / "there was a problem" → existing repair flow (RepairBscModal)
    const code = error.code != null ? Number(error.code) : Number(error.error?.code ?? NaN);
    const msg = (error.message || error.error?.message || error.reason || '').toString();
    const isRpcRelatedError = (code === -32603 || code === 32603) && (
      /transaction hash|there was a problem/i.test(msg) ||
      /invalid rpc url|invalid.*rpc/i.test(msg)
    );
    if (isRpcRelatedError) {
      const shortMsg = msg.length > 120 ? msg.slice(0, 120) + '…' : msg;
      const repairError = new Error('Network returned an error (we only use your wallet, we do not set RPC): ' + shortMsg);
      repairError.repairBscNeeded = true;
      repairError.originalMessage = msg;
      throw repairError;
    }
    if (error.reason) {
      throw new Error(`Contract error: ${error.reason}`);
    }
    throw error;
  }
}

// In-memory cache for token decimals (session-scoped)
const decimalsCache = new Map();

/**
 * Get token decimals with caching
 * @param {string} tokenSymbol - Token symbol (BNB, USDT, etc.)
 * @returns {Promise<number>} Token decimals (8, 18, etc.)
 */
async function getTokenDecimals(tokenSymbol) {
  // BNB is native, always 18 decimals
  if (tokenSymbol === 'BNB') {
    return 18;
  }

  const tokenAddress = TOKEN_ADDRESSES[tokenSymbol.toUpperCase()];
  if (!tokenAddress) {
    throw new Error(`Unknown token: ${tokenSymbol}`);
  }

  // Check cache first
  if (decimalsCache.has(tokenAddress)) {
    return decimalsCache.get(tokenAddress);
  }

  // Fetch from contract
  const provider = getProvider();
  if (!provider) {
    throw new Error('Wallet not connected');
  }

  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await tokenContract.decimals();
    
    // Cache it
    decimalsCache.set(tokenAddress, decimals);
    return decimals;
  } catch (error) {
    console.error(`[SwapExecution] Error fetching decimals for ${tokenSymbol}:`, error);
    // Fallback to 18 if fetch fails (most tokens use 18)
    const fallback = 18;
    decimalsCache.set(tokenAddress, fallback);
    return fallback;
  }
}

const swapExecutionService = {
  checkAllowance,
  approveToken,
  getSwapTxData,
  executeSwap,
  getTokenDecimals,
  isWrapperAvailable,
  getSpenderAddress,
  ensureBscForDex,
  getEthereumProvider,
  PANCAKESWAP_ROUTER,
  getBitSwapWrapperAddress,
  getUseBitSwapWrapper,
  TOKEN_ADDRESSES
};

export default swapExecutionService;
