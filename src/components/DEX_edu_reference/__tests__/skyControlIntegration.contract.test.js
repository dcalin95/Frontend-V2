import fs from 'fs';
import path from 'path';

const readSource = (...parts) => fs.readFileSync(path.join(process.cwd(), ...parts), 'utf8');

describe('Sky Control shell integration', () => {
  it('keeps a flagged Sky Control entry next to Investigator without using a DEX route', () => {
    const header = readSource('src', 'components', 'DEX_edu_reference', 'common', 'Header.jsx');
    const investigatorIndex = header.indexOf('to="/dex-edu/investigator"');
    const skyControlIndex = header.indexOf('to="/sky-control"');

    expect(header).toContain('to="/dex-edu/investigator"');
    expect(header).toContain('ENABLE_SKY_CONTROL ?');
    expect(skyControlIndex).toBeGreaterThan(investigatorIndex);
    expect(header).not.toContain('to="/dex-edu/sky-control"');
  });

  it('keeps Sky Control standalone, disabled-route safe, and authenticated when enabled', () => {
    const app = readSource('src', 'App.js');
    const dexApp = readSource('src', 'components', 'DEX_edu_reference', 'DEXApp.jsx');

    expect(app).toContain('path="/sky-control"');
    expect(app).toContain('ENABLE_SKY_CONTROL ?');
    expect(app).toContain('<DexAuthProvider>');
    expect(app).toContain('<ProtectedRoute requireAuth={true}');
    expect(app).toContain('<Navigate to="/" replace />');
    expect(dexApp).toContain('path="sky-control" element={<Navigate to="/sky-control" replace />}');
  });
});
