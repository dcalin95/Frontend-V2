/**
 * 📊 Trade Service
 * 
 * API service pentru trade operations
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const tradeService = {
  /**
   * Execute swap
   */
  async executeSwap(swapData) {
    try {
      const response = await fetch(`${API_BASE_URL}/trade/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swapData),
      });

      if (!response.ok) {
        throw new Error('Failed to execute swap');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Trade service error:', error);
      throw error;
    }
  },

  /**
   * Place limit order
   */
  async placeLimitOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/trade/limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to place limit order');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Trade service error:', error);
      throw error;
    }
  }
};

export default tradeService;

