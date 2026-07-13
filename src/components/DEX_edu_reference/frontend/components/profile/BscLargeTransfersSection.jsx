import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ExternalLink, Menu, RefreshCw, Waves, X } from 'lucide-react';
import { getApiBaseUrl } from '../../../config/apiEndpoints.js';

const formatUsd = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(Number(value) || 0);

const formatAmount = (value) => new Intl.NumberFormat('en-US', {
  maximumFractionDigits: Number(value) >= 1000 ? 2 : 6,
}).format(Number(value) || 0);

const formatDuration = (seconds) => {
  if (!Number.isFinite(Number(seconds))) return 'Not enough observations';
  if (seconds >= 86400) return `${(seconds / 86400).toFixed(1)} days`;
  if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)} hours`;
  return `${Math.round(seconds / 60)} min`;
};

const WalletAddress = ({ address }) => {
  const value = String(address || '');
  const prefix = value.length > 4 ? value.slice(0, -4) : '';
  const suffix = value.length > 4 ? value.slice(-4) : value;
  return <span className="ota-bsc-wallet-address"><span className="ota-bsc-wallet-prefix">{prefix}</span><strong className="ota-bsc-wallet-suffix">{suffix}</strong></span>;
};

const contractTypeLabel = (type) => ({
  token_proxy: 'Token proxy', token: 'Token contract', proxy: 'Proxy', contract: 'Smart contract',
}[type] || 'Smart contract');

const ContractDeployments = ({ data }) => {
  const scan = data.contractDeployments;
  if (!scan || scan.status !== 'available') {
    return <div className="ota-bsc-wallet-detail-row ota-bsc-contract-deployments"><strong>Smart contracts deployed</strong><span>Deployment history unavailable</span></div>;
  }
  const nonceScan = scan.source === 'deterministic_nonce_scan';
  const coverage = scan.complete
    ? `${nonceScan ? 'Complete on-chain nonce range' : 'Complete transaction history'} checked (${scan.scannedTransactions})`
    : `${nonceScan ? 'Partial on-chain scan: first and latest creation nonces' : 'Partial history: latest transactions'} checked (${scan.scannedTransactions})`;
  return <div className="ota-bsc-wallet-detail-row ota-bsc-contract-deployments">
    <strong>Smart contracts deployed</strong>
    {scan.deployments?.length ? scan.deployments.slice(0, 8).map((contract) => <a key={contract.address} href={contract.explorerUrl} target="_blank" rel="noopener noreferrer">
      <span className={`ota-bsc-contract-type is-${contract.type}`}>{contractTypeLabel(contract.type)}</span>
      {contract.tokenSymbol && <b>{contract.tokenSymbol}</b>}
      <WalletAddress address={contract.address} />
      <ExternalLink size={13} aria-hidden />
    </a>) : <span>{scan.complete ? 'No contract deployments found' : 'None found in the scanned transaction window'}</span>}
    <small>{coverage}</small>
  </div>;
};

const WalletInsights = ({ data }) => (
  <div className="ota-bsc-wallet-insights">
    <div className="ota-bsc-wallet-insights-title">
      <a href={data.explorerUrl} target="_blank" rel="noopener noreferrer"><WalletAddress address={data.address} /></a>
      <span>{data.classification.replaceAll('_', ' ')}</span>
    </div>
    <dl className="ota-bsc-wallet-metrics">
      <div><dt>Observed since</dt><dd>{data.firstObservedAt ? new Date(data.firstObservedAt * 1000).toLocaleString() : 'No history'}</dd></div>
      <div><dt>Last activity</dt><dd>{data.lastObservedAt ? new Date(data.lastObservedAt * 1000).toLocaleString() : 'No history'}</dd></div>
      <div><dt>Transactions</dt><dd>{data.observedTransactions} tracked / {data.transactionCount} on-chain</dd></div>
      <div><dt>Activity</dt><dd>{data.activity24h} / {data.activity7d} / {data.activity30d} (24h / 7d / 30d)</dd></div>
      <div><dt>Net flow</dt><dd>{formatUsd(data.netFlowUsd)} ({data.behavior})</dd></div>
      <div><dt>In / Out</dt><dd>{formatUsd(data.inboundUsd)} / {formatUsd(data.outboundUsd)}</dd></div>
      <div><dt>Total / average</dt><dd>{formatUsd(data.totalVolumeUsd)} / {formatUsd(data.averageTransferUsd)}</dd></div>
      <div><dt>Largest transfer</dt><dd>{formatUsd(data.largestTransferUsd)}</dd></div>
      <div><dt>Average interval</dt><dd>{formatDuration(data.averageIntervalSeconds)}</dd></div>
      <div><dt>Top-3 concentration</dt><dd>{Number(data.top3ConcentrationPct || 0).toFixed(1)}%</dd></div>
      <div><dt>Observed funding source</dt><dd>{data.observedFundingSource ? <WalletAddress address={data.observedFundingSource} /> : 'Not observed'}</dd></div>
      <div><dt>Price reaction</dt><dd>{data.priceReaction?.samples ? `${data.priceReaction.samples} samples` : 'Insufficient market context'}</dd></div>
    </dl>
    <div className="ota-bsc-wallet-detail-row"><strong>Balances</strong>{data.balances?.filter((item) => item.amount > 0).map((item) => <span key={item.token}>{item.token} {formatAmount(item.amount)}{item.valueUsd != null ? ` (${formatUsd(item.valueUsd)})` : ''}</span>)}</div>
    <div className="ota-bsc-wallet-detail-row"><strong>Tokens by tracked volume</strong>{data.tokenVolumes?.map((item) => <span key={item.token}>{item.token} {formatUsd(item.volumeUsd)}</span>)}</div>
    <div className="ota-bsc-wallet-detail-row"><strong>Top counterparties</strong>{data.topCounterparties?.slice(0, 3).map((item) => <span key={item.address}><WalletAddress address={item.address} /> x{item.count} ({formatUsd(item.volumeUsd)})</span>)}</div>
    <div className="ota-bsc-wallet-detail-row"><strong>Repeated amounts</strong>{data.repeatedAmounts?.length ? data.repeatedAmounts.map((item) => <span key={item.amountUsd}>{formatUsd(item.amountUsd)} x{item.count}</span>) : <span>None yet</span>}</div>
    <ContractDeployments data={data} />
  </div>
);

const BscLargeTransfersSection = () => {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [insights, setInsights] = useState({});
  const [insightsError, setInsightsError] = useState(null);

  const load = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/bsc/large-transfers?minUsd=1000000&limit=25&blocks=90`, {
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

  const toggleInsights = useCallback(async (row) => {
    const key = `${row.txHash}:${row.logIndex}`;
    if (expanded === key) { setExpanded(null); return; }
    setExpanded(key);
    setInsightsError(null);
    if (insights[key]) return;
    try {
      const loadWallet = async (address) => {
        const response = await fetch(`${getApiBaseUrl()}/bsc/large-transfers/wallet/${address}`, { credentials: 'include' });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body?.ok !== true) throw new Error(body?.error || 'Wallet insights unavailable');
        return body;
      };
      const [from, to] = await Promise.all([loadWallet(row.from), loadWallet(row.to)]);
      setInsights((current) => ({ ...current, [key]: { from, to } }));
    } catch (requestError) {
      setInsightsError(requestError?.message || 'Wallet insights unavailable');
    }
  }, [expanded, insights]);

  useEffect(() => {
    load();
    const refresh = setInterval(load, 60_000);
    return () => clearInterval(refresh);
  }, [load]);

  const rows = payload?.transactions || [];
  return (
    <section className="ota-bsc-whales" aria-labelledby="ota-bsc-whales-title">
      <header className="ota-bsc-whales-header">
        <div>
          <h2 id="ota-bsc-whales-title"><Waves size={19} aria-hidden /> BSC transfers over $1M</h2>
          <p>Unlabeled private wallets only. Official exchange wallets and contracts are excluded; recurrent routes appear first.</p>
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
              {rows.map((row) => {
                const rowKey = `${row.txHash}:${row.logIndex}`;
                const isExpanded = expanded === rowKey;
                return <React.Fragment key={rowKey}>
                <tr>
                  <td className="ota-bsc-whales-route">
                    <a href={`https://bscscan.com/address/${row.from}`} target="_blank" rel="noopener noreferrer"><WalletAddress address={row.from} /></a>
                    <ArrowRight size={14} aria-hidden />
                    <a href={`https://bscscan.com/address/${row.to}`} target="_blank" rel="noopener noreferrer"><WalletAddress address={row.to} /></a>
                    {row.recurrentRoute && <span className="ota-bsc-whales-repeat">Repeated x{row.routeRepeatCount}</span>}
                  </td>
                  <td><strong>{formatUsd(row.amountUsd)}</strong><span>{formatAmount(row.amount)} {row.token}</span></td>
                  <td><span className="ota-bsc-whales-token">{row.token}</span></td>
                  <td>{row.timestamp ? new Date(row.timestamp * 1000).toLocaleString() : `Block ${row.blockNumber}`}</td>
                  <td className="ota-bsc-whales-actions">
                    <button type="button" className="ota-bsc-whales-tx" onClick={() => toggleInsights(row)} title="Wallet intelligence" aria-label="Open wallet intelligence">{isExpanded ? <X size={16} /> : <Menu size={16} />}</button>
                    <a className="ota-bsc-whales-tx" href={row.explorerUrl} target="_blank" rel="noopener noreferrer" title="Open transaction on BscScan" aria-label="Open transaction on BscScan"><ExternalLink size={16} /></a>
                  </td>
                </tr>
                {isExpanded && <tr className="ota-bsc-wallet-expanded"><td colSpan="5">
                  {insightsError && <div className="ota-bsc-whales-state ota-bsc-whales-error">{insightsError}</div>}
                  {!insightsError && !insights[rowKey] && <div className="ota-bsc-whales-state">Loading wallet intelligence...</div>}
                  {insights[rowKey] && <div className="ota-bsc-wallet-insights-grid"><WalletInsights data={insights[rowKey].from} /><WalletInsights data={insights[rowKey].to} /></div>}
                </td></tr>}
                </React.Fragment>;
              })}
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
