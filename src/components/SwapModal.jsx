import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, parseUnits, formatUnits } from 'viem';
import { useWallet } from '../context/WalletContext';
import { TOKENS, getToken, getSwapPath } from '../utils/tokenList';
import useCellManagerData from '../Presale/hooks/useCellManagerData';
import logo from '../assets/logo.png';
import './SwapModal.css';
import './SwapModal.mobile.css'; // 📱 Mobile Optimizations

// 🎯 Import Presale Payment Handlers
import handleBNBPayment from '../Presale/TokenHandlers/handleBNBPayment';
import handleETHPayment from '../Presale/TokenHandlers/handleETHPayment';
import handleUSDTPayment from '../Presale/TokenHandlers/handleUSDTPayment';
import handleUSDCPayment from '../Presale/TokenHandlers/handleUSDCPayment';
import handleMATICPayment from '../Presale/TokenHandlers/handleMATICPayment';
import handleGenericPayment from '../Presale/TokenHandlers/handleGenericPayment'; // Fallback for LINK, BTC, etc.

// 🥞 PancakeSwap Router V2
const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

// Standard ERC20 ABI
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  }
];

// Router ABI
const ROUTER_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"},
      {"internalType": "address[]", "name": "path", "type": "address[]"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "swapExactETHForTokens",
    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"},
      {"internalType": "address[]", "name": "path", "type": "address[]"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"internalType": "address[]", "name": "path", "type": "address[]"}
    ],
    "name": "getAmountsOut",
    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"},
      {"internalType": "address[]", "name": "path", "type": "address[]"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "swapExactTokensForETH",
    "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const SwapModal = ({ isOpen, onClose }) => {
  const { address, isConnected } = useAccount();
  const { nativeBalance, bitsBalance } = useWallet(); // Get balances from UnifiedWalletContext
  const cellManagerData = useCellManagerData();
  // ✅ Așteaptă prețul REAL din blockchain (nu folosi fallback imediat)
  const liveBitsPrice = cellManagerData.currentPrice && cellManagerData.currentPrice > 0 
    ? cellManagerData.currentPrice 
    : null; // null = încă se încarcă
  
  const [fromToken, setFromToken] = useState('BNB');
  const [toToken, setToToken] = useState('BITS');
  const [fromAmount, setFromAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('0');
  const [slippage] = useState(0.5); // 0.5%
  const [isSwapping, setIsSwapping] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState(true);

  // UI State
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  // PRICE STATE
  const [tokenPrices, setTokenPrices] = useState({
    BNB: 0,
    BITS: null, // null = loading, va fi actualizat din blockchain
    USDT: 1,
    BUSD: 1,
    CAKE: 0,
    BTC: 0,
    SOL: 0,
    EUR: 1 // 1 EUR base
  });

  // 24H PRICE CHANGES & HISTORICAL DATA
  const [priceChanges24h, setPriceChanges24h] = useState({});
  const [historicalData, setHistoricalData] = useState({});
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);

  // GET TOKEN INFO (must be before useEffect hooks that use it)
  const tokenOptions = Object.keys(TOKENS);
  const fromTokenInfo = getToken(fromToken);
  const toTokenInfo = getToken(toToken);

  // UPDATE PRICES WHEN LIVE PRICE CHANGES
  useEffect(() => {
    if (liveBitsPrice !== null) {
      console.log("💰 [SwapModal] BITS Price loaded from CellManager:", liveBitsPrice);
      setTokenPrices(prev => ({
        ...prev,
        BITS: liveBitsPrice
      }));
      // Check if all critical prices are loaded
      setIsPriceLoading(false);
    }
  }, [liveBitsPrice]);

  // GAS ESTIMATION
  useEffect(() => {
    const estimateGas = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setGasEstimate(null);
        return;
      }

      try {
        // Estimate gas based on swap type
        const swapType = detectSwapType(fromToken, toToken);
        let gasUnits = 0;
        
        if (fromToken === 'EUR') {
          setGasEstimate(null); // No gas for Stripe
          return;
        }
        
        if (swapType === 'PRESALE') {
          // Presale contract gas (typically 200k-300k)
          gasUnits = fromTokenInfo?.isNative ? 200000 : 300000;
        } else {
          // DEX swap gas
          gasUnits = fromTokenInfo?.isNative ? 150000 : 250000;
        }

        // Estimate gas price (25 gwei average on BSC)
        const gasPrice = 5; // 5 gwei (BSC is cheap)
        const gasCostBNB = (gasUnits * gasPrice) / 1e9;
        const gasCostUSD = gasCostBNB * (tokenPrices.BNB || 0);

        setGasEstimate({
          units: gasUnits,
          priceGwei: gasPrice,
          costBNB: gasCostBNB,
          costUSD: gasCostUSD
        });
      } catch (error) {
        console.error("Gas estimation error:", error);
        setGasEstimate(null);
      }
    };

    estimateGas();
  }, [fromAmount, fromToken, toToken, tokenPrices.BNB, fromTokenInfo]);

  // SET DEFAULT AMOUNT IF EUR IS SELECTED
  useEffect(() => {
    if (fromToken === 'EUR' && (!fromAmount || fromAmount === '0')) {
      setFromAmount('10');
    }
  }, [fromToken]);

  // --- FETCH LIVE PRICES (Binance API) ---
  const fetchPrices = useCallback(async () => {
    try {
        // Fetch current prices + 24h statistics
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BNBUSDT","ETHUSDT","CAKEUSDT","BTCUSDT","SOLUSDT","MATICUSDT","LINKUSDT"]');
        const data = await response.json();
        
        const priceData = {};
        const changes = {};
        const historical = {};
        
        data.forEach(ticker => {
          const symbol = ticker.symbol.replace('USDT', ''); // BNB, ETH, etc.
          priceData[symbol] = parseFloat(ticker.lastPrice || 0);
          changes[symbol] = {
            change: parseFloat(ticker.priceChange || 0),
            changePercent: parseFloat(ticker.priceChangePercent || 0),
            high: parseFloat(ticker.highPrice || 0),
            low: parseFloat(ticker.lowPrice || 0),
            volume: parseFloat(ticker.volume || 0)
          };
          historical[symbol] = {
            high24h: parseFloat(ticker.highPrice || 0),
            low24h: parseFloat(ticker.lowPrice || 0),
            avg24h: (parseFloat(ticker.highPrice || 0) + parseFloat(ticker.lowPrice || 0)) / 2
          };
        });

        console.log("📊 [Binance API] Live Prices + 24h Changes:", priceData, changes);

        setTokenPrices(prev => ({
          ...prev,
          ...priceData,
          USDT: 1, // Stablecoin
          USDC: 1, // Stablecoin
          BUSD: 1, // Stablecoin
        }));
        
        setPriceChanges24h(changes);
        setHistoricalData(historical);
        setLastPriceUpdate(Date.now());
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }, []);

  // Auto-fetch prices on mount and every 30s
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // 1. Get Balances from Context (DIRECT - no wagmi hooks needed)
  const fromBalance = fromToken === 'BNB' ? (nativeBalance || '0') : fromToken === 'BITS' ? (bitsBalance || '0') : '0';
  const toBalance = toToken === 'BNB' ? (nativeBalance || '0') : toToken === 'BITS' ? (bitsBalance || '0') : '0';

  // 2. REAL PRICE QUOTE (On-Chain)
  const { data: quoteData } = useReadContract({
    address: PANCAKESWAP_ROUTER,
    abi: ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [
      fromAmount && parseFloat(fromAmount) > 0 && fromToken !== 'EUR' && toToken !== 'BITS'
        ? parseUnits(fromAmount, fromTokenInfo?.decimals || 18) 
        : parseUnits('0', 18),
      getSwapPath(fromToken, toToken)
    ],
    query: { 
      enabled: parseFloat(fromAmount) > 0 && !!fromTokenInfo && !!toTokenInfo && fromToken !== 'EUR' && toToken !== 'BITS',
      refetchInterval: 5000
    }
  });

  // Update Estimated Output
  useEffect(() => {
    // CASE 1: STRIPE / EUR -> BITS
    if (fromToken === 'EUR' && toToken === 'BITS') {
      if (fromAmount && parseFloat(fromAmount) > 0 && tokenPrices.BITS) {
        // Use tokenPrices.BITS which is already normalized
        const bitsAmount = parseFloat(fromAmount) / tokenPrices.BITS;
        setEstimatedOutput(bitsAmount.toFixed(1));
      } else {
        setEstimatedOutput('0');
      }
      return;
    }

    // CASE 2: CRYPTO -> BITS (PRESALE HYBRID)
    if (toToken === 'BITS') {
      if (fromAmount && parseFloat(fromAmount) > 0 && tokenPrices[fromToken] && tokenPrices.BITS) {
        const fromValUSD = parseFloat(fromAmount) * tokenPrices[fromToken];
        // Use tokenPrices.BITS which is already normalized (not liveBitsPrice which might be raw Wei)
        const bitsAmount = fromValUSD / tokenPrices.BITS;
        setEstimatedOutput(bitsAmount.toFixed(1));
      } else {
        setEstimatedOutput('0');
      }
      return;
    }

    // CASE 3: STANDARD DEX SWAP
    if (quoteData && quoteData[1]) {
      const formatted = formatUnits(quoteData[1], toTokenInfo.decimals);
      setEstimatedOutput(formatted);
    } else {
      // Fallback Logic
      if (fromAmount && parseFloat(fromAmount) > 0) {
        const fromPrice = tokenPrices[fromToken] || 0;
        const toPrice = tokenPrices[toToken] || 1;
        if (fromPrice > 0 && toPrice > 0) {
          const estimated = (parseFloat(fromAmount) * fromPrice) / toPrice;
          setEstimatedOutput(estimated.toFixed(6));
        } else {
          setEstimatedOutput('0');
        }
      } else {
        setEstimatedOutput('0');
      }
    }
  }, [quoteData, toTokenInfo, fromAmount, tokenPrices, fromToken, toToken, liveBitsPrice]);

  // 3. Check Allowance
  const { data: allowance } = useReadContract({
    address: fromTokenInfo?.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, PANCAKESWAP_ROUTER],
    query: { enabled: !fromTokenInfo?.isNative && fromToken !== 'EUR' && isConnected, refetchInterval: 5000 }
  });

  // 4. Contract Writer
  const { writeContract, data: hash, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Drag Logic
  useEffect(() => { if (isOpen) setPosition({ x: 0, y: 0 }); }, [isOpen]);
  
  const handleMouseDown = (e) => {
    // 🚫 DISABLE dragging on mobile (≤768px)
    if (window.innerWidth <= 768) return;
    if (e.target.closest('.modal-close-btn') || e.target.closest('.token-selector') || e.target.closest('input')) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    const handleMouseMove = (e) => { if (isDragging) setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }); };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Success Handler
  useEffect(() => {
    if (isConfirmed) {
      if (isApproving) {
        setIsApproving(false);
        alert("✅ Approve Successful! Now you can Swap.");
      } else {
        setIsSwapping(false);
        setFromAmount('');
        alert("✅ Swap Successful!");
      }
    }
  }, [isConfirmed]);

  // Actions
  const handleApprove = async () => {
    if (!isConnected) return;
    setIsApproving(true);
    try {
      await writeContract({
        address: fromTokenInfo.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [PANCAKESWAP_ROUTER, parseUnits('9999999999', fromTokenInfo.decimals)],
      });
    } catch (err) {
      console.error(err);
      setIsApproving(false);
    }
  };

  const handleSwap = async () => {
    // 1. STRIPE HANDLER (VISA / MASTERCARD)
    if (fromToken === 'EUR') {
      const quantity = Math.floor(parseFloat(fromAmount) / 10);
      if (quantity < 1) {
        alert("Minimum amount is €10.");
        return;
      }
      
      // URL from your screenshot
      const baseUrl = "https://buy.stripe.com/afa5Kfc3S40G18daAZ"; 
      
      // Pre-fill email if user is logged in (optional, needs user context)
      // Construct URL with quantity (Requires 'Adjustable Quantity' enabled in Stripe Dashboard)
      // locale=en is from your screenshot
      const stripeUrl = `${baseUrl}?locale=en&quantity=${quantity}`;
      
      console.log(`Redirecting to Stripe: ${stripeUrl} (Qty: ${quantity})`);
      
      // Open in new tab
      window.open(stripeUrl, '_blank');
      return;
    }

    if (!isConnected || !fromAmount) return;
    setIsSwapping(true);

    try {
      // 2. PRESALE DIRECT BUY (Hybrid) - User thinks it's PancakeSwap, but it's really CellManager!
      const swapType = detectSwapType(fromToken, toToken);
      
      if (swapType === 'PRESALE') {
        console.log(`🎯 [PRESALE MODE] ${fromToken} → BITS via CellManager.sol`);
        
        // ⚠️ Validate BITS price is loaded
        if (!liveBitsPrice || liveBitsPrice <= 0) {
          alert("⏳ Please wait for BITS price to load from blockchain...");
          setIsSwapping(false);
          return;
        }
        
        // Calculate parameters for presale handler
        const amount = parseFloat(fromAmount);
        const bitsToReceive = parseFloat(estimatedOutput);
        const usdInvested = amount * (tokenPrices[fromToken] || 0);
        
        const presaleParams = {
          amount,
          bitsToReceive,
          walletAddress: address,
          selectedChain: 'BSC',
          usdInvested,
          bonusAmount: 0,
          bonusPercentage: 0,
          fallbackBitsPrice: liveBitsPrice, // ✅ LIVE from CellManager - NO hardcoded fallback!
          referralCode: '' // Can be added from user context later
        };

        // Select correct handler based on token
        let handler;
        switch(fromToken) {
          case 'BNB': handler = handleBNBPayment; break;
          case 'ETH': handler = handleETHPayment; break;
          case 'USDT': handler = handleUSDTPayment; break;
          case 'USDC': handler = handleUSDCPayment; break;
          case 'MATIC': handler = handleMATICPayment; break;
          case 'BTC': handler = handleGenericPayment; break; // BTCB
          case 'LINK': handler = handleGenericPayment; break;
          default: 
            throw new Error(`No presale handler for ${fromToken}`);
        }

        console.log(`Calling ${fromToken} presale handler...`, presaleParams);
        await handler(presaleParams);
        
        alert(`✅ Successfully purchased ${bitsToReceive.toFixed(1)} BITS!`);
        setIsSwapping(false);
        setFromAmount('');
        setEstimatedOutput('0');
        return;
      }

      // 3. STANDARD DEX SWAP
      const amountIn = parseUnits(fromAmount, fromTokenInfo.decimals);
      const minOut = parseUnits((parseFloat(estimatedOutput) * 0.99).toFixed(toTokenInfo.decimals), toTokenInfo.decimals); 
      const path = getSwapPath(fromToken, toToken);
      const deadline = Math.floor(Date.now() / 1000) + 1200;

      if (fromTokenInfo.isNative) {
        await writeContract({
          address: PANCAKESWAP_ROUTER,
          abi: ROUTER_ABI,
          functionName: 'swapExactETHForTokens',
          args: [minOut, path, address, deadline],
          value: amountIn
        });
      } else if (toTokenInfo.isNative) {
        await writeContract({
          address: PANCAKESWAP_ROUTER,
          abi: ROUTER_ABI,
          functionName: 'swapExactTokensForETH',
          args: [amountIn, minOut, path, address, deadline]
        });
      } else {
        await writeContract({
          address: PANCAKESWAP_ROUTER,
          abi: ROUTER_ABI,
          functionName: 'swapExactTokensForTokens',
          args: [amountIn, minOut, path, address, deadline]
        });
      }
    } catch (err) {
      console.error("Swap failed", err);
      setIsSwapping(false);
    }
  };

  const needsApproval = !fromTokenInfo?.isNative && fromToken !== 'EUR' && (!allowance || allowance < parseUnits(fromAmount || '0', fromTokenInfo?.decimals || 18));
  
  const renderButtonContent = () => {
    if (fromToken === 'EUR') {
      return (
        <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
          Pay €{fromAmount || '0'} 💳
        </span>
      );
    }
    if (!isConnected) return "Connect Wallet";
    if (!fromAmount || parseFloat(fromAmount) === 0) return "Enter Amount";
    if (isSwapping || isApproving) return "Processing...";
    if (needsApproval) return `Approve ${fromToken}`;
    
    // ✅ INFORMAȚII COMPLETE: Arată ce primești exact!
    if (toToken === 'BITS' && estimatedOutput && parseFloat(estimatedOutput) > 0) {
      const formattedBits = parseFloat(estimatedOutput).toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
      return `Buy ${formattedBits} BITS 🚀`;
    }
    
    return `Swap ${fromToken} → ${toToken}`;
  };

  const handleSwapDirection = () => {
    if (fromToken === 'EUR') return; // Can't swap back to Card
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
    setEstimatedOutput('0');
  };

  // Helper to format price
  const formatPrice = (symbol) => {
    if (symbol === 'EUR') return 'Fiat Currency';
    const price = tokenPrices[symbol];
    if (price === null || price === undefined || price === 0) {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
          <i className="fa-solid fa-brain fa-beat-fade" style={{ color: '#00FFA3', fontSize: '10px' }}></i>
          Loading...
        </span>
      );
    }
    if (price < 1) return `≈ $${price.toFixed(5)}`;
    return `≈ $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Binance-style balance formatter
  const formatBalance = (balance, symbol) => {
    const num = parseFloat(balance || 0);
    if (num === 0) return '0';
    if (num < 0.00001) return num.toFixed(8);
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate USD value for balance
  const getBalanceUSD = (balance, symbol) => {
    const num = parseFloat(balance || 0);
    const price = tokenPrices[symbol] || 0;
    const usd = num * price;
    if (usd === 0) return '';
    if (usd < 0.01) return `≈ $${usd.toFixed(4)}`;
    return `≈ $${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 🎯 Detect swap type: PRESALE or DEX
  const detectSwapType = (from, to) => {
    // If buying BITS with a presale-supported token → PRESALE
    if (to === 'BITS' && fromTokenInfo?.isPresale) return 'PRESALE';
    // All other swaps → DEX (PancakeSwap)
    return 'DEX';
  };

  // 📊 Calculate Price Impact
  const calculatePriceImpact = () => {
    const amount = parseFloat(fromAmount || 0);
    if (!amount || !tokenPrices[fromToken] || !tokenPrices[toToken]) return 0;
    
    // For presale: no price impact (fixed price)
    if (detectSwapType(fromToken, toToken) === 'PRESALE') return 0;
    
    // For DEX: simplified impact calculation (would need pool reserves for exact calculation)
    // Estimate: larger trades = higher impact
    const usdValue = amount * tokenPrices[fromToken];
    if (usdValue < 100) return 0.01; // < $100: minimal impact
    if (usdValue < 1000) return 0.1; // $100-1k: small impact
    if (usdValue < 10000) return 0.5; // $1k-10k: medium impact
    return 1.5; // > $10k: higher impact
  };

  // 🛡️ Calculate Minimum Received (with slippage)
  const calculateMinReceived = () => {
    const output = parseFloat(estimatedOutput || 0);
    return output * (1 - slippage / 100);
  };

  // 📈 Format Price Change
  const formatPriceChange = (symbol) => {
    const change = priceChanges24h[symbol];
    if (!change) return null;
    
    const isPositive = change.changePercent >= 0;
    const color = isPositive ? '#00FFA3' : '#FF4757';
    const arrow = isPositive ? '▲' : '▼';
    
    return {
      text: `${arrow} ${Math.abs(change.changePercent).toFixed(2)}%`,
      color,
      isPositive
    };
  };

  // ⏱️ Time since last update
  const getTimeSinceUpdate = () => {
    if (!lastPriceUpdate) return 'Never';
    const seconds = Math.floor((Date.now() - lastPriceUpdate) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  // 🛣️ Get Swap Route
  const getSwapRoute = () => {
    if (fromToken === 'EUR') return 'EUR → BITS (Stripe)';
    if (detectSwapType(fromToken, toToken) === 'PRESALE') {
      return `${fromToken} → BITS (Direct Presale)`;
    }
    // DEX route
    const path = getSwapPath(fromToken, toToken);
    if (path.length === 2) return `${fromToken} → ${toToken} (Direct)`;
    return `${fromToken} → WBNB → ${toToken}`;
  };

  if (!isOpen) return null;

  // 📱 Disable dragging styles on mobile
  const isMobileView = window.innerWidth <= 768;
  const modalStyle = isMobileView 
    ? {} // No transform on mobile - CSS handles positioning
    : { transform: `translate(${position.x}px, ${position.y}px)`, transition: isDragging ? 'none' : 'transform 0.1s ease' };

  return (
    <div className="swap-modal-overlay" onClick={onClose}>
      <div 
        className="swap-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
        ref={modalRef}
      >
        {/* Loading Overlay */}
        {isPriceLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(2, 4, 6, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            zIndex: 1000,
            borderRadius: '16px'
          }}>
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-brain fa-beat-fade" style={{ 
                color: '#00FFA3', 
                fontSize: '48px',
                filter: 'drop-shadow(0 0 20px rgba(0, 255, 163, 0.8))'
              }}></i>
              <i className="fa-solid fa-sparkles" style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                color: '#00D9FF',
                fontSize: '20px',
                animation: 'twinkle 1s ease-in-out infinite'
              }}></i>
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#00FFA3',
              textShadow: '0 0 10px rgba(0, 255, 163, 0.5)',
              fontFamily: '"Space Grotesk", sans-serif'
            }}>
              AI Loading Live Prices...
            </div>
            <div style={{
              fontSize: '12px',
              color: '#8B9DAF',
              fontFamily: '"Roboto Mono", monospace'
            }}>
              Fetching data from blockchain
            </div>
          </div>
        )}

        {/* Header */}
        <div className="swap-modal-header" onMouseDown={handleMouseDown} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
          <div className="swap-modal-branding">
            <img src={logo} alt="BITS" className="swap-modal-logo" />
            <div className="swap-modal-title-group">
              <h2>Swap Tokens</h2>
              <p className="swap-modal-subtitle">
                {fromToken === 'EUR' ? 'Secure Payment (Visa/Mastercard)' : 'Powered by PancakeSwap V2'}
              </p>
            </div>
          </div>
          <button className="swap-modal-close" onClick={onClose}>✖</button>
        </div>

        {/* Body */}
        <div className="swap-modal-body">
          <div className="swap-marketing-banner">
            {fromToken !== 'EUR' && (
              fromTokenInfo?.logo2 ? (
                <div className="double-logo-marketing">
                  <img src={fromTokenInfo.logo} alt="L1" className="swap-marketing-logo" />
                  <img src={fromTokenInfo.logo2} alt="L2" className="swap-marketing-logo" style={{marginLeft: '-8px'}} />
                </div>
              ) : (
                <img src={fromTokenInfo?.logo} alt="Logo" className="swap-marketing-logo" />
              )
            )}
            <p className="swap-marketing-text" style={fromToken === 'EUR' ? {width: '100%', justifyContent: 'center'} : {}}>
              {fromToken === 'EUR' 
                ? (
                  <span style={{display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap'}}>
                    <span className="highlight">Buy BITS instantly</span> with 
                    <div className="brand-logo-container">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Former_Visa_%28company%29_logo.svg/1024px-Former_Visa_%28company%29_logo.svg.png" alt="Visa" className="inline-brand-logo" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/1024px-MasterCard_Logo.svg.png" alt="Mastercard" className="inline-brand-logo" />
                    </div>
                  </span>
                )
                : <>Trade <span className="highlight">{fromToken} for {toToken}</span> on BSC!</>
              }
            </p>
          </div>

          {/* FROM */}
          <div className="swap-input-group">
            <div className="swap-input-top-row">
              <span className="swap-input-label">{fromToken === 'EUR' ? 'PAY AMOUNT (EUR)' : 'FROM'}</span>
              <span className="swap-input-balance">
                {fromToken === 'EUR' ? 'Daily Limit: €2000' : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#8B9DAF', fontSize: '14px', fontWeight: '500' }}>
                      {formatBalance(fromBalance, fromToken)} {fromToken}
                    </span>
                    {getBalanceUSD(fromBalance, fromToken) && (
                      <span style={{ color: '#5A6B7D', fontSize: '13px' }}>
                        {getBalanceUSD(fromBalance, fromToken)}
                      </span>
                    )}
                    {isConnected && fromToken !== 'EUR' && (
                      <button 
                        className="max-btn" 
                        onClick={() => setFromAmount(fromBalance)}
                        style={{
                          padding: '2px 8px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: '#00FFA3',
                          background: 'rgba(0, 255, 163, 0.1)',
                          border: '1px solid rgba(0, 255, 163, 0.3)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(0, 255, 163, 0.2)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(0, 255, 163, 0.1)'}
                      >
                        MAX
                      </button>
                    )}
                  </span>
                )}
              </span>
            </div>
            <div className="swap-input-wrapper">
              <input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                step={fromToken === 'EUR' ? "10" : "any"} // Step 10 for EUR
              />
              
              {/* Token Selector Block */}
              <div className="token-selector-block">
                <div className="token-unit-price">{formatPrice(fromToken)}</div>
                <div className="token-selector-container">
                  <div className="token-selector" onClick={() => { setIsFromDropdownOpen(!isFromDropdownOpen); setIsToDropdownOpen(false); }}>
                    {fromTokenInfo.logo2 ? (
                      <div className="double-logo-selector">
                        <img src={fromTokenInfo.logo2} className="selector-brand-logo" alt="Visa" />
                        <img src={fromTokenInfo.logo} className="selector-brand-logo" alt="Mastercard" />
                      </div>
                    ) : (
                      <img src={fromTokenInfo.logo} className="token-logo" alt="" />
                    )}
                    <span className="token-symbol">{fromToken}</span>
                    <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                  </div>
                  {isFromDropdownOpen && (
                    <div className="token-dropdown-menu">
                      {tokenOptions.map(t => {
                        const tokenData = getToken(t);
                        return (
                          <div key={t} className="token-dropdown-item" onClick={() => { setFromToken(t); setFromAmount(''); setEstimatedOutput('0'); setIsFromDropdownOpen(false); }}>
                            {tokenData.logo2 ? (
                              <div className="double-logo-dropdown">
                                <img src={tokenData.logo2} className="selector-brand-logo" style={{height: '14px'}} alt="Visa" />
                                <img src={tokenData.logo} className="selector-brand-logo" style={{height: '14px'}} alt="Mastercard" />
                              </div>
                            ) : (
                              <img src={tokenData.logo} className="dropdown-token-logo" alt="" />
                            )}
                            <span>{t}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="swap-direction">
            <div className="swap-direction-btn" onClick={handleSwapDirection}>
              <i className="fa-solid fa-arrow-down"></i>
            </div>
          </div>

          {/* TO */}
          <div className="swap-input-group">
            <div className="swap-input-top-row">
              <span className="swap-input-label">TO (ESTIMATED)</span>
              <span className="swap-input-balance">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#8B9DAF', fontSize: '14px', fontWeight: '500' }}>
                    {formatBalance(toBalance, toToken)} {toToken}
                  </span>
                  {getBalanceUSD(toBalance, toToken) && (
                    <span style={{ color: '#5A6B7D', fontSize: '13px' }}>
                      {getBalanceUSD(toBalance, toToken)}
                    </span>
                  )}
                </span>
              </span>
            </div>
            <div className="swap-input-wrapper">
              <input type="text" value={formatBalance(estimatedOutput, toToken)} readOnly />
              
              {/* Token Selector Block */}
              <div className="token-selector-block">
                <div className="token-unit-price">{formatPrice(toToken)}</div>
                <div className="token-selector-container">
                  <div className="token-selector" onClick={() => { setIsToDropdownOpen(!isToDropdownOpen); setIsFromDropdownOpen(false); }}>
                    <img src={toTokenInfo.logo} className="token-logo" alt="" />
                    <span className="token-symbol">{toToken}</span>
                    <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                  </div>
                  {isToDropdownOpen && (
                    <div className="token-dropdown-menu">
                      {tokenOptions.map(t => {
                        const tokenData = getToken(t);
                        return (
                          <div key={t} className="token-dropdown-item" onClick={() => { setToToken(t); setEstimatedOutput('0'); setIsToDropdownOpen(false); }}>
                            {tokenData.logo2 ? (
                              <div className="double-logo-dropdown">
                                <img src={tokenData.logo2} className="selector-brand-logo" style={{height: '14px'}} alt="Visa" />
                                <img src={tokenData.logo} className="selector-brand-logo" style={{height: '14px'}} alt="Mastercard" />
                              </div>
                            ) : (
                              <img src={tokenData.logo} className="dropdown-token-logo" alt="" />
                            )}
                            <span>{t}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="swap-info">
            {/* Price with 24h Change */}
            <div className="swap-info-row">
              <span>Price</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isPriceLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-brain fa-beat-fade" style={{ color: '#00FFA3', fontSize: '10px' }}></i>
                    Loading...
                  </span>
                ) : parseFloat(fromAmount) <= 0 && fromToken !== 'EUR' ? (
                  <span style={{ color: '#5A6B7D', fontSize: '12px', fontStyle: 'italic' }}>
                    Enter amount to see price
                  </span>
                ) : (
                  <>
                    <span>
                      {fromToken === 'EUR' 
                        ? (tokenPrices.BITS ? `1 Pack (10 EUR) = ${(10 / tokenPrices.BITS).toFixed(1)} BITS` : 'N/A') 
                        : parseFloat(fromAmount) > 0 && parseFloat(estimatedOutput) > 0
                          ? `1 ${fromToken} ≈ ${(parseFloat(estimatedOutput)/parseFloat(fromAmount)).toFixed(1)} ${toToken}`
                          : toToken === 'BITS' && liveBitsPrice
                            ? `1 ${fromToken} ≈ ${(tokenPrices[fromToken] / liveBitsPrice).toFixed(1)} ${toToken}`
                            : `1 ${fromToken} ≈ ${(tokenPrices[toToken] ? (tokenPrices[fromToken] / tokenPrices[toToken]).toFixed(1) : '—')} ${toToken}`
                      }
                    </span>
                    {fromToken !== 'EUR' && formatPriceChange(fromToken) && (
                      <span style={{ color: formatPriceChange(fromToken).color, fontSize: '11px', fontWeight: '600' }}>
                        {formatPriceChange(fromToken).text}
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>

            {/* Price Impact */}
            {fromToken !== 'EUR' && parseFloat(fromAmount) > 0 && (
              <div className="swap-info-row">
                <span>🎯 Price Impact</span>
                <span style={{ 
                  color: calculatePriceImpact() > 1 ? '#FF4757' : calculatePriceImpact() > 0.5 ? '#FFA502' : '#00FFA3',
                  fontWeight: '600'
                }}>
                  ~{calculatePriceImpact().toFixed(2)}%
                  {calculatePriceImpact() < 0.1 && ' ✅'}
                  {calculatePriceImpact() > 1 && ' ⚠️'}
                </span>
              </div>
            )}

            {/* Minimum Received */}
            {parseFloat(estimatedOutput) > 0 && (
              <div className="swap-info-row">
                <span>📊 Minimum Received</span>
                <span style={{ color: '#00FFA3', fontWeight: '600' }}>
                  {calculateMinReceived().toFixed(1)} {toToken}
                </span>
              </div>
            )}

            {/* Route */}
            <div className="swap-info-row">
              <span>🛣️ Route</span>
              <span style={{ fontSize: '11px', color: '#8B9DAF' }}>
                {getSwapRoute()}
              </span>
            </div>

            {/* Network Fee / Stripe Fee */}
            {fromToken === 'EUR' ? (
              <div className="swap-info-row">
                <span>💰 Payment Fee</span>
                <span style={{ color: '#00FFA3', fontSize: '12px' }}>
                  Included in price ✅
                </span>
              </div>
            ) : gasEstimate && (
              <div className="swap-info-row">
                <span>💰 Network Fee</span>
                <span>
                  ~${gasEstimate.costUSD.toFixed(2)}
                  <span style={{ fontSize: '10px', color: '#5A6B7D', marginLeft: '4px' }}>
                    ({gasEstimate.units.toLocaleString()} gas)
                  </span>
                </span>
              </div>
            )}

            {/* 24h High/Low */}
            {fromToken !== 'EUR' && historicalData[fromToken] && (
              <div className="swap-info-row">
                <span>📈 24h Range</span>
                <span style={{ fontSize: '11px', color: '#8B9DAF' }}>
                  ${historicalData[fromToken].low24h.toFixed(2)} - ${historicalData[fromToken].high24h.toFixed(2)}
                </span>
              </div>
            )}

            {/* Slippage */}
            <div className="swap-info-row">
              <span>{fromToken === 'EUR' ? 'Quantity' : 'Slippage'}</span>
              <span>
                {fromToken === 'EUR' 
                  ? `${Math.floor(parseFloat(fromAmount || 0) / 10)} Packs` 
                  : '0.5%'
                }
              </span>
            </div>

            {/* Last Update */}
            <div className="swap-info-row" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
              <span>⏱️ Updated</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px' }}>{getTimeSinceUpdate()}</span>
                <button 
                  onClick={() => { fetchPrices(); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#00FFA3',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '0'
                  }}
                  title="Refresh prices"
                >
                  🔄
                </button>
              </span>
            </div>
          </div>

          {/* Action */}
          <button 
            className="swap-btn" 
            onClick={() => needsApproval ? handleApprove() : handleSwap()}
            disabled={isPriceLoading || isSwapping || isApproving || !fromAmount || parseFloat(fromAmount) <= 0}
          >
            {isPriceLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <i className="fa-solid fa-brain fa-beat-fade" style={{ color: '#00FFA3' }}></i>
                AI Loading...
              </span>
            ) : renderButtonContent()}
          </button>

          <div className="powered-by">
            {fromToken === 'EUR' ? 'Secured by Stripe Payments' : 'Secured by PancakeSwap V2'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapModal;
