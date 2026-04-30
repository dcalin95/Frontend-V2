/**
 * Wallet RPC health check. Detects invalid/unreachable BSC RPC (e.g. TWNodes).
 * @module rpcHealthCheck
 */

/**
 * Check if wallet's current RPC is reachable.
 * Calls eth_blockNumber (and eth_chainId for sanity). If it throws with -32603 and "Invalid RPC URL", returns rpcBroken.
 * @param {object} provider - EIP-1193 provider (e.g. from getInjectedProvider())
 * @returns {Promise<{ ok: boolean, rpcBroken?: boolean, error?: object }>}
 */
export async function rpcHealthCheck(provider) {
  if (!provider?.request) return { ok: false, rpcBroken: true };
  try {
    await provider.request({ method: 'eth_blockNumber' });
    return { ok: true };
  } catch (e) {
    const code = e?.code != null ? Number(e.code) : Number(e?.error?.code ?? NaN);
    const msg = (e?.message || e?.error?.message || '').toString();
    if ((code === -32603 || code === 32603) && /Invalid RPC URL/i.test(msg)) {
      return { ok: false, rpcBroken: true, error: e };
    }
    throw e;
  }
}

/**
 * Check if an error is the "Invalid RPC URL" wallet config error (pre-broadcast).
 * @param {object} err
 * @returns {boolean}
 */
export function isInvalidRpcUrlError(err) {
  if (!err) return false;
  const code = err?.code != null ? Number(err.code) : Number(err?.error?.code ?? NaN);
  const msg = (err?.message || err?.error?.message || err?.reason || '').toString();
  return (code === -32603 || code === 32603) && /Invalid RPC URL/i.test(msg);
}
