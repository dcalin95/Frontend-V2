/**
 * @jest-environment jsdom
 */

import {
  looksLikeOpenAiApiFailureText,
  formatCostAndSourceForSignalCard,
  getOtaSignalSnapshotFreshnessNote,
  getOtaSignalSnapshotFreshnessNoteFromSig,
  parseUsdNumberLoose,
  pickTotalTokensFromUsageValue,
  stripOpenAiFailureSegmentsFromReasoningText,
} from '../otaSignalCardSourceFormat';
import {
  OTA_ANALYZE_LLM_OTA_BITS_ONLY,
  OTA_ANALYZE_LLM_WITH_OPENAI,
} from '../otaAnalysisModePreference';

describe('otaSignalCardSourceFormat', () => {
  it('looksLikeOpenAiApiFailureText: 429 + openai', () => {
    expect(
      looksLikeOpenAiApiFailureText('Error: 429 ... openai ... quota'),
    ).toBe(true);
  });

  it('looksLikeOpenAiApiFailureText: openai + billing without 429', () => {
    expect(
      looksLikeOpenAiApiFailureText('OpenAI returned billing error check your plan'),
    ).toBe(true);
  });

  it('looksLikeOpenAiApiFailureText: insufficient_quota', () => {
    expect(looksLikeOpenAiApiFailureText('type: insufficient_quota')).toBe(true);
  });

  it('looksLikeOpenAiApiFailureText: platform URL', () => {
    expect(
      looksLikeOpenAiApiFailureText('see https://platform.openai.com/docs'),
    ).toBe(true);
  });

  it('looksLikeOpenAiApiFailureText: negative', () => {
    expect(looksLikeOpenAiApiFailureText('Engine hold - OTA skip')).toBe(false);
    expect(looksLikeOpenAiApiFailureText('')).toBe(false);
    expect(looksLikeOpenAiApiFailureText(null)).toBe(false);
  });

  it('formatCostAndSource: engine_no_openai', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'engine_no_openai',
      reasoning: 'skipped',
      costUsd: 0,
    });
    expect(r.sourceLabel).toMatch(/ota motor/i);
    expect(r.sourceLabel).toMatch(/no paid llm call/i);
    expect(r.isOpenAiBillingError).toBe(false);
    expect(r.isOpenAi).toBe(false);
  });

  it('formatCostAndSource: skipOpenAIReason engine_no_openai_request', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'motor_ota',
      skipOpenAIReason: 'engine_no_openai_request',
    });
    expect(r.sourceLabel).toMatch(/ota motor/i);
  });

  it('formatCostAndSource: motor_ota + 429 in reasoning is not billing error', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'motor_ota',
      reasoning: 'HOLD\nError: 429 You exceeded your current quota openai billing',
      costUsd: null,
    });
    expect(r.isOpenAiBillingError).toBe(false);
    expect(r.sourceLabel).toMatch(/ota motor/i);
    expect(r.costLabel).toBe('free');
  });

  it('formatCostAndSource: motor_ota without cost', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'motor_ota',
      reasoning: 'hold',
      costUsd: null,
    });
    expect(r.sourceLabel).toMatch(/ota motor/i);
    expect(r.costLabel).toBe('free');
    expect(r.isOpenAi).toBe(false);
  });

  it('formatCostAndSource: OpenAI paid + model + estimate label', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'openai_decides',
      model: 'gpt-4o-mini',
      costUsd: 0.002,
      costSource: 'estimate',
      tokenUsage: 400,
    });
    expect(r.isOpenAi).toBe(true);
    expect(r.sourceLabel).toContain('gpt-4o-mini');
    expect(r.costLabel).toBe('~$0.0020 (estimate)');
    expect(r.tokensLabel).toContain('tok');
  });

  it('formatCostAndSource: OpenAI platform cost label', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'openai_decides',
      model: 'gpt-4o-mini',
      costUsd: 0.0031,
      costSource: 'openai_platform',
      tokenUsage: 787,
    });
    expect(r.costLabel).toBe('$0.0031 (platform)');
  });

  it('formatCostAndSource: llm_ledger from GET /signals backfill', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'openai:gpt-4o-mini',
      model: 'gpt-4o-mini',
      costUsd: 0.03,
      costSource: 'llm_ledger',
      tokenUsage: 8681,
    });
    expect(r.costLabel).toBe('$0.03 (ledger)');
    expect(r.isOpenAi).toBe(true);
  });

  it('formatCostAndSource: anthropic Claude label', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'anthropic:claude-sonnet-4-20250514',
      model: 'claude-sonnet-4-20250514',
      costUsd: 0.02,
      costSource: 'internal_estimate',
      tokenUsage: 400,
    });
    expect(r.sourceLabel).toContain('Claude');
    expect(r.sourceLabel).toContain('claude-sonnet');
    expect(r.costLabel).toBe('$0.02');
  });

  it('formatCostAndSource: cent-scale (~0.02) uses 2 decimals', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'openai_decides',
      model: 'gpt-4o-mini',
      costUsd: 0.02,
      costSource: 'estimate',
      tokenUsage: 400,
    });
    expect(r.costLabel).toBe('~$0.02 (estimate)');
  });

  it('parseUsdNumberLoose: comma decimal string', () => {
    expect(parseUsdNumberLoose('0,02')).toBe(0.02);
    expect(parseUsdNumberLoose(' 0.02 ')).toBe(0.02);
  });

  it('formatCostAndSource: tokens without USD show pending label', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'openai_decides',
      model: 'gpt-4o-mini',
      costUsd: null,
      tokenUsage: 787,
    });
    expect(r.isOpenAi).toBe(true);
    expect(r.costLabel).toBe('USD pending');
    expect(r.tokensLabel).toBe('787 tok');
  });

  it('formatCostAndSource: tokenUsage object from POST /analyze', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'openai_decides',
      model: 'gpt-4o-mini',
      costUsd: null,
      tokenUsage: { totalTokens: 512, promptTokens: 400, completionTokens: 112 },
    });
    expect(r.isOpenAi).toBe(true);
    expect(r.tokensLabel).toBe('512 tok');
    expect(r.costLabel).toBe('USD pending');
  });

  it('pickTotalTokensFromUsageValue: snake_case total_tokens', () => {
    expect(pickTotalTokensFromUsageValue({ total_tokens: 99 })).toBe(99);
    expect(pickTotalTokensFromUsageValue(null)).toBeNull();
  });

  it('formatCostAndSource: platform pending label', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'openai_decides',
      model: 'gpt-4o-mini',
      costUsd: null,
      costSource: 'openai_platform_pending',
      tokenUsage: 787,
    });
    expect(r.costLabel).toBe('platform pending');
  });

  it('formatCostAndSource: platform pending without token count still OpenAI path', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'openai_decides',
      model: 'gpt-4o-mini',
      costUsd: null,
      costSource: 'openai_platform_pending',
      tokenUsage: null,
    });
    expect(r.isOpenAi).toBe(true);
    expect(r.costLabel).toBe('platform pending');
  });

  it('formatCostAndSource: engine_with_explanation without DB usage', () => {
    const r = formatCostAndSourceForSignalCard({
      analysisSource: 'engine_with_explanation',
      costUsd: 0,
      tokenUsage: null,
    });
    expect(r.sourceLabel).toContain('OpenAI');
    expect(r.sourceLabel).toContain('engine_with_explanation');
    expect(r.costLabel).toBe('unavailable (no usage in DB)');
  });

  it('formatCostAndSource: OpenAI failure in reasoning without cost', () => {
    const r = formatCostAndSourceForSignalCard({
      reasoning: 'Error 429 You exceeded quota openai billing',
      costUsd: null,
      tokenUsage: null,
    });
    expect(r.isOpenAiBillingError).toBe(true);
    expect(r.sourceLabel).toContain('OpenAI');
    expect(r.costLabel).not.toBe('free');
  });

  it('formatCostAndSource: uiMismatch when UI is OTA only but card is OpenAI', () => {
    const r = formatCostAndSourceForSignalCard(
      { analysisSource: 'openai_decides', costUsd: 0.001 },
      { uiPreferredMode: OTA_ANALYZE_LLM_OTA_BITS_ONLY },
    );
    expect(r.uiMismatchNote).toBeTruthy();
    const r2 = formatCostAndSourceForSignalCard(
      { analysisSource: 'engine_no_openai' },
      { uiPreferredMode: OTA_ANALYZE_LLM_WITH_OPENAI },
    );
    expect(r2.uiMismatchNote).toBeTruthy();
  });

  it('formatCostAndSource: UI OTA only + motor_ota => no uiMismatch', () => {
    const r = formatCostAndSourceForSignalCard(
      { analysisSource: 'motor_ota', costUsd: null },
      { uiPreferredMode: OTA_ANALYZE_LLM_OTA_BITS_ONLY },
    );
    expect(r.uiMismatchNote).toBeNull();
  });

  it('formatCostAndSource: UI OpenAI + openai_decides => no uiMismatch', () => {
    const r = formatCostAndSourceForSignalCard(
      { analysisSource: 'openai_decides', costUsd: 0.01 },
      { uiPreferredMode: OTA_ANALYZE_LLM_WITH_OPENAI },
    );
    expect(r.uiMismatchNote).toBeNull();
  });

  it('stripOpenAiFailureSegmentsFromReasoningText removes 429 line', () => {
    const s = stripOpenAiFailureSegmentsFromReasoningText(
      'HOLD pe AVAX\nError: 429 quota openai exceeded',
    );
    expect(s).toContain('HOLD');
    expect(s.toLowerCase()).not.toContain('429');
  });
});

describe('getOtaSignalSnapshotFreshnessNote', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('without valid createdAt => historical message, no stale line', () => {
    const r = getOtaSignalSnapshotFreshnessNote(null);
    expect(r.primary).toMatch(/history row/i);
    expect(r.staleSecondary).toBeNull();
  });

  it('inside threshold => no stale line', () => {
    const r = getOtaSignalSnapshotFreshnessNote('2026-01-15T11:55:00.000Z');
    expect(r.primary).toMatch(/snapshot/i);
    expect(r.staleSecondary).toBeNull();
  });

  it('past threshold => stale line', () => {
    const r = getOtaSignalSnapshotFreshnessNote('2026-01-15T11:40:00.000Z', { staleAfterMs: 10 * 60 * 1000 });
    expect(r.staleSecondary).toMatch(/10/);
  });
});

describe('getOtaSignalSnapshotFreshnessNoteFromSig', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses created_at when createdAt is absent (same as feed sort)', () => {
    const r = getOtaSignalSnapshotFreshnessNoteFromSig(
      { created_at: '2026-01-15T11:55:00.000Z' },
      { staleAfterMs: 10 * 60 * 1000 },
    );
    expect(r.primary).toMatch(/snapshot/i);
    expect(r.staleSecondary).toBeNull();
  });
});
