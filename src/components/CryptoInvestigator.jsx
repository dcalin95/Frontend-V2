import React, { useMemo, useState } from "react";
import { getBackendUrl } from "../utils/getBackendUrl";
import "./CryptoInvestigator.css";

const ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const CHAINS = [
  { id: 1, name: "Ethereum" },
  { id: 56, name: "BNB Chain" },
  { id: 8453, name: "Base" },
];

const shortAddress = (value = "") =>
  value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;

export default function CryptoInvestigator() {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const backendUrl = useMemo(() => getBackendUrl().replace(/\/$/, ""), []);

  const analyse = async (event) => {
    event.preventDefault();
    const candidate = address.trim();
    if (!ADDRESS.test(candidate)) {
      setError("Introdu o adresă EVM validă (0x urmat de 40 caractere hexazecimale).");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${backendUrl}/api/investigator/analyse/${candidate}?chainId=${chainId}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Analiza nu a putut fi efectuată.");
      setResult(data);
    } catch (requestError) {
      setResult(null);
      setError(requestError.message || "Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    window.open(
      `${backendUrl}/api/investigator/report/${result.address}.pdf?chainId=${chainId}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <main className="investigator-page">
      <section className="investigator-hero">
        <p className="investigator-kicker">BITS AI · ON-CHAIN INTELLIGENCE</p>
        <h1>Crypto Investigator</h1>
        <p>Analiză preliminară pentru adrese EVM, direct în bits-ai.io.</p>
        <form className="investigator-form" onSubmit={analyse}>
          <label>
            Adresă wallet / contract
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="0x…"
              autoComplete="off"
              spellCheck="false"
            />
          </label>
          <label>
            Rețea
            <select value={chainId} onChange={(event) => setChainId(Number(event.target.value))}>
              {CHAINS.map((chain) => <option key={chain.id} value={chain.id}>{chain.name}</option>)}
            </select>
          </label>
          <button type="submit" disabled={loading}>{loading ? "Se analizează…" : "Analizează"}</button>
        </form>
        <p className="investigator-note">Instrument informativ. Semnalele de risc nu reprezintă dovadă de fraudă sau identitate.</p>
      </section>

      {error && <p className="investigator-error" role="alert">{error}</p>}

      {result && (
        <section className="investigator-results" aria-live="polite">
          <div className="investigator-summary">
            <article><span>Scor risc</span><strong className={`risk-${result.riskLevel}`}>{result.riskScore}/100</strong><small>{result.riskLevel}</small></article>
            <article><span>Transferuri analizate</span><strong>{result.transferCount}</strong></article>
            <article><span>Contrapartide</span><strong>{result.counterparties}</strong></article>
            <article><span>Raport</span><button type="button" onClick={downloadReport}>Descarcă PDF</button></article>
          </div>

          <div className="investigator-panel">
            <h2>Semnale observate</h2>
            {result.signals?.length ? <ul>{result.signals.map((signal) => <li key={signal.code}><b>{signal.label} (+{signal.points})</b><span>{signal.evidence}</span></li>)}</ul> : <p>Nu au fost detectate semnale în eșantionul disponibil.</p>}
          </div>

          <div className="investigator-panel">
            <h2>Transferuri recente</h2>
            <div className="investigator-table-wrap"><table><thead><tr><th>Dată</th><th>Token</th><th>Cantitate</th><th>De la</th><th>Către</th></tr></thead><tbody>
              {result.transfers?.map((transfer) => <tr key={`${transfer.txHash}-${transfer.timestamp}`}><td>{new Date(transfer.timestamp).toLocaleString()}</td><td>{transfer.tokenSymbol}</td><td>{transfer.amount}</td><td title={transfer.sender}>{shortAddress(transfer.sender)}</td><td title={transfer.recipient}>{shortAddress(transfer.recipient)}</td></tr>)}
            </tbody></table></div>
          </div>
          <p className="investigator-disclaimer">{result.disclaimer}</p>
        </section>
      )}
    </main>
  );
}
