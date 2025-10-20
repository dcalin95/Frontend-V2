import { useState, useEffect } from 'react';

export const useWalletGate = (requiredBits = 0) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      
      try {
        // Simulare verificare wallet cu delay realist
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock wallet data pentru testare
        const mockWallet = {
          connected: true,
          bitsBalance: Math.random() * 15000, // Random balance între 0-15000
          network: 'ETH'
        };
        
        setWalletInfo(mockWallet);
        setHasAccess(mockWallet.bitsBalance >= requiredBits);
      } catch (error) {
        console.error('Error checking wallet access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [requiredBits]);

  return { 
    hasAccess, 
    loading,
    walletInfo,
    requiredBits
  };
};