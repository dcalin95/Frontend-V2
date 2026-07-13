import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ExternalLink, RefreshCw, Waves } from 'lucide-react';
import { getApiBaseUrl } from '../../../config/apiEndpoints.js';

const formatUsd = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(Number(value) || 0);

const formatAmount = (value) => new Intl.NumberFormat('en-US', {
  maximumFractionDigits: Number(value) >= 1000 ? 2 : 6,
}).format(Number(value) || 0);

const BscLargeTransfersSection = () => {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/bsc/large-transfers?minUsd=1000000&limit=25&blocks=1200`, {
        signal: controller.signal,
        credentials: 'include',
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.ok !== true) throw new Error(body?.error || 'Feed unavailable');
      setPayload(body);
    } catch (requestError) {
      setError(requestError?.name === 'AbortError' ? 'BSC feed timed out.' : requestError?.message || 'BSC feed unavailable.');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = payload?.transactions || [];
  return (
    <section className="ota-bsc-whales" aria-labelledby="ota-bsc-whales-title">
      <header className="ota-bsc-whales-header">
        <div>
          <h2 id="ota-bsc-whales-title"><Waves size={19} aria-hidden /> BSC transfers over $1M</h2>
          <p>Persistent verified history across {payload?.trackedTokens?.join(', ') || 'high-liquidity BSC tokens'}.</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="ota-bsc-whales-refresh" title="Refresh BSC transfers" aria-label="Refresh BSC transfers">
          <RefreshCw size={17} className={loading ? 'is-spinning' : ''} />
        </button>
      </header>

      {error && <div className="ota-bsc-whales-state ota-bsc-whales-error">{error}</div>}
      {!error && loading && !payload && <div className="ota-bsc-whales-state">Scanning recent BSC blocks...</div>}
      {!error && !loading && rows.length === 0 && <div className="ota-bsc-whales-state">No verified transfer above $1M has been recorded yet.</div>}
      {!error && rows.length > 0 && (
        <div className="ota-bsc-whales-table-wrap">
          <table className="ota-bsc-whales-table">
            <thead><tr><th>Wallet route</th><th>Value</th><th>Coin</th><th>Time</th><th><span className="sr-only">Transaction</span></th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.txHash}:${row.logIndex}`}>
                  <td className="ota-bsc-whales-route">
                    <a href={`https://bscscan.com/address/${row.from}`} target="_blank" rel="noopener noreferrer">{row.from}</a>
                    <ArrowRight size={14} aria-hidden />
                    <a href={`https://bscscan.com/address/${row.to}`} target="_blank" rel="noopener noreferrer">{row.to}</a>
                  </td>
                  <td><strong>{formatUsd(row.amountUsd)}</strong><span>{formatAmount(row.amount)} {row.token}</span></td>
                  <td><span className="ota-bsc-whales-token">{row.token}</span></td>
                  <td>{row.timestamp ? new Date(row.timestamp * 1000).toLocaleString() : `Block ${row.blockNumber}`}</td>
                  <td><a className="ota-bsc-whales-tx" href={row.explorerUrl} target="_blank" rel="noopener noreferrer" title="Open transaction on BscScan" aria-label="Open transaction on BscScan"><ExternalLink size={16} /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer>
        {payload?.generatedAt ? `Updated ${new Date(payload.generatedAt).toLocaleTimeString()} · blocks ${payload.scannedFromBlock}-${payload.scannedToBlock}` : 'Public BSC on-chain data'}
      </footer>
    </section>
  );
};

export default BscLargeTransfersSection;
