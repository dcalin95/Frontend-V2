import { BACKEND_URL } from './backend';

export async function fetchJson(path, { method = 'GET', body, headers = {}, credentials = 'include' } = {}) {
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const resp = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials,
  });
  const text = await resp.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!resp.ok) {
    const msg = (data && data.error) || (data && data.message) || resp.statusText || 'Request failed';
    const hint = (data && data.hint) ? ` ${data.hint}` : '';
    const err = new Error(msg + hint);
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data;
}


