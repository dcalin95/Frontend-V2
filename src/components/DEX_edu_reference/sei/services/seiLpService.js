/**
 * seiLpService.js - Liquidity Providing on Astroport SEI (XYK pools).
 * Operations: getPoolInfo, getLpPosition, provideLiquidity, withdrawLiquidity.
 * Signing through OfflineSigner from SeiWalletContext.getOfflineSigner().
 * @module seiLpService
 */

import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { SEI_RPC_LIST, SEI_REST_LIST } from '../seiConfig';

const DEFAULT_FEE = {
  amount: [{ denom: 'usei', amount: '1500000' }],
  gas: '2000000',
};

/**
 * Query a CosmWasm contract through REST with fallback chain.
 */
async function queryContract(contractAddress, queryMsg) {
  const queryB64 = btoa(unescape(encodeURIComponent(JSON.stringify(queryMsg))));
  const restList = SEI_REST_LIST?.length ? SEI_REST_LIST : ['https://rest.sei-apis.com', 'https://sei-api.polkachu.com'];
  let lastErr = null;
  for (const restUrl of restList) {
    const rest = restUrl.replace(/\/$/, '');
    try {
      const res = await fetch(`${rest}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${queryB64}`);
      if (!res.ok) { lastErr = new Error(`Query failed ${res.status}`); continue; }
      const data = await res.json();
      return data?.data || data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All REST endpoints failed');
}

/**
 * Returns pool info: reserves, current ratio, total LP shares.
 * @param {object} pool - from ASTROPORT_POOLS
 * @returns {{ atomReserve, seiReserve, totalShares, seiPerAtom, atomPerSei, tvlSei }}
 */
export async function getPoolInfo(pool) {
  const data = await queryContract(pool.pairAddress, { pool: {} });

  let atomReserve = 0;
  let seiReserve = 0;

  for (const asset of data.assets || []) {
    const denom = asset.info?.native_token?.denom || asset.info?.token?.contract_addr || '';
    const amount = Number(asset.amount || 0);
    if (denom === 'usei') seiReserve = amount;
    else atomReserve = amount;
  }

  const totalShares = Number(data.total_share || 0);
  const seiPerAtom = atomReserve > 0 ? seiReserve / atomReserve : 0;
  const atomPerSei = seiReserve > 0 ? atomReserve / seiReserve : 0;
  const tvlSei = seiReserve * 2; // both reserves expressed as SEI equivalent

  return {
    atomReserve: atomReserve / 1e6,
    seiReserve: seiReserve / 1e6,
    totalShares,
    seiPerAtom,
    atomPerSei,
    tvlSei: tvlSei / 1e6,
  };
}

/**
 * Returns the wallet LP token balance + value in SEI/ATOM.
 * @param {string} walletAddress
 * @param {object} pool - from ASTROPORT_POOLS
 * @returns {{ lpBalance, seiShare, atomShare, sharePercent }}
 */
export async function getLpPosition(walletAddress, pool) {
  if (!walletAddress || !pool.lpTokenAddress) {
    return { lpBalance: 0, seiShare: 0, atomShare: 0, sharePercent: 0 };
  }

  const [balanceData, poolInfo] = await Promise.all([
    queryContract(pool.lpTokenAddress, { balance: { address: walletAddress } }),
    getPoolInfo(pool),
  ]);

  const lpBalance = Number(balanceData?.balance || 0);
  if (lpBalance === 0 || poolInfo.totalShares === 0) {
    return { lpBalance: 0, seiShare: 0, atomShare: 0, sharePercent: 0 };
  }

  const sharePercent = (lpBalance / poolInfo.totalShares) * 100;
  const seiShare = (lpBalance / poolInfo.totalShares) * poolInfo.seiReserve;
  const atomShare = (lpBalance / poolInfo.totalShares) * poolInfo.atomReserve;

  return { lpBalance, seiShare, atomShare, sharePercent };
}

/**
 * Adds liquidity to the SEI/ATOM XYK pool.
 * @param {object} params
 * @param {string} params.walletAddress - signer address
 * @param {object} params.signer - OfflineSigner from getOfflineSigner()
 * @param {object} params.pool - from ASTROPORT_POOLS
 * @param {number} params.seiAmount - SEI to deposit (in SEI, for example: 10.5)
 * @param {number} params.atomAmount - ATOM to deposit (in ATOM, for example: 0.63)
 * @param {number} [params.slippageTolerance=0.01] - default 1%
 * @returns {Promise<{ txHash: string }>}
 */
async function connectSigningClient(signer) {
  const rpcList = SEI_RPC_LIST?.length ? SEI_RPC_LIST : ['https://rpc.sei-apis.com', 'https://rpc-sei.stingray.plus', 'https://sei-rpc.polkachu.com'];
  let lastErr = null;
  for (const rpcUrl of rpcList) {
    try {
      const client = await SigningCosmWasmClient.connectWithSigner(rpcUrl.replace(/\/$/, ''), signer, {
        gasPrice: { denom: 'usei', amount: '0.025' },
      });
      return client;
    } catch (e) { lastErr = e; }
  }
  throw new Error(`Cannot connect to SEI RPC: ${lastErr?.message || 'all failed'}`);
}

export async function provideLiquidity({ walletAddress, signer, pool, seiAmount, atomAmount, slippageTolerance = 0.01 }) {
  if (!signer) throw new Error('Signer required. Connect Keplr.');
  if (!seiAmount || seiAmount <= 0) throw new Error('SEI amount invalid.');
  if (!atomAmount || atomAmount <= 0) throw new Error('ATOM amount invalid.');
  const client = await connectSigningClient(signer);

  const usei = String(Math.floor(seiAmount * 1e6));
  const uatom = String(Math.floor(atomAmount * 1e6));

  const msg = {
    provide_liquidity: {
      assets: [
        { info: { native_token: { denom: pool.quoteDenom } }, amount: uatom },
        { info: { native_token: { denom: 'usei' } }, amount: usei },
      ],
      slippage_tolerance: String(slippageTolerance),
      auto_stake: false,
    },
  };

  // Funds are sent in ascending denom order (Cosmos convention).
  const funds = [
    { denom: pool.quoteDenom, amount: uatom },
    { denom: 'usei', amount: usei },
  ].sort((a, b) => a.denom.localeCompare(b.denom));

  try {
    const result = await client.execute(walletAddress, pool.pairAddress, msg, DEFAULT_FEE, '', funds);
    return { txHash: result.transactionHash };
  } finally {
    client.disconnect();
  }
}

/**
 * Withdraws liquidity from the SEI/ATOM XYK pool.
 * @param {object} params
 * @param {string} params.walletAddress
 * @param {object} params.signer - OfflineSigner
 * @param {object} params.pool - from ASTROPORT_POOLS
 * @param {number} params.lpAmount - LP tokens to burn (raw units, for example: 1000000)
 * @returns {Promise<{ txHash: string }>}
 */
export async function withdrawLiquidity({ walletAddress, signer, pool, lpAmount }) {
  if (!signer) throw new Error('Signer required. Connect Keplr.');
  if (!lpAmount || lpAmount <= 0) throw new Error('LP amount invalid.');

  const client = await connectSigningClient(signer);

  // For CW20 LP tokens: send an embedded `withdraw_liquidity` message.
  const withdrawMsg = { withdraw_liquidity: { assets: [] } };
  const withdrawB64 = btoa(unescape(encodeURIComponent(JSON.stringify(withdrawMsg))));

  const msg = {
    send: {
      contract: pool.pairAddress,
      amount: String(Math.floor(lpAmount)),
      msg: withdrawB64,
    },
  };

  try {
    const result = await client.execute(walletAddress, pool.lpTokenAddress, msg, DEFAULT_FEE, '', []);
    return { txHash: result.transactionHash };
  } finally {
    client.disconnect();
  }
}

/**
 * Calculates the ATOM required to add liquidity based on the current pool ratio.
 * @param {number} seiAmount - desired SEI
 * @param {object} poolInfo - from getPoolInfo()
 * @returns {number} atomAmount
 */
export function calcAtomForSei(seiAmount, poolInfo) {
  if (!poolInfo || poolInfo.seiPerAtom === 0) return 0;
  return seiAmount * poolInfo.atomPerSei;
}

/**
 * Calculates the SEI required to add liquidity based on the current ratio.
 * @param {number} atomAmount - desired ATOM
 * @param {object} poolInfo - from getPoolInfo()
 * @returns {number} seiAmount
 */
export function calcSeiForAtom(atomAmount, poolInfo) {
  if (!poolInfo || poolInfo.atomPerSei === 0) return 0;
  return atomAmount * poolInfo.seiPerAtom;
}

/**
 * Estimates annual APY based on 30-day fees (rough estimate).
 * Formula: APY = (volume30d * feePercent / tvl) * (365 / 30) * 100
 * @param {number} volume30dUsd - 30-day volume in USD
 * @param {number} tvlUsd - current TVL in USD
 * @param {number} [feePercent=0.3] - pool fee in percent
 * @returns {number} APY in percent
 */
export function estimateApy(volume30dUsd, tvlUsd, feePercent = 0.3) {
  if (!tvlUsd || tvlUsd <= 0) return 0;
  const fees30d = volume30dUsd * (feePercent / 100);
  return (fees30d / tvlUsd) * (365 / 30) * 100;
}
