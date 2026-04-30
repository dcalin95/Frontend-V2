import { dedupeProfitErrors } from '../closedPositionsProfitService';

describe('dedupeProfitErrors', () => {
  const msg =
    'Semnătura OTA lipsește sau a expirat. Deschide portofelul și acceptă mesajul scurt, apoi Reîmprospătare.';

  it('colapsează același mesaj OTA din surse multiple (fără prefix duplicat în UI)', () => {
    const d = dedupeProfitErrors([msg, `executions: ${msg}`, `closed: ${msg}`]);
    expect(d).toHaveLength(1);
    expect(d[0]).toBe(msg);
  });

  it('păstrează mesaje distincte', () => {
    expect(dedupeProfitErrors(['a', 'b'])).toEqual(['a', 'b']);
  });
});
