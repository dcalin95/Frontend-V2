/**
 * User-facing messages for 401/403 OTA wallet errors from otaWalletAuthMiddleware.
 * Avoid the generic otaApiClient "Session expired" text that confuses wallet connection with API session state.
 */

export function formatOtaSessionUserMessage(e) {
  if (!e) return null;
  const st = e.failedStatus;
  const code = e.code;
  const msg = String(e.message || '');
  if (st === 401) {
    if (code === 'OTA_WALLET_AUTH_REQUIRED' || code === 'OTA_WALLET_TOKEN_INVALID') {
      return 'The OTA signature is missing or expired. Open your wallet and accept the short message, then refresh.';
    }
    if (/session expired|please reconnect/i.test(msg)) {
      return 'The OTA API session expired. With the same wallet shown in the header, accept the wallet signature, then refresh.';
    }
  }
  if (st === 403 && code === 'OTA_WALLET_IDENTITY_MISMATCH') {
    return 'The wallet does not match the OTA session. Use the same address shown in the header.';
  }
  return msg || null;
}
