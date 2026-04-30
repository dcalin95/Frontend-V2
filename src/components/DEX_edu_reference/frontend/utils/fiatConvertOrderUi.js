/**
 * Mapare order convert (API) → variantă UI pentru copy și accent (fără logică de business).
 */
import { FIAT_CONVERT_UI_COPY } from '../constants/fiatConvertExecutionModel';

/** @typedef {'pending'|'pending_relayer_low'|'completed'|'failed'|'unknown'} FiatConvertUiVariant */

/**
 * @param {Record<string, unknown>|null|undefined} order
 * @returns {string}
 */
export function getFiatConvertPendingDetailMessage(order) {
  const n = String(order?.processor_note ?? '');
  if (n === 'relayer_insufficient_usdt') return FIAT_CONVERT_UI_COPY.pendingRelayerInsufficientUsdt;
  if (n === 'relayer_insufficient_gas') return FIAT_CONVERT_UI_COPY.pendingRelayerInsufficientGas;
  if (n === 'relayer_insufficient_bnb') return FIAT_CONVERT_UI_COPY.pendingRelayerInsufficientBnb;
  if (String(order?.token_out ?? '').toLowerCase() === 'usdt') return FIAT_CONVERT_UI_COPY.pendingNormalUsdt;
  return FIAT_CONVERT_UI_COPY.pendingNormal;
}

/**
 * @param {Record<string, unknown>|null|undefined} order
 * @returns {{ variant: FiatConvertUiVariant, tokenOut: string }}
 */
export function getFiatConvertOrderUiVariant(order) {
  const status = String(order?.status ?? '').toLowerCase();
  const tokenOut = String(order?.token_out ?? '').toLowerCase();
  if (status === 'failed') return { variant: 'failed', tokenOut };
  if (status === 'completed') return { variant: 'completed', tokenOut };
  if (status === 'pending') {
    if (
      order?.processor_note === 'relayer_insufficient_bnb' ||
      order?.processor_note === 'relayer_insufficient_usdt' ||
      order?.processor_note === 'relayer_insufficient_gas'
    ) {
      return { variant: 'pending_relayer_low', tokenOut };
    }
    return { variant: 'pending', tokenOut };
  }
  return { variant: 'unknown', tokenOut };
}

/**
 * @param {Array<Record<string, unknown>>} orders
 * @returns {Array<Record<string, unknown>>}
 */
export function sortFiatConvertOrdersNewestFirst(orders) {
  if (!Array.isArray(orders)) return [];
  return [...orders].sort((a, b) => {
    const ta = Date.parse(String(a?.completed_at || a?.created_at || 0)) || 0;
    const tb = Date.parse(String(b?.completed_at || b?.created_at || 0)) || 0;
    return tb - ta;
  });
}

/**
 * Deposit UserVault: BNB nativ = `deposit(address(0), amount)` cu `msg.value` (fără wrap obligatoriu).
 * WBNB = ERC20 separat în același contract. Pentru „direct din executor în vault” ar trebui
 * `deposit` care să crediteze alt user decât msg.sender — în UserVault.sol actual nu există; e alt contract / flow.
 * @returns {{ userDepositNativeBnbSupported: boolean, vaultCreditsMsgSenderOnly: boolean, directExecutorToUserVaultFeasible: 'needs_contract_change' }}
 */
export function describeUserVaultBnbDepositFeasibility() {
  return {
    userDepositNativeBnbSupported: true,
    vaultCreditsMsgSenderOnly: true,
    directExecutorToUserVaultFeasible: 'needs_contract_change',
  };
}
