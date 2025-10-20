import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';

const BitcoinChart = ({ type = 'price', timeframe = '7d', height = 300 }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);

  useEffect(() => {
    fetchBitcoinData();
  }, [timeframe]);

  const fetchBitcoinData = async () => {
    try {
      setLoading(true);
      
      // Fetch current price
      const priceResponse = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json');
      const priceData = await priceResponse.json();
      const currentBTCPrice = parseFloat(priceData.bpi.USD.rate.replace(',', ''));
      setCurrentPrice(currentBTCPrice);

      // Generate historical data (since free APIs are limited, we'll simulate realistic data)
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 365;
      const data = [];
      const basePrice = currentBTCPrice;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simulate realistic Bitcoin price movement
        const volatility = 0.03; // 3% daily volatility
        const trend = Math.sin(i / 10) * 0.01; // Small trend component
        const randomChange = (Math.random() - 0.5) * volatility;
        const priceMultiplier = 1 + trend + randomChange;
        
        const price = Math.round(basePrice * priceMultiplier * (0.95 + Math.random() * 0.1));
        
        data.push({
          date: date.toISOString().split('T')[0],
          price: price,
          volume: Math.round(1000000000 + Math.random() * 2000000000), // Simulate volume
          marketCap: Math.round(price * 19700000), // ~19.7M BTC in circulation
          timestamp: date.getTime()
        });
      }
      
      setChartData(data);
      
      // Calculate price change
      if (data.length >= 2) {
        const oldPrice = data[0].price;
        const newPrice = data[data.length - 1].price;
        const change = ((newPrice - oldPrice) / oldPrice) * 100;
        setPriceChange(change);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Bitcoin data:', error);
      setLoading(false);
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatVolume = (value) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bitcoin-chart-tooltip">
          <p className="tooltip-date">{label}</p>
          <p className="tooltip-price">
            Price: <span>{formatPrice(payload[0].value)}</span>
          </p>
          {payload[0].payload.volume && (
            <p className="tooltip-volume">
              Volume: <span>{formatVolume(payload[0].payload.volume)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bitcoin-chart-loading">
        <motion.div 
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          ₿
        </motion.div>
        <p>Loading Bitcoin data...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="bitcoin-chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Price Header */}
      <div className="chart-header">
        <div className="price-info">
          <h3 className="current-price">
            {currentPrice ? formatPrice(currentPrice) : 'Loading...'}
          </h3>
          {priceChange !== null && (
            <span className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% ({timeframe})
            </span>
          )}
        </div>
        
        <div className="timeframe-selector">
          {['7d', '30d', '1y'].map((tf) => (
            <button
              key={tf}
              className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
              onClick={() => fetchBitcoinData()}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="chart-wrapper" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="bitcoinGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f7931a" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f7931a" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="date" 
                stroke="#888"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#888"
                fontSize={12}
                tickFormatter={formatPrice}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#f7931a"
                strokeWidth={2}
                fill="url(#bitcoinGradient)"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="date" 
                stroke="#888"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#888"
                fontSize={12}
                tickFormatter={formatPrice}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#f7931a"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, stroke: '#f7931a', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Market Stats */}
      <div className="market-stats">
        <div className="stat-item">
          <span className="stat-label">24h Volume</span>
          <span className="stat-value">
            {chartData.length > 0 ? formatVolume(chartData[chartData.length - 1]?.volume) : 'Loading...'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Market Cap</span>
          <span className="stat-value">
            {chartData.length > 0 ? formatVolume(chartData[chartData.length - 1]?.marketCap) : 'Loading...'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Circulating Supply</span>
          <span className="stat-value">19.7M BTC</span>
        </div>
      </div>
    </motion.div>
  );
};

export default BitcoinChart;