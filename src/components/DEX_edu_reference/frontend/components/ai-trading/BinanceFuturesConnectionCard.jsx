import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, RefreshCw, ShieldCheck, Unplug } from 'lucide-react';
import {
  deleteBinanceFuturesCredentials,
  getBinanceFuturesCredentialStatus,
  saveBinanceFuturesCredentials,
} from '../../services/binanceFuturesCredentialService';

export default function BinanceFuturesConnectionCard() {
  const [status, setStatus] = useState({ loading: true, configured: false, error: '' });
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setStatus((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await getBinanceFuturesCredentialStatus();
      setStatus({ loading: false, configured: data.configured === true, error: '' });
    } catch (error) {
      setStatus({ loading: false, configured: false, error: error?.message || 'Could not check Binance Futures connection.' });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = async (event) => {
    event.preventDefault();
    if (!apiKey.trim() || !apiSecret.trim()) {
      setStatus((current) => ({ ...current, error: 'Enter both the Binance API key and secret.' }));
      return;
    }
    setSaving(true);
    setStatus((current) => ({ ...current, error: '' }));
    try {
      await saveBinanceFuturesCredentials({ apiKey, apiSecret });
      setApiKey('');
      setApiSecret('');
      setStatus({ loading: false, configured: true, error: '' });
    } catch (error) {
      setStatus((current) => ({ ...current, error: error?.message || 'Could not connect Binance Futures.' }));
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Binance Futures for this authenticated wallet? This removes its encrypted credential record.')) return;
    setSaving(true);
    try {
      await deleteBinanceFuturesCredentials();
      setStatus({ loading: false, configured: false, error: '' });
    } catch (error) {
      setStatus((current) => ({ ...current, error: error?.message || 'Could not disconnect Binance Futures.' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="binance-futures-connection-title" style={{ margin: '0 16px 14px', border: '1px solid #1e3a5f', borderRadius: 8, background: '#07111d', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} color="#60a5fa" aria-hidden />
          <div>
            <strong id="binance-futures-connection-title">Binance Futures connection</strong>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 3 }}>
              {status.loading ? 'Checking the wallet connection...' : status.configured ? 'Connected for this authenticated wallet.' : 'Required before this wallet can place a live Futures order.'}
            </div>
          </div>
        </div>
        <button type="button" onClick={refresh} disabled={status.loading || saving} title="Refresh connection status" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={15} aria-hidden /> Refresh
        </button>
      </div>
      {status.error && <p role="alert" style={{ color: '#fca5a5', margin: '10px 0 0', fontSize: 13 }}>{status.error}</p>}
      {status.configured ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#86efac', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}><CheckCircle2 size={16} aria-hidden /> Credential verified and stored encrypted.</span>
          <button type="button" onClick={disconnect} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Unplug size={15} aria-hidden /> Disconnect</button>
        </div>
      ) : (
        <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 12, alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: 5, fontSize: 12 }}>Binance API key<input value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" spellCheck="false" /></label>
          <label style={{ display: 'grid', gap: 5, fontSize: 12 }}>Binance API secret<input type="password" value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} autoComplete="new-password" spellCheck="false" /></label>
          <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 36 }}><KeyRound size={15} aria-hidden /> {saving ? 'Checking...' : 'Connect'}</button>
        </form>
      )}
    </section>
  );
}
