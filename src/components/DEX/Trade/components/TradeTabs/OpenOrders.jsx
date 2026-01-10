/**
 * 📊 OpenOrders Component
 */

import React from 'react';
import { X } from 'lucide-react';
import { formatPrice, formatVolume } from '../../utils/formatPrice';
import './OpenOrders.css';

const OpenOrders = ({ orders = [], onCancelOrder = () => {}, showAllMarkets = false }) => {
  const filteredOrders = showAllMarkets 
    ? orders 
    : orders; // Filter by current market if needed

  return (
    <div className="open-orders">
      <table className="orders-table">
        <thead>
          <tr>
            <th>
              <button className="sort-btn">
                Market
              </button>
            </th>
            <th>
              <button className="sort-btn">
                Trade Value
              </button>
            </th>
            <th>
              <button className="sort-btn">
                Limit Price
              </button>
            </th>
            <th>
              <button className="sort-btn">
                Amount Filled
              </button>
            </th>
            <th>
              <button className="sort-btn">
                Time
              </button>
            </th>
            <th>
              <button
                className="cancel-all-btn"
                disabled={filteredOrders.length === 0}
                onClick={() => filteredOrders.forEach(order => onCancelOrder(order.id))}
              >
                Cancel all
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan="6" className="empty-orders">
                No open orders
              </td>
            </tr>
          ) : (
            filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.market}</td>
                <td>${formatVolume(order.tradeValue)}</td>
                <td>{formatPrice(order.limitPrice)}</td>
                <td>
                  {formatVolume(order.amountFilled)} / {formatVolume(order.amount)}
                </td>
                <td>{new Date(order.time).toLocaleString()}</td>
                <td>
                  <button
                    className="cancel-btn"
                    onClick={() => onCancelOrder(order.id)}
                  >
                    <X size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OpenOrders;

