import { MODAL_LABELS } from './constants';

export function mapWagmiErrorToMessage(err) {
  if (!err) return null;
  const msg = String(err?.shortMessage || err?.message || (typeof err === 'string' ? err : '') || '').trim().toLowerCase();
  const code = err?.code;

  if (msg.includes('user rejected') || msg.includes('user denied') || code === 4001) {
    return null;
  }
  if (msg.includes('chain not supported') || msg.includes('unsupported chain') || msg.includes('chain_id')) {
    return 'Network not supported. Switch network in wallet or try another network.';
  }
  if (msg.includes('session') && (msg.includes('expired') || msg.includes('invalid'))) {
    return 'Session expired. Try again.';
  }
  if (msg.includes('pairing') || msg.includes('pair')) {
    return MODAL_LABELS.EVM_ERROR_GENERIC;
  }
  if (msg.includes('walletconnect') || msg.includes('wallet connect') || msg.includes('wc@')) {
    const unavailable = msg.includes('not installed') || msg.includes('not available') || msg.includes('not found') || msg.includes('missing') || msg.includes('unavailable') || msg.includes('no provider') || msg.includes('no matching key');
    if (unavailable) return MODAL_LABELS.WALLETCONNECT_NOT_INSTALLED;
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return 'Network error. Check your connection and try again.';
  }
  if (msg.includes('provider') && (msg.includes('not found') || msg.includes('missing'))) {
    return 'Wallet not found. Install the extension or open the wallet app.';
  }

  return MODAL_LABELS.EVM_ERROR_GENERIC;
}
