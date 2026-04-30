/**
 * Încercare #2 (Futures Ops feed): evită flash gol la poll când slice-ul filtrat
 * pentru panou devine temporar [] în timpul fetch-ului — păstrăm ultimul slice
 * vizibil pentru același userKey până se termină request-ul.
 *
 * `emptyPipelineFlashGuard`: buffer-ul merge încă are rânduri dar pipeline-ul (lane + allowlist +
 * gating + limit) produce [] — fără asta, după `pollBusy=false` un frame poate arăta gol deși
 * datele nu „au dispărut” din API (aceeași cauză ca „totul dispare” între poll-uri).
 *
 * @param {unknown[]} forPanel — slice-ul derivat (ex. după allowlist + gating + limit)
 * @param {{ pollBusy: boolean, layoutHold?: boolean, emptyPipelineFlashGuard?: boolean, userKey: string, lastSlice: unknown[], lastUserKey: string }} opts
 * @returns {unknown[]}
 */
export function stickySignalsPanelDisplay(forPanel, opts) {
  const panel = Array.isArray(forPanel) ? forPanel : [];
  const pollBusy = opts?.pollBusy === true;
  const layoutHold = opts?.layoutHold === true;
  const hold = pollBusy || layoutHold;
  const pipelineHold = opts?.emptyPipelineFlashGuard === true;
  const userKey = opts?.userKey != null ? String(opts.userKey) : '';
  const lastSlice = Array.isArray(opts?.lastSlice) ? opts.lastSlice : [];
  const lastUserKey = opts?.lastUserKey != null ? String(opts.lastUserKey) : '';

  if (panel.length > 0) return panel;
  const stickyHold = hold || pipelineHold;
  if (stickyHold && lastSlice.length > 0 && userKey && lastUserKey === userKey) return lastSlice;
  return panel;
}
