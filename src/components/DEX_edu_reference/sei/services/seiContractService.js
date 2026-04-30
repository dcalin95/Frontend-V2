/**
 * seiContractService.js – Apeluri contracte CosmWasm pe SEI (execute + query).
 * Folosește CosmJS cu signer din SeiWalletContext.getOfflineSigner(). Nu folosește ethers.
 * @module seiContractService
 */

import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { toUtf8 } from '@cosmjs/encoding';
import { SEI_CONTRACTS, SWAP_EXECUTOR_MSGS } from '../seiContractConfig';
import { SEI_REST_LIST, SEI_RPC_LIST, SEI_NATIVE_DENOM } from '../seiConfig';

// Platform fee: 0.15% din fiecare swap → merge la adresa proprietarului DEX
const PLATFORM_FEE_PCT = 0.0015;
const PLATFORM_FEE_ADDRESS = process.env.REACT_APP_PLATFORM_FEE_ADDRESS || 'sei1dan7dtc9mect9807kptfwu8kj3d87qm85jkjsh';
const MIN_FEE_USEI = 1000; // minim 0.001 SEI ca să nu trimitem dust

/**
 * Query contract CosmWasm (REST/LCD).
 * @param {string} contractAddress - Adresa contractului
 * @param {object} queryMsg - QueryMsg (ex. { config: {} })
 * @returns {Promise<object>} Răspunsul query
 */
export async function queryContract(contractAddress, queryMsg) {
  if (!contractAddress) {
    throw new Error('SEI contract address not set. Deploy contract and set REACT_APP_SEI_SWAP_EXECUTOR_ADDRESS.');
  }
  const queryB64 = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(JSON.stringify(queryMsg))))
    : Buffer.from(JSON.stringify(queryMsg), 'utf8').toString('base64');
  const restList = SEI_REST_LIST?.length ? SEI_REST_LIST : ['https://rest.sei-apis.com', 'https://sei-api.polkachu.com'];
  let lastErr = null;
  for (const restUrl of restList) {
    const restBase = restUrl.replace(/\/$/, '');
    try {
      const res = await fetch(`${restBase}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${queryB64}`);
      if (!res.ok) { lastErr = new Error(`SEI query failed: ${res.status}`); continue; }
      const data = await res.json();
      return data?.data || data;
    } catch (e) {
      lastErr = new Error(`SEI LCD fetch failed (${restBase}): ${e?.message || e}`);
    }
  }
  throw lastErr || new Error('All SEI REST endpoints failed');
}

/** Fee default pentru execute (SEI usei). Mărit pentru Atlantic-2 ca tx-ul să treacă. */
const DEFAULT_FEE = {
  amount: [{ denom: SEI_NATIVE_DENOM || 'usei', amount: '1000000' }],
  gas: '1500000',
};

/**
 * Execute swap pe SEI (contract swap executor). Semnare prin signer din SeiWalletContext.getOfflineSigner().
 * @param {object} params - { senderAddress, tokenIn, tokenOut, amountIn, minAmountOut, signer }
 * @returns {Promise<{ txHash: string }>}
 */
// Astroport Router on SEI pacific-1 mainnet
const ASTROPORT_ROUTER = 'sei16awrdehvla6kqq2dk5v4m6ze83qfg8trpw55qc8rvfrg9qdmfvhq7hj6x9';

/**
 * Build Astroport asset_info from denom string.
 * Native tokens: { native_token: { denom } }
 * CW20 tokens: { token: { contract_addr } } (starts with sei1... and is 63 chars)
 */
function assetInfo(denom) {
  const isCw20 = denom.startsWith('sei1') && denom.length > 40;
  return isCw20
    ? { token: { contract_addr: denom } }
    : { native_token: { denom } };
}

export async function executeSwap(params) {
  const { senderAddress, tokenIn, tokenOut, amountIn, minAmountOut, signer, operations } = params;
  if (!signer) {
    throw new Error('executeSwap: signer required. Use getOfflineSigner() from useSeiWallet().');
  }

  // Încearcă RPC-urile în ordine — polkachu e instabil
  const rpcList = SEI_RPC_LIST?.length ? SEI_RPC_LIST : ['https://rpc.sei-apis.com', 'https://rpc-sei.stingray.plus', 'https://sei-rpc.polkachu.com'];
  let client = null;
  let lastRpcErr = null;
  for (const rpcUrl of rpcList) {
    try {
      client = await SigningCosmWasmClient.connectWithSigner(rpcUrl.replace(/\/$/, ''), signer, {
        gasPrice: { denom: SEI_NATIVE_DENOM || 'usei', amount: '0.025' },
      });
      break;
    } catch (e) { lastRpcErr = e; }
  }
  if (!client) throw new Error(`Cannot connect to SEI RPC: ${lastRpcErr?.message || 'all endpoints failed'}`);

  try {
    const amountInNum = Number(amountIn);
    const isNative = !tokenIn.startsWith('sei1') || tokenIn.length <= 40;

    // Calculează platform fee (0.15%) — doar pentru tokeni nativi (usei, IBC)
    const feeAmount = Math.floor(amountInNum * PLATFORM_FEE_PCT);
    const collectFee = isNative && feeAmount >= MIN_FEE_USEI && PLATFORM_FEE_ADDRESS && PLATFORM_FEE_ADDRESS !== senderAddress;
    const swapAmount = collectFee ? String(amountInNum - feeAmount) : String(amountIn);

    // Astroport Router msg — suportă multi-hop dacă `operations` e furnizat
    const swapOperations = operations || [
      { astro_swap: { offer_asset_info: assetInfo(tokenIn), ask_asset_info: assetInfo(tokenOut) } },
    ];
    const routerMsg = {
      execute_swap_operations: {
        operations: swapOperations,
        max_spread: '0.5',
        ...(minAmountOut && Number(minAmountOut) > 0 ? { minimum_receive: String(minAmountOut) } : {}),
        to: senderAddress,
      },
    };

    let result;

    if (collectFee) {
      // Trimitere într-o singură tranzacție: MsgSend (fee) + MsgExecuteContract (swap)
      const msgs = [
        {
          typeUrl: '/cosmos.bank.v1beta1.MsgSend',
          value: {
            fromAddress: senderAddress,
            toAddress: PLATFORM_FEE_ADDRESS,
            amount: [{ denom: tokenIn, amount: String(feeAmount) }],
          },
        },
        {
          typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
          value: {
            sender: senderAddress,
            contract: ASTROPORT_ROUTER,
            msg: toUtf8(JSON.stringify(routerMsg)),
            funds: [{ denom: tokenIn, amount: swapAmount }],
          },
        },
      ];
      result = await client.signAndBroadcast(senderAddress, msgs, DEFAULT_FEE, '');
      if (result.code !== 0) throw new Error(`Tx failed: ${result.rawLog}`);
    } else {
      // Swap simplu fără fee (amount prea mic sau token nesuportat)
      const funds = isNative ? [{ denom: tokenIn, amount: swapAmount }] : [];
      result = await client.execute(senderAddress, ASTROPORT_ROUTER, routerMsg, DEFAULT_FEE, '', funds);
    }

    return {
      txHash: result.transactionHash,
      platformFeeUsei: collectFee ? feeAmount : 0,
    };
  } catch (err) {
    const msg = err?.message || String(err);
    const raw = err?.rawLog || err?.data?.message || err?.response?.data?.message;
    const detail = raw ? `${msg} (${typeof raw === 'string' ? raw : JSON.stringify(raw).slice(0, 200)})` : msg;
    throw new Error(detail);
  } finally {
    client.disconnect();
  }
}

/** Returnează fee-ul platformei pentru un amount dat (pentru afișare în UI). */
export function calcPlatformFee(amountIn, tokenIn) {
  const n = Number(amountIn);
  if (!n || n <= 0) return { feeAmount: 0, feeUsd: 0, feePct: PLATFORM_FEE_PCT };
  const isNative = !tokenIn?.startsWith('sei1') || tokenIn?.length <= 40;
  const feeAmount = Math.floor(n * PLATFORM_FEE_PCT);
  const collectFee = isNative && feeAmount >= MIN_FEE_USEI;
  return { feeAmount: collectFee ? feeAmount : 0, feePct: PLATFORM_FEE_PCT, willCollect: collectFee };
}

export { PLATFORM_FEE_PCT, PLATFORM_FEE_ADDRESS };

export { SEI_CONTRACTS, SWAP_EXECUTOR_MSGS };
