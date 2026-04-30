import { isOtaTraceAuthExpectedFailure } from '../otaTracePollErrors';

describe('isOtaTraceAuthExpectedFailure', () => {
  it('401/403 și coduri OTA wallet = așteptat (nu hard error)', () => {
    expect(isOtaTraceAuthExpectedFailure({ failedStatus: 401 })).toBe(true);
    expect(isOtaTraceAuthExpectedFailure({ failedStatus: 403 })).toBe(true);
    expect(isOtaTraceAuthExpectedFailure({ code: 'OTA_WALLET_AUTH_REQUIRED' })).toBe(true);
    expect(isOtaTraceAuthExpectedFailure({ code: 'OTA_WALLET_TOKEN_INVALID' })).toBe(true);
    expect(isOtaTraceAuthExpectedFailure({ code: 'OTA_WALLET_IDENTITY_MISMATCH' })).toBe(true);
  });

  it('500 sau lipsă = nu e gap auth-only', () => {
    expect(isOtaTraceAuthExpectedFailure({ failedStatus: 500 })).toBe(false);
    expect(isOtaTraceAuthExpectedFailure({ failedStatus: 429 })).toBe(false);
    expect(isOtaTraceAuthExpectedFailure(null)).toBe(false);
  });
});
