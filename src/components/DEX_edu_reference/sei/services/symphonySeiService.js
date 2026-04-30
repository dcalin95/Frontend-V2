/**
 * symphonySeiService.js – Integrare Symphony SDK pe Sei (agregator DEX).
 * Quote: getRoute. Execute: route.swap() cu wallet EVM pe Sei (chain 1329).
 * @see docs/SEI_DEX_AND_AGGREGATORS.md
 */

import { createWalletClient, custom } from 'viem';
import { sei } from 'viem/chains';
import { Symphony } from 'symphony-sdk/viem';
import { CLOB_SEI_RPC, CLOB_SEI_RPC_FALLBACKS, CLOB_SEI_CHAIN_ID, SEI_EVM_TOKENS } from '../../clob-sei/config';

const SEI_CHAIN_ID_NUM = Number(CLOB_SEI_CHAIN_ID);

/**
 * Creează un Symphony instance configurat pentru Sei (fără wallet – doar pentru getRoute).
 */
function createSymphonyForSei() {
  return new Symphony({
    options: {
      chainId: SEI_CHAIN_ID_NUM,
      rpcUrl: CLOB_SEI_RPC || CLOB_SEI_RPC_FALLBACKS[0],
      slippage: '1',
    },
  });
}

/**
 * Obține adresa token pentru simbol (wSEI, USDC, USDT, WETH).
 * Pentru native SEI, Symphony folosește "0x0".
 */
export function getSymphonyTokenAddress(symbol) {
  if (symbol === 'SEI' || symbol === 'native') return '0x0';
  const key = symbol === 'WSEI' ? 'wSEI' : symbol;
  const t = SEI_EVM_TOKENS[key];
  return t?.address?.toLowerCase() || null;
}

/**
 * Quote swap via Symphony (agregator). Nu necesită wallet.
 * @param {string} tokenInAddress - Adresă token in (sau "0x0" pentru SEI native)
 * @param {string} tokenOutAddress - Adresă token out
 * @param {string} amountIn - Amount string (ex: "1.5")
 * @returns {Promise<{ route: import('symphony-sdk/viem').Route, amountOutFormatted: string, amountOut: bigint, includesNative: boolean } | null>}
 */
export async function getSymphonyRoute(tokenInAddress, tokenOutAddress, amountIn) {
  if (!tokenInAddress || !tokenOutAddress || !amountIn || Number(amountIn) <= 0) return null;
  const symphony = createSymphonyForSei();
  const route = await symphony.getRoute(tokenInAddress, tokenOutAddress, amountIn, { isRaw: false });
  if (!route?.route) return null;
  return {
    route,
    amountOutFormatted: route.amountOutFormatted ?? '',
    amountOut: route.amountOut ?? 0n,
    includesNative: route.includesNative ?? false,
  };
}

/**
 * Creează un viem WalletClient pentru Sei din provider-ul injectat (ex: window.ethereum).
 * Trebuie să fie deja pe chain 1329 (switch în UI înainte).
 * @param {import('viem').EIP1193Provider} provider - ex: window.ethereum
 * @returns {Promise<{ walletClient: import('viem').WalletClient, account: import('viem').Address } | null>}
 */
export async function createSeiWalletClient(provider) {
  if (!provider?.request) return null;
  const walletClient = createWalletClient({
    transport: custom(provider),
    chain: sei,
  });
  const accounts = await walletClient.getAddresses();
  const account = accounts?.[0] ?? null;
  if (!account) return null;
  return { walletClient, account };
}

/**
 * Execută swap-ul Symphony cu wallet-ul EVM conectat pe Sei.
 * @param {import('symphony-sdk/viem').Route} route - Instanța Route returnată de getSymphonyRoute
 * @param {import('viem').WalletClient} walletClient - Wallet client (Sei)
 * @param {number} [slippageBps=100] - Slippage în basis points (100 = 1%)
 * @returns {Promise<{ success: boolean, txHash?: string, error?: string }>}
 */
export async function executeSymphonySwap(route, walletClient, slippageBps = 100) {
  if (!route?.swap) {
    return { success: false, error: 'Invalid route object' };
  }
  if (!walletClient) {
    return { success: false, error: 'Wallet not connected. Connect MetaMask to Sei (chain 1329).' };
  }
  try {
    const result = await route.swap({
      walletClient,
      slippage: {
        slippageAmount: slippageBps,
        isBps: true,
      },
      options: {
        skipApproval: false,
        skipCheckApproval: false,
        wait: 1,
      },
    });
    const txHash = result?.swapReceipt?.transactionHash ?? result?.transactionHash;
    return { success: true, txHash };
  } catch (err) {
    const message = err?.message ?? err?.shortMessage ?? String(err);
    return { success: false, error: message };
  }
}
