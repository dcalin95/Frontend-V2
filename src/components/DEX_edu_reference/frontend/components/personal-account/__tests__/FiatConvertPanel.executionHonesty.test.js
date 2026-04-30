/**
 * Dovadă statică: panoul nu pretinde că BNB merge direct în UserVault.
 */
const fs = require('fs');
const path = require('path');

describe('FiatConvertPanel execution honesty', () => {
  const p = path.join(__dirname, '../FiatConvertPanel.jsx');
  const src = fs.readFileSync(p, 'utf8');

  test('menționează explicit wallet vs vault și link deposit', () => {
    expect(src).toMatch(/UserVault|uservault/i);
    expect(src).toMatch(/connected BSC wallet|relayer/i);
    expect(src).toContain('fiatConvertExecutionModel');
    expect(src).toContain('depositCtaPath');
    expect(src).toContain('walletArrivalLine');
    expect(src).toContain('depositCtaLabel');
    expect(src).toContain('fiatConvertOrderUi');
  });
});
