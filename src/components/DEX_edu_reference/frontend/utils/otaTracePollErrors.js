/**
 * Răspunsuri 401/403 de la otaWalletAuthMiddleware (OTA_WALLET_AUTH_ENFORCE) pentru rute cu userId.
 * Nu sunt „erori” de produs — lipsă sau nepotrivire sesiune otaw_*.
 */
export function isOtaTraceAuthExpectedFailure(err) {
  const st = err?.failedStatus;
  const code = err?.code;
  return (
    st === 401 ||
    st === 403 ||
    code === 'OTA_WALLET_AUTH_REQUIRED' ||
    code === 'OTA_WALLET_TOKEN_INVALID' ||
    code === 'OTA_WALLET_IDENTITY_MISMATCH'
  );
}
