/**
 * BTC movement alert preferences: email through SMTP backend + Web Push through VAPID and DB subscription.
 * Snapshots: Binance USD-M, same logic as the backend worker.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Bell, RefreshCw, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDexAuth } from '../../context/DexAuthContext';
import { useWallet } from '../../hooks/useWallet';
import { otaApiRequest } from '../../utils/otaApiClient';
import {
  fetchBtcMarketAlertSnapshot,
  fetchBtcMarketAlertPreferences,
  saveBtcMarketAlertPreferences,
} from '../../services/otaMarketAlertsService';

const S = {
  wrap: {
    marginTop: 12,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid rgba(148, 163, 184, 0.35)',
    background: 'linear-gradient(145deg, #0f172a 0%, #0a0f1a 100%)',
    maxWidth: 720,
  },
  title: { fontSize: 13, fontWeight: 800, color: '#e2e8f0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 },
  muted: { fontSize: 11, color: '#94a3b8', lineHeight: 1.45, marginBottom: 10 },
  row: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 11, fontWeight: 700, color: '#cbd5e1' },
  input: {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#f1f5f9',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 12,
    minWidth: 100,
  },
  banner: {
    marginTop: 8,
    padding: '8px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
  },
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/**
 * @param {{ compactHeaderRow?: boolean }} props
 * compactHeaderRow: fit into the BTC + OTA LLM row on Futures Ops without extra max-width/margin-top.
 */
export default function OtaBtcMoveAlertSettings({ compactHeaderRow = false }) {
  const { walletAddress } = useWallet();
  const { user } = useDexAuth();
  const addr = (walletAddress || '').trim();
  const defaultEmail = (user?.email && String(user.email).includes('@')) ? String(user.email).trim() : '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [thresholdPct, setThresholdPct] = useState(0.35);
  const [horizon, setHorizon] = useState('1h');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [alertEmail, setAlertEmail] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [pushBusy, setPushBusy] = useState(false);

  const load = useCallback(async () => {
    if (!addr) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [prefRes, snapRes] = await Promise.all([
        fetchBtcMarketAlertPreferences(addr),
        fetchBtcMarketAlertSnapshot().catch(() => ({})),
      ]);
      const p = prefRes?.preferences;
      if (p) {
        setEnabled(!!p.enabled);
        setThresholdPct(Number(p.thresholdPct) || 0.35);
        setHorizon(p.horizon === '4h' ? '4h' : '1h');
        setNotifyEmail(p.notifyEmail !== false);
        setNotifyPush(p.notifyPush !== false);
        setAlertEmail(p.alertEmail || defaultEmail || '');
      } else {
        setAlertEmail(defaultEmail || '');
      }
      if (snapRes?.snapshot) setSnapshot(snapRes.snapshot);
    } catch (e) {
      toast.error(e.message || 'Preferences did not load');
    } finally {
      setLoading(false);
    }
  }, [addr, defaultEmail]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!addr || !enabled) return undefined;
    const id = setInterval(async () => {
      try {
        const r = await fetchBtcMarketAlertSnapshot();
        if (r?.snapshot) setSnapshot(r.snapshot);
      } catch (_) {}
    }, 60000);
    return () => clearInterval(id);
  }, [addr, enabled]);

  const save = async () => {
    if (!addr) {
      toast.warning('Connect your wallet');
      return;
    }
    setSaving(true);
    try {
      await saveBtcMarketAlertPreferences({
        walletAddress: addr,
        enabled,
        thresholdPct,
        horizon,
        notifyEmail,
        notifyPush,
        alertEmail: alertEmail.trim() || null,
      });
      toast.success('Preferences saved. Backend sends email/push when the threshold is exceeded, with cooldown.');
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const enablePush = async () => {
    if (!addr) {
      toast.warning('Connect your wallet');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Push is not supported in this browser');
      return;
    }
    setPushBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toast.warning('Notification permission denied');
        return;
      }
      const keyRes = await otaApiRequest('/ai-trading/push/public-key', { method: 'GET' });
      const publicKey = keyRes?.publicKey;
      if (!publicKey) {
        toast.error('Server has no VAPID configured (OTA_PUSH_VAPID_* on Render).');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      await otaApiRequest('/ai-trading/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ walletAddress: addr, subscription }),
      });
      toast.success('Push enabled for this wallet. You can install the PWA on your phone home screen.');
    } catch (e) {
      toast.error(e.message || 'Push failed');
    } finally {
      setPushBusy(false);
    }
  };

  const pctLive = horizon === '4h' ? snapshot?.pct4h : snapshot?.pct1h;
  const overThreshold =
    enabled &&
    pctLive != null &&
    Number.isFinite(Number(pctLive)) &&
    Math.abs(Number(pctLive)) >= Number(thresholdPct);

  const wrapStyle = compactHeaderRow
    ? {
        ...S.wrap,
        marginTop: 0,
        maxWidth: 'none',
        padding: '6px 10px',
        borderRadius: 9,
        boxSizing: 'border-box',
      }
    : S.wrap;
  const titleStyle = compactHeaderRow
    ? { ...S.title, fontSize: 12, marginBottom: 4, gap: 6 }
    : S.title;
  const mutedStyle = compactHeaderRow
    ? { ...S.muted, fontSize: 10, lineHeight: 1.32, marginBottom: 6 }
    : S.muted;
  const rowStyle = compactHeaderRow ? { ...S.row, marginBottom: 6, gap: 8 } : S.row;
  const inputStyleCompact = compactHeaderRow ? { ...S.input, padding: '5px 8px', fontSize: 11, minWidth: 88 } : S.input;
  const rowClass = compactHeaderRow ? 'ota-btc-move-alerts--header-row' : '';

  if (!addr) {
    return (
      <div className={rowClass} style={wrapStyle}>
        <div style={titleStyle}><Bell size={compactHeaderRow ? 14 : 16} /> BTC alerts (email + push)</div>
        <p style={mutedStyle}>Connect your wallet to set thresholds and save preferences on the server.</p>
      </div>
    );
  }

  return (
    <div className={rowClass} style={wrapStyle}>
      <div style={titleStyle}>
        <Bell size={compactHeaderRow ? 14 : 16} />
        BTC alerts - email &amp; push (PWA on phone)
      </div>
      <p style={mutedStyle}>
        The server periodically evaluates BTC movement on Binance USD-M (1h or ~4h). When the threshold is exceeded, you receive email (SMTP) and/or
        push notification if push and VAPID are enabled on Render. Not investment advice.
      </p>

      {loading ? (
        <p style={mutedStyle}>Loading...</p>
      ) : (
        <>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: compactHeaderRow ? 6 : 8,
              marginBottom: compactHeaderRow ? 6 : 10,
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <span style={S.label}>Enable alerts for this wallet</span>
          </label>

          <div style={rowStyle}>
            <span style={S.label}>Threshold [%]</span>
            <input
              type="number"
              step="0.05"
              min={0.05}
              max={25}
              value={thresholdPct}
              onChange={(e) => setThresholdPct(parseFloat(e.target.value) || 0.35)}
              style={inputStyleCompact}
            />
            <span style={S.label}>Window</span>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              style={{ ...inputStyleCompact, cursor: 'pointer' }}
            >
              <option value="1h">~1h (2 candle 1h)</option>
              <option value="4h">~4h (15m×17)</option>
            </select>
          </div>

          <div style={rowStyle}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
              <span style={S.label}>Email</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} />
              <span style={S.label}>Push</span>
            </label>
          </div>

          <div style={{ marginBottom: compactHeaderRow ? 6 : 10 }}>
            <div style={S.label}>
              {compactHeaderRow
                ? 'Alert email (optional; otherwise account)'
                : 'Alert email (optional; otherwise uses account email when available)'}
            </div>
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="e.g. you@example.com"
              style={{
                ...inputStyleCompact,
                width: compactHeaderRow ? '100%' : 'min(100%, 320px)',
                maxWidth: '100%',
                marginTop: compactHeaderRow ? 3 : 4,
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: compactHeaderRow ? 6 : 8,
              alignItems: 'center',
              marginBottom: compactHeaderRow ? 0 : undefined,
            }}
          >
            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: compactHeaderRow ? 5 : 6,
                padding: compactHeaderRow ? '5px 11px' : '8px 14px',
                borderRadius: compactHeaderRow ? 6 : 8,
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 700,
                cursor: saving ? 'wait' : 'pointer',
                fontSize: compactHeaderRow ? 11 : 12,
              }}
            >
              <Save size={compactHeaderRow ? 13 : 14} />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={load}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: compactHeaderRow ? 5 : 6,
                padding: compactHeaderRow ? '5px 10px' : '8px 12px',
                borderRadius: compactHeaderRow ? 6 : 8,
                border: '1px solid #475569',
                background: '#0f172a',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: compactHeaderRow ? 11 : 12,
              }}
            >
              <RefreshCw size={compactHeaderRow ? 13 : 14} />
              Reload
            </button>
            <button
              type="button"
              onClick={enablePush}
              disabled={pushBusy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: compactHeaderRow ? 5 : 6,
                padding: compactHeaderRow ? '5px 10px' : '8px 12px',
                borderRadius: compactHeaderRow ? 6 : 8,
                border: '1px solid #14532d',
                background: '#052e16',
                color: '#86efac',
                cursor: pushBusy ? 'wait' : 'pointer',
                fontSize: compactHeaderRow ? 11 : 12,
              }}
            >
              <Bell size={compactHeaderRow ? 13 : 14} />
              {pushBusy ? '...' : compactHeaderRow ? 'Device push' : 'Enable push on this device'}
            </button>
          </div>

          {snapshot && (
            <div
              style={{
                marginTop: compactHeaderRow ? 6 : 12,
                fontSize: compactHeaderRow ? 10 : 11,
                color: '#94a3b8',
                lineHeight: compactHeaderRow ? 1.35 : 1.45,
              }}
            >
              Live: 1h {snapshot.pct1h != null ? `${Number(snapshot.pct1h).toFixed(2)}%` : '—'} · ~4h{' '}
              {snapshot.pct4h != null ? `${Number(snapshot.pct4h).toFixed(2)}%` : '—'}
              {snapshot.at ? ` · ${new Date(snapshot.at).toLocaleTimeString()}` : ''}
              {!compactHeaderRow && (
                <span style={{ marginLeft: 8, color: '#64748b' }}>Source: Binance fapi klines, same as alert worker</span>
              )}
            </div>
          )}

          {overThreshold && (
            <div
              style={{
                ...S.banner,
                marginTop: compactHeaderRow ? 6 : 8,
                padding: compactHeaderRow ? '6px 8px' : '8px 10px',
                fontSize: compactHeaderRow ? 11 : 12,
                background: Number(pctLive) >= 0 ? 'rgba(22, 101, 52, 0.35)' : 'rgba(127, 29, 29, 0.35)',
                border: `1px solid ${Number(pctLive) >= 0 ? '#22c55e' : '#f87171'}`,
                color: '#f1f5f9',
              }}
            >
              Threshold currently reached for the selected window: {Number(pctLive) >= 0 ? '↑' : '↓'} {Number(pctLive).toFixed(2)}% (threshold {thresholdPct}%).
              If you have not received email/push yet, wait for the next server cycle because notifications have cooldown.
            </div>
          )}
        </>
      )}
    </div>
  );
}
