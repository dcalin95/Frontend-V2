import React, { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Bar } from "recharts";
import useSTXPriceFeed from "./useSTXPriceFeed";

function formatTime(ts) {
  try { return new Date(ts).toLocaleTimeString(); } catch { return ts; }
}

export default function STXPaperTrade() {
  const { series, price, loading, error, useDemo, refresh } = useSTXPriceFeed();
  const [usdt, setUsdt] = useState(1000);
  const [stx, setStx] = useState(0);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState(100);
  const [slippageBps] = useState(20); // 0.2%
  const [chartType, setChartType] = useState('area'); // 'area', 'line', 'candle'
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const equity = useMemo(() => {
    const stxVal = (stx * (price || 0));
    return Number((usdt + stxVal).toFixed(2));
  }, [usdt, stx, price]);

  function buyMarket() {
    if (!price || amount <= 0 || amount > usdt) return;
    const exec = price * (1 + slippageBps / 10000);
    const got = amount / exec;
    setUsdt(prev => Number((prev - amount).toFixed(2)));
    setStx(prev => Number((prev + got).toFixed(6)));
    setHistory(prev => [{ side: 'BUY', amount, exec, got, time: Date.now() }, ...prev]);
  }
  function sellMarket() {
    if (!price || amount <= 0) return;
    const exec = price * (1 - slippageBps / 10000);
    const need = amount / exec; // USDT to receive amount → STX required
    if (need > stx) return;
    setStx(prev => Number((prev - need).toFixed(6)));
    setUsdt(prev => Number((prev + amount).toFixed(2)));
    setHistory(prev => [{ side: 'SELL', amount, exec, need, time: Date.now() }, ...prev]);
  }

  const chartData = useMemo(() => {
    return series.map(p => ({ x: p.time, y: Number(p.price?.toFixed(6)) }));
  }, [series]);

  // Generate candlestick data from price series
  const candleData = useMemo(() => {
    if (series.length < 4) return [];
    const candles = [];
    for (let i = 0; i < series.length - 3; i += 4) {
      const segment = series.slice(i, i + 4);
      const open = segment[0]?.price || 0;
      const close = segment[3]?.price || 0;
      const high = Math.max(...segment.map(p => p.price || 0));
      const low = Math.min(...segment.map(p => p.price || 0));
      candles.push({
        x: segment[0]?.time || Date.now(),
        open: Number(open.toFixed(6)),
        high: Number(high.toFixed(6)),
        low: Number(low.toFixed(6)),
        close: Number(close.toFixed(6)),
        fill: close >= open ? '#2ecc71' : '#e74c3c'
      });
    }
    return candles;
  }, [series]);

  const renderChart = () => {
    const commonProps = {
      margin: { left: 16, right: 16, top: 8, bottom: 8 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData} {...commonProps}>
            <CartesianGrid stroke="#1f2942" strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="x" 
              domain={["dataMin","dataMax"]} 
              tickFormatter={formatTime} 
              stroke="#9db2d6" 
              tick={{ fontSize: 12 }} 
            />
            <YAxis domain={['auto','auto']} stroke="#9db2d6" tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={(v)=>new Date(v).toLocaleString()} 
              formatter={(v)=>[`$${v}`,'STX']} 
              contentStyle={{ background:'#0b1020', border:'1px solid #26304a', color:'#e9eef6' }} 
            />
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke="#00d4ff" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4, fill: '#00d4ff' }}
            />
          </LineChart>
        );
      
      case 'candle':
        return (
          <LineChart data={candleData} {...commonProps}>
            <CartesianGrid stroke="#1f2942" strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="x" 
              domain={["dataMin","dataMax"]} 
              tickFormatter={formatTime} 
              stroke="#9db2d6" 
              tick={{ fontSize: 12 }} 
            />
            <YAxis domain={['auto','auto']} stroke="#9db2d6" tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={(v)=>new Date(v).toLocaleString()} 
              formatter={(v, name)=>{
                if (name === 'high') return [`H: $${v}`, 'High'];
                if (name === 'low') return [`L: $${v}`, 'Low'];
                if (name === 'open') return [`O: $${v}`, 'Open'];
                if (name === 'close') return [`C: $${v}`, 'Close'];
                return [`$${v}`, name];
              }}
              contentStyle={{ background:'#0b1020', border:'1px solid #26304a', color:'#e9eef6' }} 
            />
            <Line 
              type="monotone" 
              dataKey="high" 
              stroke="#2ecc71" 
              strokeWidth={2} 
              dot={{ r: 2, fill: '#2ecc71' }}
            />
            <Line 
              type="monotone" 
              dataKey="low" 
              stroke="#e74c3c" 
              strokeWidth={2} 
              dot={{ r: 2, fill: '#e74c3c' }}
            />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#00d4ff" 
              strokeWidth={3} 
              dot={{ r: 3, fill: '#00d4ff' }}
            />
          </LineChart>
        );
      
      default: // area
        return (
          <AreaChart data={chartData} {...commonProps}>
            <defs>
              <linearGradient id="stxFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.35}/>
                <stop offset="100%" stopColor="#00d4ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f2942" strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="x" 
              domain={["dataMin","dataMax"]} 
              tickFormatter={formatTime} 
              stroke="#9db2d6" 
              tick={{ fontSize: 12 }} 
            />
            <YAxis domain={['auto','auto']} stroke="#9db2d6" tick={{ fontSize: 12 }} />
            <Tooltip 
              labelFormatter={(v)=>new Date(v).toLocaleString()} 
              formatter={(v)=>[`$${v}`,'STX']} 
              contentStyle={{ background:'#0b1020', border:'1px solid #26304a', color:'#e9eef6' }} 
            />
            <Area 
              type="monotone" 
              dataKey="y" 
              stroke="#00d4ff" 
              fill="url(#stxFill)" 
              strokeWidth={2} 
            />
          </AreaChart>
        );
    }
  };

  return (
    <div style={{ background:'#0b0b10', color:'#e9eef6', borderRadius:10, padding:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontWeight:600 }}>STX Paper Trade</span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ opacity:.8, marginRight:8 }}>Price:</span>
          <span style={{ fontWeight:700 }}>{loading ? '…' : (price ? `$${price.toFixed(4)}` : 'N/A')}</span>
          <button onClick={refresh} style={{ marginLeft:12, padding:'4px 8px', borderRadius:6, border:'1px solid #26304a', background:'#0f1421', color:'#e9eef6' }}>Refresh</button>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: 8, 
        gap: isMobile ? 4 : 6,
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={(e) => {
            e.preventDefault();
            console.log('Area clicked, current:', chartType);
            setChartType('area');
          }}
          style={{ 
            padding: '4px 10px', 
            border: '1px solid #26304a', 
            background: chartType === 'area' ? '#00d4ff' : '#0f1421', 
            color: chartType === 'area' ? '#000' : '#e9eef6', 
            borderRadius: 4, 
            fontSize: '0.75rem',
            cursor: 'pointer',
            minWidth: '65px'
          }}
        >
          📊 Area {chartType === 'area' ? '✓' : ''}
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            console.log('Line clicked, current:', chartType);
            setChartType('line');
          }}
          style={{ 
            padding: '4px 10px', 
            border: '1px solid #26304a', 
            background: chartType === 'line' ? '#00d4ff' : '#0f1421', 
            color: chartType === 'line' ? '#000' : '#e9eef6', 
            borderRadius: 4, 
            fontSize: '0.75rem',
            cursor: 'pointer',
            minWidth: '65px'
          }}
        >
          📈 Line {chartType === 'line' ? '✓' : ''}
        </button>
        <button 
          onClick={(e) => {
            e.preventDefault();
            console.log('Candles clicked, current:', chartType);
            setChartType('candle');
          }}
          style={{ 
            padding: '4px 10px', 
            border: '1px solid #26304a', 
            background: chartType === 'candle' ? '#00d4ff' : '#0f1421', 
            color: chartType === 'candle' ? '#000' : '#e9eef6', 
            borderRadius: 4, 
            fontSize: '0.75rem',
            cursor: 'pointer',
            minWidth: '65px'
          }}
        >
          🕯️ Candles {chartType === 'candle' ? '✓' : ''}
        </button>
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
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#8fa3c5' }}>No chart data</div>
        )}
      </div>

      <div style={{ 
        display:'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap:8, 
        marginBottom:8 
      }}>
        <div style={{ background:'#0f1421', border:'1px solid #26304a', borderRadius:8, padding:10 }}>
          <div style={{ marginBottom:6, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
            Account (simulated)
            <span style={{ 
              background:'#2ecc71', 
              color:'#0b0b10', 
              fontSize:'0.6rem', 
              padding:'1px 6px', 
              borderRadius:6, 
              fontWeight:700 
            }}>
              NO WALLET NEEDED
            </span>
          </div>
          <div>USDT: <strong>${usdt.toFixed(2)}</strong></div>
          <div>STX: <strong>{stx.toFixed(6)}</strong> {price ? `(≈ $${(stx*price).toFixed(2)})` : ''}</div>
          <div style={{ marginTop:8 }}>Equity: <strong>${equity.toFixed(2)}</strong></div>
          <div style={{ marginTop:8, fontSize:'0.8rem', opacity:0.7 }}>
            💡 Paper Trading: Practice with virtual money, learn without risk!
          </div>
        </div>
        <div style={{ background:'#0f1421', border:'1px solid #26304a', borderRadius:8, padding:10 }}>
          <div style={{ marginBottom:6, fontWeight:600 }}>Trade</div>
          <label style={{ display:'block', marginBottom:8 }}>Amount (USDT)
            <input type="number" value={amount} min={0} step={10} onChange={(e)=>setAmount(Number(e.target.value))} style={{ width:'100%', marginTop:6, padding:8, borderRadius:8, border:'1px solid #26304a', background:'#0b1020', color:'#e9eef6' }} />
          </label>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={buyMarket} style={{ flex:1, padding:'10px 12px', borderRadius:8, border:'none', background:'#2ecc71', color:'#0b0b10', fontWeight:700 }}>Buy STX</button>
            <button onClick={sellMarket} style={{ flex:1, padding:'10px 12px', borderRadius:8, border:'none', background:'#e74c3c', color:'#fff', fontWeight:700 }}>Sell STX</button>
          </div>
          <div style={{ marginTop:8, opacity:.8, fontSize:12 }}>Slippage simulated: 0.2%</div>
        </div>
      </div>

      <div style={{ background:'#0f1421', border:'1px solid #26304a', borderRadius:8, padding:10, marginBottom:8 }}>
        <div style={{ marginBottom:8, fontWeight:600 }}>History</div>
        {history.length === 0 ? <div style={{ opacity:.8 }}>No trades yet.</div> : (
          <div style={{ display:'grid', gap:6 }}>
            {history.map((h, idx) => (
              <div key={idx} style={{ display:'flex', justifyContent:'space-between', fontFamily:'monospace', fontSize:13 }}>
                <span>{new Date(h.time).toLocaleTimeString()}</span>
                <span>{h.side}</span>
                <span>{h.side==='BUY' ? `$${h.amount} @ $${h.exec.toFixed(6)} → +${h.got.toFixed(6)} STX` : `$${h.amount} @ $${h.exec.toFixed(6)} ← −${h.need?.toFixed(6)} STX`}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


