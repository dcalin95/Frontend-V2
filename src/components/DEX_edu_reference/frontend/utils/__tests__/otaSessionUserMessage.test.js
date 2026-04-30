import { formatOtaSessionUserMessage } from '../otaSessionUserMessage';

describe('formatOtaSessionUserMessage', () => {
  it('maps 401 OTA codes to a short English message', () => {
    const m = formatOtaSessionUserMessage({ failedStatus: 401, code: 'OTA_WALLET_AUTH_REQUIRED' });
    expect(m).toContain('OTA signature');
    expect(m).toContain('refresh');
  });

  it('maps generic 401 session text from otaApiClient', () => {
    const m = formatOtaSessionUserMessage({
      failedStatus: 401,
      message: 'Session expired. Please reconnect.',
    });
    expect(m).toContain('OTA API session');
  });
});
