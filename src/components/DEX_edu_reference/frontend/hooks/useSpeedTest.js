/**
 * useSpeedTest - measures latency and download speed to the origin (app + backend).
 * Used in Settings -> Network for "Speed test".
 */

import { useState, useCallback } from 'react';

const DEFAULT_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

/**
 * Runs speed test: latency (ms) and download (Mbps) to origin.
 * Download: fetch index.html multiple times in parallel, measuring bytes/time.
 */
async function runSpeedTest(origin = DEFAULT_ORIGIN) {
  const latencyMs = await measureLatency(origin);
  const downloadMbps = await measureDownloadMbps(origin);
  return { latencyMs, downloadMbps };
}

async function measureLatency(origin) {
  const url = `${origin}/?speedtest=${Date.now()}`;
  const start = performance.now();
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 15000);
  try {
    await fetch(url, { method: 'GET', cache: 'no-store', signal: ctrl.signal });
    clearTimeout(timeout);
    return Math.round(performance.now() - start);
  } catch (_) {
    clearTimeout(timeout);
    return null;
  }
}

async function measureDownloadMbps(origin) {
  const rounds = 4;
  const url = (i) => `${origin}/?speedtest=${Date.now()}-${i}`;
  const start = performance.now();
  const controllers = Array.from({ length: rounds }, () => new AbortController());
  const timeout = setTimeout(() => controllers.forEach(c => c.abort()), 20000);
  try {
    const responses = await Promise.all(
      Array.from({ length: rounds }, (_, i) =>
        fetch(url(i), { method: 'GET', cache: 'no-store', signal: controllers[i].signal })
      )
    );
    clearTimeout(timeout);
    const blobs = await Promise.all(responses.map(r => r.blob()));
    const totalBytes = blobs.reduce((acc, b) => acc + b.size, 0);
    const durationSec = (performance.now() - start) / 1000;
    if (durationSec <= 0 || totalBytes <= 0) return null;
    const Mbps = (totalBytes * 8) / (durationSec * 1e6);
    return Math.round(Mbps * 100) / 100;
  } catch (_) {
    clearTimeout(timeout);
    return null;
  }
}

export function useSpeedTest() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const data = await runSpeedTest();
      setResult(data);
    } catch (e) {
      setError(e?.message || 'Test failed');
    } finally {
      setRunning(false);
    }
  }, []);

  return { run, running, result, error };
}
