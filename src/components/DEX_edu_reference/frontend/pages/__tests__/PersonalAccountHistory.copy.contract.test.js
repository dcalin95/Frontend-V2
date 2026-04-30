/**
 * Contract: copy și structură secțiune History (crypto) pe Personal Account.
 */
const fs = require('fs');
const path = require('path');

const personalAccountPath = path.join(__dirname, '../PersonalAccountPage.jsx');

describe('PersonalAccountPage History (crypto) copy contract', () => {
  it('folosește copy onest pentru UserVault / BSC și nu promite „blockchain forever” generic', () => {
    const src = fs.readFileSync(personalAccountPath, 'utf8');
    expect(src).toContain('BSC · UserVault');
    expect(src).toContain('Transferuri între wallet-ul conectat și UserVault (BSC)');
    expect(src).not.toMatch(/nu se șterg niciodată/);
    expect(src).toContain('enableBrowserFallback: false');
    expect(src).toContain('autoEnsureSession: false');
    expect(src).toContain('nu mai deschide MetaMask automat pentru acest tabel');
    expect(src).toContain('manual: true');
  });
});
