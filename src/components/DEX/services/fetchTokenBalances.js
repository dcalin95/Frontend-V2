import { ethers } from 'ethers';

/**
 * Fetches real token balances for all tokens in list
 * @param {ethers.providers.Provider} provider - Ethers provider (v5)
 * @param {string} walletAddress - User wallet address
 * @param {Array} tokens - Array of token objects with { id, symbol, address, decimals, isNative }
 * @returns {Promise<Object>} { [tokenId]: "formattedBalance" }
 */
export const fetchTokenBalances = async (provider, walletAddress, tokens) => {
  try {
    console.log('🔍 Fetching real token balances for:', walletAddress);

    const balances = {};

    // Standard ERC20 ABI (balanceOf only)
    const erc20Abi = ['function balanceOf(address account) view returns (uint256)'];

    // Fetch all balances in parallel
    const balancePromises = tokens.map(async (token) => {
      try {
        let balance;

        if (token.isNative) {
          // Native token (BNB) - use provider.getBalance (ethers v5)
          balance = await provider.getBalance(walletAddress);
        } else {
          // ERC20 token - call balanceOf
          const tokenContract = new ethers.Contract(token.address, erc20Abi, provider);
          balance = await tokenContract.balanceOf(walletAddress);
        }

        // Format balance with correct decimals (ethers v5)
        const formattedBalance = ethers.utils.formatUnits(balance, token.decimals);
        
        console.log(`✅ ${token.symbol}: ${formattedBalance}`);
        
        return {
          id: token.id,
          balance: parseFloat(formattedBalance).toFixed(4), // Format to 4 decimals
        };
      } catch (error) {
        console.error(`❌ Failed to fetch ${token.symbol} balance:`, error);
        return {
          id: token.id,
          balance: '0.0000',
        };
      }
    });

    // Wait for all balance fetches
    const results = await Promise.all(balancePromises);

    // Convert array to object: { [tokenId]: balance }
    results.forEach((result) => {
      balances[result.id] = result.balance;
    });

    console.log('📊 Final balances:', balances);
    return balances;
  } catch (error) {
    console.error('❌ fetchTokenBalances failed:', error);
    return {};
  }
};

