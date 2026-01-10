/**
 * 📊 TradeTabs Component
 * 
 * Tabs pentru Open Orders, Positions, Order History
 */

import React, { useState } from 'react';
import OpenOrders from './OpenOrders';
import Positions from './Positions';
import OrderHistory from './OrderHistory';
import './TradeTabs.css';

const TradeTabs = ({
  openOrders = [],
  positions = [],
  orderHistory = [],
  onCancelOrder = () => {},
  onClosePosition = () => {},
  showAllMarkets = false,
  onToggleShowAll = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="trade-tabs">
      <div className="trade-tabs-header">
        <div className="trade-tabs-nav">
          <button
            className={`trade-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Open Orders
          </button>
          <button
            className={`trade-tab ${activeTab === 'positions' ? 'active' : ''}`}
            onClick={() => setActiveTab('positions')}
          >
            Positions
          </button>
          <button
            className={`trade-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Order History
          </button>
        </div>

        <div className="trade-tabs-actions">
          <label className="show-all-toggle">
            <input
              type="checkbox"
              checked={showAllMarkets}
              onChange={onToggleShowAll}
            />
            <span>Show all markets</span>
          </label>
        </div>
      </div>

      <div className="trade-tabs-content">
        {activeTab === 'orders' && (
          <OpenOrders
            orders={openOrders}
            onCancelOrder={onCancelOrder}
            showAllMarkets={showAllMarkets}
          />
        )}
        {activeTab === 'positions' && (
          <Positions
            positions={positions}
            onClosePosition={onClosePosition}
            showAllMarkets={showAllMarkets}
          />
        )}
        {activeTab === 'history' && (
          <OrderHistory
            history={orderHistory}
            showAllMarkets={showAllMarkets}
          />
        )}
      </div>
    </div>
  );
};

export default TradeTabs;

