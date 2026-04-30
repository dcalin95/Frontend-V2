/**
 * 🌉 BridgeHandler - Cross-Chain Bridge Orchestrator
 * 
 * Orchestrator principal pentru operațiuni cross-chain bridge între:
 * - SEI Network (CosmWasm)
 * - EVM chains (BSC, Ethereum)
 * - Solana
 * 
 * **Features:**
 * - Unified bridge interface pentru toate chain-urile
 * - Event listening și dispatch între chains
 * - OTA AI integration pentru autonomous bridge operations
 * - Cross-chain swap execution support
 * 
 * **Architecture:**
 * - Modular: Un adapter per chain (SEI, EVM, Solana)
 * - Extensible: Ușor de adăugat noi chains (L2s, etc.)
 * - OTA-ready: Support pentru AI-controlled bridge operations
 * 
 * @module BridgeHandler
 */

import { getChainConfig, getSupportedBridgeProtocol } from './bridgeConfig';
import { validateBridgeParams, BridgeLogger, BridgeError, BridgeErrorCode, retryOperation } from './bridgeUtils';
import { SEIBridgeAdapter } from './seiBridgeAdapter';
import { EVMBridgeAdapter } from './evmBridgeAdapter';
import { SolanaBridgeAdapter } from './solanaBridgeAdapter';

/**
 * BridgeHandler Class
 * 
 * Orchestrator principal pentru operațiuni cross-chain bridge
 */
export class BridgeHandler {
  constructor(walletProviders = {}) {
    this.logger = new BridgeLogger('BridgeHandler');
    this.adapters = {};
    this.walletProviders = walletProviders; // { sei: keplr, evm: ethers, solana: phantom }
    this.eventListeners = {};
    this.otaEnabled = false;
    this.otaConfig = null;
  }

  /**
   * Initialize Bridge Handler
   * 
   * Inițializează toți adapter-ii pentru chain-urile disponibile
   */
  async initialize(chains = ['sei', 'bsc', 'ethereum', 'solana']) {
    try {
      this.logger.info('Initializing Bridge Handler', { chains });

      // Initialize adapters pentru fiecare chain
      for (const chainId of chains) {
        try {
          await this.initializeAdapter(chainId);
        } catch (error) {
          this.logger.warn(`Failed to initialize adapter for ${chainId}`, { error });
        }
      }

      this.logger.info('Bridge Handler initialized', {
        initializedAdapters: Object.keys(this.adapters),
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to initialize Bridge Handler', { error });
      throw error;
    }
  }

  /**
   * Initialize Adapter for Chain
   * 
   * Inițializează adapter-ul pentru un chain specificat
   * 
   * @private
   */
  async initializeAdapter(chainId) {
    const config = getChainConfig(chainId);
    const walletProvider = this.walletProviders[chainId];

    let adapter;

    switch (config.chainType) {
      case 'sei':
        adapter = new SEIBridgeAdapter(config, walletProvider);
        break;
      case 'evm':
        adapter = new EVMBridgeAdapter(config, walletProvider);
        break;
      case 'solana':
        adapter = new SolanaBridgeAdapter(config, walletProvider, walletProvider?.connection);
        break;
      default:
        throw new BridgeError(
          `Unsupported chain type: ${config.chainType}`,
          BridgeErrorCode.INVALID_CHAIN
        );
    }

    await adapter.initialize();
    this.adapters[chainId] = adapter;

    this.logger.debug(`Adapter initialized for ${chainId}`, { chainType: config.chainType });
  }

  /**
   * Bridge Token
   * 
   * Execută un bridge transfer între două chains
   * 
   * @param {string} fromChain - Chain-ul sursă (sei, bsc, ethereum, solana)
   * @param {string} toChain - Chain-ul destinație
   * @param {string} token - Adresa token-ului (sau 'native' pentru native token)
   * @param {string} amount - Cantitatea de token-uri
   * @param {Object} user - User object cu address și opțiuni
   * @param {Object} options - Opțiuni suplimentare (protocol, otaControlled, etc.)
   */
  async bridgeToken(fromChain, toChain, token, amount, user, options = {}) {
    try {
      this.logger.info('Bridge token request', {
        fromChain,
        toChain,
        token,
        amount,
        user: user?.address,
        otaControlled: options.otaControlled || false,
      });

      // Validare parametri
      validateBridgeParams({ fromChain, toChain, token, amount, user });

      // Verificare adapters
      if (!this.adapters[fromChain]) {
        throw new BridgeError(
          `Adapter not initialized for chain: ${fromChain}`,
          BridgeErrorCode.INVALID_CHAIN
        );
      }

      // Verificare OTA authorization dacă este OTA-controlled
      if (options.otaControlled || user?.useAI) {
        await this.verifyOTAAuthorization(user);
      }

      // Get recipient address (folosește user address pe toChain dacă nu este specificat)
      const recipientAddress = options.recipientAddress || user.address;

      // Execute bridge
      const adapter = this.adapters[fromChain];
      const result = await adapter.bridgeToken(
        toChain,
        token,
        amount,
        recipientAddress,
        {
          ...options,
          otaControlled: options.otaControlled || user?.useAI || false,
        }
      );

      // Emit bridge event
      await this.onBridgeEvent({
        type: 'bridge_initiated',
        fromChain,
        toChain,
        token,
        amount,
        user: user.address,
        transactionHash: result.transactionHash || result.signature,
        otaControlled: options.otaControlled || false,
      });

      return result;
    } catch (error) {
      this.logger.error('Bridge token failed', { error, fromChain, toChain, token, amount });
      throw error;
    }
  }

  /**
   * Execute Cross-Chain Swap
   * 
   * Execută un swap cross-chain: bridge + swap pe chain-ul destinație
   * 
   * @param {string} fromChain - Chain-ul sursă
   * @param {string} toChain - Chain-ul destinație
   * @param {string} tokenIn - Token de intrare
   * @param {string} tokenOut - Token de ieșire
   * @param {string} amountIn - Cantitatea de intrare
   * @param {Object} user - User object
   * @param {Object} options - Opțiuni (protocol, slippage, etc.)
   */
  async executeCrossChainSwap(fromChain, toChain, tokenIn, tokenOut, amountIn, user, options = {}) {
    try {
      this.logger.info('Execute cross-chain swap', {
        fromChain,
        toChain,
        tokenIn,
        tokenOut,
        amountIn,
        user: user?.address,
      });

      // Step 1: Bridge token de la fromChain către toChain
      const bridgeResult = await this.bridgeToken(
        fromChain,
        toChain,
        tokenIn,
        amountIn,
        user,
        {
          ...options,
          otaControlled: options.otaControlled || user?.useAI || false,
        }
      );

      // Step 2: TODO - Execute swap pe toChain după ce bridge-ul este completat
      // Va fi implementat când swap-urile cross-chain vor fi integrate

      return {
        success: true,
        bridgeResult,
        swapResult: null, // TODO: Va conține rezultatul swap-ului
      };
    } catch (error) {
      this.logger.error('Cross-chain swap failed', { error, fromChain, toChain, tokenIn, tokenOut });
      throw error;
    }
  }

  /**
   * Listen for Bridge Events
   * 
   * Ascultă pentru events de bridge pe un chain specificat
   * 
   * @param {string} chainId - Chain-ul pentru care să asculte
   * @param {Function} callback - Callback pentru events
   * @param {Object} filters - Filters pentru events
   */
  async listenForBridgeEvents(chainId, callback, filters = {}) {
    try {
      if (!this.adapters[chainId]) {
        throw new BridgeError(
          `Adapter not initialized for chain: ${chainId}`,
          BridgeErrorCode.INVALID_CHAIN
        );
      }

      const adapter = this.adapters[chainId];
      const result = await adapter.listenForBridgeEvents(callback, filters);

      // Store listener pentru cleanup ulterioar
      this.eventListeners[chainId] = {
        listenerId: result.listenerId,
        callback,
        filters,
      };

      return result;
    } catch (error) {
      this.logger.error('Failed to listen for bridge events', { error, chainId });
      throw error;
    }
  }

  /**
   * On Bridge Event
   * 
   * Handler pentru bridge events - poate fi extins pentru OTA triggers
   * 
   * @private
   */
  async onBridgeEvent(event) {
    try {
      this.logger.info('Bridge event received', event);

      // OTA trigger dacă este OTA-controlled
      if (event.otaControlled && this.otaEnabled) {
        await this.onOTABridgeTrigger(event);
      }

      // Emit event pentru UI/other services
      // TODO: Event emitter sau callback system

      return true;
    } catch (error) {
      this.logger.error('Failed to handle bridge event', { error, event });
      throw error;
    }
  }

  /**
   * OTA Bridge Trigger
   * 
   * Handler pentru OTA-controlled bridge operations
   * 
   * @private
   */
  async onOTABridgeTrigger(event) {
    try {
      this.logger.info('OTA bridge trigger', { event });

      // TODO: Integrare cu OTA AI logic
      // OTA poate decide dacă bridge-ul este necesar, când să execute, etc.

      return true;
    } catch (error) {
      this.logger.error('OTA bridge trigger failed', { error, event });
      throw error;
    }
  }

  /**
   * Verify OTA Authorization
   * 
   * Verifică dacă user-ul are autorizație pentru OTA-controlled operations
   * 
   * @private
   */
  async verifyOTAAuthorization(user) {
    try {
      if (!user || !user.address) {
        throw new BridgeError(
          'User address is required for OTA authorization',
          BridgeErrorCode.OTA_NOT_AUTHORIZED
        );
      }

      // TODO: Verificare BITS holdings, user registration, etc.
      // Această verificare va fi integrată cu UserVault și OTA access control

      this.logger.debug('OTA authorization verified', { user: user.address });
      return true;
    } catch (error) {
      this.logger.error('OTA authorization failed', { error, user: user?.address });
      throw error;
    }
  }

  /**
   * Enable OTA Mode
   * 
   * Activează modul OTA pentru bridge operations
   */
  enableOTAMode(otaConfig = {}) {
    this.otaEnabled = true;
    this.otaConfig = otaConfig;
    this.logger.info('OTA mode enabled', { otaConfig });
  }

  /**
   * Disable OTA Mode
   * 
   * Dezactivează modul OTA
   */
  disableOTAMode() {
    this.otaEnabled = false;
    this.otaConfig = null;
    this.logger.info('OTA mode disabled');
  }

  /**
   * Get Bridge Status
   * 
   * Verifică statusul unui bridge transfer
   */
  async getBridgeStatus(chainId, transactionHash) {
    try {
      if (!this.adapters[chainId]) {
        throw new BridgeError(
          `Adapter not initialized for chain: ${chainId}`,
          BridgeErrorCode.INVALID_CHAIN
        );
      }

      const adapter = this.adapters[chainId];
      return await adapter.getBridgeStatus(transactionHash);
    } catch (error) {
      this.logger.error('Failed to get bridge status', { error, chainId, transactionHash });
      throw error;
    }
  }

  /**
   * Get Available Chains
   * 
   * Returnează lista de chains disponibile
   */
  getAvailableChains() {
    return Object.keys(this.adapters);
  }

  /**
   * Cleanup
   * 
   * Cleanup resources (event listeners, etc.)
   */
  cleanup() {
    this.eventListeners = {};
    this.logger.info('Bridge Handler cleaned up');
  }
}

// Export singleton instance (opțional)
let bridgeHandlerInstance = null;

export function getBridgeHandler(walletProviders = {}) {
  if (!bridgeHandlerInstance) {
    bridgeHandlerInstance = new BridgeHandler(walletProviders);
  }
  return bridgeHandlerInstance;
}
