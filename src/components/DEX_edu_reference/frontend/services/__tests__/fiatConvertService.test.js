/**
 * Contract client: createConvertOrder trimite idempotency (header + body) către backend.
 */
import { createConvertOrder } from '../fiatConvertService';

jest.mock('../../../config/runtimeConfig.js', () => ({
  getBackendUrl: () => 'http://localhost:5000',
}));

jest.mock('../../utils/constants', () => ({
  API_ENDPOINTS: {
    STRIPE_CONVERT_TO_TOKEN: '/api/stripe/convert-to-token',
  },
}));

describe('fiatConvertService createConvertOrder', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, orderId: 1, status: 'pending' }),
    });
  });

  test('trimite Idempotency-Key și idempotencyKey în body când sunt furnizate', async () => {
    await createConvertOrder({
      amountFiat: 25,
      currency: 'eur',
      tokenOut: 'bnb',
      idempotencyKey: 'idem-test-uuid',
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, init] = global.fetch.mock.calls[0];
    expect(init.headers['Idempotency-Key']).toBe('idem-test-uuid');
    const body = JSON.parse(init.body);
    expect(body.idempotencyKey).toBe('idem-test-uuid');
  });
});
