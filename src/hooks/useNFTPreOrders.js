import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getRobustProvider } from '../utils/rpcFallback';

// Temporary ABI - will be updated after contract deployment
const STAKING_PREORDER_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "stakeAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "lockPeriod", "type": "uint256"},
      {"internalType": "uint256", "name": "nftTokenId", "type": "uint256"},
      {"internalType": "uint256", "name": "nftPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "executionDate", "type": "uint256"},
      {"internalType": "address", "name": "nftSeller", "type": "address"}
    ],
    "name": "stakeAndPreOrderNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserNFTPreOrders",
    "outputs": [{"internalType": "NFTPreOrder[]", "name": "", "type": "tuple[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "preOrderId", "type": "uint256"}],
    "name": "executeNFTPreOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "preOrderId", "type": "uint256"}],
    "name": "canExecutePreOrder",
    "outputs": [
      {"internalType": "bool", "name": "", "type": "bool"},
      {"internalType": "string", "name": "", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getExecutablePreOrders",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const STAKING_PREORDER_ADDRESS = "0x0000000000000000000000000000000000000000"; // To be updated after deployment

/**
 * Custom hook for NFT Pre-Orders functionality
 */
export const useNFTPreOrders = (walletAddress) => {
  const [preOrders, setPreOrders] = useState([]);
  const [executableOrders, setExecutableOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get contract instance
  const getContract = async () => {
    try {
      const provider = await getRobustProvider();
      const signer = provider.getSigner();
      
      if (STAKING_PREORDER_ADDRESS === "0x0000000000000000000000000000000000000000") {
        throw new Error('Staking PreOrder contract not deployed yet');
      }
      
      return new ethers.Contract(STAKING_PREORDER_ADDRESS, STAKING_PREORDER_ABI, signer);
    } catch (error) {
      console.error('Failed to get contract:', error);
      throw error;
    }
  };

  // Load user's pre-orders
  const loadPreOrders = async () => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      console.log('📋 Loading NFT pre-orders for:', walletAddress);
      
      const contract = await getContract();
      const userPreOrders = await contract.getUserNFTPreOrders(walletAddress);
      
      // Format pre-orders data
      const formattedOrders = userPreOrders.map((order, index) => ({
        id: index,
        nftTokenId: order.nftTokenId.toString(),
        price: ethers.utils.formatUnits(order.price, 18),
        executionDate: new Date(order.executionDate.toNumber() * 1000),
        executed: order.executed,
        cancelled: order.cancelled,
        seller: order.seller,
        isExecutable: false // Will be checked separately
      }));
      
      setPreOrders(formattedOrders);
      console.log(`✅ Loaded ${formattedOrders.length} pre-orders`);
      
    } catch (error) {
      console.error('❌ Failed to load pre-orders:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load executable orders (global)
  const loadExecutableOrders = async () => {
    try {
      console.log('🔍 Checking executable pre-orders...');
      
      const contract = await getContract();
      const executableIds = await contract.getExecutablePreOrders();
      
      console.log(`⚡ Found ${executableIds.length} executable orders`);
      setExecutableOrders(executableIds.map(id => id.toString()));
      
    } catch (error) {
      console.error('❌ Failed to load executable orders:', error);
    }
  };

  // Create stake + NFT pre-order
  const stakeAndPreOrderNFT = async (
    stakeAmount,
    lockPeriod,
    nftTokenId,
    nftPrice,
    executionDate,
    nftSeller
  ) => {
    try {
      console.log('🔨 Creating stake + NFT pre-order...');
      console.log('📊 Stake Amount:', stakeAmount, 'BITS');
      console.log('🔒 Lock Period:', lockPeriod, 'seconds');
      console.log('🎨 NFT Token ID:', nftTokenId);
      console.log('💰 NFT Price:', nftPrice, 'BITS');
      console.log('📅 Execution Date:', new Date(executionDate * 1000));
      console.log('👤 Seller:', nftSeller);

      const contract = await getContract();
      
      // Convert amounts to wei
      const stakeAmountWei = ethers.utils.parseUnits(stakeAmount.toString(), 18);
      const nftPriceWei = ethers.utils.parseUnits(nftPrice.toString(), 18);
      
      // Execute transaction
      const tx = await contract.stakeAndPreOrderNFT(
        stakeAmountWei,
        lockPeriod,
        nftTokenId,
        nftPriceWei,
        executionDate,
        nftSeller
      );
      
      console.log('⏳ Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      console.log('✅ Stake + Pre-order created successfully!');
      console.log('📄 Transaction:', receipt.transactionHash);
      
      // Reload data
      await loadPreOrders();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
      
    } catch (error) {
      console.error('❌ Stake + Pre-order failed:', error);
      throw error;
    }
  };

  // Execute pre-order
  const executePreOrder = async (preOrderId) => {
    try {
      console.log(`⚡ Executing pre-order ${preOrderId}...`);
      
      const contract = await getContract();
      
      // Check if executable first
      const [canExecute, reason] = await contract.canExecutePreOrder(preOrderId);
      if (!canExecute) {
        throw new Error(`Cannot execute: ${reason}`);
      }
      
      // Execute
      const tx = await contract.executeNFTPreOrder(preOrderId);
      console.log('⏳ Execution transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Pre-order executed successfully!');
      
      // Reload data
      await loadPreOrders();
      await loadExecutableOrders();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
      
    } catch (error) {
      console.error('❌ Pre-order execution failed:', error);
      throw error;
    }
  };

  // Cancel pre-order
  const cancelPreOrder = async (preOrderId) => {
    try {
      console.log(`❌ Cancelling pre-order ${preOrderId}...`);
      
      const contract = await getContract();
      const tx = await contract.cancelNFTPreOrder(preOrderId);
      
      console.log('⏳ Cancellation transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      console.log('✅ Pre-order cancelled successfully!');
      
      // Reload data
      await loadPreOrders();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
      
    } catch (error) {
      console.error('❌ Pre-order cancellation failed:', error);
      throw error;
    }
  };

  // Load data when wallet changes
  useEffect(() => {
    if (walletAddress) {
      loadPreOrders();
      loadExecutableOrders();
    }
  }, [walletAddress]);

  // Periodic check for executable orders (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (walletAddress) {
        loadExecutableOrders();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [walletAddress]);

  return {
    preOrders,
    executableOrders,
    loading,
    error,
    stakeAndPreOrderNFT,
    executePreOrder,
    cancelPreOrder,
    loadPreOrders,
    loadExecutableOrders
  };
};

