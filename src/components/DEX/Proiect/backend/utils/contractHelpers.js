/**
 * 🔧 Contract Helpers
 * 
 * Utilitare pentru interacțiunea cu smart contracts
 * Helper functions pentru contract operations, validations, etc.
 */

const { ethers } = require("ethers");

/**
 * Validate Ethereum/BSC address
 * @param {string} address - Address to validate
 * @returns {boolean} - True if valid address
 */
function isValidAddress(address) {
  try {
    return ethers.utils.isAddress(address);
  } catch (error) {
    return false;
  }
}

/**
 * Validate and normalize address (checksum)
 * @param {string} address - Address to normalize
 * @returns {string} - Checksummed address
 * @throws {Error} - If address is invalid
 */
function normalizeAddress(address) {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  return ethers.utils.getAddress(address);
}

/**
 * Format token amount from wei/smallest unit
 * @param {string|BigNumber} amount - Amount in smallest unit
 * @param {number} decimals - Token decimals (default: 18)
 * @returns {string} - Formatted amount
 */
function formatTokenAmount(amount, decimals = 18) {
  try {
    return ethers.utils.formatUnits(amount, decimals);
  } catch (error) {
    throw new Error(`Failed to format token amount: ${error.message}`);
  }
}

/**
 * Parse token amount to wei/smallest unit
 * @param {string|number} amount - Amount as string or number
 * @param {number} decimals - Token decimals (default: 18)
 * @returns {BigNumber} - Parsed amount
 */
function parseTokenAmount(amount, decimals = 18) {
  try {
    return ethers.utils.parseUnits(amount.toString(), decimals);
  } catch (error) {
    throw new Error(`Failed to parse token amount: ${error.message}`);
  }
}

/**
 * Calculate slippage amount
 * @param {string|BigNumber} amount - Original amount
 * @param {number} slippageBps - Slippage in basis points (e.g., 50 = 0.5%)
 * @returns {BigNumber} - Minimum amount after slippage
 */
function calculateSlippageAmount(amount, slippageBps) {
  const slippageMultiplier = ethers.BigNumber.from(10000).sub(
    ethers.BigNumber.from(slippageBps)
  );
  return amount.mul(slippageMultiplier).div(10000);
}

/**
 * Calculate protocol fee
 * @param {string|BigNumber} amount - Original amount
 * @param {number} feeBps - Fee in basis points (e.g., 100 = 1%)
 * @returns {BigNumber} - Fee amount
 */
function calculateProtocolFee(amount, feeBps) {
  return amount.mul(ethers.BigNumber.from(feeBps)).div(10000);
}

/**
 * Get contract instance
 * @param {string} address - Contract address
 * @param {Array|string} abi - Contract ABI
 * @param {Provider|Signer} providerOrSigner - Provider or Signer
 * @returns {Contract} - Contract instance
 */
function getContract(address, abi, providerOrSigner) {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid contract address: ${address}`);
  }
  return new ethers.Contract(address, abi, providerOrSigner);
}

/**
 * Estimate gas for transaction
 * @param {Contract} contract - Contract instance
 * @param {string} method - Method name
 * @param {Array} params - Method parameters
 * @returns {Promise<BigNumber>} - Estimated gas
 */
async function estimateGas(contract, method, params = []) {
  try {
    const gasEstimate = await contract.estimateGas[method](...params);
    // Add 20% buffer
    return gasEstimate.mul(120).div(100);
  } catch (error) {
    throw new Error(`Gas estimation failed: ${error.message}`);
  }
}

/**
 * Wait for transaction confirmation
 * @param {TransactionResponse} tx - Transaction response
 * @param {number} confirmations - Number of confirmations (default: 1)
 * @returns {Promise<TransactionReceipt>} - Transaction receipt
 */
async function waitForConfirmation(tx, confirmations = 1) {
  try {
    return await tx.wait(confirmations);
  } catch (error) {
    throw new Error(`Transaction failed: ${error.message}`);
  }
}

/**
 * Encode function call data
 * @param {string} functionSignature - Function signature (e.g., "transfer(address,uint256)")
 * @param {Array} params - Function parameters
 * @returns {string} - Encoded data
 */
function encodeFunctionData(functionSignature, params) {
  const iface = new ethers.utils.Interface([`function ${functionSignature}`]);
  return iface.encodeFunctionData(functionSignature.split("(")[0], params);
}

/**
 * Decode function call data
 * @param {string} functionSignature - Function signature
 * @param {string} data - Encoded data
 * @returns {Array} - Decoded parameters
 */
function decodeFunctionData(functionSignature, data) {
  const iface = new ethers.utils.Interface([`function ${functionSignature}`]);
  return iface.decodeFunctionData(functionSignature.split("(")[0], data);
}

/**
 * Format error message from contract revert
 * @param {Error} error - Error object
 * @returns {string} - Formatted error message
 */
function formatContractError(error) {
  if (error.reason) {
    return error.reason;
  }
  if (error.data?.message) {
    return error.data.message;
  }
  if (error.message) {
    // Try to extract revert reason from error message
    const match = error.message.match(/reason="([^"]+)"/);
    if (match) {
      return match[1];
    }
    return error.message;
  }
  return "Unknown contract error";
}

/**
 * Check if transaction was successful
 * @param {TransactionReceipt} receipt - Transaction receipt
 * @returns {boolean} - True if successful
 */
function isTransactionSuccessful(receipt) {
  return receipt.status === 1;
}

/**
 * Get transaction link (BSCScan)
 * @param {string} txHash - Transaction hash
 * @param {string} network - Network name (bsc, bscTestnet)
 * @returns {string} - BSCScan URL
 */
function getTransactionLink(txHash, network = "bsc") {
  const baseUrl = network === "bsc" 
    ? "https://bscscan.com/tx/" 
    : "https://testnet.bscscan.com/tx/";
  return `${baseUrl}${txHash}`;
}

/**
 * Get contract link (BSCScan)
 * @param {string} address - Contract address
 * @param {string} network - Network name (bsc, bscTestnet)
 * @returns {string} - BSCScan URL
 */
function getContractLink(address, network = "bsc") {
  const baseUrl = network === "bsc" 
    ? "https://bscscan.com/address/" 
    : "https://testnet.bscscan.com/address/";
  return `${baseUrl}${address}`;
}

module.exports = {
  isValidAddress,
  normalizeAddress,
  formatTokenAmount,
  parseTokenAmount,
  calculateSlippageAmount,
  calculateProtocolFee,
  getContract,
  estimateGas,
  waitForConfirmation,
  encodeFunctionData,
  decodeFunctionData,
  formatContractError,
  isTransactionSuccessful,
  getTransactionLink,
  getContractLink
};

