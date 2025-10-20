import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BitcoinCalculator = () => {
  const [currentPrice, setCurrentPrice] = useState(50000);
  const [usdAmount, setUsdAmount] = useState('');
  const [btcAmount, setBtcAmount] = useState('');
  const [historicalDate, setHistoricalDate] = useState('');
  const [historicalPrice, setHistoricalPrice] = useState(null);
  const [calculationType, setCalculationType] = useState('current'); // 'current' or 'historical'

  useEffect(() => {
    fetchCurrentPrice();
  }, []);

  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
      const data = await response.json();
      const price = parseFloat(data.bpi.USD.rate.replace(',', ''));
      setCurrentPrice(price);
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
    }
  };

  const handleUsdChange = (value) => {
    setUsdAmount(value);
    if (value && currentPrice) {
      const btc = (parseFloat(value) / currentPrice).toFixed(8);
      setBtcAmount(btc);
    } else {
      setBtcAmount('');
    }
  };

  const handleBtcChange = (value) => {
    setBtcAmount(value);
    if (value && currentPrice) {
      const usd = (parseFloat(value) * currentPrice).toFixed(2);
      setUsdAmount(usd);
    } else {
      setUsdAmount('');
    }
  };

  const getHistoricalPrice = (date) => {
    // Simulated historical prices (in real app, you'd use an API)
    const historicalPrices = {
      '2009-01-03': 0,
      '2010-05-22': 0.0025,
      '2010-07-17': 0.05,
      '2011-06-08': 32,
      '2013-04-01': 100,
      '2013-11-30': 1000,
      '2017-12-17': 19783,
      '2020-03-12': 3800,
      '2021-04-14': 64000,
      '2021-11-10': 68789,
      '2022-11-09': 15500,
      '2024-01-11': 46000
    };

    const selectedDate = new Date(date);
    let closestPrice = null;
    let closestDiff = Infinity;

    Object.entries(historicalPrices).forEach(([priceDate, price]) => {
      const priceDateTime = new Date(priceDate);
      const diff = Math.abs(selectedDate - priceDateTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestPrice = price;
      }
    });

    return closestPrice;
  };

  const handleHistoricalCalculation = () => {
    if (historicalDate) {
      const price = getHistoricalPrice(historicalDate);
      setHistoricalPrice(price);
      
      if (usdAmount && price > 0) {
        const btc = (parseFloat(usdAmount) / price).toFixed(8);
        setBtcAmount(btc);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculatePotentialGains = () => {
    if (!usdAmount || !historicalPrice || historicalPrice === 0) return null;
    
    const initialInvestment = parseFloat(usdAmount);
    const btcBought = initialInvestment / historicalPrice;
    const currentValue = btcBought * currentPrice;
    const gains = currentValue - initialInvestment;
    const percentage = ((gains / initialInvestment) * 100);
    
    return {
      initialInvestment,
      btcBought,
      currentValue,
      gains,
      percentage
    };
  };

  const potentialGains = calculatePotentialGains();

  return (
    <motion.div 
      className="bitcoin-calculator"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="calculator-header">
        <h2>Bitcoin Calculator</h2>
        <p>Convert between USD and Bitcoin, or see historical "what if" scenarios</p>
      </div>

      <div className="calculator-tabs">
        <button 
          className={`tab ${calculationType === 'current' ? 'active' : ''}`}
          onClick={() => setCalculationType('current')}
        >
          Current Price
        </button>
        <button 
          className={`tab ${calculationType === 'historical' ? 'active' : ''}`}
          onClick={() => setCalculationType('historical')}
        >
          Historical Analysis
        </button>
      </div>

      <div className="calculator-content">
        {calculationType === 'current' ? (
          <div className="current-calculator">
            <div className="price-display">
              <span className="price-label">Current Bitcoin Price:</span>
              <span className="price-value">{formatCurrency(currentPrice)}</span>
            </div>

            <div className="conversion-inputs">
              <div className="input-group">
                <label>USD Amount</label>
                <div className="input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    value={usdAmount}
                    onChange={(e) => handleUsdChange(e.target.value)}
                    placeholder="Enter USD amount"
                  />
                </div>
              </div>

              <div className="conversion-arrow">⟷</div>

              <div className="input-group">
                <label>Bitcoin Amount</label>
                <div className="input-wrapper">
                  <span className="currency-symbol">₿</span>
                  <input
                    type="number"
                    value={btcAmount}
                    onChange={(e) => handleBtcChange(e.target.value)}
                    placeholder="Enter BTC amount"
                    step="0.00000001"
                  />
                </div>
              </div>
            </div>

            {usdAmount && btcAmount && (
              <motion.div 
                className="conversion-result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="result-item">
                  <span>{formatCurrency(parseFloat(usdAmount))}</span>
                  <span>=</span>
                  <span>{parseFloat(btcAmount).toFixed(8)} BTC</span>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="historical-calculator">
            <div className="input-group">
              <label>Select Historical Date</label>
              <input
                type="date"
                value={historicalDate}
                onChange={(e) => setHistoricalDate(e.target.value)}
                min="2009-01-03"
                max={new Date().toISOString().split('T')[0]}
              />
              <button 
                className="calculate-btn"
                onClick={handleHistoricalCalculation}
                disabled={!historicalDate}
              >
                Calculate
              </button>
            </div>

            {historicalPrice !== null && (
              <div className="historical-price-display">
                <span className="price-label">
                  Bitcoin Price on {new Date(historicalDate).toLocaleDateString()}:
                </span>
                <span className="price-value">
                  {historicalPrice === 0 ? 'Not trading yet' : formatCurrency(historicalPrice)}
                </span>
              </div>
            )}

            <div className="input-group">
              <label>USD Investment Amount</label>
              <div className="input-wrapper">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  placeholder="How much would you have invested?"
                />
              </div>
            </div>

            {potentialGains && (
              <motion.div 
                className="gains-analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3>Investment Analysis</h3>
                
                <div className="gains-grid">
                  <div className="gain-item">
                    <span className="gain-label">Initial Investment</span>
                    <span className="gain-value">{formatCurrency(potentialGains.initialInvestment)}</span>
                  </div>
                  
                  <div className="gain-item">
                    <span className="gain-label">Bitcoin Purchased</span>
                    <span className="gain-value">{potentialGains.btcBought.toFixed(8)} BTC</span>
                  </div>
                  
                  <div className="gain-item">
                    <span className="gain-label">Current Value</span>
                    <span className="gain-value">{formatCurrency(potentialGains.currentValue)}</span>
                  </div>
                  
                  <div className="gain-item highlight">
                    <span className="gain-label">Total Gains</span>
                    <span className={`gain-value ${potentialGains.gains >= 0 ? 'positive' : 'negative'}`}>
                      {potentialGains.gains >= 0 ? '+' : ''}{formatCurrency(potentialGains.gains)}
                    </span>
                  </div>
                  
                  <div className="gain-item highlight">
                    <span className="gain-label">Percentage Return</span>
                    <span className={`gain-value ${potentialGains.percentage >= 0 ? 'positive' : 'negative'}`}>
                      {potentialGains.percentage >= 0 ? '+' : ''}{potentialGains.percentage.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {potentialGains.percentage > 1000 && (
                  <div className="warning-note">
                    <span className="warning-icon">💡</span>
                    <p>
                      This shows the power of early adoption and long-term holding! 
                      Remember, past performance doesn't guarantee future results.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="calculator-footer">
        <div className="disclaimer">
          <span className="disclaimer-icon">⚠️</span>
          <p>
            This calculator is for educational purposes only. Cryptocurrency investments 
            carry significant risk. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default BitcoinCalculator;