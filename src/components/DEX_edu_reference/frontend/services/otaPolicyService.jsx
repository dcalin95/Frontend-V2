/**
 * ⚙️ OTA Policy Service - Frontend Policy Management Service
 * 
 * Frontend service pentru interacțiune cu contractul OTAPolicyManager on-chain:
 * - Get user policy
 * - Set/update policy (slippage, delays, allowlists)
 * - Set token limits
 * - Manage allowlists
 * 
 * @module otaPolicyService
 */

import { ethers } from 'ethers';
import { API_ENDPOINTS } from '../../config/apiEndpoints.js';
import { CONTRACT_MAP, getActiveNetwork } from '../../../../contract/contractMap';
import { otaApiRequest } from '../utils/otaApiClient';
import { handleApiError } from '../utils/helpers';
import { pickEvmProvider as pickEvmProviderSSoT, getSignerFromPreferredWallet } from '../../utils/evmProviderResolver.js';

/** ABI = contractul deployat pe BSC (OTAPolicyManager). setTokenLimits(token, max, daily) – user = msg.sender; getTokenLimits(user, token) citește. */
const OTA_POLICY_IFACE = new ethers.utils.Interface([
  'function setPolicy(bool _enabled, uint256 _expiresAt, uint256 _maxSlippageBps, uint256 _minDelaySeconds)',
  'function setTokenLimits(address _token, uint256 _maxPerTrade, uint256 _dailyMax)',
  'function setTokenAllowed(address _token, bool _allowed)',
  'function setPairAllowed(address _tokenIn, address _tokenOut, bool _allowed)'
]);

const PM_READ_IFACE = new ethers.utils.Interface([
  'function isTokenAllowed(address,address) view returns (bool)',
  'function isPairAllowed(address,address,address) view returns (bool)',
]);

/** Gas suficient pentru setTokenAllowed/setPairAllowed – evităm eth_estimateGas (poate folosi RPC invalid). */
const ALLOWLIST_TX_GAS = 100000;

/** Adresa OTAPolicyManager – SSOT pentru Policy, Limits, Allowlist. După redeploy: set REACT_APP_OTA_POLICY_MANAGER_ADDRESS. */
export function getOTAPolicyManagerAddress() {
  return CONTRACT_MAP?.OTA_POLICY_MANAGER?.address || '0x37CfEA29005638e4703D35F0D318d22db0f22649';
}

function isRpcTwnodesError(err) {
  const msg = (err?.message || '').toLowerCase();
  return msg.includes('invalid rpc url') || msg.includes('twnodes') || err?.code === -32603;
}

function buildSetTokenAllowedTxLocal(tokenAddress, allowed) {
  const to = getOTAPolicyManagerAddress();
  const data = OTA_POLICY_IFACE.encodeFunctionData('setTokenAllowed', [tokenAddress, !!allowed]);
  return { to, data, value: '0x0', gasLimit: ALLOWLIST_TX_GAS };
}

function buildSetPairAllowedTxLocal(tokenIn, tokenOut, allowed) {
  const to = getOTAPolicyManagerAddress();
  const data = OTA_POLICY_IFACE.encodeFunctionData('setPairAllowed', [tokenIn, tokenOut, !!allowed]);
  return { to, data, value: '0x0', gasLimit: ALLOWLIST_TX_GAS };
}

function buildSetTokenLimitsTxLocal(walletAddress, tokenAddress, maxPerTrade, dailyMax) {
  const to = getOTAPolicyManagerAddress();
  // Contract: setTokenLimits(token, maxPerTrade, dailyMax); user = msg.sender
  const data = OTA_POLICY_IFACE.encodeFunctionData('setTokenLimits', [tokenAddress, maxPerTrade, dailyMax]);
  return { to, data, value: '0x0' };
}

function pickEvmProvider() {
  return pickEvmProviderSSoT();
}

function getProvider() {
  const ethereum = pickEvmProvider();
  if (ethereum) return new ethers.providers.Web3Provider(ethereum, 'any');
  return null;
}

function isJsonRpcEngineEmptyResponse(error) {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('jsonrpcengine') && msg.includes('no error or result for request');
}

async function ensureTargetEvmNetwork(ethereum) {
  if (!ethereum?.request) return;
  const targetChainId = Number(getActiveNetwork?.()?.chainId || 56);
  const targetHex = `0x${targetChainId.toString(16)}`;
  const currentHex = await ethereum.request({ method: 'eth_chainId' }).catch(() => null);
  if (currentHex && String(currentHex).toLowerCase() === targetHex.toLowerCase()) return;

  try {
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: targetHex }] });
  } catch (switchErr) {
    // If chain is missing in wallet, try adding it with runtime-config values.
    if (switchErr?.code === 4902 || String(switchErr?.message || '').toLowerCase().includes('unrecognized chain')) {
      const cfg = getActiveNetwork?.();
      if (!cfg?.rpcUrl || !cfg?.name) throw switchErr;
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: targetHex,
          chainName: cfg.name,
          nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
          rpcUrls: [cfg.rpcUrl],
          blockExplorerUrls: [targetChainId === 97 ? 'https://testnet.bscscan.com' : 'https://bscscan.com']
        }]
      });
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: targetHex }] });
    } else {
      throw switchErr;
    }
  }
}

/**
 * Get signer from provider. Use current account from eth_accounts to avoid
 * "unknown account #0" (operation=getAddress, UNSUPPORTED_OPERATION) with some wallets (e.g. Trust, MetaMask with multiple providers).
 * @returns {Promise<ethers.providers.JsonRpcSigner>} Signer instance
 */
async function getSignerAsync(expectedWalletAddress = null) {
  let ethereum = pickEvmProvider();
  const preferredName = (() => {
    try { return (localStorage.getItem('bits_evm_preferred_connector_name') || '').toLowerCase(); }
    catch (_) { return ''; }
  })();
  const hasExplicitPreference = preferredName.includes('trust') || preferredName.includes('coinbase') || preferredName.includes('metamask');
  if (!ethereum) {
    if (hasExplicitPreference) {
      throw new Error(`Selected wallet (${preferredName}) is not available in browser. Reconnect that wallet and retry.`);
    }
    throw new Error('Wallet not connected. Please connect your wallet.');
  }

  // Diagnostic log: which provider was picked
  console.log('[OTA] getSignerAsync provider picked:', {
    isMetaMask: !!ethereum?.isMetaMask,
    isTrust: !!ethereum?.isTrust,
    isPhantom: !!ethereum?.isPhantom,
    isMetaMaskSDK: !!ethereum?.isMetaMaskSDK,
    hasProviders: !!(window.ethereum?.providers?.length),
    providersCount: window.ethereum?.providers?.length ?? 0,
  });

  const provider = new ethers.providers.Web3Provider(ethereum, 'any');
  let accounts = await ethereum.request({ method: 'eth_accounts' }).catch(() => []);
  if (!Array.isArray(accounts) || accounts.length === 0) {
    // Trigger wallet connect prompt when account list is empty.
    accounts = await ethereum.request({ method: 'eth_requestAccounts' }).catch(() => []);
  }
  if (expectedWalletAddress) {
    const target = String(expectedWalletAddress).toLowerCase();
    const hasTarget = Array.isArray(accounts) && accounts.some(a => String(a).toLowerCase() === target);
    if (!hasTarget) {
      // Retry once after explicit account request; some wallets return empty/old list first.
      const requested = await ethereum.request({ method: 'eth_requestAccounts' }).catch(() => accounts);
      if (Array.isArray(requested) && requested.length > 0) {
        accounts = requested;
      }
      const hasTargetAfterRequest = Array.isArray(accounts) && accounts.some(a => String(a).toLowerCase() === target);
      if (hasTargetAfterRequest) {
        return provider.getSigner(accounts[0]);
      }
      throw new Error(
        `Selected provider account mismatch. Expected ${expectedWalletAddress}, but provider returned ${Array.isArray(accounts) && accounts[0] ? accounts[0] : 'no account'}.`
      );
    }
  }
  if (accounts && accounts.length > 0) {
    return provider.getSigner(accounts[0]);
  }
  return provider.getSigner();
}

/**
 * Verify that the active signer address matches the expected wallet address.
 * Prevents silent allowlist mismatches when Trust Wallet intercepts signing instead of MetaMask.
 */
async function assertSignerMatchesWallet(signer, expectedWallet) {
  if (!expectedWallet) return; // no expected address to check
  try {
    const signerAddr = await signer.getAddress();
    if (signerAddr.toLowerCase() !== expectedWallet.toLowerCase()) {
      throw new Error(
        `Wrong wallet signing: signer is ${signerAddr} but your account is ${expectedWallet}. ` +
        `Please reconnect and use the same wallet/account as in header.`
      );
    }
  } catch (e) {
    if (e.message?.includes('Wrong wallet signing')) throw e;
    // If getAddress fails for other reasons, skip the check
  }
}

/** Request către backend OTA policy: timeout + retry via otaApiClient. */
async function apiRequest(endpoint, options = {}) {
  try {
    return await otaApiRequest(endpoint, options);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[OTA Policy] API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}

/**
 * Build setPolicy transaction LOCALLY — nu depinde de backend.
 * Contractul OTAPolicyManager are setPolicy(bool,uint256,uint256,uint256)
 * cu selector 0x8574a478 și parametrii:
 *   1. isActive (bool)
 *   2. maxSlippageBps (uint256) — max slippage in basis points, cap 1000 (contract max)
 *   3. maxTradeSize (uint256) — max trade size in token wei (18 decimals)
 *   4. cooldownSeconds (uint256) — cooldown between trades
 */
export async function prepareSetPolicyTransaction(walletAddress, policyData) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  const to = getOTAPolicyManagerAddress();
  const enabled = Boolean(policyData?.enabled ?? policyData?.isActive);
  const expiresAt = ethers.BigNumber.from(Math.max(0, Number(policyData?.expiresAt ?? 0)));
  const maxSlippageBps = Math.max(0, Math.min(1000, Math.round(Number(policyData?.maxSlippageBps) || 1000)));
  const minDelaySeconds = Math.max(0, Math.min(0xFFFFFFFF, Math.round(Number(policyData?.cooldownSeconds ?? policyData?.minDelaySeconds ?? 60))));

  const data = OTA_POLICY_IFACE.encodeFunctionData('setPolicy', [
    enabled,
    expiresAt,
    maxSlippageBps,
    minDelaySeconds
  ]);

  return { to, data, value: '0x0', gasLimit: 200000 };
}

/**
 * Set user policy on-chain
 * @param {string} walletAddress - User wallet address
 * @param {Object} policyData - Policy data
 * @returns {Promise<Object>} Transaction receipt
 */
export async function setPolicy(walletAddress, policyData) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    console.log('[OTA Policy] Starting setPolicy process for:', walletAddress);
    const ethereum = pickEvmProvider();
    if (!ethereum?.request) {
      throw new Error('Wallet not available. Connect wallet in header (e.g. MetaMask) and retry.');
    }
    await ethereum.request({ method: 'eth_requestAccounts' }).catch((err) => {
      if (err?.code === 4001 || /user rejected|user denied/i.test(String(err?.message))) {
        throw new Error('Wallet connection was rejected. Approve in MetaMask to continue.');
      }
      throw err;
    });
    await ensureTargetEvmNetwork(ethereum);

    const transaction = await prepareSetPolicyTransaction(walletAddress, policyData);
    console.log('[OTA Policy] Transaction prepared:', { to: transaction.to, contract: 'OTAPolicyManager', method: 'setPolicy()' });
    const signer = await getSignerFromPreferredWallet(walletAddress);
    if (!signer) {
      throw new Error('Wallet not connected. Please connect your wallet.');
    }
    await assertSignerMatchesWallet(signer, walletAddress);

    const tx = {
      to: transaction.to,
      data: transaction.data,
      value: transaction.value !== '0x0' ? transaction.value : undefined,
      ...(transaction.gasLimit && { gasLimit: transaction.gasLimit })
    };

    console.log('[OTA Policy] Sending transaction for wallet approval...');

    let txResponse;
    try {
      txResponse = await signer.sendTransaction(tx);
    } catch (sendErr) {
      if (!isJsonRpcEngineEmptyResponse(sendErr) || !ethereum?.request) {
        throw sendErr;
      }
      const from = await signer.getAddress();
      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: tx.to,
          data: tx.data,
          ...(tx.value ? { value: tx.value } : {}),
          ...(tx.gasLimit && { gasLimit: typeof tx.gasLimit === 'number' ? '0x' + tx.gasLimit.toString(16) : tx.gasLimit })
        }]
      });
      txResponse = {
        hash: txHash,
        wait: () => signer.provider.waitForTransaction(txHash)
      };
    }
    console.log('[OTA Policy] Transaction sent:', txResponse.hash);

    // Step 5: Wait for blockchain confirmation
    const receipt = await txResponse.wait();
    console.log('[OTA Policy] Policy set confirmed on-chain!');

    return {
      hash: txResponse.hash,
      receipt,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('[OTA Policy] Error setting policy:', error);
    
    if (error.code === 4001 || error.message?.includes('user rejected')) {
      throw new Error('Transaction was cancelled. Please approve the transaction in your wallet.');
    }
    
    throw error;
  }
}

/**
 * Prepare setTokenLimits transaction
 * @param {string} walletAddress - User wallet address
 * @param {string} tokenAddress - Token address
 * @param {string} maxPerTrade - Max per trade (0 = unlimited)
 * @param {string} dailyMax - Daily max (0 = unlimited)
 * @returns {Promise<Object>} Transaction data to sign
 */
export async function prepareSetTokenLimitsTransaction(walletAddress, tokenAddress, maxPerTrade, dailyMax) {
  if (!walletAddress || !tokenAddress) {
    throw new Error('Wallet address and token address are required');
  }

  // Local tx builder: contract expects (user, token, maxPerTrade, dailyMax); getTokenLimits(user, token) reads this.
  return buildSetTokenLimitsTxLocal(walletAddress, tokenAddress, maxPerTrade, dailyMax);
}

/**
 * Set token limits on-chain
 * @param {string} walletAddress - User wallet address
 * @param {string} tokenAddress - Token address
 * @param {string} maxPerTrade - Max per trade (0 = unlimited)
 * @param {string} dailyMax - Daily max (0 = unlimited)
 * @returns {Promise<Object>} Transaction receipt
 */
/** Gas pentru setTokenLimits – evitàm estimare care poate bloca popup-ul. */
const SET_TOKEN_LIMITS_GAS = 150000;

export async function setTokenLimits(walletAddress, tokenAddress, maxPerTrade, dailyMax) {
  try {
    const ethereum = pickEvmProvider();
    if (!ethereum?.request) {
      throw new Error('Wallet not available. Install MetaMask or connect your wallet from the header.');
    }
    // Forțează cerere cont – deschide MetaMask dacă e preferat
    await ethereum.request({ method: 'eth_requestAccounts' }).catch((err) => {
      if (err?.code === 4001 || /user rejected|user denied/i.test(String(err?.message))) {
        throw new Error('Wallet connection was rejected. Please approve in MetaMask to save limits.');
      }
      throw err;
    });

    const transaction = await prepareSetTokenLimitsTransaction(walletAddress, tokenAddress, maxPerTrade, dailyMax);
    // SSOT: signer de la wallet-ul preferat (același ca în header)
    const signer = await getSignerFromPreferredWallet(walletAddress);
    await ensureTargetEvmNetwork(ethereum);
    await assertSignerMatchesWallet(signer, walletAddress);

    const tx = {
      to: transaction.to,
      data: transaction.data,
      value: transaction.value !== '0x0' ? transaction.value : undefined,
      gasLimit: SET_TOKEN_LIMITS_GAS
    };

    const txResponse = await signer.sendTransaction(tx);
    const receipt = await txResponse.wait();

    return {
      hash: txResponse.hash,
      receipt,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('[OTA Policy] Error setting token limits:', error);
    throw error;
  }
}

/**
 * Prepare setTokenAllowed transaction.
 * Folosește builder local – API backend depinde de BSC_RPC care poate fi invalid (TWNodes).
 * Tx-ul e simplu (setTokenAllowed), nu necesită backend.
 */
export async function prepareSetTokenAllowedTransaction(walletAddress, tokenAddress, allowed) {
  if (!walletAddress || !tokenAddress) {
    throw new Error('Wallet address and token address are required');
  }
  return buildSetTokenAllowedTxLocal(tokenAddress, allowed);
}

/**
 * Set token allowlist on-chain
 * @param {string} walletAddress - User wallet address
 * @param {string} tokenAddress - Token address
 * @param {boolean} allowed - Allowed status
 * @returns {Promise<Object>} Transaction receipt
 */
export async function setTokenAllowed(walletAddress, tokenAddress, allowed) {
  const ethereum = pickEvmProvider();
  if (!ethereum?.request) {
    throw new Error('Wallet not available. Connect wallet in header (e.g. MetaMask) and retry.');
  }
  await ethereum.request({ method: 'eth_requestAccounts' }).catch((err) => {
    if (err?.code === 4001 || /user rejected|user denied/i.test(String(err?.message))) {
      throw new Error('Wallet connection was rejected. Approve in MetaMask to continue.');
    }
    throw err;
  });
  await ensureTargetEvmNetwork(ethereum);
  const transaction = await prepareSetTokenAllowedTransaction(walletAddress, tokenAddress, allowed);
  const signer = await getSignerFromPreferredWallet(walletAddress);
  await assertSignerMatchesWallet(signer, walletAddress);
  const tx = {
    to: transaction.to,
    data: transaction.data,
    value: transaction.value !== '0x0' ? transaction.value : undefined,
    ...(transaction.gasLimit && { gasLimit: transaction.gasLimit })
  };
  try {
    const txResponse = await signer.sendTransaction(tx);
    const receipt = await txResponse.wait();
    return { hash: txResponse.hash, receipt, blockNumber: receipt.blockNumber };
  } catch (error) {
    if (isRpcTwnodesError(error)) {
      error.showRpcRepairModal = true;
      throw error;
    }
    throw error;
  }
}

/**
 * Prepare setPairAllowed transaction.
 * Folosește builder local – API backend depinde de BSC_RPC care poate fi invalid.
 * Tx-ul e simplu (setPairAllowed), nu necesită backend.
 */
export async function prepareSetPairAllowedTransaction(walletAddress, tokenIn, tokenOut, allowed) {
  if (!walletAddress || !tokenIn || !tokenOut) {
    throw new Error('Wallet address and token addresses are required');
  }
  return buildSetPairAllowedTxLocal(tokenIn, tokenOut, allowed);
}

/**
 * Set pair allowlist on-chain
 * @param {string} walletAddress - User wallet address
 * @param {string} tokenIn - Input token address
 * @param {string} tokenOut - Output token address
 * @param {boolean} allowed - Allowed status
 * @returns {Promise<Object>} Transaction receipt
 */
export async function setPairAllowed(walletAddress, tokenIn, tokenOut, allowed) {
  const ethereum = pickEvmProvider();
  if (!ethereum?.request) {
    throw new Error('Wallet not available. Connect wallet in header (e.g. MetaMask) and retry.');
  }
  await ethereum.request({ method: 'eth_requestAccounts' }).catch((err) => {
    if (err?.code === 4001 || /user rejected|user denied/i.test(String(err?.message))) {
      throw new Error('Wallet connection was rejected. Approve in MetaMask to continue.');
    }
    throw err;
  });
  await ensureTargetEvmNetwork(ethereum);
  const transaction = await prepareSetPairAllowedTransaction(walletAddress, tokenIn, tokenOut, allowed);
  const signer = await getSignerFromPreferredWallet(walletAddress);
  await assertSignerMatchesWallet(signer, walletAddress);
  const tx = {
    to: transaction.to,
    data: transaction.data,
    value: transaction.value !== '0x0' ? transaction.value : undefined,
    ...(transaction.gasLimit && { gasLimit: transaction.gasLimit })
  };
  try {
    const txResponse = await signer.sendTransaction(tx);
    const receipt = await txResponse.wait();
    return { hash: txResponse.hash, receipt, blockNumber: receipt.blockNumber };
  } catch (error) {
    if (isRpcTwnodesError(error)) {
      error.showRpcRepairModal = true;
      throw error;
    }
    throw error;
  }
}

/**
 * Prepare setEnforceTokenAllowlist transaction
 * @param {string} walletAddress - User wallet address
 * @param {boolean} enforce - Whether to enforce token allowlist
 * @returns {Promise<Object>} Transaction data to sign
 */
export async function prepareSetEnforceTokenAllowlistTransaction(walletAddress, enforce) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }
  if (typeof enforce !== 'boolean') {
    throw new Error('enforce must be boolean');
  }

  try {
    const response = await apiRequest(
      `${API_ENDPOINTS.OTA_POLICY_ENFORCE_TOKEN_ALLOWLIST || '/ai-trading/policy/enforce-token-allowlist'}`,
      {
        method: 'POST',
        body: JSON.stringify({
          walletAddress,
          enforce
        })
      }
    );

    return response.transaction;
  } catch (error) {
    const errorMessage = await handleApiError(error);
    throw new Error(errorMessage || 'Failed to prepare enforceTokenAllowlist transaction');
  }
}

/**
 * Prepare setEnforcePairAllowlist transaction
 * @param {string} walletAddress - User wallet address
 * @param {boolean} enforce - Whether to enforce pair allowlist
 * @returns {Promise<Object>} Transaction data to sign
 */
export async function prepareSetEnforcePairAllowlistTransaction(walletAddress, enforce) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }
  if (typeof enforce !== 'boolean') {
    throw new Error('enforce must be boolean');
  }

  try {
    const response = await apiRequest(
      `${API_ENDPOINTS.OTA_POLICY_ENFORCE_PAIR_ALLOWLIST || '/ai-trading/policy/enforce-pair-allowlist'}`,
      {
        method: 'POST',
        body: JSON.stringify({
          walletAddress,
          enforce
        })
      }
    );

    return response.transaction;
  } catch (error) {
    const errorMessage = await handleApiError(error);
    throw new Error(errorMessage || 'Failed to prepare enforcePairAllowlist transaction');
  }
}

/**
 * Set token allowlist enforcement on-chain
 * @param {string} walletAddress - User wallet address
 * @param {boolean} enforce
 * @returns {Promise<Object>} Transaction receipt
 */
export async function setEnforceTokenAllowlist(walletAddress, enforce) {
  try {
    const transaction = await prepareSetEnforceTokenAllowlistTransaction(walletAddress, enforce);
    const signer = await getSignerAsync(walletAddress);

    const tx = {
      to: transaction.to,
      data: transaction.data,
      value: transaction.value !== '0x0' ? transaction.value : undefined
    };

    const txResponse = await signer.sendTransaction(tx);
    const receipt = await txResponse.wait();

    return {
      hash: txResponse.hash,
      receipt,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('[OTA Policy] Error setting enforceTokenAllowlist:', error);
    throw error;
  }
}

/**
 * Set pair allowlist enforcement on-chain
 * @param {string} walletAddress - User wallet address
 * @param {boolean} enforce
 * @returns {Promise<Object>} Transaction receipt
 */
export async function setEnforcePairAllowlist(walletAddress, enforce) {
  try {
    const transaction = await prepareSetEnforcePairAllowlistTransaction(walletAddress, enforce);
    const signer = await getSignerAsync(walletAddress);

    const tx = {
      to: transaction.to,
      data: transaction.data,
      value: transaction.value !== '0x0' ? transaction.value : undefined
    };

    const txResponse = await signer.sendTransaction(tx);
    const receipt = await txResponse.wait();

    return {
      hash: txResponse.hash,
      receipt,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('[OTA Policy] Error setting enforcePairAllowlist:', error);
    throw error;
  }
}

/**
 * Prepare allowlist enforcement transaction (DEPRECATED - Use separate functions)
 * @deprecated Use prepareSetEnforceTokenAllowlistTransaction and prepareSetEnforcePairAllowlistTransaction instead
 * @param {string} walletAddress - User wallet address
 * @param {boolean} enforceTokenAllowlist - Whether token allowlist is enforced
 * @param {boolean} enforcePairAllowlist - Whether pair allowlist is enforced
 * @returns {Promise<Object>} Transaction data to sign
 */
/**
 * Prepare allowlist enforcement transaction (DEPRECATED - Use separate functions)
 * @deprecated Use prepareSetEnforceTokenAllowlistTransaction and prepareSetEnforcePairAllowlistTransaction instead
 * @param {string} walletAddress - User wallet address
 * @param {boolean} enforceTokenAllowlist - Whether token allowlist is enforced
 * @param {boolean} enforcePairAllowlist - Whether pair allowlist is enforced
 * @returns {Promise<Object>} Transaction data to sign
 */
export async function prepareSetAllowlistEnforcementTransaction(
  walletAddress,
  enforceTokenAllowlist,
  enforcePairAllowlist
) {
  console.warn('[OTA Policy] prepareSetAllowlistEnforcementTransaction is deprecated. Use separate functions instead.');
  
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }
  if (typeof enforceTokenAllowlist !== 'boolean' || typeof enforcePairAllowlist !== 'boolean') {
    throw new Error('enforceTokenAllowlist and enforcePairAllowlist must be boolean');
  }

  try {
    // Make TWO separate API calls instead of one
    const tokenTx = await prepareSetEnforceTokenAllowlistTransaction(walletAddress, enforceTokenAllowlist);
    const pairTx = await prepareSetEnforcePairAllowlistTransaction(walletAddress, enforcePairAllowlist);
    
    // Return first transaction (user will need to sign both separately)
    return { tokenTx, pairTx };
  } catch (error) {
    const errorMessage = await handleApiError(error);
    throw new Error(errorMessage || 'Failed to prepare allowlist enforcement transaction');
  }
}

/**
 * Set allowlist enforcement on-chain (DEPRECATED - Use separate functions)
 * @deprecated Use setEnforceTokenAllowlist and setEnforcePairAllowlist instead
 * @param {string} walletAddress - User wallet address
 * @param {boolean} enforceTokenAllowlist
 * @param {boolean} enforcePairAllowlist
 * @returns {Promise<Object>} Transaction receipt
 */
/**
 * Set allowlist enforcement on-chain (DEPRECATED - Use separate functions)
 * @deprecated Use setEnforceTokenAllowlist and setEnforcePairAllowlist instead
 * @param {string} walletAddress - User wallet address
 * @param {boolean} enforceTokenAllowlist
 * @param {boolean} enforcePairAllowlist
 * @returns {Promise<Object>} Transaction receipt
 */
export async function setAllowlistEnforcement(walletAddress, enforceTokenAllowlist, enforcePairAllowlist) {
  console.warn('[OTA Policy] setAllowlistEnforcement is deprecated. Use separate functions instead.');
  
  try {
    // Make TWO separate on-chain calls
    const results = {};
    
    // Set token allowlist enforcement
    if (typeof enforceTokenAllowlist === 'boolean') {
      results.tokenEnforcement = await setEnforceTokenAllowlist(walletAddress, enforceTokenAllowlist);
    }
    
    // Set pair allowlist enforcement  
    if (typeof enforcePairAllowlist === 'boolean') {
      results.pairEnforcement = await setEnforcePairAllowlist(walletAddress, enforcePairAllowlist);
    }
    
    return results;
  } catch (error) {
    console.error('[OTA Policy] Error setting allowlist enforcement:', error);
    throw error;
  }
}

/**
 * Get user policy — DOAR din contract (OTAPolicyManager redeployat).
 * Fără fallback la backend: Policy tab reflectă strict ce e on-chain la getOTAPolicyManagerAddress() (env: REACT_APP_OTA_POLICY_MANAGER_ADDRESS).
 * După citire, dacă enabled, notifică backend (GET policy/get) pentru coada executor.
 */
export async function getPolicy(walletAddress) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  const raw = pickEvmProvider();
  const provider = raw
    ? new ethers.providers.Web3Provider(raw, 'any')
    : new ethers.providers.JsonRpcProvider(getActiveNetwork?.()?.rpcUrl || 'https://bsc-dataseed1.binance.org');
  const contractAddr = getOTAPolicyManagerAddress();
  const getPolicyAbi = ['function getPolicy(address) view returns (bool enabled, uint256 expiresAt, uint256 maxSlippageBps, uint256 minDelaySeconds, uint256 lastTradeAt, bool enforceTokenAllowlist, bool enforcePairAllowlist)'];
  const contract = new ethers.Contract(contractAddr, getPolicyAbi, provider);
  const p = await contract.getPolicy(walletAddress);
  const toNum = (v) => (v != null && typeof v.toNumber === 'function' ? v.toNumber() : (v != null && v.toString ? Number(v.toString()) : 0));
  const result = {
    enabled: Boolean(p.enabled),
    isActive: Boolean(p.enabled),
    maxSlippageBps: toNum(p.maxSlippageBps),
    maxTradeSize: '0',
    maxTradeSizeFormatted: '0',
    cooldownSeconds: toNum(p.minDelaySeconds),
    minDelaySeconds: toNum(p.minDelaySeconds),
    expiresAt: toNum(p.expiresAt),
    lastTradeAt: toNum(p.lastTradeAt),
    enforceTokenAllowlist: Boolean(p.enforceTokenAllowlist),
    enforcePairAllowlist: Boolean(p.enforcePairAllowlist)
  };
  if (result.enabled) {
    const backendEndpoint = `${API_ENDPOINTS.OTA_POLICY_GET || '/ai-trading/policy/get'}?walletAddress=${encodeURIComponent(walletAddress)}`;
    /** Notificare best-effort pentru coada executor — fără Bearer (evită 401 pe token stale + clear sesiune la fiecare poll). Cookie DEX = același wallet (middleware backend). */
    apiRequest(backendEndpoint, {
      method: 'GET',
      timeoutMs: 10000,
      omitOtaWalletBearer: true,
      suppressOtaWalletSessionClearOn401: true,
    }).catch(() => {});
  }
  return result;
}

/**
 * Get policy doar din backend (fără citire on-chain). Folosit pentru a afișa USD limits (usdMinPerTrade, usdMaxPerTrade etc.) care există doar în backend.
 * GET /api/ai-trading/policy/get → response.policy (include usdMinPerTrade, usdMaxPerTrade, usdDailyCap, maxTradesPer12h; 0 = nelimitat).
 */
export async function getPolicyFromBackendOnly(walletAddress) {
  if (!walletAddress) return null;
  const endpoint = `${API_ENDPOINTS.OTA_POLICY_GET || '/ai-trading/policy/get'}?walletAddress=${encodeURIComponent(walletAddress)}`;
  try {
    const response = await apiRequest(endpoint, { method: 'GET', timeoutMs: 15000 });
    return response?.policy ?? null;
  } catch (_) {
    return null;
  }
}

/**
 * Lista de tokeni pentru Limits – DOAR de la backend (OTA_TRACKED_TOKENS). Fără hardcodare.
 * Backend: GET /ai-trading/tracked-tokens → { symbols: string[] } sau { tokens: { symbol, address }[] }.
 * @returns {Promise<Array<{ symbol: string, address?: string }>>}
 */
export async function getTrackedTokensFromBackend() {
  const endpoint = API_ENDPOINTS.OTA_TRACKED_TOKENS_GET || '/ai-trading/tracked-tokens';
  try {
    const response = await apiRequest(endpoint, { method: 'GET', timeoutMs: 10000 });
    if (response?.tokens && Array.isArray(response.tokens)) {
      return response.tokens.map((t) => ({ symbol: t.symbol, address: t.address || undefined }));
    }
    if (response?.symbols && Array.isArray(response.symbols)) {
      return response.symbols.map((s) => ({ symbol: String(s) }));
    }
    return [];
  } catch (_) {
    return [];
  }
}

/**
 * Set user risk tolerance (conservative/moderate/aggressive/high). Stored in backend DB.
 * OpenAI receives riskLevel and adjusts confidence threshold; executor enforces min confidence per level.
 * @param {string} walletAddress - User wallet address
 * @param {string} riskLevel - 'conservative' | 'moderate' | 'aggressive' | 'high'
 * @returns {Promise<Object>} { success, riskLevel }
 */
export async function setRiskLevel(walletAddress, riskLevel) {
  if (!walletAddress || !riskLevel) {
    throw new Error('Wallet address and risk level are required');
  }
  const valid = ['conservative', 'moderate', 'aggressive', 'high'];
  if (!valid.includes(riskLevel)) {
    throw new Error(`riskLevel must be one of: ${valid.join(', ')}`);
  }

  try {
    const response = await apiRequest(
      API_ENDPOINTS.OTA_POLICY_RISK_LEVEL || '/ai-trading/policy/risk-level',
      {
        method: 'POST',
        body: JSON.stringify({ walletAddress, riskLevel })
      }
    );
    return response;
  } catch (error) {
    const errorMessage = await handleApiError(error);
    throw new Error(errorMessage || 'Failed to set risk level');
  }
}

/**
 * Get per-user LLM tuning settings. Returns merged with server defaults when null.
 * @param {string} walletAddress
 * @returns {Promise<{ success: boolean, llmTuning: Object }>}
 */
export async function getLlmTuning(walletAddress) {
  if (!walletAddress) throw new Error('Wallet address is required');
  const endpoint = `${API_ENDPOINTS.OTA_POLICY_LLM_TUNING || '/ai-trading/policy/llm-tuning'}?walletAddress=${encodeURIComponent(walletAddress)}`;
  const response = await apiRequest(endpoint, { method: 'GET' });
  return response;
}

/**
 * Set per-user LLM tuning. Body: { preset?, minConfidenceToOpen?, confidenceCap?, cooldownEnabled?, cooldownLossStreak?, cooldownPenalty?, cooldownBoostMinConfidenceToOpen? }
 * @param {string} walletAddress
 * @param {Object} llmTuning
 * @returns {Promise<{ success: boolean, llmTuning: Object }>}
 */
export async function setLlmTuning(walletAddress, llmTuning) {
  if (!walletAddress) throw new Error('Wallet address is required');
  const endpoint = API_ENDPOINTS.OTA_POLICY_LLM_TUNING || '/ai-trading/policy/llm-tuning';
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify({ walletAddress, llmTuning: llmTuning || {} })
  });
  return response;
}

/**
 * Reset loss streak for cooldown (backend records audit; next cycle computes streak only after reset time).
 * Dacă backend-ul are OTA_LOSS_STREAK_RESET_SECRET setat, trebuie același secret și la build frontend: REACT_APP_OTA_LOSS_STREAK_RESET_SECRET.
 * @param {string} walletAddress
 * @param {string} [reason]
 * @returns {Promise<{ success: boolean, resetAt?: string }>}
 */
export async function resetLossStreak(walletAddress, reason) {
  if (!walletAddress) throw new Error('Wallet address is required');
  const endpoint = API_ENDPOINTS.OTA_LOSS_STREAK_RESET || '/ai-trading/ota/loss-streak-reset';
  const secret = typeof process !== 'undefined' && process.env?.REACT_APP_OTA_LOSS_STREAK_RESET_SECRET;
  const headers = secret ? { 'X-OTA-Loss-Streak-Reset-Secret': secret } : undefined;
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify({ walletAddress, reason: reason || 'manual_reset_ui' }),
    ...(headers && { headers })
  });
  return response;
}

/**
 * Verifică on-chain dacă un token e deja în allowlist-ul user-ului.
 * Evită semnături MetaMask redundante.
 */
export async function isTokenAllowedOnChain(walletAddress, tokenAddress) {
  try {
    const raw = pickEvmProvider();
    const provider = raw
      ? new ethers.providers.Web3Provider(raw, 'any')
      : new ethers.providers.JsonRpcProvider(getActiveNetwork?.()?.rpcUrl || 'https://bsc-dataseed1.binance.org');
    const pmAddr = getOTAPolicyManagerAddress();
    const r = await provider.call({ to: pmAddr, data: PM_READ_IFACE.encodeFunctionData('isTokenAllowed', [walletAddress, tokenAddress]) });
    return ethers.BigNumber.from(r).eq(1);
  } catch (_) { return false; }
}

/**
 * Verifică on-chain dacă un pair e deja în allowlist-ul user-ului.
 */
export async function isPairAllowedOnChain(walletAddress, tokenIn, tokenOut) {
  try {
    const raw = pickEvmProvider();
    const provider = raw
      ? new ethers.providers.Web3Provider(raw, 'any')
      : new ethers.providers.JsonRpcProvider(getActiveNetwork?.()?.rpcUrl || 'https://bsc-dataseed1.binance.org');
    const pmAddr = getOTAPolicyManagerAddress();
    const r = await provider.call({ to: pmAddr, data: PM_READ_IFACE.encodeFunctionData('isPairAllowed', [walletAddress, tokenIn, tokenOut]) });
    return ethers.BigNumber.from(r).eq(1);
  } catch (_) { return false; }
}

/**
 * Verifică și corectează automat policy-ul dacă parametrii on-chain sunt invalizi.
 * Cazuri detectate: maxSlippageBps < 50, maxTradeSize < 1 token (18 dec).
 * Necesită semnătură MetaMask dacă policy-ul trebuie corectat.
 * @param {string} walletAddress
 * @returns {Promise<{fixed: boolean, policy: Object}>}
 */
export async function ensurePolicyConfigured(walletAddress) {
  console.log('[ensurePolicyConfigured] START for', walletAddress);
  let currentPolicy;
  try {
    currentPolicy = await getPolicy(walletAddress);
    console.log('[ensurePolicyConfigured] getPolicy OK:', {
      maxSlippageBps: currentPolicy.maxSlippageBps,
      maxTradeSize: currentPolicy.maxTradeSize,
      cooldownSeconds: currentPolicy.cooldownSeconds,
    });
  } catch (readErr) {
    console.error('[ensurePolicyConfigured] getPolicy FAILED:', readErr?.message);
    throw readErr;
  }

  const maxTradeBN = ethers.BigNumber.from(currentPolicy.maxTradeSize || '0');
  const slippageLow = (currentPolicy.maxSlippageBps ?? 0) < 50;
  const tradeSizeLow = maxTradeBN.lt(ethers.utils.parseEther('1'));
  const needsFix = slippageLow || tradeSizeLow;

  console.log('[ensurePolicyConfigured] needsFix:', needsFix, { slippageLow, tradeSizeLow });

  if (!needsFix) return { fixed: false, policy: currentPolicy };

  const fixedData = {
    enabled: true,
    maxSlippageBps: Math.max(currentPolicy.maxSlippageBps || 0, 300),
    maxTradeSize: ethers.utils.parseEther('100').toString(),
    cooldownSeconds: Math.max(currentPolicy.cooldownSeconds || 60, 30),
  };

  console.log('[ensurePolicyConfigured] Fixing policy on-chain:', fixedData);
  await setPolicy(walletAddress, fixedData);
  console.log('[ensurePolicyConfigured] Policy fixed successfully');
  const updated = await getPolicy(walletAddress);
  return { fixed: true, policy: updated };
}

/**
 * Get token limits (read-only) – DOAR din contract (OTAPolicyManager).
 * Nu există fallback la backend: afișarea „Afișează salvate” reflectă strict ce e on-chain la getOTAPolicyManagerAddress() (env: REACT_APP_OTA_POLICY_MANAGER_ADDRESS).
 * @param {string} walletAddress - User wallet address
 * @param {string} tokenAddress - Token address
 * @returns {Promise<Object>} { maxPerTrade, dailyMax } în wei (string)
 */
export async function getTokenLimits(walletAddress, tokenAddress) {
  if (!walletAddress || !tokenAddress) {
    throw new Error('Wallet address and token address are required');
  }

  const raw = pickEvmProvider();
  const provider = raw
    ? new ethers.providers.Web3Provider(raw, 'any')
    : new ethers.providers.JsonRpcProvider(getActiveNetwork?.()?.rpcUrl || 'https://bsc-dataseed1.binance.org');
  const contractAddr = getOTAPolicyManagerAddress();
  const getTokenLimitsAbi = ['function getTokenLimits(address,address) view returns (uint256 maxPerTrade, uint256 dailyMax)'];
  const contract = new ethers.Contract(contractAddr, getTokenLimitsAbi, provider);
  const limits = await contract.getTokenLimits(walletAddress, tokenAddress);
  return {
    maxPerTrade: limits?.maxPerTrade?.toString?.() ?? '0',
    dailyMax: limits?.dailyMax?.toString?.() ?? '0'
  };
}
