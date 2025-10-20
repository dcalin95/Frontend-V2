/**
 * Checks if a wallet of a specific type is available in the browser.
 * @param {string} type - The type of wallet ("EVM", "Solana").
 * @returns {boolean} - True if the wallet is available, false otherwise.
 */
export const isWalletAvailable = (type) => {
  switch (type) {
    case "EVM":
      return typeof window.ethereum !== "undefined"; // MetaMask, Coinbase, etc.
    case "Solana":
      return typeof window.solana !== "undefined"; // Phantom, Solflare, etc.
    default:
      throw new Error(`Unsupported wallet type: ${type}`);
  }
};

/**
 * Formats a wallet address for display purposes (e.g., "0x123...789").
 * @param {string} address - The wallet address to format.
 * @param {number} [chars=6] - Number of characters to show at the start and end of the address.
 * @returns {string} - Formatted wallet address.
 */
export const formatWalletAddress = (address, chars = 6) => {
  if (!address || address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Opens the official download page for a wallet if it's not available.
 * @param {string} walletName - The name of the wallet (e.g., "MetaMask", "Phantom").
 * @param {string} downloadLink - The official download link for the wallet.
 */
export const openWalletDownloadLink = (walletName, downloadLink) => {
  const userConfirmed = window.confirm(
    `${walletName} is not installed. Would you like to visit the official installation page?`
  );
  if (userConfirmed) {
    window.open(downloadLink, "_blank");
  }
};

/**
 * Detects the type of wallet available in the browser.
 * @returns {string|null} - Returns "EVM" or "Solana" if a wallet is detected, or null if none.
 */
export const detectWalletType = () => {
  if (typeof window.ethereum !== "undefined") return "EVM";
  if (typeof window.solana !== "undefined") return "Solana";
  return null;
};

/**
 * Utility function to handle wallet errors gracefully.
 * @param {string} walletName - The name of the wallet.
 * @param {Function} action - The action to perform if the wallet is available.
 * @returns {Promise<any>} - The result of the action or an error message.
 */
export const handleWalletAction = async (walletName, action) => {
  try {
    return await action();
  } catch (error) {
    console.error(`Error with ${walletName}:`, error.message);
    throw new Error(`Failed to interact with ${walletName}.`);
  }
};

