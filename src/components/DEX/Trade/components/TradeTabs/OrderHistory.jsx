/**
 * 📊 OrderHistory Component
 */

import React from 'react';
import { formatPrice, formatVolume } from '../../utils/formatPrice';
import './OrderHistory.css';

const OrderHistory = ({ history = [], showAllMarkets = false }) => {
  const filteredHistory = showAllMarkets 
    ? history 
    : history; // Filter by current market if needed

  return (
    <div className="order-history">
      <table className="history-table">
        <thead>
          <tr>
            <th>Market</th>
            <th>Type</th>
            <th>Price</th>
            <th>Amount</th>
            <th>Filled</th>
            <th>Status</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {filteredHistory.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty-history">
                No order history
              </td>
            </tr>
          ) : (
            filteredHistory.map((order) => (
              <tr key={order.id}>
                <td>{order.market}</td>
                <td className={order.type === 'buy' ? 'buy' : 'sell'}>
                  {order.type.toUpperCase()}
                </td>
                <td>{formatPrice(order.price)}</td>
                <td>{formatVolume(order.amount)}</td>
                <td>{formatVolume(order.filled)}</td>
                <td>
                  <span className={`status-badge ${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.time).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrderHistory;

