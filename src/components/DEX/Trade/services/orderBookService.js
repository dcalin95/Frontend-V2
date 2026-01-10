/**
 * 📊 Order Book Service
 * 
 * API service pentru order book data
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const orderBookService = {
  /**
   * Get order book for trading pair
   */
  async getOrderBook(tokenIn, tokenOut) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/orderbook/${tokenIn.symbol}/${tokenOut.symbol}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch order book');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Order book service error:', error);
      throw error;
    }
  },

  /**
   * Subscribe to order book updates (WebSocket)
   */
  subscribeOrderBook(tokenIn, tokenOut, callback) {
    // TODO: Implement WebSocket subscription
    // const ws = new WebSocket(`${WS_URL}/orderbook/${tokenIn.symbol}/${tokenOut.symbol}`);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   callback(data);
    // };
    // return ws;
  }
};

export default orderBookService;

