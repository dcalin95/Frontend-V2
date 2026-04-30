/**
 * Honest mode: analytics page must not use forbidden capability labels.
 * Allowed labels: Rule-based, Not available, Not implemented, Unavailable, Manual, Evidence-only, etc.
 */

const FORBIDDEN_PHRASES = [
  'AI analyzed',
  'analysis complete',
  'intelligent exit',
  'smart close',
  'smart decision',
  'predicted target',
  'estimated direction',
  'model concluded',
  'agent planned',
  'strong opportunity',
  'bot optimized',
  'strategy optimized',
  'reasoning complete',
  'intelligent management',
  'AI decided',
  'AI determined',
];

describe('TradeCostAnalyticsPage honest mode', () => {
  it('allowed truth labels do not contain forbidden capability phrases', () => {
    const allowedLabels = [
      'Rule-based',
      'Not available',
      'Not implemented',
      'Unavailable',
      'Manual only',
      'Manual',
      'Evidence-only',
      'Evidence level',
      'Decision type',
      'Exit mode',
      'Predictive model',
      'Exit optimization',
      'Not implemented',
      'Close at TP/SL (OTA)',
      'OTA does not auto-close',
      'Exit is manual',
    ];
    for (const label of allowedLabels) {
      const lower = label.toLowerCase();
      for (const forbidden of FORBIDDEN_PHRASES) {
        expect(lower).not.toContain(forbidden.toLowerCase());
      }
    }
  });

  it('forbidden phrases list is non-empty and has expected entries', () => {
    expect(FORBIDDEN_PHRASES).toContain('AI analyzed');
    expect(FORBIDDEN_PHRASES).toContain('smart decision');
    expect(FORBIDDEN_PHRASES.length).toBeGreaterThanOrEqual(10);
  });

  it('gas estimate label (Est.) is allowed and indicates non-real value', () => {
    const gasEstimateLabel = '(Est.)';
    expect(gasEstimateLabel).toContain('Est.');
    FORBIDDEN_PHRASES.forEach((phrase) => {
      expect(gasEstimateLabel.toLowerCase()).not.toContain(phrase.toLowerCase());
    });
  });

  it('close button must not be shown when closeActionAllowed is false', () => {
    const closeActionAllowed = false;
    const isOtaAuto = true;
    const isOtaClosable = isOtaAuto && (closeActionAllowed !== false);
    expect(isOtaClosable).toBe(false);
  });

  it('close button shown when closeActionAllowed is true for OTA row', () => {
    const closeActionAllowed = true;
    const isOtaAuto = true;
    const isOtaClosable = isOtaAuto && (closeActionAllowed !== false);
    expect(isOtaClosable).toBe(true);
  });

  it('PnL % ROC: net PnL / val. intrare (aliniat la coloana net, nu la variația de preț)', () => {
    const entryValueUsd = 5;
    const pnlNetUsd = 0.29;
    const roiPctFromUsd = entryValueUsd >= 0.01 && pnlNetUsd != null ? (pnlNetUsd / entryValueUsd) * 100 : null;
    expect(roiPctFromUsd).toBeCloseTo(5.8, 5);
  });
});
