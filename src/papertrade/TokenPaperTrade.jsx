import React, { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import useTokenPriceFeed from "./useTokenPriceFeed";

const TOKEN_CFG = {
  STX: { id: "blockstack" },
  ALEX: { id: "alexgo" },
  xBTC: { id: "wrapped-bitcoin" },
  USDA: { id: null, fixed: 1 },
};

function formatTime(ts) { try { return new Date(ts).toLocaleTimeString(); } catch { return ts; } }

export default function TokenPaperTrade({ symbol = "STX", initialUsdt = 1000 }) {
  const cfg = TOKEN_CFG[symbol] || { id: null, fixed: 1 };
  const { series, price, loading, error, useDemo, refresh } = useTokenPriceFeed({ coingeckoId: cfg.id, fixedPrice: cfg.fixed });
  const [usdt, setUsdt] = useState(initialUsdt);
  const [qty, setQty] = useState(0);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState(100);
  const [slippageBps] = useState(20);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const equity = useMemo(() => {
    const val = (qty * (price || 0));
    return Number((usdt + val).toFixed(2));
  }, [usdt, qty, price]);

  function buy() {
    if (!price || amount <= 0 || amount > usdt) return;
    const exec = price * (1 + slippageBps / 10000);
    const got = amount / exec;
    setUsdt(prev => Number((prev - amount).toFixed(2)));
    setQty(prev => Number((prev + got).toFixed(6)));
    setHistory(prev => [{ side: 'BUY', amount, exec, got, time: Date.now() }, ...prev]);
  }
  function sell() {
    if (!price || amount <= 0) return;
    const exec = price * (1 - slippageBps / 10000);
    const need = amount / exec;
    if (need > qty) return;
    setQty(prev => Number((prev - need).toFixed(6)));
    setUsdt(prev => Number((prev + amount).toFixed(2)));
    setHistory(prev => [{ side: 'SELL', amount, exec, need, time: Date.now() }, ...prev]);
  }

  const chartData = useMemo(() => series.map(p => ({ x: p.time, y: Number(p.price?.toFixed(6)) })), [series]);

  return (
    <div style={{ background:'#0b0b10', color:'#e9eef6', borderRadius:10, padding:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontWeight:600 }}>{symbol} Paper Trade</span>
          {useDemo && (
            <span style={{ 
              background:'linear-gradient(135deg, #ff6b6b, #ee5a24)', 
              color:'#fff', 
              fontSize:'0.7rem', 
              padding:'2px 8px', 
              borderRadius:8, 
              fontWeight:600 
            }}>
              DEMO DATA
            </span>
          )}
          {!useDemo && (
            <span style={{ 
              background:'linear-gradient(135deg, #2ecc71, #27ae60)', 
              color:'#fff', 
              fontSize:'0.7rem', 
              padding:'2px 8px', 
              borderRadius:8, 
              fontWeight:600 
            }}>
              REAL DATA
            </span>
          )}
        </div>
        <div>
          <span style={{ opacity:.8, marginRight:8 }}>Price:</span>
          <span style={{ fontWeight:700 }}>{loading ? '…' : (price ? `$${price.toFixed(6)}` : 'N/A')}</span>
          <button onClick={refresh} style={{ marginLeft:12, padding:'4px 8px', borderRadius:6, border:'1px solid #26304a', background:'#0f1421', color:'#e9eef6' }}>Refresh</button>
        </div>
      </div>

      <div style={{ 
        width:'100%', 
        height: isMobile ? 220 : 280, 
        background:'#0f1421', 
        border:'1px solid #26304a', 
        borderRadius:8, 
        marginBottom:8 
      }}>
        {chartData.length > 1 ? (
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="tokFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.35}/>
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2942" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" domain={["dataMin","dataMax"]} tickFormatter={formatTime} stroke="#9db2d6" tick={{ fontSize: 12 }} />
              <YAxis domain={['auto','auto']} stroke="#9db2d6" tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(v)=>new Date(v).toLocaleString()} formatter={(v)=>[`$${v}` , symbol]} contentStyle={{ background:'#0b1020', border:'1px solid #26304a', color:'#e9eef6' }} />
              <Area type="monotone" dataKey="y" stroke="#00d4ff" fill="url(#tokFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#8fa3c5' }}>No chart data</div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={{ background:'#0f1421', border:'1px solid #26304a', borderRadius:10, padding:12 }}>
          <div style={{ marginBottom:8, fontWeight:600 }}>Account (simulated)</div>
          <div>USDT: <strong>${usdt.toFixed(2)}</strong></div>
          <div>{symbol}: <strong>{qty.toFixed(6)}</strong> {price ? `(≈ $${(qty*price).toFixed(2)})` : ''}</div>
          <div style={{ marginTop:8 }}>Equity: <strong>${equity.toFixed(2)}</strong></div>
        </div>
        <div style={{ background:'#0f1421', border:'1px solid #26304a', borderRadius:10, padding:12 }}>
          <div style={{ marginBottom:8, fontWeight:600 }}>Trade</div>
          <label style={{ display:'block', marginBottom:8 }}>Amount (USDT)
            <input type="number" value={amount} min={0} step={10} onChange={(e)=>setAmount(Number(e.target.value))} style={{ width:'100%', marginTop:6, padding:8, borderRadius:8, border:'1px solid #26304a', background:'#0b1020', color:'#e9eef6' }} />
          </label>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={buy} style={{ flex:1, padding:'10px 12px', borderRadius:8, border:'none', background:'#2ecc71', color:'#0b0b10', fontWeight:700 }}>Buy {symbol}</button>
            <button onClick={sell} style={{ flex:1, padding:'10px 12px', borderRadius:8, border:'none', background:'#e74c3c', color:'#fff', fontWeight:700 }}>Sell {symbol}</button>
          </div>
          <div style={{ marginTop:8, opacity:.8, fontSize:12 }}>Slippage simulated: 0.2%</div>
        </div>
      </div>

      <div style={{ background:'#0f1421', border:'1px solid #26304a', borderRadius:10, padding:12, marginBottom:12 }}>
        <div style={{ marginBottom:8, fontWeight:600 }}>History</div>
        {history.length === 0 ? <div style={{ opacity:.8 }}>No trades yet.</div> : (
          <div style={{ display:'grid', gap:6 }}>
            {history.map((h, idx) => (
              <div key={idx} style={{ display:'flex', justifyContent:'space-between', fontFamily:'monospace', fontSize:13 }}>
                <span>{new Date(h.time).toLocaleTimeString()}</span>
                <span>{h.side}</span>
                <span>{h.side==='BUY' ? `$${h.amount} @ $${h.exec.toFixed(6)} → +${h.got.toFixed(6)} ${symbol}` : `$${h.amount} @ $${h.exec.toFixed(6)} ← −${h.need?.toFixed(6)} ${symbol}`}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


