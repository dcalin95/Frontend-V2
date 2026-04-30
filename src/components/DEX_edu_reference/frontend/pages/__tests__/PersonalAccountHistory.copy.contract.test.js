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
    expect(src).toContain('Transfers between the connected wallet and UserVault (BSC)');
    expect(src).not.toMatch(/nu se șterg niciodată/);
    expect(src).toContain('enableBrowserFallback: false');
    expect(src).toContain('autoEnsureSession: false');
    expect(src).toContain('no longer opens MetaMask automatically for this table');
    expect(src).toContain('manual: true');
  });
});
