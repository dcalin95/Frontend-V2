/**
 * 📊 Positions Component
 */

import React from 'react';
import { formatPrice, formatVolume, formatPercent } from '../../utils/formatPrice';
import './Positions.css';

const Positions = ({ positions = [], onClosePosition = () => {}, showAllMarkets = false }) => {
  const filteredPositions = showAllMarkets 
    ? positions 
    : positions; // Filter by current market if needed

  return (
    <div className="positions">
      <table className="positions-table">
        <thead>
          <tr>
            <th>Market</th>
            <th>Size</th>
            <th>Entry Price</th>
            <th>Mark Price</th>
            <th>PnL</th>
            <th>PnL %</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPositions.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty-positions">
                No open positions
              </td>
            </tr>
          ) : (
            filteredPositions.map((position) => {
              const pnl = position.markPrice - position.entryPrice;
              const pnlPercent = ((pnl / position.entryPrice) * 100) * (position.size / position.entryPrice);
              const isProfit = pnl >= 0;

              return (
                <tr key={position.id}>
                  <td>{position.market}</td>
                  <td>{formatVolume(position.size)}</td>
                  <td>{formatPrice(position.entryPrice)}</td>
                  <td>{formatPrice(position.markPrice)}</td>
                  <td className={isProfit ? 'profit' : 'loss'}>
                    {isProfit ? '+' : ''}{formatPrice(pnl)}
                  </td>
                  <td className={isProfit ? 'profit' : 'loss'}>
                    {formatPercent(pnlPercent)}
                  </td>
                  <td>
                    <button
                      className="close-btn"
                      onClick={() => onClosePosition(position.id)}
                    >
                      Close
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Positions;

