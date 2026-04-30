import {
  OTA_FUTURES_TRACE_IMMEDIATE_POLL,
  dispatchOtaFuturesTraceImmediatePoll,
} from '../otaFuturesTraceImmediatePoll';

describe('otaFuturesTraceImmediatePoll', () => {
  it('dispatches CustomEvent with expected type', () => {
    const seen = [];
    const h = (ev) => {
      seen.push(ev.type);
    };
    window.addEventListener(OTA_FUTURES_TRACE_IMMEDIATE_POLL, h);
    dispatchOtaFuturesTraceImmediatePoll();
    window.removeEventListener(OTA_FUTURES_TRACE_IMMEDIATE_POLL, h);
    expect(seen).toEqual([OTA_FUTURES_TRACE_IMMEDIATE_POLL]);
  });
});
