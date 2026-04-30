/**
 * Contract UI: hub FIAT vizibil + anchor pentru convert (fără a depinde de mount complet al paginii).
 */
const fs = require('fs');
const path = require('path');

const personalAccountPath = path.join(__dirname, '../PersonalAccountPage.jsx');
const otaProfilePath = path.join(__dirname, '../OTAProfilePage.jsx');

describe('FIAT entry hub and deep link', () => {
  it('PersonalAccountPage exposes fiat hub, CTA scroll, and convert anchor', () => {
    const src = fs.readFileSync(personalAccountPath, 'utf8');
    expect(src).toContain('personal-account-fiat-hub');
    expect(src).toContain('fiat-convert-anchor');
    expect(src).toContain('scrollIntoView');
    expect(src).toMatch(/goTo\(['"]stripe['"]\)/);
    expect(src).toMatch(/goTo\(['"]bank['"]\)/);
  });

  it('PersonalAccountPage keeps OTA profit card read-only without auto opening wallet auth', () => {
    const src = fs.readFileSync(personalAccountPath, 'utf8');
    expect(src).toMatch(/autoEnsureSession:\s*false/);
    expect(src).toContain('no longer opens MetaMask automatically');
  });

  it('OTAProfilePage links to Personal Account convert section', () => {
    const src = fs.readFileSync(otaProfilePath, 'utf8');
    expect(src).toContain('/dex-edu/account#fiat-convert-anchor');
  });

  it('OTAProfilePage links to bank withdrawal request (same flow as Personal Account hub)', () => {
    const src = fs.readFileSync(otaProfilePath, 'utf8');
    expect(src).toContain('/dex-edu/leverage?tab=bank');
    expect(src).toContain('Bank withdrawal');
  });
});
