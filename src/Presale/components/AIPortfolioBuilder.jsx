import React, { useMemo, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#845EC2"]; 

export default function AIPortfolioBuilder() {
  const [budget, setBudget] = useState(1000);
  const [horizon, setHorizon] = useState("6-12 luni");
  const [risk, setRisk] = useState("moderat");
  const [objectives, setObjectives] = useState(["crestere"]);
  const [tokenPreferences, setTokenPreferences] = useState(["STX", "ALEX"]);
  const [useBITS, setUseBITS] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

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
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#111", color: "#eee", borderRadius: 12, padding: 16, marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>AI Smart Portfolio Builder</h3>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Budget (USD)
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} min={0} step={100} style={{ width: "100%" }} />
        </label>
        <label>
          Time Horizon
          <select value={horizon} onChange={(e) => setHorizon(e.target.value)} style={{ width: "100%" }}>
            <option>{"<3 luni"}</option>
            <option>{"6-12 luni"}</option>
            <option>{">1 an"}</option>
          </select>
        </label>
        <label>
          Risk Appetite
          <select value={risk} onChange={(e) => setRisk(e.target.value)} style={{ width: "100%" }}>
            <option>conservator</option>
            <option>moderat</option>
            <option>agresiv</option>
          </select>
        </label>
        <label>
          Objectives (comma separated)
          <input
            value={objectives.join(", ")}
            onChange={(e) => setObjectives(e.target.value.split(",").map(v => v.trim()).filter(Boolean))}
            placeholder="crestere, farming"
            style={{ width: "100%" }}
          />
        </label>
        <label>
          Token preferences (comma separated)
          <input
            value={tokenPreferences.join(", ")}
            onChange={(e) => setTokenPreferences(e.target.value.split(",").map(v => v.trim().toUpperCase()).filter(Boolean))}
            placeholder="STX, ALEX, xBTC"
            style={{ width: "100%" }}
          />
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={useBITS} onChange={(e) => setUseBITS(e.target.checked)} />
          Simulate with 1000 BITS
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Building your optimal portfolio…" : "Generate Portfolio"}
        </button>
      </form>

      {error && <div style={{ color: "#ff6b6b", marginTop: 12 }}>Error: {error}</div>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <h4>Suggested Allocation</h4>
          <div style={{ width: "100%", height: 240 }}>
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
          <div style={{ marginTop: 12 }}>
            {result.allocations.map((a) => (
              <div key={a.token} style={{ padding: 8, borderBottom: "1px solid #222" }}>
                <strong>{a.token}</strong> — {a.percent}%
                {typeof a.usdAllocation === "number" && (
                  <span> • ${a.usdAllocation} {a.priceUsd ? `(≈ ${a.estTokenAmount} ${a.token} @ $${a.priceUsd})` : null}</span>
                )}
                {a.reason ? <div style={{ opacity: 0.85, fontSize: 13 }}>{a.reason}</div> : null}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <div>Risk score: <strong>{result.score}</strong></div>
            <div>Rebalance: <strong>{result.rebalance}</strong></div>
            <div style={{ marginTop: 8, opacity: 0.9 }}>{result.summary}</div>
          </div>
          {result.useBITS && result.bitsSimulation && (
            <div style={{ marginTop: 12 }}>
              <div>Simulated BITS: {result.bitsSimulation.totalBITS}</div>
              <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
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


