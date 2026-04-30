/**
 * Mapare erori ethers / wallet la mesaje acționabile pentru Leverage (live writes).
 * Fără valori hardcodate de token — doar pattern-uri de eroare.
 */

/**
 * @param {unknown} err
 * @returns {{ kind: string, userMessage: string }}
 */
export function normalizeTxError(err) {
  const code = err?.code ?? err?.error?.code;
  const nested = err?.error;
  if (
    code === 4001 ||
    code === 'ACTION_REJECTED' ||
    nested?.code === 4001 ||
    String(code) === '4001'
  ) {
    return {
      kind: 'rejected',
      userMessage: 'Transaction rejected in wallet. No changes were made.',
    };
  }
  const msg = String(err?.message || err?.reason || nested?.message || err?.data?.message || '');
  if (/user rejected|User denied|rejected the request|denied transaction|ACTION_REJECTED/i.test(msg)) {
    return {
      kind: 'rejected',
      userMessage: 'Transaction rejected in wallet. No changes were made.',
    };
  }
  if (/wrong network|Wrong network/i.test(msg) && /chain|network|switch/i.test(msg)) {
    return { kind: 'wrong_chain', userMessage: msg };
  }
  if (/No EVM wallet provider|connect a compatible wallet|Wallet not connected/i.test(msg)) {
    return { kind: 'no_signer', userMessage: msg };
  }
  if (/Transaction failed on-chain|failed on-chain \(reverted\)|reverted\)/i.test(msg)) {
    return { kind: 'onchain_fail', userMessage: msg };
  }
  if (err?.code === 'CALL_EXCEPTION' || /CALL_EXCEPTION/i.test(msg)) {
    return {
      kind: 'onchain_fail',
      userMessage: 'Transaction failed on-chain. Check the explorer for details.',
    };
  }
  return { kind: 'unknown', userMessage: msg || 'Request failed' };
}
