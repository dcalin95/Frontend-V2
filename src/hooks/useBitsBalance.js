import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// BITS Token Contract Address on BSC Mainnet
const BITS_TOKEN_ADDRESS = '0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe';

// Minimal ERC20 ABI (balanceOf function)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const useBitsBalance = (walletAddress) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) {
        setBalance(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // BSC Mainnet RPC (ethers v5 compatible)
        const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
        
        // Create contract instance
        const contract = new ethers.Contract(BITS_TOKEN_ADDRESS, ERC20_ABI, provider);
        
        // Fetch balance and decimals
        const [balanceRaw, decimals] = await Promise.all([
          contract.balanceOf(walletAddress),
          contract.decimals()
        ]);

        // Convert from Wei to human-readable (ethers v5)
        const balanceFormatted = parseFloat(ethers.utils.formatUnits(balanceRaw, decimals));
        
        setBalance(balanceFormatted);
      } catch (err) {
        console.error('Error fetching BITS balance:', err);
        setError(err.message);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [walletAddress]);

  return { balance, loading, error };
};

export default useBitsBalance;

