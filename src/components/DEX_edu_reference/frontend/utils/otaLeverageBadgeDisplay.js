/**
 * EN copy for futures leverage chips. Internal `leverageLabel` from panels: "no open", "12x", "—".
 */

function defaultFmtPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n * 100)}%`;
}

/**
 * @param {string} leverageLabel
 * @param {number|null|undefined} openMinConfidence — policy openMin when label is "no open"
 * @param {(v: number) => string} [fmtPct]
 * @returns {{ line: string, title: string }}
 */
export function otaLeverageBadgeParts(leverageLabel, openMinConfidence, fmtPct = defaultFmtPct) {
  if (leverageLabel === 'no open') {
    const thr =
      openMinConfidence != null && Number.isFinite(openMinConfidence)
        ? fmtPct(openMinConfidence)
        : null;
    return {
      line: thr ? `below ${thr}` : 'below min',
      title: thr
        ? `Confidence is below the open threshold (${thr}). No leverage multiplier is shown for a new entry until this level is met.`
        : 'Confidence is below the minimum open threshold; no leverage multiplier for entry.',
    };
  }
  if (leverageLabel == null || leverageLabel === '' || leverageLabel === '—') {
    return {
      line: 'n/a',
      title: 'Confidence or leverage policy missing from live status.',
    };
  }
  const normalized = String(leverageLabel).replace(/x$/i, '×');
  return {
    line: normalized,
    title: 'Leverage implied by policy at this confidence (execution still requires backend and venue checks).',
  };
}
