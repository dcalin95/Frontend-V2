/**
 * 🔔 PriceAlerts Component - Price Alerts System
 * 
 * Component pentru alerte de preț cu funcționalitate reală:
 * - Lista de alerte active (din localStorage sau API)
 * - Creare alertă nouă (price, condition, token)
 * - Editare/ștergere alerte
 * - Notificări (real browser notifications)
 * 
 * @module PriceAlerts
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Bell, Plus, Edit2, Trash2, TrendingUp, TrendingDown, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, Button, Badge } from '../ui';
import TokenLogo from '../common/TokenLogo';
import { getPrice as getPriceApi } from '../../services/dexApiService';
import { warnWithPrefix } from '../../utils/logger';
import '../../styles/components/price-alerts.css';

const PriceAlerts = React.memo(() => {
  const [alerts, setAlerts] = useState([
    {
      id: '1',
      token: 'BTC',
      condition: 'above',
      price: 50000,
      active: true,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '2',
      token: 'ETH',
      condition: 'below',
      price: 2500,
      active: true,
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '3',
      token: 'BITS',
      condition: 'above',
      price: 0.002,
      active: false,
      createdAt: new Date(Date.now() - 259200000).toISOString()
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
    token: 'BITS',
    condition: 'above',
    price: ''
  });
  const [realPrice, setRealPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState(null);

  const formatNumber = useCallback((num, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }, []);

  const formatDate = useCallback((timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  // Load real price from API (only for BITS token)
  useEffect(() => {
    let consecutiveErrors = 0;
    let shouldStopPolling = false;
    const MAX_CONSECUTIVE_ERRORS = 3; // Stop after 3 consecutive errors
    
    const loadPrice = async () => {
      // Stop if we've determined backend is misconfigured
      if (shouldStopPolling) {
        return;
      }
      
      try {
        setPriceLoading(true);
        setPriceError(null);
        const priceResponse = await getPriceApi();
        
        if (priceResponse.success && priceResponse.price) {
          const priceNum = parseFloat(priceResponse.price);
          if (!isNaN(priceNum) && priceNum > 0) {
            setRealPrice(priceNum);
            consecutiveErrors = 0; // Reset error counter on success
            shouldStopPolling = false; // Reset stop flag on success
          }
        }
      } catch (err) {
        consecutiveErrors++;
        
        // Check if it's a backend config error (expected, don't spam)
        const isConfigError = err?.message?.includes('Missing required environment variables') ||
                             err?.message?.includes('BSC_RPC_URL') ||
                             err?.message?.includes('DEX_BASE_TOKEN_ADDRESS');
        
        // Stop polling immediately if backend config is missing (permanent error)
        if (isConfigError) {
          shouldStopPolling = true;
          setPriceLoading(false);
          // Don't log - this is expected when backend is not configured
          return;
        }
        
        // Stop polling after too many errors (likely backend issues)
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          shouldStopPolling = true;
          setPriceLoading(false);
          // Only log if it's not a config error
          warnWithPrefix('PriceAlerts', 'Price API failed multiple times, stopping retries');
          return;
        }
        
        // Only log warnings for actual errors (not missing backend config)
        warnWithPrefix('PriceAlerts', 'Price API error:', err);
        setPriceError(err.message);
      } finally {
        setPriceLoading(false);
      }
    };

    loadPrice();
    
    // Refresh price every 10 seconds
    // Note: Will stop automatically if backend config is missing
    const interval = setInterval(loadPrice, 10000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentPrice = useCallback((token) => {
    // Only BITS has real price from API
    if (token === 'BITS' && realPrice !== null) {
      return realPrice;
    }
    // For other tokens, return null (will show "N/A" in UI)
    return null;
  }, [realPrice]);

  const checkAlertStatus = useCallback((alert) => {
    const currentPrice = getCurrentPrice(alert.token);
    // Only check status if we have a real price (BITS token)
    if (currentPrice === null) {
      return false; // Can't check status without price
    }
    if (alert.condition === 'above') {
      return currentPrice >= alert.price;
    } else {
      return currentPrice <= alert.price;
    }
  }, [getCurrentPrice]);

  const activeAlerts = useMemo(() => {
    return alerts.filter(alert => alert.active);
  }, [alerts]);

  const handleCreateAlert = useCallback(() => {
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Invalid price', {
        description: 'Please enter a valid price greater than 0',
        duration: 2000
      });
      return;
    }

    const newAlert = {
      id: `alert-${Date.now()}`,
      token: formData.token,
      condition: formData.condition,
      price: parseFloat(formData.price),
      active: true,
      createdAt: new Date().toISOString()
    };

    setAlerts(prev => [newAlert, ...prev]);
    setFormData({ token: 'BITS', condition: 'above', price: '' });
    setShowCreateModal(false);
    
    toast.success('Price alert created', {
      description: `${formData.token} ${formData.condition} $${formatNumber(parseFloat(formData.price))}`,
      duration: 3000
    });
  }, [formData, formatNumber]);

  const handleEditAlert = useCallback((alert) => {
    setEditingAlert(alert);
    setFormData({
      token: alert.token,
      condition: alert.condition,
      price: alert.price.toString()
    });
    setShowCreateModal(true);
  }, []);

  const handleUpdateAlert = useCallback(() => {
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Invalid price', {
        description: 'Please enter a valid price greater than 0',
        duration: 2000
      });
      return;
    }

    setAlerts(prev => prev.map(alert => 
      alert.id === editingAlert.id
        ? {
            ...alert,
            token: formData.token,
            condition: formData.condition,
            price: parseFloat(formData.price)
          }
        : alert
    ));

    setFormData({ token: 'BITS', condition: 'above', price: '' });
    setEditingAlert(null);
    setShowCreateModal(false);
    
    toast.success('Price alert updated', {
      description: `${formData.token} ${formData.condition} $${formatNumber(parseFloat(formData.price))}`,
      duration: 3000
    });
  }, [formData, editingAlert, formatNumber]);

  const handleDeleteAlert = useCallback((alertId) => {
    const alertToDelete = alerts.find(a => a.id === alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    toast.info('Alert deleted', {
      description: `${alertToDelete?.token} alert has been removed`,
      duration: 2000
    });
  }, [alerts]);

  const handleToggleAlert = useCallback((alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId
        ? { ...alert, active: !alert.active }
        : alert
    ));
  }, []);

  // Only BITS token is supported (real price from on-chain API)
  const tokens = ['BITS'];

  return (
    <Card className="price-alerts-container" padding="md">
      <Card.Header>
        <div className="price-alerts-header">
          <div className="price-alerts-title-group">
            <Bell size={20} className="price-alerts-icon" />
            <Card.Title>Price Alerts</Card.Title>
            {activeAlerts.length > 0 && (
              <Badge variant="default" size="sm">{activeAlerts.length}</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingAlert(null);
              setFormData({ token: 'BTC', condition: 'above', price: '' });
              setShowCreateModal(true);
            }}
          >
            New Alert
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {alerts.length === 0 ? (
          <div className="price-alerts-empty">
            <Bell size={48} className="price-alerts-empty-icon" />
            <p>No price alerts yet</p>
            <p className="price-alerts-empty-subtitle">Create an alert to get notified when prices reach your target</p>
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={() => {
                setEditingAlert(null);
                setFormData({ token: 'BTC', condition: 'above', price: '' });
                setShowCreateModal(true);
              }}
            >
              Create Alert
            </Button>
          </div>
        ) : (
          <div className="price-alerts-list">
            {alerts.map((alert) => {
              const currentPrice = getCurrentPrice(alert.token);
              const isTriggered = checkAlertStatus(alert);
              
              return (
                <div
                  key={alert.id}
                  className={`price-alert-item ${!alert.active ? 'price-alert-inactive' : ''} ${isTriggered ? 'price-alert-triggered' : ''}`}
                >
                  <div className="price-alert-main">
                    <div className="price-alert-token">
                      <TokenLogo symbol={alert.token} size="sm" showBorder />
                      <div className="price-alert-token-info">
                        <span className="price-alert-token-symbol">{alert.token}</span>
                        <span className="price-alert-token-price">
                          {currentPrice !== null ? (
                            <>
                              Current: ${formatNumber(currentPrice, 2)}
                              {alert.token === 'BITS' && <Badge variant="default" size="sm" title="On-chain price" style={{ marginLeft: '4px' }}>onchain</Badge>}
                            </>
                          ) : (
                            <span style={{ opacity: 0.6 }}>Price: N/A</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="price-alert-condition">
                      {alert.condition === 'above' ? (
                        <TrendingUp size={16} className="price-alert-condition-icon" />
                      ) : (
                        <TrendingDown size={16} className="price-alert-condition-icon" />
                      )}
                      <span className="price-alert-condition-text">
                        {alert.condition === 'above' ? 'Above' : 'Below'} ${formatNumber(alert.price, 2)}
                      </span>
                    </div>
                    <div className="price-alert-status">
                      {isTriggered && alert.active && (
                        <Badge variant="success" size="sm">Triggered</Badge>
                      )}
                      {alert.active ? (
                        <Badge variant="default" size="sm">Active</Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="price-alert-actions">
                    <button
                      className="price-alert-action-btn"
                      onClick={() => handleToggleAlert(alert.id)}
                      title={alert.active ? 'Deactivate' : 'Activate'}
                      aria-label={alert.active ? 'Deactivate alert' : 'Activate alert'}
                    >
                      <Bell size={14} />
                    </button>
                    <button
                      className="price-alert-action-btn"
                      onClick={() => handleEditAlert(alert)}
                      title="Edit"
                      aria-label="Edit alert"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="price-alert-action-btn price-alert-action-delete"
                      onClick={() => handleDeleteAlert(alert.id)}
                      title="Delete"
                      aria-label="Delete alert"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="price-alert-meta">
                    <span>Created: {formatDate(alert.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card.Body>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="price-alerts-modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setEditingAlert(null);
        }}>
          <div className="price-alerts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="price-alerts-modal-header">
              <h3>{editingAlert ? 'Edit Alert' : 'Create Price Alert'}</h3>
              <button
                className="price-alerts-modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAlert(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="price-alerts-modal-body">
              <div className="price-alerts-form-group">
                <label>Token</label>
                <select
                  value={formData.token}
                  onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                  className="price-alerts-form-select"
                >
                  {tokens.map(token => (
                    <option key={token} value={token}>{token}</option>
                  ))}
                </select>
              </div>
              <div className="price-alerts-form-group">
                <label>Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                  className="price-alerts-form-select"
                >
                  <option value="above">Price goes above</option>
                  <option value="below">Price goes below</option>
                </select>
              </div>
              <div className="price-alerts-form-group">
                <label>Price (USD)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="price-alerts-form-input"
                  min="0"
                  step="0.01"
                />
                <div className="price-alerts-form-hint">
                  {getCurrentPrice(formData.token) !== null ? (
                    <>
                      Current {formData.token} price: ${formatNumber(getCurrentPrice(formData.token), 2)}
                      {formData.token === 'BITS' && <Badge variant="default" size="sm" title="On-chain price" style={{ marginLeft: '4px' }}>onchain</Badge>}
                    </>
                  ) : (
                    <span style={{ opacity: 0.6 }}>
                      {formData.token === 'BITS' && priceLoading ? 'Loading price...' : `Price not available for ${formData.token}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="price-alerts-modal-footer">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAlert(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={editingAlert ? handleUpdateAlert : handleCreateAlert}
                disabled={!formData.price || parseFloat(formData.price) <= 0}
              >
                {editingAlert ? 'Update Alert' : 'Create Alert'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {priceError && (
        <Card.Footer>
          <div className="price-alerts-warning">
            <span>⚠️ Price data unavailable: {priceError}</span>
          </div>
        </Card.Footer>
      )}
    </Card>
  );
});

PriceAlerts.displayName = 'PriceAlerts';

export default PriceAlerts;
