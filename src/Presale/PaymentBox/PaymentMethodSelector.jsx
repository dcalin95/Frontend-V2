import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PaymentMethodSelector.css';

// Icons (you can replace with actual imports)
const icons = {
  card: "💳",
  moonpay: "🌙", 
  transak: "🏦",
  nowpayments: "💰",
  crypto: "₿"
};

const PaymentMethodSelector = ({ 
  onSelectMethod, 
  selectedMethod, 
  amount, 
  walletAddress,
  isVisible = true 
}) => {
  const [availableMethods, setAvailableMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectAvailablePaymentMethods();
  }, []);

  const detectAvailablePaymentMethods = async () => {
    setLoading(true);
    
    // Simulate detection logic based on user location, amount, etc.
    const methods = [];

    // Always available
    methods.push({
      id: 'nowpayments',
      name: 'Card Payment (NOWPayments)',
      description: 'Credit/Debit card - Coming Soon!',
      icon: icons.nowpayments,
      fees: '1.5-4%',
      processingTime: '5-15 min',
      available: false,
      recommended: false,
      comingSoon: true,
      features: ['📋 Waiting for Seychelles company registration', '🔑 Business verification required']
    });

    // MoonPay - Coming Soon
    if (amount >= 20 && amount <= 5000) {
      methods.push({
        id: 'moonpay_widget',
        name: 'MoonPay',
        description: 'Credit card payments - Coming Soon!',
        icon: icons.moonpay,
        fees: '3.5-4.5%',
        processingTime: '10-30 min',
        available: false,
        recommended: false,
        comingSoon: true,
        features: ['📋 Waiting for Seychelles company registration', '🔑 Business docs required']
      });
    }

    // Transak - Coming Soon
    if (amount >= 15 && amount <= 10000) {
      methods.push({
        id: 'transak_widget',
        name: 'Transak',
        description: 'Bank transfer & card payments - Coming Soon!',
        icon: icons.transak,
        fees: '0.99-5.5%',
        processingTime: '5-20 min',
        available: false,
        recommended: false,
        comingSoon: true,
        features: ['📋 Waiting for Seychelles company registration', '🔑 Business verification required']
      });
    }

    // Add crypto option if wallet is connected
    if (walletAddress) {
      methods.push({
        id: 'crypto',
        name: 'Crypto Payment',
        description: 'Pay with BNB, ETH, USDT, SOL, etc.',
        icon: icons.crypto,
        fees: '0-0.5%',
        processingTime: '1-5 min',
        available: true,
        recommended: true,
        features: ['Lowest Fees', 'Instant', 'No KYC']
      });
    }

    setAvailableMethods(methods);
    setLoading(false);
  };

  const handleMethodSelect = (method) => {
    console.log("🎯 [PaymentMethodSelector] Method selected:", method);
    console.log("🎯 [PaymentMethodSelector] Method available:", method.available);
    console.log("🎯 [PaymentMethodSelector] onSelectMethod exists:", !!onSelectMethod);
    
    if (method.available && onSelectMethod) {
      console.log("🎯 [PaymentMethodSelector] Calling onSelectMethod with:", method);
      onSelectMethod(method);
    } else {
      console.warn("⚠️ [PaymentMethodSelector] Method not selected - not available or no handler");
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div 
      className="payment-method-selector"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="payment-selector-header">
        <h3>Choose Payment Method</h3>
        <p>Select how you'd like to purchase ${amount} worth of $BITS</p>
      </div>

      {loading ? (
        <div className="payment-methods-loading">
          <div className="loading-spinner"></div>
          <p>Detecting available payment methods...</p>
        </div>
      ) : (
        <div className="payment-methods-grid">
          <AnimatePresence>
            {availableMethods.map((method, index) => (
              <motion.div
                key={method.id}
                className={`payment-method-card ${selectedMethod?.id === method.id ? 'selected' : ''} ${!method.available ? 'disabled' : ''} ${method.recommended ? 'recommended' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => handleMethodSelect(method)}
                whileHover={{ scale: method.available ? 1.02 : 1, y: method.available ? -2 : 0 }}
                whileTap={{ scale: method.available ? 0.98 : 1 }}
              >
                {method.recommended && (
                  <div className="recommended-badge">
                    ⭐ Recommended
                  </div>
                )}
                
                <div className="payment-method-icon">
                  {method.icon}
                </div>
                
                <div className="payment-method-info">
                  <h4>{method.name}</h4>
                  <p className="payment-method-description">{method.description}</p>
                  
                  <div className="payment-method-details">
                    <div className="detail-row">
                      <span className="detail-label">Fees:</span>
                      <span className="detail-value">{method.fees}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Time:</span>
                      <span className="detail-value">{method.processingTime}</span>
                    </div>
                  </div>
                  
                  <div className="payment-method-features">
                    {method.features.map((feature, idx) => (
                      <span key={idx} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                </div>
                
                {!method.available && (
                  <div className="unavailable-overlay">
                    <span>Not Available</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selectedMethod && (
        <motion.div
          className="selected-method-summary"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="summary-content">
            <div className="summary-icon">{selectedMethod.icon}</div>
            <div className="summary-text">
              <h4>Selected: {selectedMethod.name}</h4>
              <p>Fees: {selectedMethod.fees} • Processing: {selectedMethod.processingTime}</p>
            </div>
            <button 
              className="continue-button"
              onClick={() => onSelectMethod(selectedMethod)}
            >
              Continue →
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PaymentMethodSelector;
