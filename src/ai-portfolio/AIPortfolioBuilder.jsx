import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { GA4_HELPERS } from "../config/googleAnalytics";
import './styles.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#845EC2"]; 

export default function AIPortfolioBuilder() {
  const [budget, setBudget] = useState(1000);
  const [horizon, setHorizon] = useState("6-12 months");
  const [risk, setRisk] = useState("moderate");
  const [objectives, setObjectives] = useState(["growth"]);
  const [tokenPreferences, setTokenPreferences] = useState(["STX", "ALEX"]);
  const [useBITS, setUseBITS] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [savedOk, setSavedOk] = useState("");
  const cardRef = useRef(null);
  const chartRef = useRef(null);

  const pieData = useMemo(() => {
    if (!result?.allocations) return [];
    return result.allocations.map((a) => ({ name: a.token, value: a.percent }));
  }, [result]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = { budget: Number(budget), horizon, risk, objectives, tokenPreferences, useBITS };
      const { data } = await axios.post(`${BACKEND_URL}/api/generate-portfolio`, payload, { timeout: 20000 });
      setResult(data);
      try { GA4_HELPERS.trackEvent('ai_portfolio_generate', { budget: Number(budget), risk }); } catch {}
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  // Load from query param (?result=base64json) or localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const enc = params.get("result");
      if (enc) {
        const json = JSON.parse(atob(enc));
        if (json && json.allocations) setResult(json);
      } else {
        const last = localStorage.getItem("ai_portfolio_last");
        if (last) setResult(JSON.parse(last));
      }
    } catch {}
  }, []);

  function saveLocal() {
    try {
      if (!result) return;
      localStorage.setItem("ai_portfolio_last", JSON.stringify(result));
      setSavedOk("Saved");
      try { GA4_HELPERS.trackEvent('ai_portfolio_save'); } catch {}
      setTimeout(() => setSavedOk(""), 1500);
    } catch {}
  }

  async function copyJson() {
    try {
      if (!result) return;
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setSavedOk("Copied");
      try { GA4_HELPERS.trackEvent('ai_portfolio_copy'); } catch {}
      setTimeout(() => setSavedOk(""), 1500);
    } catch {}
  }

  function shareLink() {
    try {
      if (!result) return;
      const enc = btoa(JSON.stringify(result));
      const url = `${window.location.origin}/ai-portfolio?result=${encodeURIComponent(enc)}`;
      navigator.clipboard.writeText(url);
      try { GA4_HELPERS.trackEvent('ai_portfolio_share'); } catch {}
      setSavedOk("Link copied");
      setTimeout(() => setSavedOk(""), 1500);
    } catch {}
  }

  async function exportElementToPng(element, filename) {
    if (!element) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: window.devicePixelRatio || 2,
        logging: false
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setSavedOk('PNG exported');
      setTimeout(() => setSavedOk(''), 1500);
    } catch (e) {
      setError('Failed to export PNG');
      setTimeout(() => setError(''), 2000);
    }
  }

  const exportCardPng = () => {
    try { GA4_HELPERS.trackEvent('ai_portfolio_export_card_png'); } catch {}
    exportElementToPng(cardRef.current, 'ai-portfolio.png');
  };

  const exportChartPng = () => {
    try { GA4_HELPERS.trackEvent('ai_portfolio_export_chart_png'); } catch {}
    exportElementToPng(chartRef.current, 'ai-portfolio-chart.png');
  };

  return (
    <div className="ai-portfolio-card" ref={cardRef}>
      <h3 className="ai-portfolio-title">AI Smart Portfolio Builder</h3>
      <form onSubmit={onSubmit} className="ai-portfolio-form">
        <label>
          Budget (USD)
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} min={0} step={100} />
        </label>
        <label>
          Time horizon
          <select value={horizon} onChange={(e) => setHorizon(e.target.value)}>
            <option>{"<3 months"}</option>
            <option>{"6-12 months"}</option>
            <option>{">1 year"}</option>
          </select>
        </label>
        <label>
          Risk appetite
          <select value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option>conservative</option>
            <option>moderate</option>
            <option>aggressive</option>
          </select>
        </label>
        <label>
          Objectives (comma separated)
          <input
            value={objectives.join(", ")}
            onChange={(e) => setObjectives(e.target.value.split(",").map(v => v.trim()).filter(Boolean))}
            placeholder="growth, farming"
          />
        </label>
        <label>
          Token preferences (comma separated)
          <input
            value={tokenPreferences.join(", ")}
            onChange={(e) => setTokenPreferences(e.target.value.split(",").map(v => v.trim().toUpperCase()).filter(Boolean))}
            placeholder="STX, ALEX, xBTC"
          />
        </label>
        <label className="ai-portfolio-toggle">
          <input type="checkbox" checked={useBITS} onChange={(e) => setUseBITS(e.target.checked)} />
          Simulate with 1000 BITS
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Building your optimal portfolio…" : "Generate Portfolio"}
        </button>
      </form>

      {error && <div className="ai-portfolio-error">Error: {error}</div>}

      {result && (
        <div className="ai-portfolio-output">
          <h4>Suggested allocation</h4>
          <div className="ai-portfolio-chart" ref={chartRef}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="ai-portfolio-list">
            {result.allocations.map((a) => (
              <div key={a.token} className="ai-portfolio-item">
                <strong>{a.token}</strong> — {a.percent}%
                {typeof a.usdAllocation === "number" && (
                  <span> • ${a.usdAllocation} {a.priceUsd ? `(≈ ${a.estTokenAmount} ${a.token} @ $${a.priceUsd})` : null}</span>
                )}
                {a.reason ? <div className="ai-portfolio-reason">{a.reason}</div> : null}
              </div>
            ))}
          </div>
          <div className="ai-portfolio-meta">
            <div>Risk score: <strong>{result.score}</strong></div>
            <div>Rebalance: <strong>{result.rebalance}</strong></div>
            <div className="ai-portfolio-summary">{result.summary}</div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button onClick={saveLocal}>Save</button>
            <button onClick={copyJson}>Copy JSON</button>
            <button onClick={shareLink}>Copy link</button>
            <button onClick={exportCardPng}>Export Card PNG</button>
            <button onClick={exportChartPng}>Export Chart PNG</button>
            {savedOk && <span style={{ alignSelf:'center', opacity:.8 }}>{savedOk}</span>}
          </div>
          {result.useBITS && result.bitsSimulation && (
            <div className="ai-portfolio-bits">
              <div>Simulated BITS: {result.bitsSimulation.totalBITS}</div>
              <div className="ai-portfolio-bits-list">
                {result.bitsSimulation.allocations.map((b) => (
                  <div key={b.token}>{b.token}: {b.bits} BITS</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


