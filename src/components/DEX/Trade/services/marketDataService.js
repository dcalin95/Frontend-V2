/**
 * 📊 Market Data Service
 * 
 * API service pentru market data
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const marketDataService = {
  /**
   * Get market data for trading pair
   */
  async getMarketData(tokenIn, tokenOut) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/market/${tokenIn.symbol}/${tokenOut.symbol}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Market data service error:', error);
      throw error;
    }
  }
};

export default marketDataService;

