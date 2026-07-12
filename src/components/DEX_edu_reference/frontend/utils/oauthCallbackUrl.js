export function hasOAuthSuccessMarker(locationLike) {
  const search = String(locationLike?.search || '');
  const hash = String(locationLike?.hash || '');
  return search.includes('auth=success') || hash.includes('auth=success');
}
