/**
 * 📊 LimitOrderPanel Component - Limit Orders Panel
 * 
 * Component pentru limit orders cu funcționalitate reală:
 * - Buy/Sell tabs
 * - Price input
 * - Amount input
 * - Total calculation
 * - Active orders list (din API)
 * - Cancel order functionality (real on-chain)
 * 
 * @module LimitOrderPanel
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// Real API data only. No fake or unverified data.
import { getOrders as getOrdersApi, createOrder as createOrderApi, cancelOrder as cancelOrderApi, getPrice as getPriceApi } from '../../services/dexApiService';
import { X, TrendingUp, TrendingDown, Coins, ArrowDownUp, ChevronDown, RotateCcw, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import TokenLogo from '../common/TokenLogo';
import { Card, Button, Badge, Slider } from '../ui';
import Skeleton from '../common/Skeleton';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import tokenPriceService from '../../services/tokenPriceService';
import walletBalanceService from '../../services/walletBalanceService';
import { getAllTokenSymbols, DEFAULT_BSC_QUOTE_SYMBOL, isStablecoin } from '../../services/tokenRegistry';
import { useDexAuth } from '../../context/DexAuthContext';
import { errorWithPrefix, warnWithPrefix, logWithPrefix } from '../../utils/logger';
import Modal from '../common/Modal/Modal';
import ConfirmationModal from '../common/ConfirmationModal';
import '../../styles/components/limit-order-panel.css';
import '../../styles/components/percentage-buttons.css';

const LimitOrderPanel = React.memo(({ selectedPair = 'BINANCE:BTCUSDT', initialFromSignal = null, onOrderPlaced, onWatchingOrderChange }) => {
  const [orderType, setOrderType] = useState('limit'); // 'limit' or 'swap' - pentru tab-uri
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'sell' - pentru direcția comenzii
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const appliedFromSignalRef = useRef(null);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [riskSectionOpen, setRiskSectionOpen] = useState(false);
  const [showConfirmOrder, setShowConfirmOrder] = useState(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const openRisk = useCallback((e) => {
    if (e) e.preventDefault();
    setRiskSectionOpen(true);
  }, []);
  const closeRisk = useCallback(() => setRiskSectionOpen(false), []);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swapDataLoading, setSwapDataLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [error, setError] = useState(null);
  const [swapData, setSwapData] = useState(null);
  const [marketPrice, setMarketPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  /** -1 = niciun preset; 25|50|75|100 pentru evidențiere buton */
  const [sliderValue, setSliderValue] = useState(-1);
  const priceInputRef = useRef(null);
  const amountInputRef = useRef(null);
  const [isWatchingPrice, setIsWatchingPrice] = useState(false);
  const [watchError, setWatchError] = useState(null);
  const watchIntervalRef = useRef(null);

  // Wallet & OTA Context
  const { walletAddress: contextWalletAddress, user, isAuthenticated, login, wallet } = useDexAuth();
  // REAL DEX auth check - no API calls if not properly authenticated
  const isDexAuthenticated = isAuthenticated && user && user.walletAddress;
  // Use walletAddress from context (which uses effectiveWalletAddress: wallet.walletAddress if connected, or authState.walletAddress)
  // Fallback to user.walletAddress like Header does
  // ✅ FIX: Stabilize walletAddress with useMemo to prevent infinite re-renders
  const walletAddress = useMemo(() => {
    return contextWalletAddress || user?.walletAddress || (wallet?.isConnected ? wallet?.walletAddress : null);
  }, [contextWalletAddress, user?.walletAddress, wallet?.isConnected, wallet?.walletAddress]);

  /** Quote on-chain pentru limit/swap BSC (implicit USDC; REACT_APP_BSC_QUOTE_SYMBOL). Prețul din chart rămâne pereche Binance *USDT. */
  const quoteSym = DEFAULT_BSC_QUOTE_SYMBOL;

  // Extract token symbol from selectedPair (BINANCE:BNBUSDT -> BNB)
  const selectedTokenSymbol = useMemo(() => {
    if (!selectedPair) return 'BNB'; // Updated default to BNB
    // Remove BINANCE: prefix and USDT suffix
    return selectedPair.replace('BINANCE:', '').replace('USDT', '') || 'BNB';
  }, [selectedPair]);

  // Pre-fill from Signal (Execute Signal from Signals page): apply side, price, amount when token matches (re-apply if new signal)
  useEffect(() => {
    if (!initialFromSignal) return;
    const sigToken = String(initialFromSignal.token || '').trim().toUpperCase();
    if (sigToken !== selectedTokenSymbol) return;
    const key = `${sigToken}-${initialFromSignal.side}-${initialFromSignal.entryPrice}`;
    if (appliedFromSignalRef.current === key) return;
    appliedFromSignalRef.current = key;
    setActiveTab(initialFromSignal.side === 'sell' ? 'sell' : 'buy');
    if (initialFromSignal.entryPrice != null && !Number.isNaN(Number(initialFromSignal.entryPrice))) {
      setPrice(String(initialFromSignal.entryPrice));
    }
    if (initialFromSignal.amount != null && !Number.isNaN(Number(initialFromSignal.amount))) {
      setAmount(String(initialFromSignal.amount));
    }
  }, [initialFromSignal, selectedTokenSymbol]);

  useEffect(() => {
    if (!onWatchingOrderChange) return;
    if (!isWatchingPrice) {
      onWatchingOrderChange(null);
    }
  }, [isWatchingPrice, onWatchingOrderChange]);

  useEffect(() => {
    if (!onWatchingOrderChange || !isWatchingPrice) return;
    onWatchingOrderChange({
      side: activeTab,
      price: String(price),
      amount: String(amount),
      token: selectedTokenSymbol,
    });
  }, [isWatchingPrice, activeTab, price, amount, selectedTokenSymbol, onWatchingOrderChange]);

  // Load swapData with default structure (similar to SwapPanel)
  useEffect(() => {
    const loadSwapData = async () => {
      try {
        setSwapDataLoading(true);
        
        // Get all available tokens from centralized registry
        const availableTokenSymbols = getAllTokenSymbols();
        
        // Default balances (0 if wallet not connected) - include all tokens from registry
        let balances = {};
        availableTokenSymbols.forEach(symbol => {
          balances[symbol] = '0';
        });

        // If wallet is connected, fetch REAL balances from blockchain
        // Note: Balance can be loaded even if user is not authenticated (wallet connected via Header)
        if (walletAddress) {
          setBalancesLoading(true);
          try {
            // Include selectedTokenSymbol, quote stable (USDC implicit), BNB
            const tokensToFetch = [selectedTokenSymbol, quoteSym, 'BNB'].filter((token, index, arr) => arr.indexOf(token) === index);
            logWithPrefix('LimitOrderPanel', '🔄 Fetching balances for:', { tokensToFetch, walletAddress, selectedTokenSymbol });
            const realBalances = await walletBalanceService.getAllTokenBalances(walletAddress, tokensToFetch);
            logWithPrefix('LimitOrderPanel', '✅ Real balances received:', realBalances);
            // Merge real balances into default balances object
            Object.keys(realBalances).forEach(key => {
              balances[key] = realBalances[key];
            });
            // Ensure selectedTokenSymbol has balance
            if (realBalances[selectedTokenSymbol]) {
              balances[selectedTokenSymbol] = realBalances[selectedTokenSymbol];
            }
            logWithPrefix('LimitOrderPanel', '✅ Final balances object:', { balances, realBalances, selectedTokenSymbol, walletAddress, 'BNB balance': balances['BNB'] });
          } catch (error) {
            errorWithPrefix('LimitOrderPanel', '❌ Error loading real balances:', error);
            // Keep balances at 0 if error
          } finally {
            setBalancesLoading(false);
          }
        } else {
          logWithPrefix('LimitOrderPanel', '⚠️ Wallet not connected:', { walletAddress });
        }

        // Fetch REAL prices from blockchain/DEX (for selected token + quote stable)
        let prices = {};
        availableTokenSymbols.forEach(symbol => {
          prices[symbol] = isStablecoin(symbol) ? 1 : 0;
        });

        try {
          const tokensToFetch = [selectedTokenSymbol, quoteSym].filter((token, index, arr) => arr.indexOf(token) === index);
          const realPrices = await tokenPriceService.getAllTokenPrices(tokensToFetch);
          prices = { ...prices, ...realPrices };
          logWithPrefix('LimitOrderPanel', '✅ Prices loaded:', prices);
        } catch (error) {
          errorWithPrefix('LimitOrderPanel', '❌ Error loading real prices:', error);
        }

        let tokenPrice = prices[selectedTokenSymbol] || 0;
        const quotePrice = prices[quoteSym] || 1;
        
        // If token price is 0 but marketPrice is available, use marketPrice as fallback
        // Note: marketPrice might not be loaded yet, so we'll update it later in another useEffect
        if (tokenPrice === 0 && marketPrice > 0 && !isStablecoin(selectedTokenSymbol)) {
          tokenPrice = marketPrice;
          logWithPrefix('LimitOrderPanel', 'Using marketPrice as fallback for token price:', { selectedTokenSymbol, marketPrice, tokenPrice });
        }
        
        // Calculate rate
        const rate = tokenPrice > 0 && quotePrice > 0 ? tokenPrice / quotePrice : 0;

        // Create swap data - ALWAYS (UI always visible) with REAL prices
        const data = {
          fromToken: {
            symbol: selectedTokenSymbol,
            balance: parseFloat(balances[selectedTokenSymbol] || '0'),
            price: tokenPrice
          },
          toToken: {
            symbol: quoteSym,
            balance: parseFloat(balances[quoteSym] || '0'),
            price: quotePrice
          },
          rate: rate,
          fee: 0.1
        };

        setSwapData(data);
        logWithPrefix('LimitOrderPanel', '✅ swapData loaded:', {
          ...data,
          balances,
          selectedTokenSymbol,
          'BNB balance': balances['BNB'],
          'fromToken.balance': data.fromToken.balance,
          'toToken.balance': data.toToken.balance,
          walletAddress,
          isAuthenticated
        });
      } catch (err) {
        errorWithPrefix('LimitOrderPanel', 'Error loading swapData:', err);
        // Set default swapData even on error
        setSwapData({
          fromToken: { symbol: selectedTokenSymbol, balance: 0, price: 0 },
          toToken: { symbol: quoteSym, balance: 0, price: 1 },
          rate: 0,
          fee: 0.1
        });
      } finally {
        setSwapDataLoading(false);
      }
    };

    loadSwapData();
  }, [selectedTokenSymbol, walletAddress, isDexAuthenticated, quoteSym]);

  // Update balance when selectedTokenSymbol changes (like Header does for native balance)
  // This runs AFTER swapData is loaded to refresh balance for the selected token
  // Note: Balance can be loaded even if user is not authenticated (wallet connected via Header)
  // ✅ FIX: Use ref to track previous walletAddress and prevent infinite loops
  const prevWalletAddressRef = useRef(walletAddress);
  useEffect(() => {
    // Skip if walletAddress hasn't actually changed
    if (prevWalletAddressRef.current === walletAddress && prevWalletAddressRef.current !== null) {
      return;
    }
    prevWalletAddressRef.current = walletAddress;

    if (!walletAddress || !swapData || !selectedTokenSymbol) {
      return;
    }

    // Always update balance when selectedTokenSymbol matches fromToken (token selected from chart)
    // Also update quote stable balance (toToken)
    const updateBalances = async () => {
      try {
        setBalancesLoading(true);
        
        // Update balance for selected token (fromToken)
        const fromBalance = await walletBalanceService.getBalanceForToken(walletAddress, selectedTokenSymbol);
        const realFromBalance = parseFloat(fromBalance || '0');
        
        const toBalance = await walletBalanceService.getBalanceForToken(walletAddress, quoteSym);
        const realToBalance = parseFloat(toBalance || '0');
        
        // ✅ FIX: Only update if balances actually changed to prevent infinite loops
        setSwapData(prevData => {
          if (prevData && prevData.fromToken.symbol === selectedTokenSymbol) {
            // Check if balances actually changed
            const fromChanged = Math.abs(prevData.fromToken.balance - realFromBalance) > 0.00000001;
            const toChanged = Math.abs(prevData.toToken.balance - realToBalance) > 0.00000001;
            
            if (!fromChanged && !toChanged) {
              return prevData; // No change, return same object to prevent re-render
            }
            
            return {
              ...prevData,
              fromToken: {
                ...prevData.fromToken,
                balance: realFromBalance
              },
              toToken: {
                ...prevData.toToken,
                balance: realToBalance
              }
            };
          }
          return prevData;
        });
        
        logWithPrefix('LimitOrderPanel', `✅ Balances updated:`, { 
          [selectedTokenSymbol]: realFromBalance, 
          [quoteSym]: realToBalance,
          walletAddress 
        });
      } catch (error) {
        errorWithPrefix('LimitOrderPanel', `❌ Error updating balances:`, error);
      } finally {
        setBalancesLoading(false);
      }
    };

    // Small delay to ensure swapData is fully set
    const timeoutId = setTimeout(updateBalances, 200);
    return () => clearTimeout(timeoutId);
  }, [selectedTokenSymbol, swapData, walletAddress, quoteSym]); // Removed isAuthenticated - balance can be loaded if wallet is connected

  // Reset amount and price when selectedTokenSymbol changes (when user changes trading pair)
  useEffect(() => {
    // Reset form values when trading pair changes
    setAmount('');
    setPrice('');
    setSliderValue(-1);
    setError(null);
    logWithPrefix('LimitOrderPanel', '🔄 Reset amount and price for new trading pair:', { selectedTokenSymbol });
  }, [selectedTokenSymbol]);

  // Update token price when marketPrice is loaded (if token price was 0)
  useEffect(() => {
    if (!swapData || !marketPrice || marketPrice <= 0 || isStablecoin(selectedTokenSymbol)) {
      return;
    }

    // If token price is 0 but marketPrice is available, update it
    if (swapData.fromToken.price === 0 && marketPrice > 0) {
      const newRate = marketPrice > 0 ? marketPrice : swapData.rate;
      setSwapData(prevData => {
        if (prevData && prevData.fromToken.symbol === selectedTokenSymbol) {
          return {
            ...prevData,
            fromToken: {
              ...prevData.fromToken,
              price: marketPrice
            },
            rate: newRate
          };
        }
        return prevData;
      });
      logWithPrefix('LimitOrderPanel', '✅ Updated token price from marketPrice:', { selectedTokenSymbol, marketPrice, newRate });
    }
  }, [marketPrice, swapData, selectedTokenSymbol]);

  useEffect(() => {
    // Skip API calls if user is not authenticated (endpoint requires auth)
    if (!isAuthenticated) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        logWithPrefix('LimitOrderPanel', 'loadOrders:start', { isAuthenticated, selectedTokenSymbol });
        // Load orders from API - use current selected trading pair
        const response = await getOrdersApi({ 
          status: 'pending,partially_filled',
          limit: 50 
        });
        
        if (response.success && response.orders) {
          // Transform API orders to component format
          const transformedOrders = response.orders.map(order => ({
            id: order.id,
            side: order.side,
            price: parseFloat(order.price),
            amount: parseFloat(order.amount),
            filled: parseFloat(order.filled_amount || 0),
            status: order.status,
            createdAt: new Date(order.created_at).getTime()
          }));
          logWithPrefix('LimitOrderPanel', 'loadOrders:ok', { count: transformedOrders.length });
          setOrders(transformedOrders);
        } else {
          logWithPrefix('LimitOrderPanel', 'loadOrders:empty');
          setOrders([]);
        }
      } catch (err) {
        // Check if it's a 401 error - stop retrying if unauthenticated
        const isUnauthorized = err?.message?.includes('No session found') || 
                               err?.message?.includes('Unauthorized') ||
                               err?.message?.includes('authenticate');
        
        if (isUnauthorized) {
          // Stop polling if unauthenticated - don't log, this is expected
          setOrders([]);
          setLoading(false);
          return;
        }
        
        // Only log unexpected errors (not auth errors)
        warnWithPrefix('LimitOrderPanel', 'Orders API error:', err);
        setOrders([]);
        setError(err?.message || String(err) || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Refresh orders every 10 seconds (only if authenticated)
    const interval = setInterval(() => {
      // Double-check auth before each call
      if (isAuthenticated) {
        loadData();
      }
    }, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, selectedTokenSymbol]);

  // Load real market price from API
  useEffect(() => {
    let consecutiveErrors = 0;
    let shouldStopPolling = false;
    const MAX_CONSECUTIVE_ERRORS = 3; // Stop after 3 consecutive errors
    
    const loadPrice = async () => {
      // Stop if we've determined backend is misconfigured
      if (shouldStopPolling) {
        return;
      }
      
      try {
        setPriceLoading(true);
        setPriceError(null);
        const priceResponse = await getPriceApi();
        
        if (priceResponse.success && priceResponse.price) {
          const priceNum = parseFloat(priceResponse.price);
          if (!isNaN(priceNum) && priceNum > 0) {
            setMarketPrice(priceNum);
            consecutiveErrors = 0; // Reset error counter on success
            shouldStopPolling = false; // Reset stop flag on success
          } else {
            throw new Error('Invalid price from API');
          }
        } else {
          throw new Error('Failed to load price');
        }
      } catch (err) {
        consecutiveErrors++;
        
        // Check if it's a backend config error (expected, don't spam)
        const isConfigError = err?.message?.includes('Missing required environment variables') ||
                             err?.message?.includes('BSC_RPC_URL') ||
                             err?.message?.includes('DEX_BASE_TOKEN_ADDRESS');
        
        // Stop polling immediately if backend config is missing (permanent error)
        if (isConfigError) {
          shouldStopPolling = true;
          setPriceLoading(false);
          // Don't log - this is expected when backend is not configured
          return;
        }
        
        // Stop polling after too many errors (likely backend issues)
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          shouldStopPolling = true;
          setPriceLoading(false);
          // Only log if it's not a config error
          warnWithPrefix('LimitOrderPanel', 'Price API failed multiple times, stopping retries');
          return;
        }
        
        // Only log warnings for actual errors (not missing backend config)
        warnWithPrefix('LimitOrderPanel', 'Price API error:', err);
        setPriceError(err.message);
        // Don't set marketPrice to 0, keep previous value if available
      } finally {
        setPriceLoading(false);
      }
    };

    loadPrice();
    
    // Refresh price every 10 seconds (same as orders)
    // Note: Will stop automatically if backend config is missing
    const interval = setInterval(loadPrice, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = useCallback((num, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }, []);

  // Handle set percentage of wallet balance
  const handleSetPercentage = useCallback((percentage) => {
    if (!swapData) {
      logWithPrefix('LimitOrderPanel', '⚠️ handleSetPercentage: swapData is null');
      return;
    }
    
    logWithPrefix('LimitOrderPanel', '🔄 handleSetPercentage called:', { 
      percentage, 
      balance: swapData.fromToken.balance,
      symbol: swapData.fromToken.symbol,
      price: swapData.fromToken.price,
      marketPrice 
    });
    
    if (swapData.fromToken.balance > 0) {
      const amount = (swapData.fromToken.balance * percentage / 100).toFixed(8);
      logWithPrefix('LimitOrderPanel', '✅ Setting amount:', { amount, balance: swapData.fromToken.balance, percentage });
      setAmount(amount);
      setSliderValue(percentage); // ✅ ADDED: Update slider value pentru active state
      setError(null);
      // Force price update if not set
      if ((!price || parseFloat(price) <= 0) && marketPrice > 0) {
        logWithPrefix('LimitOrderPanel', '✅ Auto-setting price to marketPrice:', marketPrice);
        setPrice(marketPrice.toFixed(2));
      } else if ((!price || parseFloat(price) <= 0) && swapData.fromToken.price > 0) {
        logWithPrefix('LimitOrderPanel', '✅ Auto-setting price to token price:', swapData.fromToken.price);
        setPrice(swapData.fromToken.price.toFixed(2));
      }
    } else {
      logWithPrefix('LimitOrderPanel', '⚠️ Balance is 0, cannot set percentage:', { 
        symbol: swapData.fromToken.symbol,
        balance: swapData.fromToken.balance 
      });
      // Show error if balance is 0
      setError(`Balance is 0 for ${swapData.fromToken.symbol}. Please connect wallet or select a different token.`);
    }
  }, [swapData, price, marketPrice]);

  // Market price is now loaded from API (state variable)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'mod+b': () => {
      setActiveTab('buy');
      setTimeout(() => priceInputRef.current?.focus(), 100);
    },
    'mod+s': () => {
      setActiveTab('sell');
      setTimeout(() => priceInputRef.current?.focus(), 100);
    },
    'mod+shift+b': () => {
      setActiveTab('buy');
      if (swapData && marketPrice > 0) {
        setPrice(marketPrice.toFixed(2));
        setTimeout(() => amountInputRef.current?.focus(), 100);
      }
    },
    'mod+shift+s': () => {
      setActiveTab('sell');
      if (swapData && marketPrice > 0) {
        setPrice(marketPrice.toFixed(2));
        setTimeout(() => amountInputRef.current?.focus(), 100);
      }
    }
  }, true, [marketPrice, swapData]);

  // Handle reverse tokens (swap fromToken and toToken)
  const handleReverse = useCallback(() => {
    if (swapData) {
      const newSwapData = {
        ...swapData,
        fromToken: { ...swapData.toToken },
        toToken: { ...swapData.fromToken },
        rate: swapData.rate > 0 ? 1 / swapData.rate : 0
      };
      setSwapData(newSwapData);
      setError(null);
    }
  }, [swapData]);

  // Auto-set price to marketPrice when amount is entered and price is not set
  // WITH smart offset for faster execution:
  // - BUY orders: +1% above market (to match existing sell orders)
  // - SELL orders: -1% below market (to match existing buy orders)
  useEffect(() => {
    if (amount && parseFloat(amount) > 0 && (!price || parseFloat(price) <= 0) && marketPrice > 0) {
      const offset = activeTab === 'buy' ? 1.01 : 0.99; // BUY +1%, SELL -1%
      const smartPrice = (marketPrice * offset).toFixed(2);
      setPrice(smartPrice);
      logWithPrefix('LimitOrderPanel', 'Auto-set price with smart offset:', { 
        amount, 
        marketPrice, 
        activeTab, 
        offset: activeTab === 'buy' ? '+1%' : '-1%',
        smartPrice 
      });
    }
  }, [amount, marketPrice, activeTab]); // Include activeTab for BUY/SELL logic

  // Calculate receive amount (toAmount) based on price and amount
  // If price is not set, use marketPrice or swapData.fromToken.price as fallback
  const toAmount = useMemo(() => {
    if (!amount) return '';
    const amountNum = parseFloat(amount) || 0;
    if (amountNum <= 0) return '';
    
    // Use price if set, otherwise use marketPrice or token price as fallback
    let priceToUse = parseFloat(price) || 0;
    
    if (priceToUse <= 0) {
      // Try marketPrice first
      if (marketPrice > 0) {
        priceToUse = marketPrice;
      } 
      // If marketPrice not available, use token price from swapData
      else if (swapData?.fromToken?.price > 0) {
        priceToUse = swapData.fromToken.price;
      }
      // If still no price, can't calculate
      if (priceToUse <= 0) return '';
    }
    
    return (amountNum * priceToUse).toFixed(8);
  }, [price, amount, marketPrice, swapData]);

  // Calculate total (USDT value)
  const total = useMemo(() => {
    if (!toAmount) return '';
    return parseFloat(toAmount || 0).toFixed(2);
  }, [toAmount]);

  // Validation
  const inputError = useMemo(() => {
    if (!swapData) return null;
    if (!price || !amount) return null;
    
    const priceNum = parseFloat(price);
    const amountNum = parseFloat(amount);
    
    if (isNaN(priceNum) || priceNum <= 0) {
      return 'Price must be greater than 0';
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      return 'Amount must be greater than 0';
    }
    if (amountNum > swapData.fromToken.balance) {
      return `Insufficient balance. Max: ${formatNumber(swapData.fromToken.balance)}`;
    }
    
    return null;
  }, [price, amount, swapData, formatNumber]);

  // Helper function to reload orders (used by multiple handlers)
  const reloadOrders = useCallback(async () => {
    try {
      logWithPrefix('LimitOrderPanel', 'reloadOrders:start', { selectedTokenSymbol });
      const response = await getOrdersApi({ 
        status: 'pending,partially_filled', 
        limit: 50 
      });
      if (response.success && response.orders) {
        const transformedOrders = response.orders.map(order => ({
          id: order.id,
          side: order.side,
          price: parseFloat(order.price),
          amount: parseFloat(order.amount),
          filled: parseFloat(order.filled_amount || 0),
          status: order.status,
          createdAt: new Date(order.created_at).getTime()
        }));
        logWithPrefix('LimitOrderPanel', 'reloadOrders:ok', { count: transformedOrders.length });
        setOrders(transformedOrders);
      } else {
        logWithPrefix('LimitOrderPanel', 'reloadOrders:empty');
        setOrders([]);
      }
    } catch (err) {
      errorWithPrefix('LimitOrderPanel', 'Error reloading orders:', err);
    }
  }, [selectedTokenSymbol]);

  // Active orders for current tab (pending or partially_filled)
  const activeOrders = useMemo(() => {
    return orders.filter(order => 
      order.side === activeTab && (order.status === 'pending' || order.status === 'partially_filled')
    ).slice(0, 5);
  }, [orders, activeTab]);

  const handlePlaceOrder = useCallback(async () => {
    if (!swapData || !price || !amount || inputError) {
      setError('Enter valid price and amount');
      return;
    }

    const priceNum = parseFloat(price);
    const amountNum = parseFloat(amount);

    if (priceNum <= 0 || amountNum <= 0 || amountNum > swapData.fromToken.balance) {
      setError('Invalid price or amount');
      return;
    }

    setError(null);
    setShowConfirmOrder(false);

    try {
      setPlacingOrder(true);
      const orderData = {
        order_type: 'limit',
        side: activeTab,
        base_token: swapData.fromToken.symbol === 'BITS' ? 'BITS' : swapData.fromToken.symbol,
        quote_token: quoteSym,
        amount: amountNum,
        price: priceNum
      };
      if (stopLoss && parseFloat(stopLoss) > 0) orderData.stop_loss = parseFloat(stopLoss);
      if (takeProfit && parseFloat(takeProfit) > 0) orderData.take_profit = parseFloat(takeProfit);

      const response = await createOrderApi(orderData);

      if (response.success) {
        setShowOrderSuccessModal(true);
        onOrderPlaced?.();
        toast.success(
          `${activeTab === 'buy' ? 'Buy' : 'Sell'} order placed`,
          { description: `Price: ${priceNum} ${quoteSym} | Amount: ${amountNum} ${swapData.fromToken.symbol} | Total: ${total} ${quoteSym}. Order will execute when price is reached (handled by exchange).`, duration: 4000 }
        );
        setPrice('');
        setAmount('');
        setStopLoss('');
        setTakeProfit('');
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (err) {
      errorWithPrefix('LimitOrderPanel', 'Error placing order:', err);
      setError(err?.message || 'Order placement failed. Please try again.');
      toast.error('Order placement failed', { description: err?.message || 'Please check your connection and try again', duration: 3000 });
    } finally {
      setPlacingOrder(false);
      setShowConfirmOrder(false);
    }
  }, [swapData, price, amount, total, activeTab, inputError, stopLoss, takeProfit, onOrderPlaced, quoteSym]);

  const onConfirmOrder = useCallback(() => {
    handlePlaceOrder(); /* Modal stays open with loading until handlePlaceOrder finishes (finally closes it) */
  }, [handlePlaceOrder]);

  const handleCancelOrder = useCallback(async (orderId) => {
    try {
      setCancellingOrderId(orderId);
      const response = await cancelOrderApi(orderId);
      
      if (response.success) {
        toast.success('Order cancelled', {
          description: `Order #${orderId} has been cancelled`,
          duration: 2000
        });
        
        // Reload orders
        await reloadOrders();
      } else {
        throw new Error(response.message || 'Failed to cancel order');
      }
    } catch (err) {
      errorWithPrefix('LimitOrderPanel', 'Error cancelling order:', err);
      toast.error('Order cancellation failed', {
        description: err.message || 'Please try again',
        duration: 3000
      });
    } finally {
      setCancellingOrderId(null);
    }
  }, [reloadOrders]);

  const handleSetMarketPrice = useCallback(() => {
    if (marketPrice > 0) {
      setPrice(marketPrice.toFixed(2));
      setError(null);
    }
  }, [marketPrice]);

  // Reset price to market price or clear it
  const handleResetPrice = useCallback(() => {
    if (marketPrice > 0) {
      setPrice(marketPrice.toFixed(2));
    } else {
      setPrice('');
    }
    setError(null);
  }, [marketPrice]);

  const handleSetPricePercentage = useCallback((percentage) => {
    if (swapData && marketPrice > 0) {
      // percentage can be positive or negative
      const newPrice = marketPrice * (1 + (percentage / 100));
      setPrice(newPrice.toFixed(2));
      setError(null);
    }
  }, [swapData, marketPrice]);

  // Calculate current price percentage relative to market price
  const currentPricePercentage = useMemo(() => {
    if (!swapData || marketPrice <= 0) return 0;
    const currentPrice = parseFloat(price) || 0;
    if (currentPrice <= 0) return 0;
    return ((currentPrice - marketPrice) / marketPrice) * 100;
  }, [price, marketPrice, swapData]);

  // Increment/decrement price percentage
  const handleIncrementPricePercentage = useCallback(() => {
    // Get base price: use marketPrice if available, otherwise use token price, otherwise use current price
    let basePrice = marketPrice;
    if (basePrice <= 0 && swapData?.fromToken?.price > 0) {
      basePrice = swapData.fromToken.price;
    }
    if (basePrice <= 0) {
      basePrice = parseFloat(price) || 0;
    }
    
    if (basePrice <= 0) {
      toast.error('Price unavailable');
      return;
    }
    
    // Use current price if set, otherwise use base price
    const currentPrice = parseFloat(price) || basePrice;
    const increment = basePrice * 0.01; // 1% of base price
    const newPrice = currentPrice + increment;
    
    setPrice(newPrice.toFixed(2));
    setError(null);
  }, [swapData, marketPrice, price]);

  const handleDecrementPricePercentage = useCallback(() => {
    // Get base price: use marketPrice if available, otherwise use token price, otherwise use current price
    let basePrice = marketPrice;
    if (basePrice <= 0 && swapData?.fromToken?.price > 0) {
      basePrice = swapData.fromToken.price;
    }
    if (basePrice <= 0) {
      basePrice = parseFloat(price) || 0;
    }
    
    if (basePrice <= 0) {
      toast.error('Price unavailable');
      return;
    }
    
    // Use current price if set, otherwise use base price
    const currentPrice = parseFloat(price) || basePrice;
    const decrement = basePrice * 0.01; // 1% of base price
    const newPrice = Math.max(0, currentPrice - decrement); // Don't go below 0
    
    setPrice(newPrice.toFixed(2));
    setError(null);
  }, [swapData, marketPrice, price]);

  // Only show skeleton if swapData is still loading (required for UI)
  if (swapDataLoading || !swapData) {
    return (
      <Card className="limit-order-panel-container limit-order-panel-skeleton-wrap" padding="lg">
        <Skeleton variant="text" width="60%" height="20px" />
        <Skeleton variant="rectangle" className="limit-order-panel-skeleton-chart" />
        <Skeleton variant="text" width="80%" height="16px" style={{ marginTop: '8px' }} />
        <Skeleton variant="button" style={{ marginTop: '16px' }} />
      </Card>
    );
  }

  return (
    <Card className="limit-order-panel-container" padding="lg">
      <Card.Body className="limit-order-panel-body-no-scroll">
        {/* Buy/Sell Tabs - Only show for Limit orders */}
        {/* Buy/Sell: radio + label ca click-ul să funcționeze mereu (label activează input-ul nativ) */}
          <div className="limit-order-panel-side-tabs" role="tablist" aria-label="Buy or Sell">
            <input
              type="radio"
              name="limit-order-side-tab"
              id="limit-order-tab-buy"
              value="buy"
              checked={activeTab === 'buy'}
              onChange={() => { setActiveTab('buy'); setError(null); }}
              className="limit-order-panel-side-tab-radio"
              aria-label="Buy"
            />
            <label
              htmlFor="limit-order-tab-buy"
              className={`limit-order-panel-side-tab ${activeTab === 'buy' ? 'active' : ''}`}
              id="limit-order-label-buy"
            >
              <TrendingUp size={14} />
              <span>Buy</span>
            </label>
            <input
              type="radio"
              name="limit-order-side-tab"
              id="limit-order-tab-sell"
              value="sell"
              checked={activeTab === 'sell'}
              onChange={() => { setActiveTab('sell'); setError(null); }}
              className="limit-order-panel-side-tab-radio"
              aria-label="Sell"
            />
            <label
              htmlFor="limit-order-tab-sell"
              className={`limit-order-panel-side-tab ${activeTab === 'sell' ? 'active' : ''}`}
              id="limit-order-label-sell"
            >
              <TrendingDown size={14} />
              <span>Sell</span>
            </label>
          </div>

        {isWatchingPrice && (
          <div className="limit-order-panel-watching" style={{ marginTop: 10, padding: 10, background: 'var(--ds-bg-elevated)', borderRadius: 8, fontSize: 13 }}>
            <p style={{ margin: 0, color: 'var(--ds-text-secondary)' }}>
              Watching price… Will execute swap when {activeTab === 'buy' ? `price ≤ ${price} ${quoteSym}` : `price ≥ ${price} ${quoteSym}`}. Keep this tab open.
            </p>
            {watchError && <p style={{ margin: '6px 0 0', color: 'var(--dex-error)' }}>{watchError}</p>}
            <Button variant="secondary" size="sm" onClick={() => { if (watchIntervalRef.current) { clearInterval(watchIntervalRef.current); watchIntervalRef.current = null; } setIsWatchingPrice(false); setPlacingOrder(false); setWatchError(null); }} style={{ marginTop: 8 }}>
              Cancel watch
            </Button>
          </div>
        )}

        {/* Pay Section */}
        <div className="limit-order-panel-input-group">
          <div className="limit-order-panel-input-row">
            <input
              ref={amountInputRef}
              type="number"
              placeholder="Pay"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setSliderValue(-1);
                setError(null);
              }}
              min="0"
              step="0.00000001"
              className="limit-order-panel-amount-input"
              aria-label="Amount to pay"
              aria-describedby={error ? "amount-error" : undefined}
            />
            <button
              type="button"
              className="limit-order-panel-token-button"
              aria-label="Token selector"
            >
              <TokenLogo symbol={swapData.fromToken.symbol} size="sm" showBorder />
              <span className="limit-order-panel-token-symbol">{swapData.fromToken.symbol}</span>
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="limit-order-panel-amount-info">
            <span className="limit-order-panel-usd-value">
              ${amount && swapData?.fromToken?.price ? formatNumber(parseFloat(amount || 0) * swapData.fromToken.price) : '0.00'}
            </span>
            <div className="limit-order-panel-balance-group">
              <span className="limit-order-panel-balance">
                <Coins size={12} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />
                Balance: {formatNumber(swapData.fromToken.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Percentage Buttons - Oxium style (NO slider track) */}
        {swapData.fromToken.balance > 0 && (
          <div className="limit-order-panel-percentage-buttons">
            <button 
              type="button"
              className={`limit-order-panel-percentage-btn ${sliderValue === 25 ? 'active' : ''}`}
              onClick={() => handleSetPercentage(25)}
            >
              25%
            </button>
            <button 
              type="button"
              className={`limit-order-panel-percentage-btn ${sliderValue === 50 ? 'active' : ''}`}
              onClick={() => handleSetPercentage(50)}
            >
              50%
            </button>
            <button 
              type="button"
              className={`limit-order-panel-percentage-btn ${sliderValue === 75 ? 'active' : ''}`}
              onClick={() => handleSetPercentage(75)}
            >
              75%
            </button>
            <button 
              type="button"
              className={`limit-order-panel-percentage-btn ${sliderValue === 100 ? 'active' : ''}`}
              onClick={() => handleSetPercentage(100)}
            >
              100%
            </button>
          </div>
        )}

        {/* Reverse Button - Between Pay and Receive */}
        <div className="limit-order-panel-reverse-container">
          <button
            type="button"
            className="limit-order-panel-reverse-btn"
            onClick={handleReverse}
            title="Reverse tokens"
            aria-label="Reverse tokens"
          >
            <ArrowDownUp size={16} />
          </button>
        </div>

        {/* Receive Section - watermark în linia de input */}
        <div className="limit-order-panel-input-group">
          <div className="limit-order-panel-input-row">
            <input
              type="text"
              placeholder="Receive"
              value={toAmount}
              readOnly
              className="limit-order-panel-amount-input"
              disabled
            />
            <button
              type="button"
              className="limit-order-panel-token-button"
              aria-label="Token selector"
            >
              <TokenLogo symbol={swapData.toToken.symbol} size="sm" showBorder />
              <span className="limit-order-panel-token-symbol">{swapData.toToken.symbol}</span>
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="limit-order-panel-amount-info">
            <span className="limit-order-panel-usd-value">
              ${toAmount && swapData?.toToken?.price ? formatNumber(parseFloat(toAmount || 0) * swapData.toToken.price) : '0.00'}
            </span>
            <span className="limit-order-panel-balance">
              <Coins size={12} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }} />
              Balance: {formatNumber(swapData.toToken.balance)}
            </span>
          </div>
        </div>


        {/* Limit Price Section - Like Oxium */}
        <div className="limit-order-panel-input-group">
          <div className="limit-order-panel-section-label">
            <span>When {swapData.fromToken.symbol} is worth</span>
          </div>
          <div className="limit-order-panel-input-row">
            <input
              ref={priceInputRef}
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setError(null);
              }}
              min="0"
              step="0.01"
              className="limit-order-panel-price-input"
              aria-label="Limit price"
            />
            <div className="limit-order-panel-token-button" style={{ cursor: 'default' }}>
              <span className="limit-order-panel-token-symbol">{swapData.toToken.symbol}</span>
            </div>
          </div>
          <div className="limit-order-panel-price-quick-actions">
            <button
              type="button"
              className="limit-order-panel-quick-btn"
              onClick={handleSetMarketPrice}
            >
              Use Market
            </button>
            
            {/* Current percentage display */}
            {price && parseFloat(price) > 0 && marketPrice > 0 && (
              <span className="limit-order-panel-price-percentage" style={{ 
                fontSize: '0.75rem', 
                color: 'var(--dex-text-secondary)',
                padding: '0 4px',
                minWidth: '50px',
                textAlign: 'center'
              }}>
                {currentPricePercentage >= 0 ? '+' : ''}{currentPricePercentage.toFixed(1)}%
              </span>
            )}
            
            {/* Increment/Decrement buttons */}
            <button
              type="button"
              className="limit-order-panel-quick-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDecrementPricePercentage();
              }}
              title="Decrease price by 1%"
            >
              −
            </button>
            <button
              type="button"
              className="limit-order-panel-quick-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleIncrementPricePercentage();
              }}
              title="Increase price by 1%"
            >
              +
            </button>
            <button
              type="button"
              className="limit-order-panel-quick-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleResetPrice();
              }}
              title="Reset price to market price"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="limit-order-panel-error" id="price-error" role="alert" aria-live="polite">
            <span>{error}</span>
          </div>
        )}

        {/* Active Orders: removed from Buy/Sell panel – view in Open Orders (bottom bar) */}
      </Card.Body>

      <Card.Footer>
        {/* Risk lipit de wallet + Place order (fără gol negru în Body) */}
        <div className="limit-order-panel-risk-section limit-order-panel-risk-section--footer">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRiskSectionOpen(true); }}
            onPointerDown={(e) => { e.stopPropagation(); }}
            style={{
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text)',
              padding: '8px',
              background: 'rgba(79, 172, 254, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(79, 172, 254, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
            aria-haspopup="dialog"
            aria-expanded={riskSectionOpen}
          >
            <span>Risk Management (optional — Stop-Loss & Take-Profit)</span>
            <span style={{ fontSize: '14px' }} aria-hidden>▼</span>
          </button>
        </div>

        <Modal
          isOpen={riskSectionOpen}
          onClose={closeRisk}
          title="Risk Management (optional — Stop-Loss & Take-Profit)"
          size="small"
          className="limit-order-panel-risk-modal"
        >
          <p style={{ fontSize: '12px', color: 'var(--ds-text-tertiary)', margin: '0 0 12px 0' }}>
            Values are sent with the order. Auto-close at price depends on backend / OTA.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ds-text-secondary)', marginBottom: '6px', display: 'block' }}>Stop-Loss (auto-close if price drops)</label>
              <input
                type="number"
                placeholder={marketPrice > 0 ? `e.g. ${(marketPrice * 0.95).toFixed(2)}` : '0.00'}
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--ds-bg-base)', border: '1px solid var(--ds-border-color)', borderRadius: '8px', color: 'var(--ds-text-primary)', fontSize: '14px', boxSizing: 'border-box' }}
              />
              {stopLoss && marketPrice > 0 && <div style={{ fontSize: '11px', color: 'var(--ds-text-tertiary)', marginTop: '4px' }}>{((parseFloat(stopLoss) / marketPrice - 1) * 100).toFixed(2)}% from market</div>}
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ds-text-secondary)', marginBottom: '6px', display: 'block' }}>Take-Profit (auto-close if price rises)</label>
              <input
                type="number"
                placeholder={marketPrice > 0 ? `ex. ${(marketPrice * 1.05).toFixed(2)}` : '0.00'}
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--ds-bg-base)', border: '1px solid var(--ds-border-color)', borderRadius: '8px', color: 'var(--ds-text-primary)', fontSize: '14px', boxSizing: 'border-box' }}
              />
              {takeProfit && marketPrice > 0 && <div style={{ fontSize: '11px', color: 'var(--ds-text-tertiary)', marginTop: '4px' }}>{((parseFloat(takeProfit) / marketPrice - 1) * 100).toFixed(2)}% from market</div>}
            </div>
          </div>
        </Modal>

        {isAuthenticated && walletAddress && (
          <div style={{ marginBottom: '2px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {balancesLoading ? (
              <span style={{ opacity: 0.6 }}>Loading balances...</span>
            ) : (
              <span>
                Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </span>
            )}
          </div>
        )}

        <div className="limit-order-panel-footer-actions">
          {/* Protocol Fee - Left side */}
          {amount && parseFloat(amount) > 0 && swapData && swapData.fromToken.price > 0 && (
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--dex-text-secondary)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              <span style={{ fontWeight: 500 }}>Protocol Fee: </span>
              <span style={{ fontWeight: 600, color: 'var(--dex-text-primary)' }}>
                {swapData.fee}%
                <span style={{ marginLeft: '4px', fontSize: '11px', color: 'var(--dex-text-tertiary)' }}>
                  (~${((parseFloat(amount) * swapData.fromToken.price * swapData.fee) / 100).toFixed(2)})
                </span>
              </span>
            </div>
          )}
          
          {/* Button - Right side */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Button
              variant={activeTab === 'buy' ? 'primary' : 'danger'}
              size="lg"
              fullWidth
              onClick={!walletAddress ? login : (!isAuthenticated ? login : () => setShowConfirmOrder(true))}
              disabled={(!walletAddress ? false : (!isAuthenticated ? false : (!price || !amount || parseFloat(price) <= 0 || parseFloat(amount) <= 0 || !!inputError || placingOrder)))}
              aria-label={!walletAddress ? 'Connect wallet' : (!isAuthenticated ? 'Sign in to place order' : `Place limit ${activeTab === 'buy' ? 'buy' : 'sell'} order`)}
            >
              {!walletAddress
                ? 'Connect wallet to place order'
                : !isAuthenticated
                ? 'Sign In to Place Order'
                : placingOrder
                ? 'Placing...'
                : !price || !amount
                ? `Place ${activeTab === 'buy' ? 'buy' : 'sell'} order`
                : inputError
                ? inputError
                : `Place ${activeTab === 'buy' ? 'Buy' : 'Sell'} Order`
              }
            </Button>
          </div>
        </div>
      </Card.Footer>

      <ConfirmationModal
        isOpen={showConfirmOrder}
        onClose={() => setShowConfirmOrder(false)}
        onConfirm={onConfirmOrder}
        title="Confirm Order"
        message={
          swapData && price && amount && parseFloat(amount) > 0 && parseFloat(price) > 0
            ? `Place limit ${activeTab === 'buy' ? 'Buy' : 'Sell'} order: ${amount} ${swapData.fromToken.symbol} @ ${price} ${quoteSym}. Total: ${(parseFloat(amount) * parseFloat(price)).toFixed(2)} ${quoteSym}. Order will execute when price is reached (handled by exchange). View in Open Orders.`
            : 'Confirm order?'
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant={activeTab === 'sell' ? 'danger' : 'default'}
        isLoading={placingOrder}
      />

      {/* Success popup after order placed – view orders in Open Orders (bottom bar) */}
      <Modal
        isOpen={showOrderSuccessModal}
        onClose={() => setShowOrderSuccessModal(false)}
        title="Order placed"
        size="small"
      >
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--ds-text-primary)' }}>
          Your limit order has been placed successfully. View it in <strong>Open Orders</strong> below.
        </p>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={() => setShowOrderSuccessModal(false)}>
            OK
          </Button>
        </div>
      </Modal>
    </Card>
  );
});

LimitOrderPanel.displayName = 'LimitOrderPanel';

export default LimitOrderPanel;
