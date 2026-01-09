/**
 * ₿ Bitcoin Arbitrage Strategy - Oxium-Inspired
 * 
 * Strategie de arbitraj pentru Bitcoin tokens (WBTC ↔ BTCB):
 * - Detectează price differences între WBTC și BTCB
 * - Execută arbitrage trades când diferența e suficientă
 * - Optimizează routing pentru best execution
 * 
 * @module BitcoinArbitrageStrategy
 */

import { 
  isBitcoinArbitragePair, 
  areBitcoinEquivalents,
  getBestBitcoinTokenForTrade,
  getBitcoinTokenBySymbol,
  getBitcoinTokenByAddress
} from '../utils/bitcoinTokens.js';

export class BitcoinArbitrageStrategy {
  constructor(config = {}) {
    this.config = {
      minPriceDifference: config.minPriceDifference || 0.1, // 0.1% minimum pentru arbitrage
      maxPriceDifference: config.maxPriceDifference || 5.0, // 5% maximum (suspicious)
      minConfidence: config.minConfidence || 0.75, // 75% confidence pentru arbitrage
      riskLevel: 'low' // Arbitrage e low risk (price difference e garantată)
    };
    
    this.name = 'Bitcoin Arbitrage';
    this.riskLevel = 'low';
  }

  /**
   * Analizează market pentru Bitcoin arbitrage opportunities
   * @param {string} token - Token symbol sau address
   * @param {Object} marketData - Market data
   * @returns {Promise<Object>} Trading signal
   */
  async analyze(token, marketData) {
    try {
      // Check dacă e Bitcoin token
      const bitcoinToken = getBitcoinTokenBySymbol(token) || getBitcoinTokenByAddress(token);
      if (!bitcoinToken) {
        // Nu e Bitcoin token - return hold
        return {
          signal: 'hold',
          confidence: 0,
          reasoning: 'Not a Bitcoin token - arbitrage strategy only works for WBTC/BTCB'
        };
      }

      // Pentru arbitrage, avem nevoie de prețuri pentru ambele WBTC și BTCB
      // Presupunem că marketData conține prețuri pentru ambele (sau putem fetch separat)
      const wbtcPrice = marketData.wbtcPrice || marketData.price; // Fallback la price dacă nu e specific
      const btcbPrice = marketData.btcbPrice || marketData.price;
      
      // Check dacă avem prețuri pentru ambele
      if (!wbtcPrice || !btcbPrice || wbtcPrice === btcbPrice) {
        return {
          signal: 'hold',
          confidence: 0,
          reasoning: 'Insufficient price data for Bitcoin arbitrage'
        };
      }

      // Calculate price difference
      const priceDiff = Math.abs(wbtcPrice - btcbPrice);
      const priceDiffPercent = (priceDiff / Math.min(wbtcPrice, btcbPrice)) * 100;

      // Check dacă diferența e suficientă pentru arbitrage
      if (priceDiffPercent < this.config.minPriceDifference) {
        return {
          signal: 'hold',
          confidence: 0.3,
          reasoning: `Price difference too small: ${priceDiffPercent.toFixed(3)}% < ${this.config.minPriceDifference}%`
        };
      }

      // Check dacă diferența e prea mare (suspicious - poate fi eroare)
      if (priceDiffPercent > this.config.maxPriceDifference) {
        return {
          signal: 'hold',
          confidence: 0.2,
          reasoning: `Price difference suspiciously large: ${priceDiffPercent.toFixed(3)}% > ${this.config.maxPriceDifference}%`
        };
      }

      // Determine arbitrage direction
      let signal = 'hold';
      let tokenIn = null;
      let tokenOut = null;
      let entryPrice = null;
      
      if (wbtcPrice > btcbPrice) {
        // WBTC e mai scump - buy BTCB, sell WBTC
        signal = 'buy';
        tokenIn = 'BTCB';
        tokenOut = 'WBTC';
        entryPrice = btcbPrice;
      } else {
        // BTCB e mai scump - buy WBTC, sell BTCB
        signal = 'buy';
        tokenIn = 'WBTC';
        tokenOut = 'BTCB';
        entryPrice = wbtcPrice;
      }

      // Calculate confidence bazat pe price difference
      const confidence = Math.min(0.95, 0.5 + (priceDiffPercent / this.config.maxPriceDifference) * 0.45);

      // Calculate stop loss și take profit (tight pentru arbitrage)
      const stopLoss = entryPrice * 0.995; // -0.5% stop loss (tight pentru arbitrage)
      const takeProfit = entryPrice * (1 + priceDiffPercent / 100 * 0.8); // 80% din price difference

      return {
        signal,
        confidence: Math.max(confidence, this.config.minConfidence),
        reasoning: `Bitcoin arbitrage opportunity: ${priceDiffPercent.toFixed(3)}% price difference between ${tokenIn} and ${tokenOut}. Buy ${tokenIn} at ${entryPrice.toFixed(2)}, sell ${tokenOut} for profit.`,
        entryPrice,
        stopLoss,
        takeProfit,
        tokenIn,
        tokenOut,
        priceDifference: priceDiffPercent,
        arbitrageType: 'bitcoin',
        isArbitrage: true
      };
    } catch (error) {
      console.error('Error in Bitcoin Arbitrage Strategy:', error);
      return {
        signal: 'hold',
        confidence: 0,
        reasoning: `Error: ${error.message}`
      };
    }
  }

  /**
   * Get strategy info
   * @returns {Object} Strategy information
   */
  getInfo() {
    return {
      name: this.name,
      riskLevel: this.riskLevel,
      description: 'Bitcoin arbitrage strategy - detects and executes arbitrage opportunities between WBTC and BTCB',
      config: this.config
    };
  }
}

export default BitcoinArbitrageStrategy;

