/* eslint-disable */
/**
 * SwapPanel Component - Swap/Trade Panel
 * 
 * Component pentru swap panel cu trading real:
 * - From/To token selection
 * - Amount input
 * - Real-time rate display (din backend API)
 * - Approve + Swap buttons (real on-chain trading)
 * 
 * @module SwapPanel
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// Real data only: API, wallet, DEX. No fake or unverified data.
import { ArrowDownUp, Info, Settings, ChevronDown, X, Search, Check } from 'lucide-react';
// toast removed - all notifications in SwapProgressModal
import TokenLogo from '../common/TokenLogo';
import { Card, Button, Input, Slider } from '../ui';
import SwapSettingsModal from './SwapSettingsModal';
import SwapProgressModal from './SwapProgressModal';
import RepairBscModal from './RepairBscModal';
import RpcRepairModal from './RpcRepairModal';
import { useDexAuth } from '../../context/DexAuthContext';
import { rpcHealthCheck } from '../../services/rpcHealthCheck';
import walletBalanceService from '../../services/walletBalanceService';
import tokenPriceService from '../../services/tokenPriceService';
import swapExecutionService from '../../services/swapExecutionService';
import { repairBscNetwork } from '../../services/repairBscNetwork';
import { recordManualOutcome } from '../../services/aiTradingApiService';
import { saveSwapOutcome } from '../../utils/swapOutcomesStorage';
import { getAllTokens, getAllTokenSymbols, DEFAULT_BSC_QUOTE_SYMBOL, isStablecoin } from '../../services/tokenRegistry';
import { API_ENDPOINTS } from '../../../config/apiEndpoints.js';
import { otaApiRequest } from '../../utils/otaApiClient';
import { ethers } from 'ethers';
import { logWithPrefix, errorWithPrefix } from '../../utils/logger';
import '../../styles/components/swap-panel.css';
import '../../styles/components/swap-panel-token-selector.css';
import '../../styles/components/percentage-buttons.css';
import '../../styles/components/swap-progress-modal.css';
import '../../styles/components/rpc-repair-modal.css';

const SwapPanel = React.memo(({ selectedPair = null }) => {
  const { isAuthenticated, walletAddress, login, wallet } = useDexAuth();
  const [swapData, setSwapData] = useState(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(3); // 3% default – CAKE→BNB needs 3%+ to avoid "couldn't be completed"
  const [deadline, setDeadline] = useState(20); // minutes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFromTokenSelector, setShowFromTokenSelector] = useState(false);
  const [showToTokenSelector, setShowToTokenSelector] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  const [tokens, setTokens] = useState([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [quoteData, setQuoteData] = useState(null); // { amountOut, minOut, priceImpact, price, timestamp }
  const [allowance, setAllowance] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // { hash, status: 'pending' | 'confirmed' | 'failed', error }
  const [tokenDecimals, setTokenDecimals] = useState(18); // Default to 18, will be fetched
  const [showSwapConfirmation, setShowSwapConfirmation] = useState(false);
  /** -1 = niciun preset procent; 25|50|75|100 pentru evidențiere buton */
  const [sliderValue, setSliderValue] = useState(-1);
  
  // 🆕 Progress Modal States
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [swapProgressState, setSwapProgressState] = useState('idle'); // 'idle' | 'approving' | 'swapping' | 'success' | 'error'
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showRpcRepairModal, setShowRpcRepairModal] = useState(false);
  const repairRetryParamsRef = useRef(null);
  const hasRetriedAfterRepairRef = useRef(false);
  // Snapshot la succes – modal afișează date reale (cantități + hash) chiar dacă formularul se resetează
  const [successSnapshot, setSuccessSnapshot] = useState(null); // { fromAmount, toAmount, txHash }
  // P2.3 Paper trading: record outcome as simulated (backend can skip/flag for paper trades)
  const [recordAsSimulated, setRecordAsSimulated] = useState(false);

  // Escape closes token selector modals; reset search when closing
  useEffect(() => {
    if (!showFromTokenSelector && !showToTokenSelector) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        setShowFromTokenSelector(false);
        setShowToTokenSelector(false);
        setTokenSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showFromTokenSelector, showToTokenSelector]);

  // Reset search when opening a token selector
  useEffect(() => {
    if (showFromTokenSelector || showToTokenSelector) setTokenSearchQuery('');
  }, [showFromTokenSelector, showToTokenSelector]);

  /** Fire-and-forget: POST record-outcome with txHash so backend/DB can link outcome to tx; 404/501 = no-op. */
  const recordOutcomeAfterSwap = useCallback(async (walletAddr, data, quote, txHash, simulated, slipPercent, feePercent, amountInFromSwap = null) => {
    if (!walletAddr || !data?.fromToken?.symbol || !data?.toToken?.symbol) return;
    const amountOut = parseFloat(quote?.amountOut ?? quote?.amount_out ?? 0) || 0;
    const amountIn = amountInFromSwap != null ? parseFloat(amountInFromSwap) : (parseFloat(data?.fromAmount ?? 0) || 0);
    let price = parseFloat(quote?.price ?? data.toToken?.price ?? 0) || 0;
    if (price <= 0 && amountOut > 0) {
      try {
        const symOut = (data.toToken?.symbol || '').trim();
        const symIn = (data.fromToken?.symbol || '').trim();
        const toFetch = [symOut, symIn].filter(Boolean);
        if (toFetch.length > 0) {
          const prices = await tokenPriceService.getAllTokenPrices([...new Set(toFetch)]);
          price = prices[symOut] ?? prices[symOut?.toUpperCase?.()] ?? 0;
        }
      } catch (_) {}
    }
    const value = amountOut && price ? amountOut * price : 0;
    recordManualOutcome({
      userId: walletAddr,
      token: data.toToken.symbol,
      tokenIn: data.fromToken.symbol,
      tokenOut: data.toToken.symbol,
      side: 'buy',
      amount: amountOut,
      amountIn: amountIn > 0 ? amountIn : undefined,
      amountOut,
      value,
      price,
      entryPrice: price,
      exitPrice: price,
      source: 'manual',
      simulated: !!simulated,
      txHash: txHash || undefined
    }).catch(() => {});
    if (txHash && (amountOut > 0 || price > 0)) {
      saveSwapOutcome({
        txHash,
        tokenIn: data.fromToken.symbol,
        tokenOut: data.toToken.symbol,
        amountIn: amountIn > 0 ? amountIn : undefined,
        amountOut,
        price,
        value,
        slippage: slipPercent,
        fee: feePercent,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  // Read query params on mount for pre-population from OTA (run once after tokens are loaded)
  const [queryParamsProcessed, setQueryParamsProcessed] = useState(false);
  useEffect(() => {
    if (!swapData || tokens.length === 0 || queryParamsProcessed) return; // Wait for data to load, run only once

    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const to = params.get('to');
    const amount = params.get('amount');

    if (from && to) {
      // Pre-fill tokens if they exist in tokens list
      const fromTokenData = tokens.find(t => t.symbol.toUpperCase() === from.toUpperCase());
      const toTokenData = tokens.find(t => t.symbol.toUpperCase() === to.toUpperCase());

      if (fromTokenData && toTokenData) {
        // Update swapData with pre-filled tokens
        const newSwapData = {
          ...swapData,
          fromToken: {
            symbol: fromTokenData.symbol,
            balance: parseFloat(fromTokenData.balance || '0'),
            price: fromTokenData.price || 0
          },
          toToken: {
            symbol: toTokenData.symbol,
            balance: parseFloat(toTokenData.balance || '0'),
            price: toTokenData.price || 0
          },
          rate: fromTokenData.price > 0 && toTokenData.price > 0 ? fromTokenData.price / toTokenData.price : 0
        };
        setSwapData(newSwapData);

        // Pre-fill amount if provided
        if (amount && parseFloat(amount) > 0) {
          setFromAmount(amount);
        }

        logWithPrefix('SWAP', 'Pre-filled from OTA:', { from, to, amount });
        setQueryParamsProcessed(true);
        
        // Clear query params from URL (optional, for cleaner URL)
        // window.history.replaceState({}, '', '/dex-edu/swap');
      } else {
        setQueryParamsProcessed(true); // Mark as processed even if tokens not found
      }
    } else {
      setQueryParamsProcessed(true); // Mark as processed if no query params
    }
  }, [swapData, tokens, queryParamsProcessed]); // Run after swapData and tokens are loaded, only once

  // Load swap UI data - ALWAYS show UI, with REAL prices from blockchain
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Get all available tokens from centralized registry
      const availableTokenSymbols = getAllTokenSymbols();
      
      // Always create swap data structure (UI always visible)
      // If wallet NOT connected: balances = 0. Real state only.
      // If wallet connected: load real balances from blockchain
      // Prices: real from blockchain/DEX only.
      
      let balances = {};
      availableTokenSymbols.forEach(symbol => {
        balances[symbol] = '0';
      });

      // Fetch REAL prices from blockchain/DEX (always, regardless of wallet connection)
      let prices = {};
      availableTokenSymbols.forEach(symbol => {
        prices[symbol] = isStablecoin(symbol) ? 1 : 0;
      });

      try {
        // Get REAL prices from blockchain/DEX
        const realPrices = await tokenPriceService.getAllTokenPrices(availableTokenSymbols);
        if (realPrices && typeof realPrices === 'object') {
          prices = { ...prices, ...realPrices };
        }
        logWithPrefix('SwapPanel', 'Ôťů Prices loaded:', prices);
      } catch (error) {
        errorWithPrefix('SwapPanel', 'ÔŁî Error loading real prices:', error);
        // Keep prices at 0 if error. Real data only.
      }

      // If wallet is connected, fetch REAL balances from blockchain
      // Note: Balance can be loaded even if user is not authenticated (wallet connected via Header)
      if (walletAddress) {
        setBalancesLoading(true);
        try {
          const fetchedBalances = await walletBalanceService.getAllTokenBalances(
            walletAddress,
            availableTokenSymbols
          );
          if (fetchedBalances && typeof fetchedBalances === 'object') {
            balances = { ...balances, ...fetchedBalances };
          }
        } catch (error) {
          errorWithPrefix('SwapPanel', 'Error loading real balances:', error);
          // Keep balances at 0 if error. Real data only.
        } finally {
          setBalancesLoading(false);
        }
      }

      // Determine initial tokens from selectedPair if provided
      // Chart: BINANCE:BNBUSDT (preț spot); swap „Receive”: quote BSC implicit (USDC dacă nu e setat altceva)
      let initialFromTokenSymbol = 'BNB';
      const defaultQuote = DEFAULT_BSC_QUOTE_SYMBOL;
      let initialToTokenSymbol = defaultQuote;

      if (selectedPair) {
        const pairStr = selectedPair.replace('BINANCE:', '');
        if (pairStr.endsWith('USDT')) {
          initialFromTokenSymbol = pairStr.replace('USDT', '');
          initialToTokenSymbol = defaultQuote;
        } else {
          initialFromTokenSymbol = pairStr || 'BNB';
          initialToTokenSymbol = defaultQuote;
        }
      }

      // Calculate rate from real prices
      const initialFromTokenPrice = prices[initialFromTokenSymbol] || 0;
      const initialToTokenPrice = prices[initialToTokenSymbol] || 1;
      const rate = initialFromTokenPrice > 0 && initialToTokenPrice > 0 ? initialFromTokenPrice / initialToTokenPrice : 0;

      logWithPrefix('SwapPanel', 'Ôťů Setting swapData with prices:', { 
        selectedPair,
        parsedFromToken: initialFromTokenSymbol,
        parsedToToken: initialToTokenSymbol,
        shouldShowBNB: initialFromTokenSymbol,
        expectedInUI: initialFromTokenSymbol,
        pricesObject: prices
      });

      // Create swap data - ALWAYS (UI always visible) with REAL prices
      const data = {
        fromToken: {
          symbol: initialFromTokenSymbol,
          balance: parseFloat(balances[initialFromTokenSymbol] || '0'), // 0 if wallet not connected, real if connected
          price: initialFromTokenPrice // REAL price from blockchain/DEX
        },
        toToken: {
          symbol: initialToTokenSymbol,
          balance: parseFloat(balances[initialToTokenSymbol] || '0'), // 0 if wallet not connected, real if connected
          price: initialToTokenPrice // REAL price from DEX
        },
        rate: rate, // REAL rate calculated from real prices
        fee: 0.1
      };

      logWithPrefix('SwapPanel', 'Ôťů Balances loaded:', {
        balances,
        'BNB balance': balances['BNB'],
        'BTC balance': balances['BTC'],
        fromTokenBalance: data.fromToken.balance,
        toTokenBalance: data.toToken.balance
      });

      logWithPrefix('SwapPanel', 'Ôťů Final swapData:', {
        ...data,
        'fromToken.symbol': data.fromToken.symbol,
        'fromToken.price': data.fromToken.price,
        'toToken.symbol': data.toToken.symbol,
        'toToken.price': data.toToken.price,
        'rate': data.rate
      });

      // Create tokens list - from centralized registry with REAL prices
      const tokensList = getAllTokens().map(token => ({
        symbol: token.symbol,
        name: token.name,
        balance: balances[token.symbol] || '0',
        price: prices[token.symbol] || 0
      }));

      setSwapData(data);
      setTokens(tokensList);
      setLoading(false);
    };

    loadData();
  }, [walletAddress, selectedPair]); // Removed isAuthenticated - balance can be loaded if wallet is connected

  // Refetch price when from/to token price is 0 (e.g. CAKE) so receive amount shows
  const priceRefetchKey = useRef('');
  useEffect(() => {
    if (!swapData) return;
    const needFrom = swapData.fromToken.price <= 0 && !isStablecoin(swapData.fromToken.symbol);
    const needTo = swapData.toToken.price <= 0 && !isStablecoin(swapData.toToken.symbol);
    if (!needFrom && !needTo) return;
    const key = `${swapData.fromToken.symbol}-${swapData.toToken.symbol}`;
    if (priceRefetchKey.current === key) return;
    priceRefetchKey.current = key;
    const syms = [];
    if (needFrom) syms.push(swapData.fromToken.symbol);
    if (needTo) syms.push(swapData.toToken.symbol);
    if (syms.length === 0) return;
    tokenPriceService.getAllTokenPrices(syms).then((prices) => {
      priceRefetchKey.current = '';
      if (!prices || !swapData) return;
      let updated = false;
      const next = { ...swapData };
      if (needFrom && (prices[swapData.fromToken.symbol] ?? 0) > 0) {
        next.fromToken = { ...swapData.fromToken, price: prices[swapData.fromToken.symbol] };
        updated = true;
      }
      if (needTo && (prices[swapData.toToken.symbol] ?? 0) > 0) {
        next.toToken = { ...swapData.toToken, price: prices[swapData.toToken.symbol] };
        updated = true;
      }
      if (updated) {
        const fp = next.fromToken.price || 0;
        const tp = next.toToken.price || 1;
        next.rate = fp > 0 && tp > 0 ? fp / tp : next.rate;
        setSwapData(next);
        setTokens(prev => prev.map(t => (prices[t.symbol] != null && prices[t.symbol] > 0) ? { ...t, price: prices[t.symbol] } : t));
      }
    }).catch(() => { priceRefetchKey.current = ''; });
  }, [swapData]);

  // Reset amounts when selectedPair changes (when user changes trading pair from parent)
  useEffect(() => {
    if (selectedPair) {
      // Extract token symbol from selectedPair (BINANCE:BTCUSDT -> BTC)
      const tokenSymbol = selectedPair.replace('BINANCE:', '').replace('USDT', '') || 'BTC';
      
      // Only reset if swapData exists and the token has changed
      if (swapData && swapData.fromToken.symbol !== tokenSymbol) {
        setFromAmount('');
        setToAmount('');
        setQuoteData(null);
        setError(null);
        setSliderValue(-1);
        logWithPrefix('SWAP', '­čöä Reset amounts for new trading pair:', { selectedPair, tokenSymbol, oldToken: swapData.fromToken.symbol });
      }
    }
  }, [selectedPair, swapData]);

  const formatNumber = useCallback((num) => {
    if (!num || isNaN(num)) return '0.00';
    
    const value = parseFloat(num);
    
    // Pentru sume mari (≥100): maxim 2 zecimale
    if (value >= 100) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value);
    }
    
    // Pentru sume medii (≥1): maxim 4 zecimale
    if (value >= 1) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      }).format(value);
    }
    
    // Pentru sume mici (<1): maxim 6 zecimale
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    }).format(value);
  }, []);

  const formatUSD = useCallback((num) => {
    if (!num || isNaN(num)) return '$0.00';
    
    const value = parseFloat(num);
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  // Normalize amount input: comma → dot (locale RO/DE etc.); avoids sending 0 to backend
  const normalizeAmount = useCallback((str) => (str == null || str === '' ? '' : String(str).trim().replace(/,/g, '.')), []);

  // Validare input
  const inputError = useMemo(() => {
    if (!swapData || !fromAmount) return null;
    const amount = parseFloat(normalizeAmount(fromAmount));
    if (isNaN(amount) || amount <= 0) return null;
    if (amount > swapData.fromToken.balance) {
      return `Insufficient balance. Max: ${formatNumber(swapData.fromToken.balance)}`;
    }
    return null;
  }, [fromAmount, swapData, normalizeAmount]);

  // Fetch quote from backend when fromAmount, fromToken, toToken, or slippage changes
  useEffect(() => {
    if (!swapData || !fromAmount || inputError) {
      setQuoteData(null);
      setToAmount('');
      return;
    }

    const amount = parseFloat(normalizeAmount(fromAmount));
    if (isNaN(amount) || amount <= 0) {
      setQuoteData(null);
      setToAmount('');
      return;
    }

    // Calculate immediate fallback using prices (for instant feedback)
    const fromPrice = swapData.fromToken.price || 0;
    const toPrice = swapData.toToken.price || 1;
    const calculatedRate = fromPrice > 0 && toPrice > 0 ? fromPrice / toPrice : swapData.rate || 0;
    
    if (calculatedRate > 0) {
      // Show immediate calculation while waiting for API
      const immediateAmount = amount * calculatedRate * (1 - swapData.fee / 100) * (1 - slippage / 100);
      setToAmount(formatNumber(immediateAmount));
    }

    // Debounce: wait 500ms after user stops typing
    const timeoutId = setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError(null);

      try {
        const query = `tokenIn=${swapData.fromToken.symbol}&tokenOut=${swapData.toToken.symbol}&amountIn=${amount}&slippage=${slippage}`;
        const endpoint = `${API_ENDPOINTS.OTA_QUOTE}?${query}`;
        logWithPrefix('SWAP', 'Quote request:', { 
          tokenIn: swapData.fromToken.symbol, 
          tokenOut: swapData.toToken.symbol, 
          amountIn: amount,
          slippage 
        });

        const data = await otaApiRequest(endpoint);
        if (!data.success || !data.quote) {
          logWithPrefix('SWAP', 'Quote invalid response', { success: data?.success, hasQuote: !!data?.quote, data: data });
          throw new Error('Invalid quote response');
        }

        const quote = data.quote;
        setQuoteData({
          amountOut: quote.amountOut,
          minOut: quote.minOut,
          priceImpact: quote.priceImpact || 0,
          price: quote.price,
          deadline: quote.deadline,
          routerAddress: quote.routerAddress,
          timestamp: Date.now()
        });
        setToAmount(formatNumber(parseFloat(quote.amountOut)));

        console.log('[SWAP_DEBUG] Quote received', { amountOut: quote.amountOut, minOut: quote.minOut, price: quote.price, deadline: quote.deadline });
        logWithPrefix('SWAP', 'Quote received:', {
          amountOut: quote.amountOut,
          minOut: quote.minOut,
          priceImpact: quote.priceImpact
        });
      } catch (error) {
        errorWithPrefix('SWAP', 'Quote error:', error);
        setQuoteError(error.message);
        setQuoteData(null);
        // Fallback to calculated amount if quote fails
        // Use prices directly if rate is 0 or invalid
        if (calculatedRate > 0) {
          const fallbackAmount = amount * calculatedRate * (1 - swapData.fee / 100) * (1 - slippage / 100);
          setToAmount(formatNumber(fallbackAmount));
        } else {
          // If no rate available, set to 0
          setToAmount('0.00');
        }
      } finally {
        setQuoteLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [fromAmount, swapData, slippage, inputError, normalizeAmount]);

  // Fetch token decimals when fromToken changes
  useEffect(() => {
    if (!swapData?.fromToken?.symbol) {
      setTokenDecimals(18);
      return;
    }

    const fetchDecimals = async () => {
      try {
        const decimals = await swapExecutionService.getTokenDecimals(swapData.fromToken.symbol);
        setTokenDecimals(decimals);
        logWithPrefix('SWAP', 'Token decimals fetched:', { token: swapData.fromToken.symbol, decimals });
      } catch (error) {
        errorWithPrefix('SWAP', 'Error fetching decimals, using 18 as fallback:', error);
        setTokenDecimals(18); // Fallback to 18
      }
    };

    fetchDecimals();
  }, [swapData?.fromToken?.symbol]);

  // Check allowance when fromToken or walletAddress changes
  useEffect(() => {
    if (!isAuthenticated || !walletAddress || !swapData || swapData.fromToken.symbol === 'BNB') {
      setAllowance(null);
      return;
    }

    const checkAllowance = async () => {
      try {
        const allowanceValue = await swapExecutionService.checkAllowance(
          swapData.fromToken.symbol,
          walletAddress
        );
        setAllowance(allowanceValue);
        logWithPrefix('SWAP', 'Allowance checked:', { token: swapData.fromToken.symbol, allowance: allowanceValue });
      } catch (error) {
        errorWithPrefix('SWAP', 'Error checking allowance:', error);
        setAllowance(null);
      }
    };

    checkAllowance();
  }, [isAuthenticated, walletAddress, swapData?.fromToken?.symbol]);

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (!isAuthenticated || !walletAddress || !swapData || swapData.fromToken.symbol === 'BNB' || !fromAmount) {
      return false;
    }

    if (!allowance) {
      return true; // Assume needs approval if allowance not checked yet
    }

    try {
      // Use fetched decimals (defaults to 18 if not fetched yet); normalize comma → dot
      const amountWei = ethers.utils.parseUnits(normalizeAmount(fromAmount), tokenDecimals);
      const allowanceBN = ethers.BigNumber.from(allowance);
      return allowanceBN.lt(amountWei);
    } catch (error) {
      errorWithPrefix('SWAP', 'Error checking if approval needed:', error);
      return true; // Assume needs approval on error
    }
  }, [isAuthenticated, walletAddress, swapData, fromAmount, allowance, tokenDecimals, normalizeAmount]);

  // Handle approve with progress modal
  const handleApprove = useCallback(async () => {
    if (!isAuthenticated || !walletAddress || !swapData || !fromAmount) {
      // Don't setError - let button handle validation
      return;
    }

    setIsApproving(true);
    setShowProgressModal(true);
    
    // Small delay to ensure modal renders
    setTimeout(async () => {
      setSwapProgressState('approving');

      try {
        const amountNorm = normalizeAmount(fromAmount);
        logWithPrefix('SWAP', 'Approving token:', { token: swapData.fromToken.symbol, amount: amountNorm });
        
        const result = await swapExecutionService.approveToken(swapData.fromToken.symbol, amountNorm);
        
        // Refresh allowance
        const newAllowance = await swapExecutionService.checkAllowance(swapData.fromToken.symbol, walletAddress);
        setAllowance(newAllowance);

        setSwapProgressState('success');
        logWithPrefix('SwapPanel', '[SWAP] Approval confirmed:', result);
        
        // Auto-close success modal after 2 seconds
        setTimeout(() => {
          setShowProgressModal(false);
          setSwapProgressState('idle');
        }, 2000);
        
      } catch (error) {
        errorWithPrefix('SwapPanel', '[SWAP] Approval error:', error);
        setError(error?.message || 'Approval failed');
        setSwapProgressState('error');
      } finally {
        setIsApproving(false);
      }
    }, 100);
  }, [isAuthenticated, walletAddress, swapData, fromAmount]);

  // Start swap with progress modal (skip confirmation)
  const handleSwapClick = useCallback(async () => {
    if (!swapData || !fromAmount || inputError) {
      // Don't setError - let button text handle this
      return;
    }

    if (!walletAddress) {
      // Don't setError - button already shows "Connect Wallet"
      return;
    }

    const amountNorm = normalizeAmount(fromAmount);
    const amount = parseFloat(amountNorm);
    if (amount <= 0 || amount > swapData.fromToken.balance) {
      // Don't setError - let button text handle this  
      return;
    }

    if (needsApproval) {
      // Don't setError - button should show approve first
      return;
    }

    // 🆕 Always show modal first - catch ALL errors in modal
    setShowProgressModal(true);
    setSwapProgressState('swapping');
    hasRetriedAfterRepairRef.current = false;

    // Small delay to ensure modal renders
    setTimeout(async () => {
      setIsSwapping(true);
      setTxStatus({ status: 'pending', hash: null });

      try {
        // Wallet RPC health check before swap – detect Invalid RPC URL (e.g. TWNodes) and show RpcRepairModal
        const provider = swapExecutionService.getEthereumProvider();
        if (provider?.request) {
          const health = await rpcHealthCheck(provider).catch(() => ({ ok: false, rpcBroken: false }));
          if (!health.ok && health.rpcBroken) {
            setShowRpcRepairModal(true);
            setError('Wallet RPC invalid or unreachable. Please fix BSC network in wallet settings.');
            setTxStatus({ status: 'failed', hash: null, error: 'Invalid RPC URL' });
            setSwapProgressState('error');
            setIsSwapping(false);
            return;
          }
        }

        // Refresh quote if older than 20s – avoids stale minOut causing revert
        let minOutToUse = quoteData?.minOut ?? null;
        const quoteAge = quoteData?.timestamp ? Date.now() - quoteData.timestamp : Infinity;
        if (quoteAge > 20000) {
          try {
            const query = `tokenIn=${swapData.fromToken.symbol}&tokenOut=${swapData.toToken.symbol}&amountIn=${amountNorm}&slippage=${slippage}`;
            const data = await otaApiRequest(`${API_ENDPOINTS.OTA_QUOTE}?${query}`);
            if (data?.success && data?.quote?.minOut) {
              minOutToUse = data.quote.minOut;
              logWithPrefix('SWAP', 'Quote refreshed before swap (was stale):', { minOut: minOutToUse });
            }
          } catch (_) {}
        }
        // Fallback minOut from toAmount when quote failed (e.g. CAKE/USDT without backend quote)
        // Apply extra 5% buffer so AMM can satisfy minOut (frontend price often more optimistic than pool)
        if (minOutToUse == null && toAmount) {
          const toNum = parseFloat(String(toAmount).replace(/,/g, ''));
          if (!isNaN(toNum) && toNum > 0) {
            const withSlippage = toNum * (1 - slippage / 100) * 0.95;
            minOutToUse = String(withSlippage);
            logWithPrefix('SWAP', 'MinOut fallback from toAmount (no quote, 5% buffer):', { toAmount, slippage, minOut: minOutToUse });
          }
        }

        console.log('[SWAP_DEBUG] SwapPanel handleSwapClick', {
          tokenIn: swapData.fromToken.symbol,
          tokenOut: swapData.toToken.symbol,
          amountIn: amountNorm,
          recipient: walletAddress,
          slippage,
          deadline,
          minOut: minOutToUse
        });
        console.log('[SWAP_DEBUG] Full swap params:', { tokenIn: swapData.fromToken.symbol, tokenOut: swapData.toToken.symbol, amountIn: amountNorm, minOut: minOutToUse, slippage, allowance });
        logWithPrefix('SWAP', 'Executing swap:', {
          tokenIn: swapData.fromToken.symbol,
          tokenOut: swapData.toToken.symbol,
          amountIn: amountNorm,
          recipient: walletAddress,
          slippage
        });

        const result = await swapExecutionService.executeSwap(
          swapData.fromToken.symbol,
          swapData.toToken.symbol,
          amountNorm,
          walletAddress,
          slippage,
          deadline,
          minOutToUse,
          wallet?.signer ?? null
        );

        setTxStatus({ status: 'confirmed', hash: result.hash });
        setSwapProgressState('success');
        setSuccessSnapshot({ fromAmount: amountNorm, toAmount: quoteData?.amountOut ?? toAmount, txHash: result.hash });
        logWithPrefix('SwapPanel', '[SWAP] Swap confirmed:', result);

        recordOutcomeAfterSwap(walletAddress, swapData, quoteData, result.hash, recordAsSimulated, slippage, swapData?.fee ?? 0.25, amountNorm);

        // Reset form after 3 seconds (modal păstrează successSnapshotRef)
        setTimeout(() => {
          setFromAmount('');
          setToAmount('');
          setSliderValue(-1);
          setTxStatus(null);
        }, 3000);

      } catch (error) {
        console.error('[SWAP_DEBUG] SwapPanel catch', {
          message: error?.message,
          code: error?.code,
          reason: error?.reason,
          repairBscNeeded: error?.repairBscNeeded,
          rpcInvalidUrl: error?.rpcInvalidUrl,
          stack: error?.stack?.slice?.(0, 500)
        });
        errorWithPrefix('SwapPanel', '[SWAP] Swap error:', error);
        if (error?.rpcInvalidUrl) {
          setShowRpcRepairModal(true);
          setError(error?.message || 'Wallet RPC invalid. Please fix BSC network in wallet settings.');
          setTxStatus({ status: 'failed', hash: null, error: error?.message });
          setSwapProgressState('error');
          setIsSwapping(false);
          return;
        }
        if (error?.repairBscNeeded && !hasRetriedAfterRepairRef.current) {
          repairRetryParamsRef.current = {
            tokenIn: swapData.fromToken.symbol,
            tokenOut: swapData.toToken.symbol,
            amountIn: amountNorm,
            recipient: walletAddress,
            slippage,
            deadline,
            minOut: minOutToUse ?? quoteData?.minOut ?? null
          };
          setShowRepairModal(true);
          setError(error?.message || 'Invalid BSC RPC');
          setTxStatus({ status: 'failed', hash: null, error: error.message });
          setSwapProgressState('error');
          setIsSwapping(false);
          return;
        }
        logWithPrefix('SwapPanel', '[SWAP] Swap failed', { message: error?.message, code: error?.code, reason: error?.reason });
        setError(error?.message || 'Swap failed');
        setTxStatus({ status: 'failed', hash: null, error: error.message });
        setSwapProgressState('error');
      } finally {
        setIsSwapping(false);
      }
    }, 100); // 100ms delay pentru modal rendering
  }, [swapData, fromAmount, toAmount, inputError, walletAddress, wallet, needsApproval, slippage, deadline, quoteData, normalizeAmount, recordAsSimulated, recordOutcomeAfterSwap]);

  // Repair BSC: fix network then retry swap once
  const handleRepairAndRetry = useCallback(async () => {
    const ethereum = swapExecutionService.getEthereumProvider();
    if (!ethereum) {
      setError('Wallet is not connected');
      return;
    }
    const repaired = await repairBscNetwork(ethereum);
    if (!repaired) return;
    setShowRepairModal(false);
    hasRetriedAfterRepairRef.current = true;
    const p = repairRetryParamsRef.current;
    if (!p) return;
    setSwapProgressState('swapping');
    setTxStatus({ status: 'pending', hash: null });
    setIsSwapping(true);
    try {
      const result = await swapExecutionService.executeSwap(
        p.tokenIn,
        p.tokenOut,
        p.amountIn,
        p.recipient,
        p.slippage,
        p.deadline,
        p.minOut ?? null,
        wallet?.signer ?? null
      );
      setTxStatus({ status: 'confirmed', hash: result.hash });
      setSwapProgressState('success');
      setSuccessSnapshot({ fromAmount: p.amountIn, toAmount: quoteData?.amountOut ?? null, txHash: result.hash });
      logWithPrefix('SwapPanel', '[SWAP] Swap confirmed after repair:', result);
      recordOutcomeAfterSwap(walletAddress, swapData, quoteData, result.hash, recordAsSimulated, p.slippage, swapData?.fee ?? 0.25, p.amountIn);
      setTimeout(() => {
        setFromAmount('');
        setToAmount('');
        setSliderValue(-1);
        setTxStatus(null);
      }, 3000);
    } catch (err) {
      errorWithPrefix('SwapPanel', '[SWAP] Retry after repair failed:', err);
      setError(err?.message || 'Swap failed');
      setTxStatus({ status: 'failed', hash: null, error: err?.message });
      setSwapProgressState('error');
    } finally {
        setIsSwapping(false);
      }
    }, [swapData, quoteData, walletAddress, wallet, recordAsSimulated, recordOutcomeAfterSwap]);

  // Swap execution logic moved to handleSwapClick

  // Set Pay amount so you receive ~1 USDT (when To = USDT)
  const handleSetReceive1USDT = useCallback(() => {
    if (!swapData || swapData.toToken.symbol !== 'USDT') return;
    const toPrice = swapData.toToken.price || 1;
    const fromPrice = swapData.fromToken.price || 0;
    const rate = fromPrice > 0 && toPrice > 0 ? fromPrice / toPrice : swapData.rate || 0;
    if (rate <= 0) return;
    const feeFactor = 1 - (swapData.fee || 0) / 100;
    const slippageFactor = 1 - (slippage || 0) / 100;
    const amountIn = 1 / (rate * feeFactor * slippageFactor);
    const rounded = Math.min(amountIn * 1.02, swapData.fromToken.balance || 0);
    setFromAmount(rounded > 0 ? String(Number(rounded.toFixed(8))) : '');
    setSliderValue(-1);
  }, [swapData, slippage]);

  const handleReverse = useCallback(() => {
    if (swapData) {
      // New object (immutability)
      const newSwapData = {
        ...swapData,
        fromToken: { ...swapData.toToken },
        toToken: { ...swapData.fromToken },
        rate: 1 / swapData.rate
      };
      setSwapData(newSwapData);
      
      // Inverseaz─â amount-urile
      const tempAmount = fromAmount;
      setFromAmount(toAmount);
      setToAmount(tempAmount);
      
      // Error clearing removed - no errors in main UI
    }
  }, [swapData, fromAmount, toAmount]);

  const handleFromTokenSelect = useCallback(async (token) => {
    if (swapData && token && token.symbol !== swapData.toToken.symbol) {
      const tokenData = tokens.find(t => t.symbol === token.symbol);
      if (tokenData) {
        // Get real balance if wallet is connected
        // Note: Balance can be loaded even if user is not authenticated (wallet connected via Header)
        let realBalance = parseFloat(tokenData.balance || '0');
        if (walletAddress) {
          try {
            setBalancesLoading(true);
            logWithPrefix('SwapPanel', `­čöä Fetching balance for ${tokenData.symbol}...`, { walletAddress });
            const balance = await walletBalanceService.getBalanceForToken(walletAddress, tokenData.symbol);
            realBalance = parseFloat(balance || '0');
            logWithPrefix('SwapPanel', `Ôťů Balance fetched for ${tokenData.symbol}:`, { balance, realBalance });
            // Update token balance in tokens list
            setTokens(prevTokens => 
              prevTokens.map(t => 
                t.symbol === tokenData.symbol 
                  ? { ...t, balance: balance || '0' }
                  : t
              )
            );
          } catch (error) {
            errorWithPrefix('SwapPanel', `ÔŁî Error getting balance for ${tokenData.symbol}:`, error);
            // Use tokenData balance as fallback
          } finally {
            setBalancesLoading(false);
          }
        }

        const newSwapData = {
          ...swapData,
          fromToken: {
            symbol: tokenData.symbol,
            balance: realBalance,
            price: tokenData.price
          },
          rate: tokenData.price / swapData.toToken.price
        };
        setSwapData(newSwapData);
        setShowFromTokenSelector(false);
        setError(null);
      }
    }
  }, [swapData, tokens, walletAddress]); // Removed isAuthenticated - balance can be loaded if wallet is connected

  const handleToTokenSelect = useCallback(async (token) => {
    if (swapData && token && token.symbol !== swapData.fromToken.symbol) {
      const tokenData = tokens.find(t => t.symbol === token.symbol);
      if (tokenData) {
        // Get real balance if wallet is connected
        // Note: Balance can be loaded even if user is not authenticated (wallet connected via Header)
        let realBalance = parseFloat(tokenData.balance || '0');
        if (walletAddress) {
          try {
            setBalancesLoading(true);
            const balance = await walletBalanceService.getBalanceForToken(walletAddress, tokenData.symbol);
            realBalance = parseFloat(balance || '0');
            // Update token balance in tokens list
            setTokens(prevTokens => 
              prevTokens.map(t => 
                t.symbol === tokenData.symbol 
                  ? { ...t, balance: balance || '0' }
                  : t
              )
            );
          } catch (error) {
            errorWithPrefix('SwapPanel', `Error getting balance for ${tokenData.symbol}:`, error);
            // Use tokenData balance as fallback
          } finally {
            setBalancesLoading(false);
          }
        }

        const newSwapData = {
          ...swapData,
          toToken: {
            symbol: tokenData.symbol,
            balance: realBalance,
            price: tokenData.price
          },
          rate: swapData.fromToken.price / tokenData.price
        };
        setSwapData(newSwapData);
        setShowToTokenSelector(false);
        setError(null);
      }
    }
  }, [swapData, tokens, walletAddress]); // Removed isAuthenticated - balance can be loaded if wallet is connected

  const handleSetPercentage = useCallback((percentage) => {
    if (swapData && swapData.fromToken.balance > 0) {
      const amount = (swapData.fromToken.balance * percentage / 100).toFixed(8);
      setFromAmount(amount);
      setSliderValue(percentage);
      setError(null);
    }
  }, [swapData]);

  // UI always visible - show loading only while initializing
  if (loading || !swapData) {
    return (
      <Card className="swap-panel-container">
        <div className="swap-panel-loading">
          {isAuthenticated && walletAddress 
            ? 'Loading real balances from blockchain...' 
            : 'Loading swap interface...'}
        </div>
      </Card>
    );
  }

  return (
    <Card className="swap-panel-container">
      <Card.Header>
        <Card.Title>Swap</Card.Title>
        <Button
          variant="ghost"
          size="sm"
          icon={<Settings size={18} />}
          title="Swap settings (slippage)"
          aria-label="Swap settings"
          onClick={() => setShowSettingsModal(true)}
        />
      </Card.Header>

      <Card.Body>
        {/* From Token - Pay Section: watermark în linia de input */}
        <div className="swap-panel-input-group">
          <div className="swap-panel-input-row">
            <input
              type="number"
              placeholder="Pay"
              value={fromAmount}
              onChange={(e) => {
                setFromAmount(e.target.value);
                setSliderValue(-1); // Reset preset când user tastează manual
                // Error clearing removed
              }}
              min="0"
              step="0.00000001"
              className="swap-panel-amount-input"
              aria-label="Amount to pay"
              aria-describedby={inputError ? "swap-error" : undefined}
            />
            <button
              type="button"
              className="swap-panel-token-button"
              onClick={() => setShowFromTokenSelector(true)}
              aria-label="Select from token"
            >
              <TokenLogo symbol={swapData.fromToken.symbol} size="lg" showBorder />
              <span className="swap-panel-token-symbol">{swapData.fromToken.symbol}</span>
              <ChevronDown size={16} className="swap-panel-token-chevron" />
            </button>
          </div>
          <div className="swap-panel-amount-info">
            <span className="swap-panel-usd-value">
              {fromAmount ? formatUSD(parseFloat(fromAmount || 0) * swapData.fromToken.price) : '$0.00'}
            </span>
            <div className="swap-panel-balance-group">
              <span className="swap-panel-balance">
                Balance: {formatNumber(swapData.fromToken.balance)}
              </span>
            </div>
          </div>
          {/* Input error moved to button text - no text in main UI */}
        </div>

        {/* Swap Button - Centered overlapping */}
        <div className="swap-panel-swap-button-container">
          <Button
            variant="ghost"
            size="md"
            icon={<ArrowDownUp size={20} />}
            onClick={handleReverse}
            title="Reverse tokens"
            aria-label="Reverse tokens"
            className="swap-panel-swap-button"
          />
        </div>

        {/* To Token - Receive Section */}
        <div className="swap-panel-input-group">
          <div className="swap-panel-input-row">
            <input
              type="text"
              placeholder={quoteLoading ? "Loading..." : "Receive"}
              value={quoteLoading ? "..." : toAmount}
              readOnly
              className="swap-panel-amount-input"
              disabled={quoteLoading}
            />
            <button
              type="button"
              className="swap-panel-token-button"
              onClick={() => setShowToTokenSelector(true)}
              aria-label="Select receive token"
            >
              <TokenLogo symbol={swapData.toToken.symbol} size="lg" showBorder />
              <span className="swap-panel-token-symbol">{swapData.toToken.symbol}</span>
              <ChevronDown size={16} className="swap-panel-token-chevron" />
            </button>
          </div>
          <div className="swap-panel-amount-info">
            <span className="swap-panel-usd-value">
              {toAmount ? formatUSD(parseFloat(toAmount || 0) * swapData.toToken.price) : '$0.00'}
            </span>
            <div className="swap-panel-amount-info-right">
              {swapData.fromToken.symbol === 'BNB' && swapData.toToken.symbol === 'USDT' && (
                <button
                  type="button"
                  className="swap-panel-quick-amount-btn"
                  onClick={handleSetReceive1USDT}
                  title="Set Pay amount to receive ~1 USDT"
                >
                  ~1 USDT
                </button>
              )}
              <span className="swap-panel-balance">
                Balance: {formatNumber(swapData.toToken.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Percentage Buttons - Oxium style (NO slider track) */}
        {swapData.fromToken.balance > 0 && (
          <div className="swap-panel-percentage-buttons">
            <button 
              type="button"
              className={`swap-panel-percentage-btn ${sliderValue === 25 ? 'active' : ''}`}
              onClick={() => handleSetPercentage(25)}
            >
              25%
            </button>
            <button 
              type="button"
              className={`swap-panel-percentage-btn ${sliderValue === 50 ? 'active' : ''}`}
              onClick={() => handleSetPercentage(50)}
            >
              50%
            </button>
            <button 
              type="button"
              className={`swap-panel-percentage-btn ${sliderValue === 75 ? 'active' : ''}`}
              onClick={() => handleSetPercentage(75)}
            >
              75%
            </button>
            <button 
              type="button"
              className={`swap-panel-percentage-btn ${sliderValue === 100 ? 'active' : ''}`}
              onClick={() => handleSetPercentage(100)}
            >
              100%
            </button>
          </div>
        )}

        {/* Rate Info - Only when amounts are entered */}
        {fromAmount && toAmount && !inputError && (
          <div className="swap-panel-rate-info">
            {quoteLoading ? (
              <div className="swap-panel-rate-item">
                <span>Loading quote...</span>
              </div>
            ) : quoteData ? (
              <>
                {quoteData.priceImpact > 0.1 && (
                  <div className="swap-panel-rate-item swap-panel-rate-warning">
                    <span>Price Impact:</span>
                    <span>{quoteData.priceImpact.toFixed(2)}%</span>
                  </div>
                )}
                <div className="swap-panel-rate-item" title="0.1% of the paid amount goes to the protocol treasury (BitSwapDEX)">
                  <span>Protocol Fee:</span>
                  <span>
                    {swapData.fee}%
                    {fromAmount && parseFloat(fromAmount) > 0 && (
                      <span className="swap-panel-fee-amount">
                        ≈ {formatNumber((parseFloat(fromAmount) * swapData.fee) / 100)} {swapData.fromToken.symbol}
                        {swapData.fromToken.price > 0 && (
                          <> (~${((parseFloat(fromAmount) * swapData.fromToken.price * swapData.fee) / 100).toFixed(2)})</>
                        )}
                      </span>
                    )}
                  </span>
                </div>
                {slippage > 0 && quoteData.minOut && (
                  <div className="swap-panel-rate-item swap-panel-rate-warning">
                    <span>Min. received:</span>
                    <span>{formatNumber(parseFloat(quoteData.minOut || 0))} {swapData.toToken.symbol}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="swap-panel-rate-item" title="0.1% of the paid amount goes to the protocol treasury (BitSwapDEX)">
                  <span>Protocol Fee:</span>
                  <span>
                    {swapData.fee}%
                    {fromAmount && parseFloat(fromAmount) > 0 && (
                      <span className="swap-panel-fee-amount">
                        ≈ {formatNumber((parseFloat(fromAmount) * swapData.fee) / 100)} {swapData.fromToken.symbol}
                        {swapData?.fromToken?.price > 0 && (
                          <> (~${((parseFloat(fromAmount) * swapData.fromToken.price * swapData.fee) / 100).toFixed(2)})</>
                        )}
                      </span>
                    )}
                  </span>
                </div>
                {slippage > 0 && (
                  <div className="swap-panel-rate-item swap-panel-rate-warning">
                    <span>Min. received:</span>
                    <span>{formatNumber(parseFloat(toAmount || 0))} {swapData.toToken.symbol}</span>
                  </div>
                )}
              </>
            )}
            {quoteError && (
              <div className="swap-panel-error-text" style={{ marginTop: '8px' }} role="status">
                Quote unavailable. Using estimated rate — you can still swap.
              </div>
            )}
          </div>
        )}

        {/* Error messages moved to SwapProgressModal - zona butonului curățată */}

      </Card.Body>

      <Card.Footer>
        {/* Button - Full Width */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={!walletAddress ? login : (needsApproval && swapData?.fromToken?.symbol !== 'BNB' ? handleApprove : handleSwapClick)}
          disabled={walletAddress && (needsApproval ? (isApproving || !fromAmount || parseFloat(fromAmount) <= 0 || inputError) : (isSwapping || !fromAmount || parseFloat(fromAmount) <= 0 || inputError || quoteLoading))}
          aria-label={!walletAddress ? 'Connect wallet to swap' : (needsApproval && swapData?.fromToken?.symbol !== 'BNB' ? 'Approve token for swap' : 'Execute swap')}
        >
          {!walletAddress
            ? 'Connect Wallet to Swap'
            : needsApproval && swapData?.fromToken?.symbol !== 'BNB'
            ? (isApproving ? 'Approving...' : `Approve ${swapData.fromToken.symbol}`)
            : isSwapping 
            ? 'Swapping...' 
            : !fromAmount || parseFloat(fromAmount) <= 0 
            ? 'Enter amount' 
            : inputError
            ? 'Invalid amount'
            : quoteLoading
            ? 'Loading quote...'
            : `Swap`
          }
        </Button>

        {/* P2.3 Paper trading: record outcome as simulated – sub buton */}
        {walletAddress && (
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--token-text-secondary)',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={recordAsSimulated}
              onChange={(e) => setRecordAsSimulated(e.target.checked)}
              aria-label="Record outcome as paper trade (simulated)"
            />
            <span>Record outcome as paper trade (simulated)</span>
          </label>
        )}

        {/* Max Slippage + Wallet - Single Row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%',
          marginTop: '8px',
          fontSize: '12px',
          color: 'var(--token-text-secondary)',
          gap: '12px'
        }}>
          {/* Wallet Info - Left */}
          {isAuthenticated && walletAddress && (
            <div style={{ flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {balancesLoading ? 'Loading balances...' : `Wallet: ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
            </div>
          )}
          
          {/* Max Slippage - Right (click to open Settings) */}
          <div 
            onClick={() => setShowSettingsModal(true)}
            style={{ 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              border: '2px solid var(--ds-accent, #f7931a)',
              backgroundColor: 'rgba(247, 147, 26, 0.18)',
              boxShadow: '0 0 12px rgba(247, 147, 26, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(247, 147, 26, 0.28)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(247, 147, 26, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(247, 147, 26, 0.18)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(247, 147, 26, 0.2)';
            }}
            title="Click to adjust slippage tolerance. If swap fails, try 3% or 4%."
          >
            <Settings size={22} style={{ color: 'var(--ds-accent, #f7931a)', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Max Slippage</span>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ds-accent, #f7931a)' }}>{slippage}%</span>
          </div>
        </div>
        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--token-text-secondary)', lineHeight: 1.3 }}>
          <span style={{ opacity: 0.85 }}>If swap fails with &quot;couldn&apos;t be completed&quot;, </span>
          <button type="button" onClick={() => setShowSettingsModal(true)} style={{ background: 'none', border: 'none', color: 'var(--ds-accent, #f7931a)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}>increase slippage</button>
          <span style={{ opacity: 0.85 }}> to 3–4% in Settings.</span>
        </div>

        {/* Connect wallet message removed - zona butonului curățată */}

        {/* Transaction status moved to SwapProgressModal - zona butonului curățată */}
      </Card.Footer>

      {/* Token selector modals - Pay (From) and Receive (To) - list visible immediately */}
      {showFromTokenSelector && (() => {
        const excludeSymbol = swapData?.toToken?.symbol;
        const available = tokens.filter(t => t.symbol !== excludeSymbol);
        const q = (tokenSearchQuery || '').trim().toLowerCase();
        const filtered = q
          ? available.filter(t => t.symbol.toLowerCase().includes(q) || (t.name || '').toLowerCase().includes(q))
          : available;
        const order = ['BNB', 'CAKE', 'USDT', 'ETH', 'BTC', 'SOL', 'STX', 'DOGE', 'MATIC', 'SHIB'];
        const sorted = [...filtered].sort((a, b) => {
          const ia = order.indexOf(a.symbol);
          const ib = order.indexOf(b.symbol);
          if (ia >= 0 && ib >= 0) return ia - ib;
          if (ia >= 0) return -1;
          if (ib >= 0) return 1;
          return (a.symbol || '').localeCompare(b.symbol || '');
        });
        return (
          <div
            className="swap-panel-token-selector-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Select pay token"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowFromTokenSelector(false); setTokenSearchQuery(''); } }}
          >
            <div className="swap-panel-token-selector-modal" onClick={(e) => e.stopPropagation()}>
              <div className="swap-panel-token-selector-header">
                <h3>Select Pay token</h3>
                <button type="button" className="swap-panel-token-selector-close" onClick={() => { setShowFromTokenSelector(false); setTokenSearchQuery(''); }} aria-label="Close"><X size={20} /></button>
              </div>
              <div className="swap-panel-token-selector-body">
                <div className="swap-panel-token-selector-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search token..."
                    value={tokenSearchQuery}
                    onChange={(e) => setTokenSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="swap-panel-token-selector-list">
                  {sorted.map((t) => (
                    <button
                      key={t.symbol}
                      type="button"
                      className={`swap-panel-token-selector-item ${swapData?.fromToken?.symbol === t.symbol ? 'selected' : ''}`}
                      onClick={() => { handleFromTokenSelect(t); setShowFromTokenSelector(false); setTokenSearchQuery(''); }}
                    >
                      <TokenLogo symbol={t.symbol} size="md" showBorder />
                      <div className="swap-panel-token-selector-item-info">
                        <span className="swap-panel-token-selector-symbol">{t.symbol}</span>
                        <span className="swap-panel-token-selector-name">{t.name || t.symbol}</span>
                      </div>
                      {t.balance != null && parseFloat(t.balance) > 0 && <span className="swap-panel-token-selector-balance">{parseFloat(t.balance).toFixed(4)}</span>}
                      {swapData?.fromToken?.symbol === t.symbol && <Check size={16} className="swap-panel-token-selector-check" />}
                    </button>
                  ))}
                  {sorted.length === 0 && <div className="swap-panel-token-selector-empty">No tokens found</div>}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {showToTokenSelector && (() => {
        const excludeSymbol = swapData?.fromToken?.symbol;
        const available = tokens.filter(t => t.symbol !== excludeSymbol);
        const q = (tokenSearchQuery || '').trim().toLowerCase();
        const filtered = q
          ? available.filter(t => t.symbol.toLowerCase().includes(q) || (t.name || '').toLowerCase().includes(q))
          : available;
        const order = ['BNB', 'CAKE', 'USDT', 'ETH', 'BTC', 'SOL', 'STX', 'DOGE', 'MATIC', 'SHIB'];
        const sorted = [...filtered].sort((a, b) => {
          const ia = order.indexOf(a.symbol);
          const ib = order.indexOf(b.symbol);
          if (ia >= 0 && ib >= 0) return ia - ib;
          if (ia >= 0) return -1;
          if (ib >= 0) return 1;
          return (a.symbol || '').localeCompare(b.symbol || '');
        });
        return (
          <div
            className="swap-panel-token-selector-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Select receive token"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowToTokenSelector(false); setTokenSearchQuery(''); } }}
          >
            <div className="swap-panel-token-selector-modal" onClick={(e) => e.stopPropagation()}>
              <div className="swap-panel-token-selector-header">
                <h3>Select Receive token</h3>
                <button type="button" className="swap-panel-token-selector-close" onClick={() => { setShowToTokenSelector(false); setTokenSearchQuery(''); }} aria-label="Close"><X size={20} /></button>
              </div>
              <div className="swap-panel-token-selector-body">
                <div className="swap-panel-token-selector-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search token..."
                    value={tokenSearchQuery}
                    onChange={(e) => setTokenSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="swap-panel-token-selector-list">
                  {sorted.map((t) => (
                    <button
                      key={t.symbol}
                      type="button"
                      className={`swap-panel-token-selector-item ${swapData?.toToken?.symbol === t.symbol ? 'selected' : ''}`}
                      onClick={() => { handleToTokenSelect(t); setShowToTokenSelector(false); setTokenSearchQuery(''); }}
                    >
                      <TokenLogo symbol={t.symbol} size="md" showBorder />
                      <div className="swap-panel-token-selector-item-info">
                        <span className="swap-panel-token-selector-symbol">{t.symbol}</span>
                        <span className="swap-panel-token-selector-name">{t.name || t.symbol}</span>
                      </div>
                      {t.balance != null && parseFloat(t.balance) > 0 && <span className="swap-panel-token-selector-balance">{parseFloat(t.balance).toFixed(4)}</span>}
                      {swapData?.toToken?.symbol === t.symbol && <Check size={16} className="swap-panel-token-selector-check" />}
                    </button>
                  ))}
                  {sorted.length === 0 && <div className="swap-panel-token-selector-empty">No tokens found</div>}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Swap Settings Modal */}
      <SwapSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        slippage={slippage}
        onSlippageChange={setSlippage}
        deadline={deadline}
        onDeadlineChange={setDeadline}
      />

      {/* 🆕 Swap Progress Modal */}
      <SwapProgressModal
        isOpen={showProgressModal}
        onClose={() => {
          setShowProgressModal(false);
          setSwapProgressState('idle');
          setError(null);
          setSuccessSnapshot(null);
          setIsSwapping(false);
        }}
        onOpenSettings={() => {
          setShowProgressModal(false);
          setShowSettingsModal(true);
          setSwapProgressState('idle');
          setError(null);
          setIsSwapping(false);
        }}
        swapState={swapProgressState}
        swapData={swapData}
        error={error}
        txHash={successSnapshot?.txHash ?? txStatus?.hash}
        fromAmount={successSnapshot?.fromAmount ?? fromAmount}
        toAmount={successSnapshot?.toAmount ?? toAmount}
        feeAmount={(successSnapshot?.fromAmount || fromAmount) && swapData ? (parseFloat(successSnapshot?.fromAmount || fromAmount) * swapData.fromToken.price * 0.1 / 100) : 0}
      />

      <RepairBscModal
        isOpen={showRepairModal}
        onClose={() => setShowRepairModal(false)}
        onFix={handleRepairAndRetry}
      />

      <RpcRepairModal
        isOpen={showRpcRepairModal}
        onClose={() => setShowRpcRepairModal(false)}
        onFixed={() => setShowRpcRepairModal(false)}
      />

      {/* Old confirmation modal removed - replaced with SwapProgressModal */}
      {/* Old confirmation modal removed */}
    </Card>
  );
});

SwapPanel.displayName = 'SwapPanel';

export default SwapPanel;
