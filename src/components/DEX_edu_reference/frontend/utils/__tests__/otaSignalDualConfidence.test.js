import {
  normalizeOtaConfidenceToUnit,
  pickGroundedConfidence,
  pickLlmIgnoredConfidence,
  formatLlmIgnoredRow,
  isMotorOtaAnalysisSource,
} from '../otaSignalDualConfidence';

describe('otaSignalDualConfidence', () => {
  it('normalizeOtaConfidenceToUnit: 1-100 -> fraction (avoids "4500%" in UI)', () => {
    expect(normalizeOtaConfidenceToUnit(45)).toBe(0.45);
    expect(normalizeOtaConfidenceToUnit(100)).toBe(1);
    expect(normalizeOtaConfidenceToUnit(0.65)).toBe(0.65);
  });

  it('pickGroundedConfidence prefers confidenceOtaGrounded when finite', () => {
    expect(pickGroundedConfidence({ confidenceOtaGrounded: 0.55, confidence: 0.44 }, 0.44)).toBe(0.55);
  });

  it('pickGroundedConfidence normalizes 1-100 percent from confidenceOtaGrounded', () => {
    expect(pickGroundedConfidence({ confidenceOtaGrounded: 45, confidence: 0.44 }, 0.44)).toBe(0.45);
  });

  it('pickGroundedConfidence falls back to derivedConfidence when OTA is missing', () => {
    expect(pickGroundedConfidence({ confidence: 0.44 }, 0.44)).toBe(0.44);
  });

  it('pickGroundedConfidence normalizes derived when confidence is an integer percent', () => {
    expect(pickGroundedConfidence({ confidence: 45 }, 45)).toBe(0.45);
  });

  it('pickLlmIgnoredConfidence returns null when missing', () => {
    expect(pickLlmIgnoredConfidence({})).toBeNull();
    expect(pickLlmIgnoredConfidence({ llmConfidenceIgnored: null })).toBeNull();
    // UI guard: Number(null) === 0, so do not use Number.isFinite(Number(x)) without x != null.
    expect(Number.isFinite(Number(null))).toBe(true);
    expect(pickLlmIgnoredConfidence({ llmConfidenceIgnored: null }) != null).toBe(false);
  });

  it('pickLlmIgnoredConfidence parses number', () => {
    expect(pickLlmIgnoredConfidence({ llmConfidenceIgnored: 0.71 })).toBe(0.71);
    expect(pickLlmIgnoredConfidence({ llmConfidenceIgnored: '0.8' })).toBe(0.8);
  });

  it('formatLlmIgnoredRow: percent when llmConfidenceIgnored exists', () => {
    expect(formatLlmIgnoredRow({ llmConfidenceIgnored: 0.44 })).toBe('44%');
    expect(formatLlmIgnoredRow({ llmConfidenceIgnored: 44 })).toBe('44%');
  });

  it('formatLlmIgnoredRow: agentFinalReason cunoscut', () => {
    expect(formatLlmIgnoredRow({ agentFinalReason: 'insufficient_grounded_evidence' })).toContain('ungrounded');
  });

  it('formatLlmIgnoredRow: no anchored finish', () => {
    expect(formatLlmIgnoredRow({ agentFinishCompleted: false })).toContain('no anchored finish()');
  });

  it('isMotorOtaAnalysisSource: motor_ota and engine_no_openai', () => {
    expect(isMotorOtaAnalysisSource({ analysisSource: 'motor_ota' })).toBe(true);
    expect(isMotorOtaAnalysisSource({ analysisSource: 'engine_no_openai' })).toBe(true);
    expect(isMotorOtaAnalysisSource({ analysisSource: 'openai:agent' })).toBe(false);
    expect(isMotorOtaAnalysisSource({ analysisSource: 'openai:gpt-4o-mini' })).toBe(false);
    expect(isMotorOtaAnalysisSource({})).toBe(false);
  });
});
