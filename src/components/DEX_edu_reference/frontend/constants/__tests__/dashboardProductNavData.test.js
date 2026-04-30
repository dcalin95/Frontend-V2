import {
  DASHBOARD_FEATURE_GRID_ITEMS,
  DASHBOARD_SECONDARY_LINK_GROUPS,
  DASHBOARD_ICON_MAP,
} from '../dashboardProductNavData';

describe('dashboardProductNavData', () => {
  it('exports 12 feature tiles with routes under /dex-edu', () => {
    expect(DASHBOARD_FEATURE_GRID_ITEMS).toHaveLength(12);
    for (const item of DASHBOARD_FEATURE_GRID_ITEMS) {
      expect(item.to).toMatch(/^\/dex-edu\//);
      expect(item.bullets.length).toBeGreaterThanOrEqual(2);
      expect(DASHBOARD_ICON_MAP[item.iconId]).toBeTruthy();
    }
  });

  it('groups secondary links without duplicate paths across groups', () => {
    const seen = new Set();
    for (const g of DASHBOARD_SECONDARY_LINK_GROUPS) {
      expect(g.links.length).toBeGreaterThan(0);
      for (const { to } of g.links) {
        expect(to).toMatch(/^\/dex-edu\//);
        expect(seen.has(to)).toBe(false);
        seen.add(to);
      }
    }
  });
});
