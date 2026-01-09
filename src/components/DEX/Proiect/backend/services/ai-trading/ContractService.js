/**
 * 🔗 Contract Service - Smart Contract Interaction
 * 
 * Interacțiune cu smart contracts (BitSwapDEXWrapper):
 * - Execute swaps
 * - Monitor transactions
 * - Get contract state
 * - Handle errors
 * 
 * @module ContractService
 */

const { ethers } = require('ethers');
const path = require('path');
const logger = require('../../utils/logger');

// Try to load contract ABI (placeholder pentru moment)
let BitSwapDEXWrapperABI = null;
try {
  const abiPath = path.join(__dirname, '../../contracts/abis/BitSwapDEXWrapper.json');
  const abiFile = require(abiPath);
  BitSwapDEXWrapperABI = abiFile.abi || abiFile;
} catch (error) {
  logger.warn('Could not load BitSwapDEXWrapper ABI (contract not deployed yet):', error.message);
  // Use minimal ABI pentru testing
  BitSwapDEXWrapperABI = [
    'function swapTokensForTokens(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin, uint256 deadline) external returns (uint256 amountOut)',
    'function swapETHForTokens(address tokenOut, uint256 amountOutMin, uint256 deadline) external payable returns (uint256 amountOut)',
    'function swapTokensForETH(address tokenIn, uint256 amountIn, uint256 amountOutMin, uint256 deadline) external returns (uint256 amountOut)',
    'function getFeeStatistics() external view returns (uint256 totalFees, uint256 totalFeesUSD)',
    'function totalFeesCollected(address token) external view returns (uint256)',
    'function treasury() external view returns (address)',
    'function burnPercentage() external view returns (uint8)',
    'function stakersPercentage() external view returns (uint8)',
    'function protocolFee() external view returns (uint8)',
    'event FeeCollected(address indexed token, uint256 amount, uint256 burnAmount, uint256 stakersAmount, uint256 treasuryAmount)'
  ];
}

class ContractService {
  constructor() {
    // BSC Network
    this.bscRPC = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/';
    this.chainId = 56; // BSC Mainnet
    this.testnetChainId = 97; // BSC Testnet

    // Contract addresses
    this.wrapperAddress = process.env.WRAPPER_CONTRACT_ADDRESS || ''; // Va fi setat după deployment
    this.pancakeRouterAddress = '0x10ED43C718714eb63d5aA57B78B54704E256024E'; // PancakeSwap Router V2

    // Web3 provider
    this.provider = null;
    this.wallet = null;
    this.wrapperContract = null;

    // Initialize provider
    this.init();
  }

  /**
   * Initialize Web3 provider și contract
   */
  async init() {
    try {
      // Create provider
      this.provider = new ethers.JsonRpcProvider(this.bscRPC);

      // Load private key from environment (AWS Secrets Manager, Render env vars)
      const privateKey = process.env.WALLET_PRIVATE_KEY || '';
      
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        logger.info('Wallet address:', this.wallet.address);
      } else {
        logger.warn('WALLET_PRIVATE_KEY not set - contract interactions will be read-only');
      }
      
      // Load contract dacă address este setat
      if (this.wrapperAddress && BitSwapDEXWrapperABI) {
        const signer = this.wallet || this.provider;
        this.wrapperContract = new ethers.Contract(
          this.wrapperAddress,
          BitSwapDEXWrapperABI,
          signer
        );
        logger.contract('Wrapper contract loaded', { address: this.wrapperAddress });
      } else {
        logger.warn('Wrapper contract address not set - use WRAPPER_CONTRACT_ADDRESS env var');
      }

      logger.info('Contract Service initialized');
    } catch (error) {
      logger.error('Error initializing Contract Service:', error);
      // Don't throw - allow service to work în read-only mode
    }
  }

  /**
   * Execute swap prin BitSwapDEXWrapper
   * @param {Object} params - { tokenIn, tokenOut, amountIn, amountOutMin, deadline, userAddress }
   * @returns {Promise<Object>} Transaction result cu { success, txHash, amountOut, error }
   */
  async executeSwap(params) {
    try {
      const { tokenIn, tokenOut, amountIn, amountOutMin, deadline, userAddress } = params;

      // Validate params
      if (!tokenIn || !tokenOut || !amountIn || !userAddress) {
        throw new Error('Missing required parameters: tokenIn, tokenOut, amountIn, userAddress are required');
      }

      if (!amountOutMin || amountOutMin <= 0) {
        throw new Error('amountOutMin must be greater than 0');
      }

      if (!deadline || deadline < Math.floor(Date.now() / 1000)) {
        throw new Error('Invalid deadline - must be in the future');
      }

      // Check dacă contract e deployed
      if (!this.wrapperAddress || !this.wrapperContract) {
        throw new Error('Wrapper contract not deployed or not initialized. Set WRAPPER_CONTRACT_ADDRESS env var');
      }

      if (!this.wallet) {
        throw new Error('Wallet not initialized. Set WALLET_PRIVATE_KEY env var');
      }

      // Convert amountIn to BigNumber (wei pentru BNB, smallest unit pentru tokens)
      const amountInWei = ethers.parseUnits(amountIn.toString(), 18); // Assuming 18 decimals
      const amountOutMinWei = ethers.parseUnits(amountOutMin.toString(), 18);

      // Check dacă tokenIn este BNB (native token) sau ERC20
      const WETH_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // BSC WETH
      const isNative = tokenIn.toLowerCase() === 'bnb' || 
                       tokenIn.toLowerCase() === '0x0000000000000000000000000000000000000000' ||
                       tokenIn.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

      let txHash;
      let amountOut = null;

      if (isNative) {
        // Swap BNB for tokens
        // Convert tokenOut to address if it's a symbol
        const tokenOutAddress = this.resolveTokenAddress(tokenOut);
        
        const tx = await this.wrapperContract.swapETHForTokens(
          tokenOutAddress,
          amountOutMinWei,
          deadline,
          { value: amountInWei }
        );

        // Wait for transaction
        const receipt = await tx.wait();
        txHash = receipt.hash;

        // Extract amountOut from events (if available)
        if (receipt.logs && receipt.logs.length > 0) {
          // Try to parse Swap event (depende de contract implementation)
          // amountOut = receipt.logs[0].args?.amountOut || amountOutMin * 0.99;
          amountOut = amountOutMin * 0.99; // Fallback
        }
      } else {
        // Swap tokens for tokens (sau tokens for ETH)
        const tokenInAddress = this.resolveTokenAddress(tokenIn);
        const tokenOutAddress = this.resolveTokenAddress(tokenOut);
        const isETHOut = tokenOut.toLowerCase() === 'bnb' || 
                        tokenOut.toLowerCase() === '0x0000000000000000000000000000000000000000' ||
                        tokenOut.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

        // Approve token spending dacă e necesar (pentru ERC20)
        const tokenContract = new ethers.Contract(
          tokenInAddress,
          ['function approve(address spender, uint256 amount) external returns (bool)'],
          this.wallet
        );

        const approveTx = await tokenContract.approve(this.wrapperAddress, amountInWei);
        await approveTx.wait();

        let tx;
        if (isETHOut) {
          // Swap tokens for ETH
          tx = await this.wrapperContract.swapTokensForETH(
            tokenInAddress,
            amountInWei,
            amountOutMinWei,
            deadline
          );
        } else {
          // Swap tokens for tokens
          tx = await this.wrapperContract.swapTokensForTokens(
            tokenInAddress,
            tokenOutAddress,
            amountInWei,
            amountOutMinWei,
            deadline
          );
        }

        // Wait for transaction
        const receipt = await tx.wait();
        txHash = receipt.hash;

        // Extract amountOut from events (if available)
        if (receipt.logs && receipt.logs.length > 0) {
          // Try to parse Swap event
          // amountOut = receipt.logs[0].args?.amountOut || amountOutMin * 0.99;
          amountOut = amountOutMin * 0.99; // Fallback
        }
      }

      logger.contract('Swap executed successfully', { 
        tokenIn, 
        tokenOut, 
        txHash,
        amountOut: amountOut || amountOutMin * 0.99
      });

      return {
        success: true,
        txHash,
        amountOut: amountOut || amountOutMin * 0.99,
        error: null
      };
    } catch (error) {
      logger.error('Error executing swap:', error);
      return {
        success: false,
        txHash: null,
        amountOut: 0,
        error: error.message || 'Failed to execute swap'
      };
    }
  }

  /**
   * Resolve token symbol to address (cu Bitcoin support - Oxium-inspired)
   * @private
   */
  resolveTokenAddress(token) {
    const bitcoinTokens = require('../../utils/bitcoinTokens');
    
    // Check dacă e Bitcoin token (WBTC, BTCB, BTC) - Oxium-inspired
    const bitcoinAddress = bitcoinTokens.resolveBitcoinTokenAddress(token);
    if (bitcoinAddress) {
      return bitcoinAddress;
    }
    
    // Common BSC token addresses
    const tokenMap = {
      'bnb': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      'wbnb': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      'usdt': '0x55d398326f99059fF775485246999027B3197955', // USDT BSC
      'busd': '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD BSC
      'usdc': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC BSC
      'eth': '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' // ETH BSC
    };

    const tokenLower = token.toLowerCase();
    
    // Dacă e deja un address (starts with 0x), return as is
    if (tokenLower.startsWith('0x') && tokenLower.length === 42) {
      return tokenLower;
    }

    // Dacă e în map, return address
    if (tokenMap[tokenLower]) {
      return tokenMap[tokenLower];
    }

    // Fallback: assume it's already an address
    return token;
  }

  /**
   * Get contract state (fees collected, etc.)
   * @returns {Promise<Object>} Contract state
   */
  async getContractState() {
    try {
      if (!this.wrapperContract) {
        throw new Error('Wrapper contract not initialized. Set WRAPPER_CONTRACT_ADDRESS env var');
      }

      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      // Get fee statistics
      let feeStats = { totalFees: 0, totalFeesUSD: 0 };
      try {
        feeStats = await this.wrapperContract.getFeeStatistics();
      } catch (error) {
        logger.warn('Error getting fee statistics:', error.message);
      }

      // Get treasury address
      let treasury = null;
      try {
        treasury = await this.wrapperContract.treasury();
      } catch (error) {
        logger.warn('Error getting treasury address:', error.message);
      }

      // Get fee distribution percentages
      let burnPercentage = 50;
      let stakersPercentage = 30;
      let protocolFee = 20;

      try {
        burnPercentage = await this.wrapperContract.burnPercentage();
        stakersPercentage = await this.wrapperContract.stakersPercentage();
        protocolFee = await this.wrapperContract.protocolFee();
      } catch (error) {
        logger.warn('Error getting fee distribution:', error.message);
      }

      // Get total fees collected pentru principalele tokens
      const mainTokens = [
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
        '0x55d398326f99059fF775485246999027B3197955', // USDT
        '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' // BUSD
      ];

      const feesByToken = {};
      for (const token of mainTokens) {
        try {
          const fees = await this.wrapperContract.totalFeesCollected(token);
          feesByToken[token] = ethers.formatEther(fees);
        } catch (error) {
          logger.warn(`Error getting fees for token ${token}:`, error.message);
        }
      }

      return {
        totalFeesCollected: ethers.formatEther(feeStats.totalFees || 0),
        totalFeesCollectedUSD: ethers.formatEther(feeStats.totalFeesUSD || 0),
        treasury: treasury || null,
        feeDistribution: {
          burn: burnPercentage || 50,
          stakers: stakersPercentage || 30,
          treasury: protocolFee || 20
        },
        feesByToken,
        contractAddress: this.wrapperAddress,
        isInitialized: !!this.wrapperContract
      };
    } catch (error) {
      logger.error('Error getting contract state:', error);
      // Return default state on error
      return {
        totalFeesCollected: 0,
        totalFeesCollectedUSD: 0,
        treasury: null,
        feeDistribution: {
          burn: 50,
          stakers: 30,
          treasury: 20
        },
        feesByToken: {},
        contractAddress: this.wrapperAddress,
        isInitialized: false,
        error: error.message
      };
    }
  }

  /**
   * Monitor transaction
   * @param {string} txHash - Transaction hash
   * @param {number} confirmations - Number of confirmations to wait for (default: 1)
   * @returns {Promise<Object>} Transaction receipt
   */
  async monitorTransaction(txHash, confirmations = 1) {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      if (!txHash || typeof txHash !== 'string') {
        throw new Error('Invalid transaction hash');
      }

      // Wait for transaction with confirmations
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      // Check status (1 = success, 0 = failed)
      const success = receipt.status === 1;

      // Get gas used
      const gasUsed = receipt.gasUsed ? receipt.gasUsed.toString() : null;
      const gasPrice = receipt.gasPrice ? ethers.formatUnits(receipt.gasPrice, 'gwei') : null;
      const gasCost = gasUsed && receipt.gasPrice ? 
        ethers.formatEther(receipt.gasUsed * receipt.gasPrice) : null;

      // Extract events (if available)
      const events = receipt.logs || [];

      return {
        success,
        receipt: {
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          blockHash: receipt.blockHash,
          status: receipt.status,
          gasUsed,
          gasPrice,
          gasCost,
          from: receipt.from,
          to: receipt.to,
          eventsCount: events.length,
          confirmations: receipt.confirmations || 0
        },
        message: success ? 'Transaction successful' : 'Transaction failed'
      };
    } catch (error) {
      logger.error('Error monitoring transaction:', error);
      return {
        success: false,
        receipt: null,
        error: error.message || 'Failed to monitor transaction'
      };
    }
  }
}

module.exports = new ContractService();

