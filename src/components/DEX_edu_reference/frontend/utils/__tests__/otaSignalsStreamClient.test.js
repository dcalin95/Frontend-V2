import { consumeSseTextChunk, buildOtaSignalsStreamUrl, subscribeOtaSignalsListStream } from '../otaSignalsStreamClient';

jest.mock('../../../config/apiEndpoints.js', () => ({
  getApiBaseUrl: jest.fn(() => 'https://api.example.test/api'),
  API_ENDPOINTS: { SIGNALS_STREAM: '/ai-trading/signals/stream' },
}));

jest.mock('../otaWalletSession', () => ({
  getOtaWalletAuthToken: jest.fn(() => null),
}));

describe('otaSignalsStreamClient', () => {
  const { getApiBaseUrl } = require('../../../config/apiEndpoints.js');

  beforeEach(() => {
    jest.clearAllMocks();
    getApiBaseUrl.mockReturnValue('https://api.example.test/api');
  });

  it('consumeSseTextChunk parses data events', () => {
    const seen = [];
    let buf = '';
    buf = consumeSseTextChunk(buf, 'data: {"type":"signals_snapshot","x":1}\n\n', (o) => seen.push(o));
    expect(seen).toEqual([{ type: 'signals_snapshot', x: 1 }]);
    expect(buf).toBe('');
  });

  it('buffers incomplete events', () => {
    const seen = [];
    let buf = consumeSseTextChunk('', 'data: {"a":', (o) => seen.push(o));
    expect(seen.length).toBe(0);
    buf = consumeSseTextChunk(buf, '1}\n\n', (o) => seen.push(o));
    expect(seen).toEqual([{ a: 1 }]);
  });

  it('buildOtaSignalsStreamUrl joins API base and query', () => {
    const u = buildOtaSignalsStreamUrl({
      userId: ' 0xabc ',
      limit: 50,
      offset: 0,
      tradeContext: 'long_spot',
    });
    expect(u).toBe(
      'https://api.example.test/api/ai-trading/signals/stream?userId=0xabc&limit=50&offset=0&tradeContext=long_spot'
    );
  });

  it('subscribeOtaSignalsListStream reconnects after stream ends (no fatal onError)', async () => {
    jest.useFakeTimers();
    const encoder = new TextEncoder();
    let fetchCount = 0;
    global.fetch = jest.fn(() => {
      fetchCount += 1;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"type":"x"}\n\n'));
          controller.close();
        },
      });
      return Promise.resolve({
        ok: true,
        status: 200,
        body: stream.getReader ? stream : null,
      });
    });

    const onError = jest.fn();
    const { close } = subscribeOtaSignalsListStream({ userId: 'u1', limit: 10 }, { onError });

    await Promise.resolve();
    await Promise.resolve();

    expect(global.fetch).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(2100);
    await Promise.resolve();
    await Promise.resolve();

    expect(global.fetch.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(onError).not.toHaveBeenCalled();

    close();
    jest.useRealTimers();
  });

  it('subscribeOtaSignalsListStream calls onError once for 401 and stops', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        body: null,
      })
    );

    const onError = jest.fn();
    const { close } = subscribeOtaSignalsListStream({ userId: 'u1', limit: 10 }, { onError });

    await new Promise((r) => setTimeout(r, 30));

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].failedStatus).toBe(401);
    close();
  });
});
