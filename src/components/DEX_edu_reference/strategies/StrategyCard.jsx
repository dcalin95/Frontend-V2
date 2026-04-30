/**
 * 🎴 StrategyCard Component - Strategy Card Display
 * 
 * Component pentru displaying single strategy card:
 * - Strategy name și type
 * - Strategy status (enabled/disabled)
 * - Strategy actions (edit, delete, enable/disable)
 * 
 * @module StrategyCard
 */

import React from 'react';
import { Target, Edit, Trash2, Power, PowerOff, Settings } from 'lucide-react';
import { formatDate } from '../utils/DEX/formatters';
import '../../../styles/DEX/components/strategy-card.css';

const StrategyCard = ({ 
  strategy, 
  onSelect, 
  onDelete, 
  onEnable, 
  onDisable 
}) => {
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete strategy "${strategy.name}"?`)) {
      try {
        await onDelete?.(strategy.id);
      } catch (error) {
        console.error('Error deleting strategy:', error);
      }
    }
  };

  const handleEnable = async (e) => {
    e.stopPropagation();
    try {
      await onEnable?.(strategy.id);
    } catch (error) {
      console.error('Error enabling strategy:', error);
    }
  };

  const handleDisable = async (e) => {
    e.stopPropagation();
    try {
      await onDisable?.(strategy.id);
    } catch (error) {
      console.error('Error disabling strategy:', error);
    }
  };

  const isEnabled = strategy.enabled !== false;

  return (
    <div 
      className={`strategy-card ${isEnabled ? 'enabled' : 'disabled'}`}
      onClick={onSelect}
    >
      <div className="strategy-card-header">
        <div className="strategy-card-icon">
          <Target size={24} />
        </div>
        <div className="strategy-card-info">
          <h3 className="strategy-card-name">{strategy.name || 'Unnamed Strategy'}</h3>
          <span className="strategy-card-type">{strategy.type || strategy.riskLevel || 'custom'}</span>
        </div>
        <div className={`strategy-card-status ${isEnabled ? 'enabled' : 'disabled'}`}>
          {isEnabled ? (
            <Power size={16} className="status-enabled" />
          ) : (
            <PowerOff size={16} className="status-disabled" />
          )}
        </div>
      </div>

      {strategy.config && (
        <div className="strategy-card-config">
          {strategy.config.riskLimits && (
            <div className="strategy-card-risk-limits">
              <span className="strategy-card-risk-label">Max % per trade:</span>
              <span className="strategy-card-risk-value">
                {strategy.config.riskLimits.maxPercentPerTrade || 'N/A'}%
              </span>
            </div>
          )}
        </div>
      )}

      {strategy.createdAt && (
        <div className="strategy-card-date">
          Created: {formatDate(strategy.createdAt)}
        </div>
      )}

      <div className="strategy-card-actions">
        <button
          className="strategy-card-btn strategy-card-btn-edit"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          title="Edit strategy"
        >
          <Edit size={16} />
        </button>
        
        {isEnabled ? (
          <button
            className="strategy-card-btn strategy-card-btn-disable"
            onClick={handleDisable}
            title="Disable strategy"
          >
            <PowerOff size={16} />
          </button>
        ) : (
          <button
            className="strategy-card-btn strategy-card-btn-enable"
            onClick={handleEnable}
            title="Enable strategy"
          >
            <Power size={16} />
          </button>
        )}
        
        <button
          className="strategy-card-btn strategy-card-btn-delete"
          onClick={handleDelete}
          title="Delete strategy"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default StrategyCard;

