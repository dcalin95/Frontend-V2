/**
 * Atentionări derivate din date reale — fără recomandări AI inventate.
 */

function pickGateSafeToExecute(live) {
  if (!live || typeof live !== 'object') return null;
  const g = live.gate;
  if (g && typeof g === 'object' && 'safeToExecuteLive' in g) return g.safeToExecuteLive;
  return null;
}

/**
 * @returns {Array<{ id: string, severity: 'warn'|'info', text: string, href?: string }>}
 */
export function buildDashboardAttentionItems(input) {
  const {
    loading,
    otaHealth,
    futuresLiveStatus,
    futuresOpenShorts,
    vaultBalanceComparison,
    leverageDemoStatus,
  } = input || {};

  if (loading) return [];

  const items = [];

  const healthOk =
    otaHealth &&
    (otaHealth.ok === true ||
      otaHealth.status === 'ok' ||
      otaHealth.healthy === true ||
      (typeof otaHealth === 'object' && !otaHealth.error));

  if (otaHealth && !healthOk) {
    items.push({
      id: 'ota-health',
      severity: 'warn',
      text: 'OTA health endpoint: check backend / session',
      href: '/dex-edu/ota',
    });
  }

  if (futuresLiveStatus == null && futuresOpenShorts == null) {
    items.push({
      id: 'futures-api',
      severity: 'warn',
      text: 'Futures short-ops: API unavailable or not configured (secret / network)',
      href: '/dex-edu/ota/short-ops',
    });
  }

  const safeLive = pickGateSafeToExecute(futuresLiveStatus);
  if (typeof safeLive === 'boolean' && safeLive === false) {
    items.push({
      id: 'futures-gate',
      severity: 'warn',
      text: 'Futures gate: safeToExecuteLive = false',
      href: '/dex-edu/ota/short-ops',
    });
  }

  const ac = vaultBalanceComparison?.anomalyCount;
  if (typeof ac === 'number' && ac > 0) {
    items.push({
      id: 'vault-anomaly',
      severity: 'warn',
      text: `Vault balance-comparison: ${ac} anomalii raportate`,
      href: '/dex-edu/account',
    });
  }

  if (leverageDemoStatus?.hasAccount !== true) {
    items.push({
      id: 'leverage-aggregate',
      severity: 'info',
      text: 'Leverage live: on-chain positions are not aggregated on the dashboard - monitor on /dex-edu/leverage',
      href: '/dex-edu/leverage',
    });
  }

  return items.slice(0, 6);
}
