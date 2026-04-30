/**
 * 🛠️ Bridge Utilities - Common Helper Functions
 * 
 * Funcții utilitare comune pentru bridge operations:
 * - Logging și error handling
 * - Token amount conversions
 * - Event parsing și validation
 * - Transaction status checking
 * 
 * @module BridgeUtils
 */

/**
 * Bridge Event Types
 */
export const BridgeEventType = {
  BRIDGE_INITIATED: 'bridge_initiated',
  BRIDGE_COMPLETED: 'bridge_completed',
  BRIDGE_FAILED: 'bridge_failed',
  BRIDGE_PENDING: 'bridge_pending',
};

/**
 * Chain-specific amount converters
 */

/**
 * Convert SEI amount (usei) to human-readable
 */
export function convertSeiAmount(amount, decimals = 6) {
  if (typeof amount === 'string') {
    return (BigInt(amount) / BigInt(10 ** decimals)).toString();
  }
  return (Number(amount) / (10 ** decimals)).toString();
}

/**
 * Convert EVM amount (wei) to human-readable
 */
export function convertEvmAmount(amount, decimals = 18) {
  if (typeof amount === 'string' || typeof amount === 'bigint') {
    const divisor = BigInt(10 ** decimals);
    const value = BigInt(amount);
    return (value / divisor).toString();
  }
  return (Number(amount) / (10 ** decimals)).toString();
}

/**
 * Convert Solana amount (lamports) to human-readable
 */
export function convertSolanaAmount(amount, decimals = 9) {
  if (typeof amount === 'string' || typeof amount === 'bigint') {
    const divisor = BigInt(10 ** decimals);
    const value = BigInt(amount);
    return (value / divisor).toString();
  }
  return (Number(amount) / (10 ** decimals)).toString();
}

/**
 * Convert human-readable amount to chain-specific format
 */
export function convertToChainAmount(amount, chainType, decimals = null) {
  const defaultDecimals = {
    sei: 6,
    evm: 18,
    solana: 9,
  };

  const chainDecimals = decimals || defaultDecimals[chainType] || 18;
  const multiplier = BigInt(10 ** chainDecimals);
  const amountBigInt = BigInt(Math.floor(parseFloat(amount) * Number(multiplier)));

  return amountBigInt.toString();
}

/**
 * Logging Utilities
 */

/**
 * Bridge Logger - Structured logging pentru bridge operations
 */
export class BridgeLogger {
  constructor(component = 'BridgeHandler') {
    this.component = component;
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      component: this.component,
      level,
      message,
      ...data,
    };

    // Console logging (în production, poate fi înlocuit cu logger service)
    const logMethod = {
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    }[level] || console.log;

    logMethod(`[${timestamp}] [${this.component}] ${message}`, data);

    return logEntry;
  }

  info(message, data = {}) {
    return this.log('info', message, data);
  }

  warn(message, data = {}) {
    return this.log('warn', message, data);
  }

  error(message, data = {}) {
    return this.log('error', message, data);
  }

  debug(message, data = {}) {
    return this.log('debug', message, data);
  }
}

/**
 * Error Handling Utilities
 */

/**
 * Bridge Error - Custom error class pentru bridge operations
 */
export class BridgeError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'BridgeError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Error Codes
 */
export const BridgeErrorCode = {
  INVALID_CHAIN: 'INVALID_CHAIN',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  BRIDGE_TIMEOUT: 'BRIDGE_TIMEOUT',
  BRIDGE_FAILED: 'BRIDGE_FAILED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  BRIDGE_CONTRACT_ERROR: 'BRIDGE_CONTRACT_ERROR',
  OTA_NOT_AUTHORIZED: 'OTA_NOT_AUTHORIZED',
};

/**
 * Event Parsing Utilities
 */

/**
 * Parse Bridge Event
 * 
 * Parsează un event de bridge într-un format standardizat
 */
export function parseBridgeEvent(event, chainType) {
  const baseEvent = {
    type: BridgeEventType.BRIDGE_INITIATED,
    chain: chainType,
    timestamp: Date.now(),
    ...event,
  };

  // Chain-specific parsing
  switch (chainType) {
    case 'sei':
      return parseSeiBridgeEvent(baseEvent);
    case 'evm':
      return parseEvmBridgeEvent(baseEvent);
    case 'solana':
      return parseSolanaBridgeEvent(baseEvent);
    default:
      return baseEvent;
  }
}

function parseSeiBridgeEvent(event) {
  // Parse CosmWasm event
  return {
    ...event,
    transactionHash: event.txhash,
    blockHeight: event.height,
  };
}

function parseEvmBridgeEvent(event) {
  // Parse EVM event
  return {
    ...event,
    transactionHash: event.transactionHash || event.hash,
    blockNumber: event.blockNumber,
    logIndex: event.logIndex,
  };
}

function parseSolanaBridgeEvent(event) {
  // Parse Solana event
  return {
    ...event,
    signature: event.signature,
    slot: event.slot,
  };
}

/**
 * Transaction Status Utilities
 */

/**
 * Check Transaction Status
 * 
 * Verifică statusul unei tranzacții pe un chain specificat
 */
export async function checkTransactionStatus(txHash, chainConfig) {
  try {
    switch (chainConfig.chainType) {
      case 'sei':
        // SEI transaction check (Cosmos SDK)
        return await checkSeiTransactionStatus(txHash, chainConfig);
      case 'evm':
        // EVM transaction check
        return await checkEvmTransactionStatus(txHash, chainConfig);
      case 'solana':
        // Solana transaction check
        return await checkSolanaTransactionStatus(txHash, chainConfig);
      default:
        throw new BridgeError(
          `Unsupported chain type: ${chainConfig.chainType}`,
          BridgeErrorCode.INVALID_CHAIN
        );
    }
  } catch (error) {
    throw new BridgeError(
      `Failed to check transaction status: ${error.message}`,
      BridgeErrorCode.BRIDGE_FAILED,
      { originalError: error }
    );
  }
}

async function checkSeiTransactionStatus(txHash, chainConfig) {
  // TODO: Implement SEI transaction status check
  // Folosește REST endpoint: `${chainConfig.restEndpoint}/cosmos/tx/v1beta1/txs/${txHash}`
  return { status: 'pending', confirmed: false };
}

async function checkEvmTransactionStatus(txHash, chainConfig) {
  // TODO: Implement EVM transaction status check
  // Folosește ethers.js provider
  return { status: 'pending', confirmed: false };
}

async function checkSolanaTransactionStatus(signature, chainConfig) {
  // TODO: Implement Solana transaction status check
  // Folosește Solana web3.js connection
  return { status: 'pending', confirmed: false };
}

/**
 * Validation Utilities
 */

/**
 * Validate Bridge Parameters
 * 
 * Validează parametrii pentru o operație de bridge
 */
export function validateBridgeParams(params) {
  const { fromChain, toChain, token, amount, user } = params;

  if (!fromChain || !toChain) {
    throw new BridgeError(
      'From chain and to chain are required',
      BridgeErrorCode.INVALID_CHAIN
    );
  }

  if (fromChain === toChain) {
    throw new BridgeError(
      'From chain and to chain cannot be the same',
      BridgeErrorCode.INVALID_CHAIN
    );
  }

  if (!token) {
    throw new BridgeError(
      'Token address is required',
      BridgeErrorCode.INVALID_AMOUNT
    );
  }

  if (!amount || parseFloat(amount) <= 0) {
    throw new BridgeError(
      'Amount must be greater than 0',
      BridgeErrorCode.INVALID_AMOUNT
    );
  }

  if (!user || !user.address) {
    throw new BridgeError(
      'User address is required',
      BridgeErrorCode.OTA_NOT_AUTHORIZED
    );
  }

  return true;
}

/**
 * Retry Utility
 */
export async function retryOperation(operation, maxRetries = 3, delay = 5000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
