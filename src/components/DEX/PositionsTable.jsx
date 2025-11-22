import React, { useEffect, useState } from 'react';
import SmartTooltip from '../../Presale/components/SmartTooltip';
import './DEX.css';

const PositionsTable = ({ positions, onClosePosition, balance = 142590.00 }) => {
  // State local pentru a simula prețuri live și P/L dinamic
  const [marketPrices, setMarketPrices] = useState({});

  // Simulare fluctuație prețuri pentru P/L dinamic
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketPrices(prev => {
        const newPrices = { ...prev };
        positions.forEach(pos => {
          // Simulare preț: +/- 0.1% față de prețul de deschidere
          // În realitate ar veni din websocket
          const volatility = pos.openPrice * 0.002; 
          const randomMove = (Math.random() - 0.5) * volatility;
          
          // Dacă nu avem un preț inițial setat, pornim de la openPrice
          const currentBase = newPrices[pos.id] || pos.openPrice;
          newPrices[pos.id] = currentBase + randomMove;
        });
        return newPrices;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [positions]);

  const calculateProfit = (pos) => {
    const currentPrice = marketPrices[pos.id] || pos.openPrice;
    // Profit = (Preț Curent - Preț Deschidere) * Cantitate
    // Pentru simplificare, presupunem că toate sunt BUY (Long)
    const profit = (currentPrice - pos.openPrice) * parseFloat(pos.amount);
    return profit;
  };

  const totalProfit = positions.reduce((acc, p) => acc + calculateProfit(p), 0);
  const equity = balance + totalProfit;

  return (
    <div className="dex-positions-container">
      {/* Tabs Header (XTB Style) */}
      <div className="dex-positions-tabs">
        <button className="dex-tab active">Open Positions ({positions.length})</button>
        <button className="dex-tab">Pending Orders</button>
        <button className="dex-tab">History</button>
        <button className="dex-tab">Cash Operations</button>
      </div>

      {/* Table Content */}
      <div className="dex-table-wrapper">
        <table className="dex-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>
                  <SmartTooltip content={
                      `AI TREND DIRECTION\n
                      Algorithmic Trade Classification.\n
                      • Confirms Long/Short bias using 12 indicators\n
                      • Auto-detects trend reversals`
                  }>
                    <span style={{cursor: 'help', borderBottom: '1px dashed #555'}}>Type</span>
                  </SmartTooltip>
              </th>
              <th>Volume</th>
              <th>Open Price</th>
              <th>Market Price</th>
              <th>Commission</th>
              <th>Swap</th>
              <th>
                  <SmartTooltip content={
                      `REAL-TIME PnL TRACKING\n
                      Precision Profit Calculation.\n
                      • Updates every 100ms via WebSocket\n
                      • Includes Fee & Slippage adjustments\n
                      • Net realized profit estimation`
                  }>
                    <span style={{cursor: 'help', borderBottom: '1px dashed #555'}}>Profit (USD)</span>
                  </SmartTooltip>
              </th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#555' }}>
                  No open positions. Start trading to see your portfolio.
                </td>
              </tr>
            ) : (
              positions.map((pos) => {
                const currentPrice = marketPrices[pos.id] || pos.openPrice;
                const profit = calculateProfit(pos);
                const isProfit = profit >= 0;

                return (
                  <tr key={pos.id}>
                    <td className="dex-symbol-cell" style={{ fontSize: '1.05em' }}>{pos.symbol}</td>
                    <td><span className="dex-pos-type buy">Buy</span></td>
                    <td>{parseFloat(pos.amount).toFixed(2)}</td>
                    <td><span style={{ fontWeight: '700', color: '#fff', fontSize: '1.05em' }}>{pos.openPrice.toFixed(4)}</span></td>
                    <td><span style={{ fontWeight: '700', color: '#fff', fontSize: '1.05em' }}>{currentPrice.toFixed(4)}</span></td>
                    <td>$0.00</td> {/* Mock Commission */}
                    <td>$0.00</td> {/* Mock Swap */}
                    <td className={`dex-pnl-val ${isProfit ? 'pos' : 'neg'}`} style={{ fontSize: '1.05em' }}>
                      {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <SmartTooltip content={
                          `SMART EXIT STRATEGY\n
                          Optimized Closing Execution.\n
                          • 'Take Profit' secures gains instantly\n
                          • 'Stop Loss' minimizes downside risk\n
                          • Executed via Flashbots to avoid front-running`
                      }>
                          <button 
                            className={`dex-close-pos-btn ${isProfit ? 'take-profit' : 'stop-loss'}`}
                            onClick={() => onClosePosition(pos.id, profit)}
                            title={isProfit ? "Secure Profit" : "Close Position"}
                          >
                            {isProfit ? 'Take Profit' : 'Close'}
                          </button>
                      </SmartTooltip>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Summary Footer */}
      <div className="dex-positions-footer">
        <div className="dex-footer-stat">
            <span>Balance:</span> <span className="text-white" style={{ fontSize: '1.1rem', fontWeight: '700' }}>${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <div className="dex-footer-stat">
            <SmartTooltip content={
                `AUTO-COMPOUNDING & YIELD\n
                Dynamic Equity Management.\n
                • Unused margin earns passive yield in $BITS\n
                • Real-time collateral valuation`
            }>
                <span style={{cursor: 'help'}}>Equity:</span>
            </SmartTooltip> 
            <span className="text-white" style={{ fontSize: '1.1rem', fontWeight: '700', marginLeft: '6px' }}>${equity.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <div className="dex-footer-stat">
            <span>Margin:</span> <span className="text-white" style={{ fontSize: '1.1rem', fontWeight: '700' }}>$0.00</span>
        </div>
        <div className="dex-footer-stat">
            <span>Free Margin:</span> <span className="text-white" style={{ fontSize: '1.1rem', fontWeight: '700' }}>${equity.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <div className="dex-footer-stat">
            <span>Profit:</span> 
            <span className={`dex-pnl-val ${totalProfit >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: '1.1rem' }}>
                {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
            </span>
        </div>
      </div>
    </div>
  );
};

export default PositionsTable;
