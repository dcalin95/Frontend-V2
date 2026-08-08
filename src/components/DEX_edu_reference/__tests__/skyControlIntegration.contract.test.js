import fs from 'fs';
import path from 'path';

const readSource = (...parts) => fs.readFileSync(path.join(process.cwd(), ...parts), 'utf8');

describe('Sky Control shell integration', () => {
  it('keeps the header entry behind the explicit flag next to Investigator', () => {
    const header = readSource('src', 'components', 'DEX_edu_reference', 'common', 'Header.jsx');
    const investigatorIndex = header.indexOf('to="/dex-edu/investigator"');
    const skyControlIndex = header.indexOf('to="/dex-edu/sky-control"');

    expect(header).toContain('ENABLE_SKY_CONTROL ?');
    expect(investigatorIndex).toBeGreaterThan(-1);
    expect(skyControlIndex).toBeGreaterThan(investigatorIndex);
  });

  it('keeps Sky Control disabled-route safe and authenticated when enabled', () => {
    const app = readSource('src', 'components', 'DEX_edu_reference', 'DEXApp.jsx');

    expect(app).toContain('path="sky-control"');
    expect(app).toContain('ENABLE_SKY_CONTROL ?');
    expect(app).toContain('<ProtectedRoute requireAuth={true}');
    expect(app).toContain('<Navigate to={`${DEX_BASE_PATH}/dashboard`} replace />');
  });
});
