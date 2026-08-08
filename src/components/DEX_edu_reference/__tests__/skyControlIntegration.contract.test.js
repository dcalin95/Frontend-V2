import fs from 'fs';
import path from 'path';

const readSource = (...parts) => fs.readFileSync(path.join(process.cwd(), ...parts), 'utf8');

describe('Sky Control shell integration', () => {
  it('keeps the DEX header free of the standalone Sky Control route', () => {
    const header = readSource('src', 'components', 'DEX_edu_reference', 'common', 'Header.jsx');

    expect(header).toContain('to="/dex-edu/investigator"');
    expect(header).not.toContain('sky-control');
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
