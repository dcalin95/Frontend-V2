/* eslint-disable */
/**
 * stxContractService.js – Apeluri contracte Clarity pe Stacks.
 * Semnare: @stacks/connect openContractCall + Leather (sau alt provider injectat).
 * @module stxContractService
 */

import { openContractCall } from '@stacks/connect';
import { AnchorMode, contractPrincipalCV, uintCV, standardPrincipalCV } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { STX_CONTRACTS } from '../stxContractConfig';
import { STX_API, stxNetwork } from '../stxConfig';
import { parseStacksContractId, getSip10FullContractIdForSymbol } from '../stxStacksPrincipals';

/**
 * Query read-only din contract (prin Stacks API Hiro).
 * @param {string} contractFullId - SP....addr.contract-name
 * @param {string} functionName
 * @param {object} args - body JSON pentru Hiro (map, array args — depinde de funcție)
 * @returns {Promise<object>}
 */
export async function readContract(contractFullId, functionName, args = {}) {
  if (!contractFullId) {
    throw new Error('STX contract address not set. Deploy contract and set REACT_APP_STX_*_ADDRESS.');
  }
  const { address, contractName } = parseStacksContractId(contractFullId);
  const url = `${STX_API}/v2/contracts/call-read/${address}/${contractName}/${encodeURIComponent(functionName)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  }).catch(() => null);
  if (!res?.ok) throw new Error(`STX read failed: ${res?.status || 'network'}`);
  return res.json();
}

function getStacksNetwork() {
  return stxNetwork.chainId === 'testnet' ? STACKS_TESTNET : STACKS_MAINNET;
}

function principalCvFromSymbol(symbol) {
  const full = getSip10FullContractIdForSymbol(symbol);
  if (!full) {
    throw new Error(
      `Missing SIP-010 contract id for "${symbol}". Set REACT_APP_STX_SIP010_${String(symbol).toUpperCase()} in env (see docs/STX_FRONTEND_ENV.md).`
    );
  }
  const { address, contractName } = parseStacksContractId(full);
  return contractPrincipalCV(address, contractName);
}

function parseDexWrapperId() {
  const raw = STX_CONTRACTS.DEX_WRAPPER || STX_CONTRACTS.AI_TRADING_EXECUTOR;
  if (!raw) {
    throw new Error(
      'Set REACT_APP_STX_DEX_WRAPPER_ADDRESS (recommended) or REACT_APP_STX_AI_TRADING_EXECUTOR_ADDRESS after deploy.'
    );
  }
  return parseStacksContractId(raw);
}

/**
 * @param {object} backendPayload - răspuns backend txForSigning (flexibil)
 * @returns {{ contractAddress: string, contractName: string, functionName: string, functionArgs: unknown[] }|null}
 */
function normalizeBackendContractCall(backendPayload) {
  if (!backendPayload || typeof backendPayload !== 'object') return null;
  const p = backendPayload.msg?.execute_swap ?? backendPayload.execute_swap ?? backendPayload;
  const contractAddress = p.contractAddress ?? p.contract_address;
  const contractName = p.contractName ?? p.contract_name;
  const functionName = p.functionName ?? p.function_name;
  let functionArgs = p.functionArgs ?? p.function_args;
  if (contractAddress && contractName && functionName && Array.isArray(functionArgs)) {
    return { contractAddress, contractName, functionName, functionArgs };
  }
  return null;
}

/**
 * Execute swap pe Stacks (dex-wrapper.swap sau payload de la backend).
 * @param {object} params
 * @param {string} params.senderAddress
 * @param {string} params.tokenIn
 * @param {string} params.tokenOut
 * @param {string} params.amountIn - unități minime (string)
 * @param {string} params.minAmountOut - unități minime (string)
 * @param {object} [params.signer] - ignorat; păstrat pentru compat API
 * @param {object} [params.stacksProvider] - Leather / Stacks provider (opțional)
 * @param {object} [params.backendPayload] - txForSigning de la backend
 * @returns {Promise<{ txHash: string }>}
 */
export async function executeSwap(params) {
  const { senderAddress, tokenIn, tokenOut, amountIn, minAmountOut, stacksProvider, backendPayload } =
    params || {};

  if (!senderAddress) {
    throw new Error('executeSwap: senderAddress required.');
  }

  const backendCall = normalizeBackendContractCall(backendPayload);
  const network = getStacksNetwork();

  if (backendCall) {
    return new Promise((resolve, reject) => {
      openContractCall(
        {
          network,
          anchorMode: AnchorMode.Any,
          contractAddress: backendCall.contractAddress,
          contractName: backendCall.contractName,
          functionName: backendCall.functionName,
          functionArgs: backendCall.functionArgs,
          stxAddress: senderAddress,
          onFinish: (data) => {
            const txHash = data?.txId ?? data?.txid ?? data?.txHash ?? data?.transaction?.tx_id;
            if (!txHash) {
              reject(new Error('executeSwap: wallet finished without tx id.'));
              return;
            }
            resolve({ txHash: String(txHash) });
          },
          onCancel: () => reject(new Error('executeSwap: user cancelled.')),
        },
        stacksProvider || undefined
      );
    });
  }

  const { address: dexAddr, contractName: dexName } = parseDexWrapperId();

  let amountInBn;
  let minOutBn;
  try {
    amountInBn = BigInt(String(amountIn));
    minOutBn = BigInt(String(minAmountOut || '0'));
  } catch {
    throw new Error('executeSwap: amountIn / minAmountOut must be integer strings (minimal units).');
  }

  const tokenInCv = principalCvFromSymbol(tokenIn);
  const tokenOutCv = principalCvFromSymbol(tokenOut);
  const recipientCv = standardPrincipalCV(senderAddress);

  const functionArgs = [tokenInCv, tokenOutCv, uintCV(amountInBn), uintCV(minOutBn), recipientCv];

  return new Promise((resolve, reject) => {
    openContractCall(
      {
        network,
        anchorMode: AnchorMode.Any,
        contractAddress: dexAddr,
        contractName: dexName,
        functionName: 'swap',
        functionArgs,
        stxAddress: senderAddress,
        onFinish: (data) => {
          const txHash = data?.txId ?? data?.txid ?? data?.txHash ?? data?.transaction?.tx_id;
          if (!txHash) {
            reject(new Error('executeSwap: wallet finished without tx id.'));
            return;
          }
          resolve({ txHash: String(txHash) });
        },
        onCancel: () => reject(new Error('executeSwap: user cancelled.')),
      },
      stacksProvider || undefined
    );
  });
}

export { STX_CONTRACTS };
