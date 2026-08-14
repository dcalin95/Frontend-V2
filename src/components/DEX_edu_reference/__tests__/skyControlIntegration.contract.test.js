import fs from 'fs';
import path from 'path';

const readSource = (...parts) => fs.readFileSync(path.join(process.cwd(), ...parts), 'utf8');

describe('Sky Control shell integration', () => {
  it('keeps a flagged Sky Control entry next to Investigator', () => {
    const header = readSource('src', 'components', 'DEX_edu_reference', 'common', 'Header.jsx');
    const investigatorIndex = header.indexOf('to="/dex-edu/investigator"');
    const skyControlIndex = header.indexOf('to="/dex-edu/sky-control"');

    expect(header).toContain('to="/dex-edu/investigator"');
    expect(header).toContain('ENABLE_SKY_CONTROL ?');
    expect(skyControlIndex).toBeGreaterThan(investigatorIndex);
  });

  it('keeps Sky Control in the authenticated DEX route and aliases the root route', () => {
    const app = readSource('src', 'App.js');
    const dexApp = readSource('src', 'components', 'DEX_edu_reference', 'DEXApp.jsx');

    expect(app).toContain('path="/sky-control"');
    expect(app).toContain('ENABLE_SKY_CONTROL ?');
    expect(app).toContain('<Navigate to="/dex-edu/sky-control" replace />');
    expect(dexApp).toContain('<ProtectedRoute requireAuth={true}');
    expect(app).toContain('<Navigate to="/" replace />');
    expect(dexApp).toContain('path="sky-control"');
    expect(dexApp).toContain('ENABLE_SKY_CONTROL ?');
  });

  it('uses the DEX runtime backend for every authenticated Sky Control request', () => {
    const service = readSource('src', 'components', 'DEX_edu_reference', 'frontend', 'services', 'skyControlService.js');

    expect(service).toContain('function getSkyControlBackendUrl()');
    expect(service).toContain('return String(getBackendUrl() || \'\').replace(/\\/$/, \'\');');
    expect(service).not.toContain('window.location.origin');
    expect(service).toContain("credentials: 'include'");
  });
});
