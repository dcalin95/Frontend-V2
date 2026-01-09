/**
 * ⛓️ Web3 Utilities
 * 
 * Web3 utilities pentru blockchain interaction:
 * - Provider initialization
 * - Contract interaction helpers
 * - Transaction helpers
 * - Error handling
 * 
 * @module web3
 */

const { ethers } = require('ethers');

// TODO: Implementare completă
// 1. Initialize provider
// 2. Load contract ABIs
// 3. Contract interaction helpers
// 4. Transaction monitoring
// 5. Error handling și retries

class Web3Utils {
  constructor() {
    // BSC Network
    this.bscRPC = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/';
    this.testnetRPC = process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
    
    // Provider
    this.provider = null;
    this.testnetProvider = null;

    // Initialize providers
    this.initProviders();
  }

  /**
   * Initialize Web3 providers
   */
  initProviders() {
    try {
      // Mainnet provider
      this.provider = new ethers.JsonRpcProvider(this.bscRPC);

      // Testnet provider
      this.testnetProvider = new ethers.JsonRpcProvider(this.testnetRPC);

      console.log('Web3 providers initialized');
    } catch (error) {
      console.error('Error initializing Web3 providers:', error);
      throw error;
    }
  }

  /**
   * Get provider (mainnet sau testnet)
   * @param {boolean} testnet - Dacă e testnet
   * @returns {ethers.Provider} Provider instance
   */
  getProvider(testnet = false) {
    return testnet ? this.testnetProvider : this.provider;
  }

  /**
   * Create contract instance
   * @param {string} address - Contract address
   * @param {Array} abi - Contract ABI
   * @param {ethers.Signer|ethers.Provider} signerOrProvider - Signer sau Provider
   * @returns {ethers.Contract} Contract instance
   */
  getContract(address, abi, signerOrProvider) {
    try {
      if (!address || !abi) {
        throw new Error('Contract address and ABI are required');
      }

      return new ethers.Contract(address, abi, signerOrProvider || this.provider);
    } catch (error) {
      console.error('Error creating contract instance:', error);
      throw error;
    }
  }

  /**
   * Create wallet instance
   * @param {string} privateKey - Private key
   * @param {boolean} testnet - Dacă e testnet
   * @returns {ethers.Wallet} Wallet instance
   */
  getWallet(privateKey, testnet = false) {
    try {
      if (!privateKey) {
        throw new Error('Private key is required');
      }

      const provider = this.getProvider(testnet);
      return new ethers.Wallet(privateKey, provider);
    } catch (error) {
      console.error('Error creating wallet instance:', error);
      throw error;
    }
  }

  /**
   * Format amount (wei to ether)
   * @param {string|BigNumber} amount - Amount în wei
   * @param {number} decimals - Token decimals (default 18)
   * @returns {string} Formatted amount
   */
  formatAmount(amount, decimals = 18) {
    try {
      return ethers.formatUnits(amount, decimals);
    } catch (error) {
      console.error('Error formatting amount:', error);
      throw error;
    }
  }

  /**
   * Parse amount (ether to wei)
   * @param {string|number} amount - Amount în ether
   * @param {number} decimals - Token decimals (default 18)
   * @returns {BigNumber} Parsed amount în wei
   */
  parseAmount(amount, decimals = 18) {
    try {
      return ethers.parseUnits(amount.toString(), decimals);
    } catch (error) {
      console.error('Error parsing amount:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction
   * @param {string} txHash - Transaction hash
   * @param {number} confirmations - Number of confirmations (default 1)
   * @param {number} timeout - Timeout în milliseconds (default 5 minutes)
   * @returns {Promise<ethers.TransactionReceipt>} Transaction receipt
   */
  async waitForTransaction(txHash, confirmations = 1, timeout = 5 * 60 * 1000) {
    try {
      if (!txHash) {
        throw new Error('Transaction hash is required');
      }

      const provider = this.provider;
      const receipt = await Promise.race([
        provider.waitForTransaction(txHash, confirmations),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timeout')), timeout)
        )
      ]);

      return receipt;
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      throw error;
    }
  }

  /**
   * Get gas price
   * @returns {Promise<BigNumber>} Current gas price
   */
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || ethers.parseUnits('20', 'gwei'); // Default 20 gwei
    } catch (error) {
      console.error('Error getting gas price:', error);
      return ethers.parseUnits('20', 'gwei'); // Fallback
    }
  }

  /**
   * Check dacă address este valid
   * @param {string} address - Address to validate
   * @returns {boolean} True dacă e valid
   */
  isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
const web3Utils = new Web3Utils();

module.exports = web3Utils;

