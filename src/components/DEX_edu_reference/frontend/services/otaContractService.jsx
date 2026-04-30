/**
 * 🔐 OTA Contract Service - Frontend On-Chain Registration Service
 * 
 * Frontend service pentru interacțiune cu contractul UserVault on-chain:
 * - Verifică status înregistrare on-chain (direct pe BSC, fără backend)
 * - Trimite tranzacții semnate prin wallet (ethers.js)
 * - Verifică privilegii și status bot authorization
 * 
 * @module otaContractService
 */

import { ethers } from 'ethers';
import { CONTRACT_MAP, getActiveNetwork } from '../../../../contract/contractMap';
import { otaApiRequest } from '../utils/otaApiClient';
import { pickEvmProvider as pickEvmProviderSSoT } from '../../utils/evmProviderResolver.js';

/**
 * Resolve a public (read-only) BSC provider for on-chain reads.
 * We avoid window.ethereum here to prevent Phantom/connector chooser popups.
 */
function getReadProvider() {
  const rpcUrl = getActiveNetwork?.()?.rpcUrl || 'https://bsc-dataseed1.binance.org';
  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

/**
 * Get signer (wallet) for on-chain writes.
 * @returns {ethers.providers.Web3Provider|null} Provider instance or null if MetaMask not available
 */
function getSigner(signerOverride) {
  if (signerOverride) return signerOverride;
  throw new Error('Wallet signer missing. Please connect your wallet (MetaMask) first.');
}

/**
 * Get on-chain registration status for a user
 * @param {string} walletAddress - User wallet address
 * @returns {Promise<Object>} Registration status
 */
export async function getRegistrationStatus(walletAddress) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    const readProvider = getReadProvider();

    const userVaultInfo = CONTRACT_MAP?.USER_VAULT;
    const accessControlInfo = CONTRACT_MAP?.AI_TRADING_ACCESS_CONTROL;
    const bitsInfo = CONTRACT_MAP?.BITS_TOKEN;

    if (!userVaultInfo?.address || !userVaultInfo?.abi) {
      throw new Error('USER_VAULT contract not configured');
    }
    if (!accessControlInfo?.address || !accessControlInfo?.abi) {
      throw new Error('AI_TRADING_ACCESS_CONTROL contract not configured');
    }
    if (!bitsInfo?.address || !bitsInfo?.abi) {
      throw new Error('BITS_TOKEN contract not configured');
    }

    const userVault = new ethers.Contract(userVaultInfo.address, userVaultInfo.abi, readProvider);
    const bits = new ethers.Contract(bitsInfo.address, bitsInfo.abi, readProvider);

    const [
      isRegistered,
      canUseOTA,
      minBitsRaw,
      bitsDecimals,
      bitsBalRaw,
    ] = await Promise.all([
      userVault.isRegistered(walletAddress),
      userVault.canUserUseOTA(walletAddress),
      userVault.minBITSForOTA(),
      bits.decimals().catch(() => 18),
      bits.balanceOf(walletAddress),
    ]);

    let privileges = null;
    try {
      const p = await userVault.getUserPrivileges(walletAddress);
      privileges = {
        payGasWithBITS: !!p?.payGasWithBITS,
        accessAdvancedOTA: !!p?.accessAdvancedOTA,
        cashbackRate: p?.cashbackRate ? p.cashbackRate.toString() : '0',
        minBITSRequired: minBitsRaw?.toString?.() ? ethers.utils.formatUnits(minBitsRaw, bitsDecimals) : '0',
        isRegistered: !!p?.isRegistered,
        registeredAt: p?.registeredAt ? p.registeredAt.toString() : '0',
      };
    } catch (_) {
      // ok: unregistered users may still read this; if not, ignore
    }

    // Bot authorizations (per-user, stored in UserVault)
    // ABI slot index 3 = authorizedAt (creation timestamp). Contract has NO expiresAt; do NOT use authorizedAt as expiry.
    // ethers poate returna struct ca array [bot, max, used, authorizedAt, isActive] — normalizăm mereu.
    let botAuthorizations = [];
    try {
      const bots = await userVault.getUserAuthorizedBots(walletAddress);
      if (Array.isArray(bots) && bots.length > 0) {
        const auths = await Promise.all(
          bots.map(async (botAddr) => {
            try {
              const raw = await userVault.getBotAuthorization(walletAddress, botAddr);
              const a = Array.isArray(raw)
                ? {
                    botAddress: raw[0] ?? botAddr,
                    maxAmount: raw[1],
                    usedAmount: raw[2],
                    authorizedAt: raw[3],
                    isActive: raw[4],
                  }
                : {
                    botAddress: raw?.botAddress ?? botAddr,
                    maxAmount: raw?.maxAmount,
                    usedAmount: raw?.usedAmount,
                    authorizedAt: raw?.authorizedAt,
                    isActive: raw?.isActive,
                  };
              const authorizedAtRaw =
                a?.authorizedAt != null ? a.authorizedAt.toString?.() ?? String(a.authorizedAt) : '0';
              const authorizedAtNum = parseInt(authorizedAtRaw, 10) || 0;
              const isActiveBool =
                a?.isActive === true ||
                a?.isActive === 1 ||
                (a?.isActive != null && String(a.isActive).toLowerCase() === 'true');
              const maxB = ethers.BigNumber.from(a.maxAmount != null ? a.maxAmount : 0);
              const usedB = ethers.BigNumber.from(a.usedAmount != null ? a.usedAmount : 0);
              /** Contract: maxAmount 0 = nelimitat */
              const unlimitedCap = maxB.isZero();
              let remainingWei = '0';
              let amountExhausted = false;
              if (unlimitedCap) {
                remainingWei = '0';
                amountExhausted = false;
              } else {
                remainingWei = maxB.sub(usedB).toString();
                amountExhausted = ethers.BigNumber.from(remainingWei).lte(0);
              }
              const effectiveActive = isActiveBool && (unlimitedCap || ethers.BigNumber.from(remainingWei).gt(0));
              const expiredByTimestamp = false;
              return {
                botAddress: String(a.botAddress || botAddr),
                maxAmount: maxB.toString(),
                usedAmount: usedB.toString(),
                remainingWei,
                unlimitedCap,
                authorizedAt: authorizedAtRaw,
                authorizedAtSeconds: authorizedAtNum,
                authorizedAtIso: authorizedAtNum > 0 ? new Date(authorizedAtNum * 1000).toISOString() : null,
                expiresAtRaw: '0',
                expiresAtSeconds: 0,
                expiresAtIso: null,
                isActive: isActiveBool,
                expiresAtIsZero: true,
                expiredByTimestamp,
                amountExhausted,
                effectiveActive,
                reason: !isActiveBool
                  ? 'INACTIVE_FLAG'
                  : unlimitedCap
                    ? 'OK_UNLIMITED'
                    : amountExhausted
                      ? 'AMOUNT_EXHAUSTED'
                      : 'OK',
              };
            } catch {
              return {
                botAddress: botAddr,
                maxAmount: '0',
                usedAmount: '0',
                remainingWei: '0',
                unlimitedCap: false,
                authorizedAt: '0',
                expiresAtRaw: '0',
                isActive: false,
                effectiveActive: false,
                reason: 'UNKNOWN',
              };
            }
          })
        );
        botAuthorizations = auths.filter(Boolean);
      }
    } catch (_) {
      // ignore
    }

    const bitsBalance = ethers.utils.formatUnits(bitsBalRaw, bitsDecimals);
    const minBITSRequired = ethers.utils.formatUnits(minBitsRaw, bitsDecimals);
    const hasSufficientBITS = bitsBalRaw.gte(minBitsRaw);

    return {
      isRegistered: !!isRegistered,
      canUseOTA: !!canUseOTA,
      bitsBalance,
      minBITSRequired,
      hasSufficientBITS,
      privileges,
      botAuthorizations,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Register user on-chain (UserVault.register()).
 * @param {string} walletAddress - User wallet address
 * @returns {Promise<{hash: string, receipt: object}>} Transaction hash and receipt
 */
export async function registerUser(walletAddress, signerOverride = null) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    const signer = getSigner(signerOverride);
    const userVaultInfo = CONTRACT_MAP?.USER_VAULT;
    if (!userVaultInfo?.address || !userVaultInfo?.abi) throw new Error('USER_VAULT contract not configured');

    const userVault = new ethers.Contract(userVaultInfo.address, userVaultInfo.abi, signer);
    const tx = await userVault.register({ gasLimit: 200000 });
    const receipt = await tx.wait();
    return { hash: tx.hash, receipt, blockNumber: receipt.blockNumber };
  } catch (error) {
    console.error('[OTA Contract] Error registering user:', error);
    
    // Provide more specific error messages
    if (error.code === 4001 || error.message?.includes('user rejected')) {
      throw new Error('Transaction was cancelled. Please approve the transaction in MetaMask to complete registration.');
    } else if (error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient BNB for gas fees. Please add BNB to your wallet.');
    } else if (error.message?.includes('network')) {
      throw new Error('Could not reach the server. Please try again in a moment.');
    } else if (error.message?.includes('already registered')) {
      throw new Error('You are already registered for OTA on-chain.');
    }
    
    throw error;
  }
}

/**
 * Authorize bot on-chain (UserVault.authorizeBot(bot, maxAmount)).
 * NOTE: maxAmount is interpreted as 18-decimal amount (BNB-style). "0" means unlimited.
 * @param {string} walletAddress - User wallet address
 * @param {string} botAddress - Bot address
 * @param {string} maxAmount - Max amount (formatted string, "0" = unlimited)
 * @returns {Promise<{hash: string, receipt: object}>} Transaction hash and receipt
 */
export async function authorizeBot(walletAddress, botAddress, maxAmount = "0", signerOverride = null) {
  if (!walletAddress || !botAddress) {
    throw new Error('Wallet address and bot address are required');
  }

  try {
    const signer = getSigner(signerOverride);
    const userVaultInfo = CONTRACT_MAP?.USER_VAULT;
    if (!userVaultInfo?.address || !userVaultInfo?.abi) throw new Error('USER_VAULT contract not configured');

    const userVault = new ethers.Contract(userVaultInfo.address, userVaultInfo.abi, signer);
    const amt =
      !maxAmount || String(maxAmount).trim() === '0'
        ? ethers.constants.Zero
        : ethers.utils.parseEther(String(maxAmount).trim());

    const tx = await userVault.authorizeBot(botAddress, amt, { gasLimit: 250000 });
    const receipt = await tx.wait();
    return { hash: tx.hash, receipt };
  } catch (error) {
    console.error('[OTA Contract] Error authorizing bot:', error);
    throw error;
  }
}

/**
 * Check if user is registered on-chain
 * @param {string} walletAddress - User wallet address
 * @returns {Promise<boolean>} True if user is registered
 */
export async function isUserRegistered(walletAddress) {
  try {
    const status = await getRegistrationStatus(walletAddress);
    return status?.isRegistered || false;
  } catch (error) {
    console.error('[OTA Contract] Error checking registration:', error);
    return false;
  }
}

/**
 * Check if user can use OTA (registered + sufficient BITS)
 * @param {string} walletAddress - User wallet address
 * @returns {Promise<boolean>} True if user can use OTA
 */
export async function canUserUseOTA(walletAddress) {
  try {
    const status = await getRegistrationStatus(walletAddress);
    return status?.canUseOTA || false;
  } catch (error) {
    console.error('[OTA Contract] Error checking OTA access:', error);
    return false;
  }
}

/**
 * Get user privileges from on-chain
 * @param {string} walletAddress - User wallet address
 * @returns {Promise<Object|null>} User privileges or null if not registered
 */
export async function getUserPrivileges(walletAddress) {
  try {
    const status = await getRegistrationStatus(walletAddress);
    return status?.privileges || null;
  } catch (error) {
    console.error('[OTA Contract] Error getting privileges:', error);
    return null;
  }
}

/**
 * Read-only precheck for Direct Entry execution wiring.
 * Verifies that UserVault has dexWrapper set and executor bot is authorized.
 * This avoids opaque "revert (0x)" failures when backend tries executeTrade.
 *
 * @param {string|null} executorAddress - Executor bot address from backend (/ai-trading/bot-address)
 * @returns {Promise<{dexWrapper: string|null, hasDexWrapper: boolean, executorAddress: string|null, executorAuthorized: boolean|null}>}
 */
export async function getDirectEntryExecutionWiringStatus(executorAddress = null, userAddress = null) {
  try {
    const userVaultInfo = CONTRACT_MAP?.USER_VAULT;
    if (!userVaultInfo?.address || !userVaultInfo?.abi) {
      throw new Error('USER_VAULT contract not configured');
    }

    const readProvider = getReadProvider();
    const userVault = new ethers.Contract(userVaultInfo.address, userVaultInfo.abi, readProvider);

    let dexWrapper = null;
    try {
      dexWrapper = await userVault.dexWrapper();
    } catch (_) {
      dexWrapper = null;
    }
    const hasDexWrapper = !!(dexWrapper && /^0x[a-fA-F0-9]{40}$/.test(String(dexWrapper)) && String(dexWrapper) !== ethers.constants.AddressZero);

    // IMPORTANT: wiring check must use OTAAutoExecutor address (contract caller),
    // not bot EOA address (transaction signer). Fetch from backend if available.
    let resolvedAutoExecutor = null;
    try {
      const info = await otaApiRequest('/ai-trading/bot-address', { method: 'GET', timeoutMs: 10000 });
      const fromApi = info?.autoExecutorAddress || info?.executorAddress || null;
      if (fromApi && /^0x[a-fA-F0-9]{40}$/.test(String(fromApi))) {
        resolvedAutoExecutor = String(fromApi);
      }
    } catch (_) { /* non-blocking */ }

    let executorAuthorized = null;
    const ex = resolvedAutoExecutor
      || ((executorAddress && /^0x[a-fA-F0-9]{40}$/.test(String(executorAddress))) ? String(executorAddress) : null);
    if (ex) {
      try {
        executorAuthorized = !!(await userVault.authorizedExecutors(ex));
      } catch (_) {
        executorAuthorized = null;
      }
    }

    let pancakeRouter = null;
    try {
      pancakeRouter = await userVault.pancakeRouter();
    } catch (_) {
      pancakeRouter = null;
    }
    const hasPancakeRouter = !!(pancakeRouter && /^0x[a-fA-F0-9]{40}$/.test(String(pancakeRouter)) && String(pancakeRouter) !== ethers.constants.AddressZero);

    let executorBotAuth = null;
    const autoExecAddr = CONTRACT_MAP?.OTA_AUTO_EXECUTOR?.address;
    const addrForBotAuth = autoExecAddr || ex;
    if (addrForBotAuth && userAddress) {
      try {
        const auth = await userVault.getBotAuthorization(userAddress, addrForBotAuth);
        executorBotAuth = {
          maxAmount: auth?.maxAmount?.toString() || '0',
          usedAmount: auth?.usedAmount?.toString() || '0',
          isActive: !!auth?.isActive,
        };
      } catch (_) { executorBotAuth = null; }
    }

    let callerBotAuth = null;
    if (executorAddress && userAddress && executorAddress.toLowerCase() !== (addrForBotAuth || '').toLowerCase()) {
      try {
        const auth = await userVault.getBotAuthorization(userAddress, executorAddress);
        callerBotAuth = {
          maxAmount: auth?.maxAmount?.toString() || '0',
          usedAmount: auth?.usedAmount?.toString() || '0',
          isActive: !!auth?.isActive,
        };
      } catch (_) { callerBotAuth = null; }
    }

    let execRegisteredInAC = null;
    if (addrForBotAuth) {
      try {
        const acAddr = await userVault.accessControl();
        if (acAddr && acAddr !== ethers.constants.AddressZero) {
          const ac = new ethers.Contract(acAddr, [
            'function isAuthorizedBot(address) view returns (bool)',
          ], readProvider);
          execRegisteredInAC = await ac.isAuthorizedBot(addrForBotAuth);
        }
      } catch (_) { execRegisteredInAC = null; }
    }

    return { dexWrapper, hasDexWrapper, executorAddress: ex, executorAuthorized, pancakeRouter, hasPancakeRouter, executorBotAuth, callerBotAuth, execRegisteredInAC };
  } catch (error) {
    throw error;
  }
}

/**
 * Register a bot address in the AITradingAccessControl contract.
 * Uses authorizeBot(address, uint8 permLevel, uint256 maxTradesPerHour, uint256 maxAmountPerTrade).
 * Required before UserVault.authorizeBot can be called for that address.
 */
export async function registerBotInAccessControl(botAddress) {
  const userVaultInfo = CONTRACT_MAP?.USER_VAULT;
  if (!userVaultInfo?.address || !userVaultInfo?.abi) throw new Error('USER_VAULT contract not configured');
  if (!botAddress) throw new Error('Bot address required');

  const ethereum = pickEvmProviderSSoT();
  if (!ethereum) throw new Error('No EVM wallet detected. Please install MetaMask.');
  let accounts = await ethereum.request({ method: 'eth_accounts' }).catch(() => []);
  if (!accounts?.length) {
    accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  }
  const provider = new ethers.providers.Web3Provider(ethereum, 'any');
  const signer = provider.getSigner();

  const userVault = new ethers.Contract(userVaultInfo.address, userVaultInfo.abi, provider);
  const acAddr = await userVault.accessControl();
  if (!acAddr || acAddr === ethers.constants.AddressZero) throw new Error('AccessControl not configured on UserVault');

  const ac = new ethers.Contract(acAddr, [
    'function authorizeBot(address,uint8,uint256,uint256)',
    'function isAuthorizedBot(address) view returns (bool)',
  ], signer);

  const already = await ac.isAuthorizedBot(botAddress).catch(() => false);
  if (already) return null;

  const tx = await ac.authorizeBot(botAddress, 2, 100, ethers.utils.parseEther('1000'), { gasLimit: 300000 });
  await tx.wait();
  return tx;
}

/**
 * Re-authorize bot with a higher maxAmount. Opens MetaMask automatically.
 */
export async function reauthorizeBotOnVault(botAddress, maxAmount) {
  const userVaultInfo = CONTRACT_MAP?.USER_VAULT;
  if (!userVaultInfo?.address || !userVaultInfo?.abi) throw new Error('USER_VAULT contract not configured');
  if (!botAddress) throw new Error('Bot address required');

  const ethereum = pickEvmProviderSSoT();
  if (!ethereum) throw new Error('No EVM wallet detected. Please install MetaMask.');
  let accounts = await ethereum.request({ method: 'eth_accounts' }).catch(() => []);
  if (!accounts?.length) {
    accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  }
  const provider = new ethers.providers.Web3Provider(ethereum, 'any');
  const signer = provider.getSigner();

  const userVault = new ethers.Contract(userVaultInfo.address, userVaultInfo.abi, signer);
  const amt = !maxAmount || String(maxAmount).trim() === '0'
    ? ethers.constants.Zero
    : ethers.utils.parseEther(String(maxAmount).trim());
  const tx = await userVault.authorizeBot(botAddress, amt, { gasLimit: 250000 });
  await tx.wait();
  return tx;
}

/**
 * Set the PancakeSwap router on UserVault. Requires owner signature.
 * Opens MetaMask automatically if needed.
 */
export async function setPancakeRouterOnVault(routerAddress) {
  const userVaultInfo = CONTRACT_MAP?.USER_VAULT;
  if (!userVaultInfo?.address || !userVaultInfo?.abi) throw new Error('USER_VAULT contract not configured');
  if (!routerAddress || !/^0x[a-fA-F0-9]{40}$/.test(routerAddress)) throw new Error('Invalid router address');

  const ethereum = pickEvmProviderSSoT();
  if (!ethereum) throw new Error('No EVM wallet detected. Please install MetaMask.');
  let accounts = await ethereum.request({ method: 'eth_accounts' }).catch(() => []);
  if (!accounts?.length) {
    accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  }
  const provider = new ethers.providers.Web3Provider(ethereum, 'any');
  const signer = provider.getSigner();

  const userVault = new ethers.Contract(userVaultInfo.address, userVaultInfo.abi, signer);
  const tx = await userVault.setPancakeRouter(routerAddress, { gasLimit: 150000 });
  await tx.wait();
  return tx;
}

const otaContractService = {
  getRegistrationStatus,
  registerUser,
  authorizeBot,
  isUserRegistered,
  canUserUseOTA,
  getUserPrivileges,
  getDirectEntryExecutionWiringStatus
};

export default otaContractService;
