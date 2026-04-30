/**
 * Command center cards: real data, short executive copy (headline + max 3 secondary lines).
 * Cards avoid repeating userId on every row; scope matches the rest of the dashboard.
 */

function capSecondary(lines, max = 3) {
  return Array.isArray(lines) ? lines.slice(0, max) : [];
}

function pickGateSafeToExecute(live) {
  if (!live || typeof live !== 'object') return null;
  const g = live.gate;
  if (g && typeof g === 'object' && 'safeToExecuteLive' in g) return g.safeToExecuteLive;
  return null;
}

function countOpenShorts(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload.positions;
  if (Array.isArray(p)) return p.length;
  if (typeof payload.count === 'number') return payload.count;
  return null;
}

/**
 * @returns {Array<{ id: string, title: string, href: string, badge: string, headline: string, secondary: string[], foot: string|null, level: string }>}
 */
export function buildDashboardMicroSummary(input) {
  const cards = buildDashboardSystemCards(input);
  const byId = (id) => cards.find((c) => c.id === id);
  return [
    { id: 'futures', label: 'Futures', text: byId('futures')?.headline || '—', href: '/dex-edu/ota/short-ops' },
    { id: 'ota-auto', label: 'OTA Auto', text: byId('ota-auto')?.headline || '—', href: '/dex-edu/ota' },
    { id: 'leverage', label: 'Leverage', text: byId('leverage')?.headline || '—', href: '/dex-edu/leverage' },
  ];
}

export function buildDashboardSystemCards(input) {
  const {
    loading,
    futuresLiveStatus,
    futuresOpenShorts,
    vaultBalanceComparison,
    leverageDemoAccount,
    leverageDemoStatus,
    autoStatus,
    signalsToday,
    tradesTotal,
    lastSignal,
  } = input || {};

  const cards = [];

  /* 1 — Binance Futures */
  {
    const openN = countOpenShorts(futuresOpenShorts);
    const safeLive = pickGateSafeToExecute(futuresLiveStatus);
    const hasVenue = futuresLiveStatus?.adapter?.present === true;
    let level = 'muted';
    let badge = '—';
    let headline = '—';
    const secondary = [];

    if (loading) {
      headline = '…';
      secondary.push('Loading');
    } else if (futuresLiveStatus == null && futuresOpenShorts == null) {
      headline = 'API unavailable';
      secondary.push('Short-ops: check secret / network');
      badge = '!';
      level = 'partial';
    } else {
      if (typeof safeLive === 'boolean') {
        headline = safeLive ? 'Gate: LIVE' : 'Gate: BLOCKED';
        level = safeLive ? 'ok' : 'warn';
      } else {
        headline = 'Gate: —';
        level = 'partial';
      }
      secondary.push(`Open: ${openN != null ? openN : '—'}`);
      secondary.push(hasVenue ? 'Venue: yes' : 'Venue: —');
      badge = openN != null ? String(openN) : '—';
    }
    cards.push({
      id: 'futures',
      title: 'Binance Futures',
      href: '/dex-edu/ota/short-ops',
      badge,
      headline,
      secondary: capSecondary(secondary),
      foot: 'Short-ops',
      level,
    });
  }

  /* 2 — OTA Auto */
  {
    let headline = '—';
    let badge = '—';
    let level = 'muted';
    const secondary = [];
    if (loading) {
      headline = '…';
      secondary.push('Loading');
    } else if (!autoStatus || typeof autoStatus !== 'object') {
      headline = 'No status';
      badge = '—';
      level = 'partial';
    } else {
      const en = autoStatus.enabled === true;
      const worker = autoStatus.executorFunctional === true;
      headline = en ? 'AUTO ON' : 'AUTO OFF';
      badge = en ? 'ON' : 'OFF';
      secondary.push(worker ? 'Worker: OK' : 'Worker: —');
      if (autoStatus.executionsCount24h != null) secondary.push(`24h: ${autoStatus.executionsCount24h}`);
      if (autoStatus.lastRunAt != null) secondary.push(`Run: ${String(autoStatus.lastRunAt).slice(0, 19)}`);
      level = en && worker ? 'ok' : en ? 'warn' : 'muted';
    }
    cards.push({
      id: 'ota-auto',
      title: 'OTA Auto',
      href: '/dex-edu/ota',
      badge,
      headline,
      secondary: capSecondary(secondary),
      foot: 'Auto execution',
      level,
    });
  }

  /* 3 — Leverage */
  {
    let headline = '—';
    let badge = '—';
    let level = 'muted';
    const secondary = [];
    if (loading) {
      headline = '…';
      secondary.push('Loading');
    } else {
      const demoPos = Array.isArray(leverageDemoAccount?.positions) ? leverageDemoAccount.positions.length : null;
      const hasDemo = leverageDemoStatus?.hasAccount === true;
      if (hasDemo && demoPos != null) {
        headline = `Demo: ${demoPos} pos.`;
        badge = String(demoPos);
        secondary.push('Server demo account');
        level = 'ok';
      } else if (hasDemo && demoPos === 0) {
        headline = 'Demo: 0 pos.';
        badge = '0';
        secondary.push('Active demo account');
        level = 'ok';
      } else {
        headline = 'Live: on page';
        badge = '→';
        secondary.push('On-chain CFD is not aggregated here');
        secondary.push('Open Leverage (BSC)');
        level = 'partial';
      }
    }
    cards.push({
      id: 'leverage',
      title: 'Leverage (BSC)',
      href: '/dex-edu/leverage',
      badge,
      headline,
      secondary: capSecondary(secondary),
      foot: 'Demo vs live',
      level,
    });
  }

  /* 4 — Vault */
  {
    let headline = '—';
    let badge = '—';
    let level = 'muted';
    const secondary = [];
    if (loading) {
      headline = '…';
      secondary.push('Loading');
    } else if (!vaultBalanceComparison || typeof vaultBalanceComparison !== 'object') {
      headline = 'Snapshot —';
      badge = '—';
      level = 'partial';
    } else {
      const nTok = Array.isArray(vaultBalanceComparison.tokens) ? vaultBalanceComparison.tokens.length : 0;
      const oc = vaultBalanceComparison.onChainAvailable === true;
      headline = oc ? 'On-chain OK' : 'Partial';
      badge = String(nTok);
      secondary.push(`Tokens: ${nTok}`);
      if (vaultBalanceComparison.anomalyCount != null) secondary.push(`Anomalies: ${vaultBalanceComparison.anomalyCount}`);
      level = oc ? 'ok' : 'partial';
    }
    cards.push({
      id: 'vault',
      title: 'Vault',
      href: '/dex-edu/account',
      badge,
      headline,
      secondary: capSecondary(secondary),
      foot: 'Vault compare',
      level,
    });
  }

  /* 5 - Trading: executions / history, not signal feed. */
  {
    const n = typeof tradesTotal === 'number' ? tradesTotal : null;
    let headline = '—';
    const secondary = [];
    if (loading) {
      headline = '…';
      secondary.push('Loading');
    } else if (n != null) {
      headline = `${n} rows loaded`;
      secondary.push('Execution list (limit)');
      secondary.push('Open orders: separate page');
    } else {
      headline = 'No list';
    }
    cards.push({
      id: 'trading',
      title: 'Executions',
      href: '/dex-edu/order-history',
      badge: n != null ? String(n) : '—',
      headline,
      secondary: capSecondary(secondary),
      foot: 'Exec list',
      level: loading ? 'muted' : n != null ? 'ok' : 'partial',
    });
  }

  /* 6 - Signals: signal feed, different role from executions. */
  {
    const st = typeof signalsToday === 'number' ? signalsToday : null;
    let headline = '—';
    let badge = '—';
    const secondary = [];
    if (loading) {
      headline = '…';
      secondary.push('Loading');
    } else {
      headline = st != null ? `Today: ${st}` : '— today';
      badge = st != null ? String(st) : '—';
      if (lastSignal && (lastSignal.token || lastSignal.side)) {
        secondary.push(`Latest: ${lastSignal.token || '—'} ${String(lastSignal.side || lastSignal.signal || '').slice(0, 8)}`);
      } else {
        secondary.push('Latest exec: —');
      }
      secondary.push('API signal feed');
    }
    cards.push({
      id: 'signals',
      title: 'Signals',
      href: '/dex-edu/signals',
      badge,
      headline,
      secondary: capSecondary(secondary),
      foot: 'Signals feed',
      level: st != null ? 'ok' : 'partial',
    });
  }

  return cards;
}
