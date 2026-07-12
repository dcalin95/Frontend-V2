import { hasOAuthSuccessMarker } from '../oauthCallbackUrl';

describe('hasOAuthSuccessMarker', () => {
  test('detects a normal query callback', () => {
    expect(hasOAuthSuccessMarker({ search: '?auth=success', hash: '' })).toBe(true);
  });

  test('detects the production hash-router callback', () => {
    expect(hasOAuthSuccessMarker({ search: '', hash: '#/dex-edu/profile?auth=success' })).toBe(true);
  });

  test('ignores a profile URL without an OAuth success marker', () => {
    expect(hasOAuthSuccessMarker({ search: '', hash: '#/dex-edu/profile' })).toBe(false);
  });
});
