/**
 * Stare GET live-status pentru panouri Futures Ops: la eșec sau payload lipsă
 * păstrăm snapshot-ul anterior, ca `{liveStatus && …}` să nu șteargă tot UI-ul.
 *
 * @param {*} prev - ultimul `liveStatus` din state
 * @param {{ ok: boolean, data?: * }} slice - succes cu `data` sau eșec (`ok: false`)
 * @returns {*}
 */
export function reduceOtaFuturesLiveStatus(prev, slice) {
  if (slice && slice.ok === true) {
    const d = slice.data;
    if (d !== undefined && d !== null) return d;
    return prev;
  }
  return prev;
}
