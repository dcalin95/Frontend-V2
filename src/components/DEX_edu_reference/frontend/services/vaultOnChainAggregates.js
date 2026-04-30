/**
 * Sold curent UserVault din contract (eth_call): getUserBalances → sold real per token.
 * Nu folosește eth_getLogs, nu folosește getVault (totalDeposited corupt – include swap-uri interne).
 * USD = sumă(token_amount × preț) via tokenPriceService.
 */
import { ethers } from 'ethers';
import { CONTRACT_MAP, getActiveNetwork } from '../../../../contract/contractMap';
import { TOKEN_REGISTRY } from './tokenRegistry';
import tokenPriceService from './tokenPriceService';

const BSC_CHAIN = Object.freeze({ chainId: 56, name: 'bsc' });

function createReadProvider() {
  let url = (getActiveNetwork?.()?.rpcUrl || '').trim().replace(/\/$/, '');
  if (!url || /1rpc\.io|llamarpc\.com/i.test(url)) url = 'https://bsc-dataseed1.binance.org';
  return new ethers.providers.StaticJsonRpcProvider(url, BSC_CHAIN);
}

function tokenMeta(addr) {
  if (!addr || addr === ethers.constants.AddressZero) {
    return { symbol: 'BNB', decimals: 18 };
  }
  const a = String(addr).toLowerCase();
  for (const [key, info] of Object.entries(CONTRACT_MAP || {})) {
    if (info?.address && String(info.address).toLowerCase() === a) {
      return { symbol: key, decimals: info.decimals ?? 18 };
    }
  }
  for (const sym of Object.keys(TOKEN_REGISTRY || {})) {
    const t = TOKEN_REGISTRY[sym];
    if (t?.address && String(t.address).toLowerCase() === a) {
      return { symbol: sym, decimals: t.decimals ?? 18 };
    }
  }
  return { symbol: `${a.slice(0, 6)}…`, decimals: 18 };
}

function stableUsd(symbol) {
  const s = String(symbol || '').toUpperCase();
  return s === 'USDT' || s === 'USDC' || s === 'BUSD' || s === 'DAI' || s === 'EURS' || s === 'EURC' ? 1 : null;
}

/**
 * Returnează soldul curent USD al vault-ului (getUserBalances – un singur apel, fara getVault corupt).
 * totalDepositsUsd = valoarea USD a soldului curent (nu totalDeposited din contract, care include swap-uri interne).
 * totalWithdrawalsUsd = 0 (nu poate fi calculat corect din contract; foloseste backend /invested-capital pentru asta).
 *
 * @param {string} walletAddress
 * @returns {Promise<{ totalDepositsUsd: number, totalWithdrawalsUsd: number } | null>}
 */
export async function fetchVaultDepositWithdrawTotalsUsd(walletAddress) {
  if (!walletAddress || !CONTRACT_MAP?.USER_VAULT?.address) return null;
  const userAddr = ethers.utils.getAddress(String(walletAddress).trim());
  const uv = CONTRACT_MAP.USER_VAULT;
  const provider = createReadProvider();
  const contract = new ethers.Contract(uv.address, uv.abi, provider);

  let addrs = [];
  let amounts = [];
  try {
    [addrs, amounts] = await contract.getUserBalances(userAddr);
  } catch {
    return null;
  }

  if (!addrs || addrs.length === 0) {
    return { totalDepositsUsd: 0, totalWithdrawalsUsd: 0 };
  }

  const symbols = addrs.map((addr) => tokenMeta(addr).symbol);
  let prices = {};
  try {
    prices = (await tokenPriceService.getAllTokenPrices([...new Set(symbols)])) || {};
  } catch {
    prices = {};
  }

  let totalDepositsUsd = 0;

  for (let i = 0; i < addrs.length; i++) {
    const tokenAddr = addrs[i];
    const { symbol, decimals } = tokenMeta(tokenAddr);
    const balanceBn = ethers.BigNumber.from(amounts[i] ?? 0);
    const humanBal = parseFloat(ethers.utils.formatUnits(balanceBn, decimals)) || 0;
    const p =
      (prices[symbol] != null && Number.isFinite(prices[symbol]) ? prices[symbol] : null) ??
      stableUsd(symbol) ??
      0;
    totalDepositsUsd += humanBal * p;
  }

  if (!Number.isFinite(totalDepositsUsd)) totalDepositsUsd = 0;

  return { totalDepositsUsd, totalWithdrawalsUsd: 0 };
}
