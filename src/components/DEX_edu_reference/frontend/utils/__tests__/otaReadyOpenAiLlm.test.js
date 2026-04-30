import { getOpenAiLlmEnabledFromReadyPayload, parseOtaTradingReadyPayload } from '../otaReadyOpenAiLlm';

describe('parseOtaTradingReadyPayload', () => {
  it('payload null → câmpuri null, fetchOk true (neîncărcat / fără body)', () => {
    const p = parseOtaTradingReadyPayload(null);
    expect(p.fetchOk).toBe(true);
    expect(p.openaiLlmEnabled).toBeNull();
    expect(p.openaiKeyConfigured).toBeNull();
  });

  it('503 not_ready cu checks — citește openai și openaiLlmEnabled', () => {
    const p = parseOtaTradingReadyPayload({
      status: 'not_ready',
      reason: 'OpenAI API key not configured',
      checks: { openai: false, openaiLlmEnabled: true, circuitBreaker: 'CLOSED' },
    });
    expect(p.fetchOk).toBe(true);
    expect(p.openaiKeyConfigured).toBe(false);
    expect(p.openaiLlmEnabled).toBe(true);
    expect(p.status).toBe('not_ready');
  });
});

describe('getOpenAiLlmEnabledFromReadyPayload', () => {
  it('null când lipsește checks', () => {
    expect(getOpenAiLlmEnabledFromReadyPayload({})).toBeNull();
    expect(getOpenAiLlmEnabledFromReadyPayload({ checks: {} })).toBeNull();
  });

  it('null când openaiLlmEnabled nu e boolean', () => {
    expect(getOpenAiLlmEnabledFromReadyPayload({ checks: { openaiLlmEnabled: 'true' } })).toBeNull();
    expect(getOpenAiLlmEnabledFromReadyPayload({ checks: { openaiLlmEnabled: 1 } })).toBeNull();
  });

  it('false / true când serverul expune boolean (GET /ready)', () => {
    expect(
      getOpenAiLlmEnabledFromReadyPayload({
        status: 'ready',
        checks: { openai: true, openaiLlmEnabled: false, circuitBreaker: 'CLOSED' },
      }),
    ).toBe(false);
    expect(
      getOpenAiLlmEnabledFromReadyPayload({
        status: 'ready',
        checks: { openaiLlmEnabled: true },
      }),
    ).toBe(true);
  });
});
