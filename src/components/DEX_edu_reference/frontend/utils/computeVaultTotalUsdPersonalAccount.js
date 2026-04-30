/**
 * Total USD vault aliniat cu PersonalAccountPage: solduri on-chain UserVault
 * + prețuri piață (tokenPriceService), stables 1:1, BITS exclus din total.
 * O singură sursă de logică pentru „Total (USD)” din /dex-edu/account.
 */
import { ethers } from 'ethers';

const PREFERRED_ORDER = [
  'USDT',
  'USDC',
  'BNB',
  'MATIC',
  'DOGE',
  'XRP',
  'BITS',
  'ETH',
  'BTC',
  'SOL',
  'CAKE',
  'SHIB',
  'ADA',
  'LINK',
  'EURS',
  'EURC',
  'BUSD',
  'DAI',
];

function getRawForToken(t, balances) {
  if (!balances || typeof balances !== 'object') return '0';
  return (
    balances[t.address] ||
    balances[String(t.address || '').toLowerCase()] ||
    (t.symbol === 'BNB' ? balances['BNB'] : null) ||
    (t.symbol === 'DOGE'
      ? balances['DOGE'] ??
        balances['0xba2ae424d960c26247dd6c32edc70b295c744c43'] ??
        balances['0xba2ae424d960c26247dd6c32edc70b295c744c43'.toLowerCase()]
      : null) ||
    '0'
  );
}

/**
 * @param {object} p
 * @param {Array<{ symbol: string, address?: string, decimals?: number }>} p.tokenOptions
 * @param {Record<string, string>} p.balances
 * @param {Record<string, number>} p.vaultTokenPrices - USD per token (din tokenPriceService.getAllTokenPrices)
 * @returns {{ totalUsd: number, rowCount: number, pricedNonStable: boolean }}
 */
export function computeVaultTotalUsdPersonalAccount({ tokenOptions, balances, vaultTokenPrices }) {
  const prices = vaultTokenPrices && typeof vaultTokenPrices === 'object' ? vaultTokenPrices : {};
  if (!Array.isArray(tokenOptions) || tokenOptions.length === 0) {
    return { totalUsd: 0, rowCount: 0, pricedNonStable: false };
  }

  const visibleCrypto = [...tokenOptions].sort((a, b) => {
    const iA = PREFERRED_ORDER.indexOf(a.symbol);
    const iB = PREFERRED_ORDER.indexOf(b.symbol);
    if (iA !== -1 && iB !== -1) return iA - iB;
    if (iA !== -1) return -1;
    if (iB !== -1) return 1;
    return (a.symbol || '').localeCompare(b.symbol || '');
  });

  const cryptoWithBalance = visibleCrypto.filter((t) => {
    const raw = getRawForToken(t, balances);
    if (t.symbol === 'BNB' || t.symbol === 'DOGE' || t.symbol === 'STX') return true;
    if (raw === '0' || raw === '0x0') return false;
    try {
      const formatted = ethers.utils.formatUnits(raw, t.decimals ?? 18);
      if (parseFloat(formatted) <= 0 || !Number.isFinite(parseFloat(formatted))) return false;
    } catch {
      return false;
    }
    return true;
  });

  let pricedNonStable = false;
  const rows = cryptoWithBalance.map((t) => {
    const raw = getRawForToken(t, balances);
    let num;
    try {
      num = parseFloat(ethers.utils.formatUnits(raw, t.decimals ?? 18));
    } catch {
      num = 0;
    }
    const isStable = (t.symbol || '').match(/USDT|USDC|BUSD|EURS|EURC/i);
    const isPresaleToken = (t.symbol || '').toUpperCase() === 'BITS';
    const priceUsd = isStable ? 1 : (prices[t.symbol] ?? 0);
    if (!isStable && priceUsd > 0) pricedNonStable = true;
    const usdValue = num * priceUsd;
    return { isPresaleToken, usdValue };
  });

  const totalUsd = rows.reduce((sum, r) => sum + (r.isPresaleToken ? 0 : r.usdValue), 0);

  return {
    totalUsd: Number.isFinite(totalUsd) ? totalUsd : 0,
    rowCount: rows.length,
    pricedNonStable,
  };
}
