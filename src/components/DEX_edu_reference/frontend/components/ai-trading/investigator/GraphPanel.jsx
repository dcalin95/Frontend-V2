import React from 'react';

function short(value) {
  const text = String(value || '');
  return text.length > 18 ? `${text.slice(0, 10)}…${text.slice(-6)}` : text || '—';
}

export default function GraphPanel({ graph, loading, error, onLoad }) {
  return (
    <section className="investigator-panel investigator-graph-panel" aria-labelledby="investigator-graph-title">
      <header className="investigator-panel__header">
        <div>
          <h3 id="investigator-graph-title">Evidence graph</h3>
          <p>One-hop bounded graph. Every edge links to an exact persisted evidence record.</p>
        </div>
        <button type="button" className="investigator-btn investigator-btn--ghost" onClick={onLoad} disabled={loading}>
          {loading ? 'Loading…' : 'Load graph'}
        </button>
      </header>
      {error ? <div className="investigator-alert investigator-alert--danger" role="alert">{error}</div> : null}
      {graph?.edges?.length ? (
        <div className="investigator-graph-list">
          {graph.edges.map((edge) => (
            <article key={edge.edgeId}>
              <div><code title={edge.sourceAddress}>{short(edge.sourceAddress)}</code><span aria-hidden>→</span><code title={edge.destinationAddress}>{short(edge.destinationAddress)}</code></div>
              <strong>{edge.amount?.normalizedValue || '—'} {edge.amount?.tokenSymbol || ''}</strong>
              <small title={edge.transactionHash}>Evidence {short(edge.evidenceId)} · TX {short(edge.transactionHash)}</small>
            </article>
          ))}
          <footer>Stop reasons: {graph.coverage?.stopReasons?.join(', ') || 'snapshot boundary'}</footer>
        </div>
      ) : (
        <div className="investigator-empty"><p>{graph ? 'No matching evidence edges in this bounded snapshot.' : 'Load a completed case snapshot to build the graph.'}</p></div>
      )}
    </section>
  );
}
