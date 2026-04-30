import { OTA_LLM_BILLING_REFRESH, dispatchOtaLlmBillingRefresh } from '../otaLlmBillingRefresh';

describe('otaLlmBillingRefresh', () => {
  it('dispatches CustomEvent for billing strip refresh', () => {
    const seen = [];
    const h = (ev) => seen.push(ev.type);
    window.addEventListener(OTA_LLM_BILLING_REFRESH, h);
    dispatchOtaLlmBillingRefresh();
    window.removeEventListener(OTA_LLM_BILLING_REFRESH, h);
    expect(seen).toEqual([OTA_LLM_BILLING_REFRESH]);
  });
});
