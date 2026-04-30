import {
  DASHBOARD_QUOTA_UNLIMITED_THRESHOLD,
  normalizeDashboardQuotaForDisplay,
  formatDashboardHeroFooterLine,
} from '../dashboardKpiNormalize';

describe('normalizeDashboardQuotaForDisplay', () => {
  it('maps exempt + sentinel analysesLeft to Unlimited', () => {
    const r = normalizeDashboardQuotaForDisplay({
      analysesToday: 0,
      maxAnalysesPerDay: 0,
      analysesLeft: DASHBOARD_QUOTA_UNLIMITED_THRESHOLD,
      isExempt: true,
    });
    expect(r.displayValue).toBe('Unlimited');
    expect(r.isUnlimited).toBe(true);
    expect(r.isExempt).toBe(true);
    expect(r.rawNumeric).toBe(DASHBOARD_QUOTA_UNLIMITED_THRESHOLD);
  });

  it('maps analysesLeft at sentinel without isExempt to Unlimited', () => {
    const r = normalizeDashboardQuotaForDisplay({
      analysesToday: 0,
      maxAnalysesPerDay: 100,
      analysesLeft: DASHBOARD_QUOTA_UNLIMITED_THRESHOLD,
      isExempt: false,
    });
    expect(r.displayValue).toBe('Unlimited');
    expect(r.isUnlimited).toBe(true);
  });

  it('shows floored non-sentinel remainder', () => {
    const r = normalizeDashboardQuotaForDisplay({
      analysesToday: 2,
      maxAnalysesPerDay: 10,
      analysesLeft: 8,
      isExempt: false,
    });
    expect(r.displayValue).toBe('8');
    expect(r.isUnlimited).toBe(false);
    expect(r.rawNumeric).toBe(8);
  });

  it('handles null otaQuota', () => {
    const r = normalizeDashboardQuotaForDisplay(null);
    expect(r.displayValue).toBe('—');
    expect(r.isUnlimited).toBe(false);
  });

  it('handles analyses_left snake_case', () => {
    const r = normalizeDashboardQuotaForDisplay({ analyses_left: 3 });
    expect(r.displayValue).toBe('3');
  });
});

describe('formatDashboardHeroFooterLine', () => {
  it('returns trimmed human line when provided', () => {
    expect(formatDashboardHeroFooterLine('pnl', '  Hello  ')).toBe('Hello');
  });

  it('falls back per kind when empty', () => {
    expect(formatDashboardHeroFooterLine('exposure', '')).toBe('Positions');
  });
});
