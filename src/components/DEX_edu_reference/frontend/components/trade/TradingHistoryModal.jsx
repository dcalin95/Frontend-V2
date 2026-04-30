/**
 * 📊 TradingHistoryModal Component - Trading History Modal
 * 
 * Modal pentru istoricul tranzacțiilor cu date reale:
 * - Lista de tranzacții cu detalii (din API)
 * - Filtre (tip, token, perioadă, status)
 * - Export (CSV, JSON)
 * - Paginare
 * 
 * @module TradingHistoryModal
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Download, Filter, X, TrendingUp, TrendingDown, ArrowUpDown, Calendar, Sparkles, ExternalLink, Bot, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../common/Modal/Modal';
import { Button, Badge } from '../ui';
import TokenLogo from '../common/TokenLogo';
import { getTrades } from '../../services/executionApiService';
import { getOTAHistory } from '../../services/aiTradingApiService';
import { getSwapOutcomeByTxHash, saveSwapOutcome } from '../../utils/swapOutcomesStorage';
import { fetchSwapDetailsFromTx } from '../../services/swapDetailsFromTx';
import tokenPriceService from '../../services/tokenPriceService';
import { useDexAuth } from '../../context/DexAuthContext';
import useWallet from '../../hooks/useWallet';
import { errorWithPrefix } from '../../utils/logger';
import Skeleton from '../common/Skeleton';
import '../../styles/components/trading-history-modal.css';

function dataToCSV(data, tab, formatDate, formatNumber) {
  if (!data || data.length === 0) return '';
  const isAnalysis = tab === 'analysis' || (data[0] && data[0].type === 'analysis');
  if (isAnalysis) {
    const headers = ['Date', 'Signal', 'Token', 'Decision score (heuristic)', 'Entry Price', 'Reasoning', 'Status'];
    const rows = data.map(item => [
      formatDate(item.timestamp || item.createdAt),
      (item.signal || 'hold').toUpperCase(),
      item.token,
      `${Math.round((item.confidence || 0) * 100)}%`,
      formatNumber(item.entryPrice || 0, 2),
      (item.reasoning || '').replace(/,/g, ';'),
      item.status || 'completed'
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  const headers = ['Date', 'Type', 'Token', 'Amount', 'Price', 'Total', 'Source', 'Fees', 'Slippage', 'TimeInTrade', 'CloseReason', 'Status', 'Tx'];
  const rows = data.map(item => [
    formatDate(item.timestamp || item.createdAt),
    (item.type || 'trade').toString().toUpperCase(),
    item.token,
    formatNumber(item.amount, 4),
    formatNumber(item.price, 2),
    formatNumber(item.value || item.total, 2),
    (item.source === 'ota_auto' || item.source === 'OTA Auto') ? 'OTA Auto' : (item.simulated ? 'Manual (Paper)' : 'Manual'),
    item.fees != null ? String(item.fees) : '–',
    item.slippage != null ? String(item.slippage) : '–',
    item.timeInTrade != null ? String(item.timeInTrade) : '–',
    (item.closeReason || '–').toString().replace(/,/g, ';'),
    item.status || 'completed',
    item.txHash || '–'
  ]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

const TradingHistoryModal = ({ isOpen, onClose, onBack }) => {
  const { walletAddress, associatedWalletAddress } = useDexAuth();
  const wallet = useWallet();
  const effectiveUserWallet = walletAddress || associatedWalletAddress || (wallet?.isConnected ? wallet?.walletAddress : null) || null;
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'trades', 'orders', 'analysis'
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'buy', 'sell', 'swap'
    token: 'all',
    status: 'all', // 'all', 'completed', 'pending', 'cancelled'
    dateRange: '7d' // '1d', '7d', '30d', 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceCache, setPriceCache] = useState({ BNB: 0, CAKE: 0 });

  // Fetch real data from API
  useEffect(() => {
    const loadData = async () => {
      if (!effectiveUserWallet) {
        setAllData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // If analysis tab, fetch OTA analysis history
        if (activeTab === 'analysis') {
          const response = await getOTAHistory(effectiveUserWallet, {
            limit: 100,
            offset: 0,
            token: filters.token !== 'all' ? filters.token : null
          });

          if (response.success && response.history) {
            // Transform analysis history to format expected by component
            const analysisItems = response.history.map(item => ({
              id: item.id || item._id || `analysis-${item.timestamp}`,
              type: 'analysis',
              token: item.token || 'N/A',
              signal: item.signal || 'hold',
              confidence: item.confidence || 0,
              reasoning: item.reasoning || '',
              entryPrice: item.entryPrice || 0,
              stopLoss: item.stopLoss || 0,
              takeProfit: item.takeProfit || 0,
              amount: 0,
              price: item.entryPrice || 0,
              value: 0,
              status: 'completed',
              timestamp: item.timestamp || item.createdAt || Date.now(),
              createdAt: item.createdAt || item.timestamp
            }));
            
            setAllData(analysisItems);
          } else {
            setAllData([]);
          }
        } else {
          // Fetch trades from /api/ai-trading/execution/trades
          const response = await getTrades(effectiveUserWallet, {
            limit: 100,
            offset: 0
          });

          const rawTrades = response.trades ?? response.data?.trades ?? response.data ?? [];
          const tradesList = Array.isArray(rawTrades) ? rawTrades : [];
          if (tradesList.length > 0 && process.env.NODE_ENV === 'development') {
            tradesList.forEach((t, i) => {
              const amtOut = t.amountOut ?? t.amount_out ?? t.amount;
              const amtIn = t.amountIn ?? t.amount_in;
              const val = t.value ?? t.total_value ?? t.total;
              const prc = t.price ?? t.entryPrice ?? t.exitPrice;
              if (prc == null || +prc === 0 || val == null || +val === 0) {
                console.log(`[TradingHistoryModal] API trade[${i}] fără price/value:`, { tokenIn: t.tokenIn ?? t.token_in, tokenOut: t.tokenOut ?? t.token_out, price: prc, value: val, amountIn: amtIn, amountOut: amtOut });
              }
            });
          }
          if (tradesList.length > 0) {
            const safeNum = (x) => { const n = parseFloat(x); return Number.isNaN(n) ? 0 : n; };
            const trades = tradesList.map(trade => {
              let amt = safeNum(trade.amountOut ?? trade.amount_out ?? trade.outputAmount ?? trade.output_amount ?? trade.amount ?? 0);
              let amtIn = safeNum(trade.amountIn ?? trade.amount_in ?? trade.inputAmount ?? trade.input_amount ?? 0);
              let prc = safeNum(trade.price ?? trade.entryPrice ?? trade.exitPrice ?? 0);
              let val = safeNum(trade.value ?? trade.total_value ?? trade.total) || amt * prc;
              const txHashForLookup = trade.txHash || trade.tx_hash || null;
              const stored = txHashForLookup ? getSwapOutcomeByTxHash(txHashForLookup) : null;
              let tokenIn = trade.tokenIn ?? trade.token_in ?? null;
              let tokenOut = trade.tokenOut ?? trade.token_out ?? trade.token ?? 'N/A';
              let fees = trade.fees != null ? trade.fees : null;
              let slippage = trade.slippage != null ? trade.slippage : null;
              if (stored && (amt === 0 || val === 0)) {
                if (stored.amount > 0) amt = stored.amount;
                if (stored.amountIn != null && stored.amountIn > 0) amtIn = stored.amountIn;
                if (stored.price > 0) prc = stored.price;
                if (stored.value > 0) val = stored.value;
                else if (amt > 0 && prc > 0) val = amt * prc;
                if (stored.tokenIn) tokenIn = stored.tokenIn;
                if (stored.tokenOut) tokenOut = stored.tokenOut;
                if (stored.fee != null) fees = stored.fee;
                if (stored.slippage != null) slippage = stored.slippage;
              }
              return {
              id: trade.id || trade._id,
              type: trade.type || (tokenIn && tokenOut ? 'swap' : 'trade'),
              token: tokenOut,
              tokenIn,
              tokenOut,
              amount: amt,
              amountIn: amtIn > 0 ? amtIn : null,
              price: prc,
              value: val,
              status: trade.status || 'completed',
              timestamp: trade.timestamp || trade.createdAt || trade.executedAt,
              createdAt: trade.createdAt || trade.timestamp,
              source: trade.source || trade.execution_mode || (trade.botAddress ? 'ota_auto' : null),
              simulated: trade.simulated === true || trade.simulated === 'true',
              txHash: trade.txHash || trade.tx_hash || null,
              fees,
              slippage,
              timeInTrade: trade.timeInTrade ?? trade.time_in_trade ?? null,
              closeReason: trade.closeReason ?? trade.close_reason ?? null
            };
            });

            // Sursă de adevăr: blockchain. Pentru orice trade cu txHash, încercăm fetchSwapDetailsFromTx.
            const withTxHash = trades.filter(t => t.txHash);
            if (withTxHash.length > 0) {
              const results = await Promise.allSettled(withTxHash.map(t => fetchSwapDetailsFromTx(t.txHash)));
              results.forEach((r, i) => {
                if (r.status === 'fulfilled' && r.value) {
                  const detail = r.value;
                  const trade = withTxHash[i];
                  const idx = trades.findIndex(t => t.txHash === trade.txHash);
                  if (idx >= 0 && detail.amountOut > 0) {
                    const row = trades[idx];
                    row.amount = detail.amountOut;
                    row.amountIn = detail.amountIn > 0 ? detail.amountIn : null;
                    if (detail.tokenIn) row.tokenIn = detail.tokenIn;
                    if (detail.tokenOut) row.tokenOut = detail.tokenOut;
                    saveSwapOutcome({
                      txHash: trade.txHash,
                      tokenIn: detail.tokenIn,
                      tokenOut: detail.tokenOut,
                      amountIn: detail.amountIn,
                      amountOut: detail.amountOut
                    });
                  }
                }
              });
            }

            // For trades with amount but value 0, fetch USD prices and compute total
            const needsPrice = trades.filter(t => {
              const hasAmount = t.amount > 0;
              const needsVal = (t.value == null || t.value === 0);
              const hasToken = !!(t.tokenOut || t.token || (t.tokenIn && t.amount < 1000));
              return hasAmount && needsVal && hasToken;
            });
            if (trades.some(t => t.value === 0)) {
              const sample = trades.find(t => t.value === 0);
              console.log('[TradingHistoryModal] tradesWithValue0', { needsPriceCount: needsPrice.length, sample: sample ? { tokenIn: sample.tokenIn, tokenOut: sample.tokenOut, token: sample.token, amount: sample.amount } : null });
            }
            if (needsPrice.length > 0) {
              const resolveSym = (t) => {
                let s = (t.tokenOut || t.token || '').toString().trim();
                if ((s.includes('→') || s.includes('-') || s.includes('/')) && s.length > 2) {
                  const parts = s.split(/[→\-/]/);
                  s = (parts[1] || parts[0] || '').trim();
                }
                const ti = (t.tokenIn || '').toString().toUpperCase();
                const to = (s || '').toUpperCase();
                if (ti === 'CAKE' && (to === 'WBNB' || to === 'BNB' || !to)) return 'BNB';
                if ((ti === 'WBNB' || ti === 'BNB') && (to === 'CAKE' || !to)) return 'CAKE';
                if (!s && ti === 'CAKE') return 'BNB';
                if (!s && (ti === 'WBNB' || ti === 'BNB')) return 'CAKE';
                return s;
              };
              const symbols = [...new Set([
                ...needsPrice.flatMap(t => {
                  const sym = resolveSym(t);
                  const out = sym ? [sym] : [];
                  const u = (sym || '').toUpperCase();
                  if (u === 'BNB' || u === 'WBNB') out.push('BNB');
                  if (u === 'CAKE') out.push('CAKE');
                  return out;
                }),
                'BNB', 'CAKE'
              ].filter(Boolean))];
              try {
                const prices = await tokenPriceService.getAllTokenPrices(symbols);
                console.log('[TradingHistoryModal] needsPrice', { count: needsPrice.length, symbols, pricesBNB: prices.BNB });
                for (const t of needsPrice) {
                  const idx = trades.findIndex(x => x === t);
                  if (idx < 0) continue;
                  const sym = resolveSym(t);
                  const symNorm = (sym || '').toUpperCase();
                  // Stablecoin = sursă de adevăr: preț 1 USD; nu folosi preț greșit stocat (ex. CAKE 1.31 pentru USDT)
                  if (symNorm === 'USDT' || symNorm === 'BUSD' || symNorm === 'USDC') {
                    const row = trades[idx];
                    const amt = t.amount || 0;
                    if (amt > 0) {
                      row.price = 1;
                      row.value = amt * 1;
                      if (row.txHash) {
                        saveSwapOutcome({
                          txHash: row.txHash,
                          tokenIn: row.tokenIn,
                          tokenOut: row.tokenOut || sym,
                          amountIn: row.amountIn,
                          amountOut: row.amount,
                          price: 1,
                          value: row.value
                        });
                      }
                    }
                    continue;
                  }
                  const priceFromApi = trades[idx].price > 0 ? trades[idx].price : null;
                  let priceUsd = priceFromApi ?? prices[sym] ?? prices[symNorm] ?? (symNorm === 'BNB' || symNorm === 'WBNB' ? (prices.BNB ?? 0) : (symNorm === 'CAKE' ? (prices.CAKE ?? 0) : 0));
                  if (priceUsd <= 0 && symNorm === 'BNB') {
                    try {
                      const bnbPrices = await tokenPriceService.getAllTokenPrices(['BNB']);
                      priceUsd = bnbPrices.BNB ?? 0;
                    } catch (_) {}
                  }
                  if (priceUsd <= 0 && symNorm === 'CAKE') {
                    try {
                      const cakePrices = await tokenPriceService.getAllTokenPrices(['CAKE']);
                      priceUsd = cakePrices.CAKE ?? 0;
                    } catch (_) {}
                  }
                  const amt = t.amount || 0;
                  const amtIn = t.amountIn || 0;
                  let tokenInNorm = (t.tokenIn || '').toString().toUpperCase();
                  const tokenStr = (t.tokenOut || t.token || '').toString();
                  if (!tokenInNorm && tokenStr.includes('→')) {
                    const parts = tokenStr.split(/[→\-/]/).map(p => p.trim());
                    if (parts[0]) tokenInNorm = parts[0].toUpperCase();
                  }
                  const isBnbOut = symNorm === 'BNB' || symNorm === 'WBNB';
                  const isCakeOut = symNorm === 'CAKE';
                  const isCakeIn = tokenInNorm === 'CAKE';
                  const isBnbIn = tokenInNorm === 'BNB' || tokenInNorm === 'WBNB';
                  const smallAmt = amt < 1 && amt > 0 ? amt : (amtIn < 1 && amtIn > 0 ? amtIn : 0);
                  const largeAmt = amt > 1 ? amt : (amtIn > 1 ? amtIn : 0);
                  let amountToUse = 0;
                  if (isBnbOut) {
                    amountToUse = smallAmt > 0 ? smallAmt : (isCakeIn && largeAmt > 0 ? largeAmt : 0);
                    if (amountToUse === largeAmt && isCakeIn) {
                      priceUsd = priceFromApi ?? prices.CAKE ?? 0;
                    }
                  } else if (isCakeOut) {
                    amountToUse = largeAmt > 0 ? largeAmt : (isBnbIn && smallAmt > 0 ? smallAmt : amt || amtIn);
                    if (amountToUse === smallAmt && isBnbIn) {
                      priceUsd = priceFromApi ?? prices.BNB ?? 0;
                    }
                  } else {
                    amountToUse = amt || amtIn;
                  }
                  if (priceUsd <= 0 && process.env.NODE_ENV === 'development') {
                    console.log('[TradingHistoryModal] priceUsd=0', { sym, tokenIn: t.tokenIn, tokenOut: t.tokenOut, amount: amt, amountIn: amtIn, amountToUse });
                  }
                  if (priceUsd > 0 && amountToUse > 0) {
                    const valueUsd = amountToUse * priceUsd;
                    const row = trades[idx];
                    row.price = priceUsd;
                    row.value = valueUsd;
                    if (row.txHash) {
                      saveSwapOutcome({
                        txHash: row.txHash,
                        tokenIn: row.tokenIn,
                        tokenOut: sym || row.tokenOut,
                        amountIn: row.amountIn,
                        amountOut: amountToUse,
                        price: priceUsd,
                        value: valueUsd
                      });
                    }
                  }
                }
              } catch (e) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[TradingHistoryModal] needsPrice fetch failed', e);
                }
              }
            }

            // Fallback final: orice trade cu value=0 dar cu amount SAU amountIn – calcul simplu
            const stillNeedsValue = trades.filter(t => {
              const v = t.value ?? 0;
              const amt = t.amount ?? 0;
              const amtIn = t.amountIn ?? 0;
              return (v === 0 || v == null) && (amt > 0 || amtIn > 0);
            });
            if (stillNeedsValue.length > 0) {
              try {
                const fallbackPrices = await tokenPriceService.getAllTokenPrices(['BNB', 'CAKE']);
                const bnbPrice = fallbackPrices.BNB ?? 0;
                const cakePrice = fallbackPrices.CAKE ?? 0;
                for (const t of stillNeedsValue) {
                  const idx = trades.findIndex(x => x === t);
                  if (idx < 0) continue;
                  const amt = t.amount || 0;
                  const amtIn = t.amountIn || 0;
                  const smallAmt = (amt > 0 && amt < 1) ? amt : ((amtIn > 0 && amtIn < 1) ? amtIn : 0);
                  const largeAmt = (amt > 1) ? amt : ((amtIn > 1) ? amtIn : 0);
                  const tokenStr = (t.tokenOut || t.token || t.tokenIn || '').toString().toUpperCase();
                  const hasBnb = tokenStr.includes('BNB') || tokenStr.includes('WBNB');
                  const hasCake = tokenStr.includes('CAKE');
                  let priceUsd = 0;
                  let amountToUse = 0;
                  if (smallAmt > 0 && bnbPrice > 0 && (hasBnb || !hasCake)) {
                    priceUsd = bnbPrice;
                    amountToUse = smallAmt;
                  } else if (largeAmt > 0 && cakePrice > 0 && (hasCake || !hasBnb)) {
                    priceUsd = cakePrice;
                    amountToUse = largeAmt;
                  } else if (smallAmt > 0 && bnbPrice > 0) {
                    priceUsd = bnbPrice;
                    amountToUse = smallAmt;
                  } else if (largeAmt > 0 && cakePrice > 0) {
                    priceUsd = cakePrice;
                    amountToUse = largeAmt;
                  }
                  if (priceUsd > 0 && amountToUse > 0) {
                    const row = trades[idx];
                    row.price = priceUsd;
                    row.value = amountToUse * priceUsd;
                    if (row.txHash) {
                      saveSwapOutcome({
                        txHash: row.txHash,
                        tokenIn: row.tokenIn,
                        tokenOut: row.tokenOut,
                        amountIn: row.amountIn,
                        amountOut: amountToUse,
                        price: priceUsd,
                        value: row.value
                      });
                    }
                  }
                }
              } catch (_) {}
            }

            const out = trades.map((t) => t);
            setAllData(out);
          } else {
            setAllData([]);
          }
        }
      } catch (err) {
        errorWithPrefix('TradingHistoryModal', '❌ ERROR:', err);
        setError(err?.message || String(err) || 'Unknown error');
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab, effectiveUserWallet, filters.token]);

  // Fetch prices pentru display fallback (BNB, CAKE, SOL, ETH când apar în tokenOut)
  useEffect(() => {
    const needs = allData.some(item => (item.value ?? 0) === 0 && ((item.amount ?? 0) > 0 || (item.amountIn ?? 0) > 0));
    if (!needs || !isOpen) return;
    const symbols = ['BNB', 'CAKE'];
    allData.forEach(item => {
      const out = (item.tokenOut || item.token || '').toString().toUpperCase();
      if (out && !symbols.includes(out) && ['SOL', 'ETH', 'BTC', 'DOGE', 'MATIC', 'SHIB'].includes(out)) symbols.push(out);
    });
    tokenPriceService.getAllTokenPrices(symbols).then(p => {
      setPriceCache({
        BNB: p.BNB ?? 0,
        CAKE: p.CAKE ?? 0,
        SOL: p.SOL ?? 0,
        ETH: p.ETH ?? 0,
        BTC: p.BTC ?? 0,
        DOGE: p.DOGE ?? 0,
        MATIC: p.MATIC ?? 0,
        SHIB: p.SHIB ?? 0
      });
    }).catch(() => {});
  }, [allData, isOpen]);

  // Filter data (fără inventare – afișăm doar date reale, "–" când lipsesc)
  const filteredData = useMemo(() => {
    let filtered = allData.map((item) => ({ ...item }));

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    // Filter by token
    if (filters.token !== 'all') {
      filtered = filtered.filter(item => item.token === filters.token);
    }

    // Filter by status (executed/confirmed = completed for OTA execution_history)
    if (filters.status !== 'all') {
      const want = filters.status;
      const isSuccess = (s) => s === 'completed' || s === 'executed' || s === 'confirmed';
      filtered = filtered.filter((item) => {
        const s = item.status;
        if (want === 'completed' && isSuccess(s)) return true;
        return s === want;
      });
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = filters.dateRange === '1d' ? 1 : filters.dateRange === '7d' ? 7 : 30;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp || item.createdAt);
        return itemDate >= cutoffDate;
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt);
      const dateB = new Date(b.timestamp || b.createdAt);
      return dateB - dateA;
    });
  }, [allData, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const formatNumber = useCallback((num, decimals = 2) => {
    const n = typeof num === 'number' && !Number.isNaN(num) ? num : 0;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(n);
  }, []);

  const formatDate = useCallback((timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const handleExport = useCallback((format) => {
    const dataStr = format === 'csv'
      ? dataToCSV(filteredData, activeTab, formatDate, formatNumber)
      : JSON.stringify(filteredData, null, 2);

    const blob = new Blob([dataStr], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trading-history-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Export completed', {
      description: `Exported ${filteredData.length} transactions as ${format.toUpperCase()}`,
      duration: 3000
    });
  }, [filteredData, activeTab, formatDate, formatNumber]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      token: 'all',
      status: 'all',
      dateRange: '7d'
    });
    setCurrentPage(1);
  }, []);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== 'all' && v !== '7d').length;
  }, [filters]);

  const tokens = useMemo(() => {
    const tokenSet = new Set();
    allData.forEach(item => {
      if (item.token) tokenSet.add(item.token);
    });
    return Array.from(tokenSet).sort();
  }, [allData]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trading History"
      size="fullscreen"
      className="trading-history-modal"
    >
      <div className="trading-history-modal-content">
        {!wallet?.isConnected && (
            <div className="trading-history-wallet-hint" role="alert">
              <span>Wallet not connected. Connect your wallet to view trading history.</span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => wallet?.connectWallet?.('evm')}
              >
                Connect wallet
              </Button>
            </div>
        )}
        {error && (
          <div className="trading-history-modal-error" role="alert">
            <span>Could not load trades: {error}</span>
          </div>
        )}
        {/* Tabs */}
        <div className="trading-history-tabs">
          <button
            className={`trading-history-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
          >
            All Activity
          </button>
          <button
            className={`trading-history-tab ${activeTab === 'trades' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('trades');
              setCurrentPage(1);
            }}
          >
            Trades
          </button>
          <button
            className={`trading-history-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('orders');
              setCurrentPage(1);
            }}
          >
            Orders
          </button>
          <button
            className={`trading-history-tab ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('analysis');
              setCurrentPage(1);
            }}
            title="OTA decisions (rule-based + LLM). Not calibrated analysis."
          >
            OTA signals
          </button>
        </div>

        {/* Toolbar */}
        <div className="trading-history-toolbar">
          <div className="trading-history-toolbar-left">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={16} />}
              onClick={onBack || onClose}
            >
              Back
            </Button>
            <span className="trading-history-toolbar-sep" />
            <Button
              variant="ghost"
              size="sm"
              icon={<Filter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="default" size="sm" style={{ marginLeft: '8px' }}>
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>
          <div className="trading-history-toolbar-right">
            <Button
              variant="ghost"
              size="sm"
              icon={<Download size={16} />}
              onClick={() => handleExport('csv')}
            >
              Export CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Download size={16} />}
              onClick={() => handleExport('json')}
            >
              Export JSON
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="trading-history-filters">
            <div className="trading-history-filter-group">
              <label>Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="trading-history-filter-select"
              >
                <option value="all">All Types</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="swap">Swap</option>
              </select>
            </div>

            <div className="trading-history-filter-group">
              <label>Token</label>
              <select
                value={filters.token}
                onChange={(e) => handleFilterChange('token', e.target.value)}
                className="trading-history-filter-select"
              >
                <option value="all">All Tokens</option>
                {tokens.map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>

            <div className="trading-history-filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="trading-history-filter-select"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="trading-history-filter-group">
              <label>Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="trading-history-filter-select"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="trading-history-results">
          <span>
            Showing {paginatedData.length} of {filteredData.length} transactions
          </span>
        </div>

        {/* Table */}
        <div className="trading-history-table-container">
            <table className="trading-history-table" role="table" aria-label="Trading history">
            <thead>
              <tr role="row">
                <th scope="col">Date</th>
                <th scope="col">{activeTab === 'analysis' ? 'Signal' : 'Type'}</th>
                <th scope="col">Token</th>
                {activeTab === 'analysis' ? (
                  <>
                    <th scope="col" title="Heuristic decision score; not a calibrated probability.">Decision score</th>
                    <th scope="col">Entry Price</th>
                    <th scope="col">Reasoning</th>
                  </>
                ) : (
                  <>
                    <th scope="col">Amount</th>
                    <th scope="col">Price</th>
                    <th scope="col">Total</th>
                    <th scope="col">Source</th>
                    <th scope="col">Fee / Slippage</th>
                  </>
                )}
                <th scope="col">Status</th>
                {activeTab !== 'analysis' && <th scope="col">Tx</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} aria-hidden>
                    {Array.from({ length: activeTab === 'analysis' ? 7 : 10 }).map((_, j) => (
                      <td key={j}><Skeleton variant="text" height={16} style={{ width: j === 2 ? '80%' : '60%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'analysis' ? 7 : 10} className="trading-history-empty">
                    {activeTab === 'analysis' ? (
                      <>
                        No OTA signal history found.
                        <span className="trading-history-empty-hint">
                          Run &quot;Analyze market&quot; in Signals to see OTA decisions (rule-based + LLM) here.
                        </span>
                      </>
                    ) : !effectiveUserWallet ? (
                      <>
                        Connect your wallet to view trading history.
                        <span className="trading-history-empty-hint">
                          Connect in the header, then sign in with wallet for full access.
                        </span>
                      </>
                    ) : (
                      <>
                        No transactions found.
                        <span className="trading-history-empty-hint">
                          Manual swaps and OTA Auto executions will show here. Make a swap on Swap to record outcomes.
                        </span>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIndex) => {
                  const toLabel = (s) => (s && (String(s).toUpperCase() === 'WBNB')) ? 'BNB' : (s || '');
                  return (
                  <tr key={item.id ?? item.txHash ?? `row-${rowIndex}`} role="row">
                    <td style={{ color: 'inherit', visibility: 'visible' }}>{formatDate(item.timestamp || item.createdAt)}</td>
                    <td>
                      {activeTab === 'analysis' ? (
                        <div className={`trading-history-type trading-history-type-${item.signal || 'hold'}`}>
                          {item.signal === 'buy' ? (
                            <TrendingUp size={14} />
                          ) : item.signal === 'sell' ? (
                            <TrendingDown size={14} />
                          ) : (
                            <Sparkles size={14} />
                          )}
                          <span>{(item.signal || 'hold').toUpperCase()}</span>
                        </div>
                      ) : (
                        <div className={`trading-history-type trading-history-type-${item.type || 'swap'}`}>
                          {(item.type || 'swap') === 'buy' ? (
                            <TrendingUp size={14} />
                          ) : (item.type || 'swap') === 'sell' ? (
                            <TrendingDown size={14} />
                          ) : (
                            <ArrowUpDown size={14} />
                          )}
                          <span>{(item.type || 'swap').toUpperCase()}</span>
                        </div>
                      )}
                    </td>
<td style={{ color: 'inherit', visibility: 'visible' }}>
                        <div className="trading-history-token">
                          {item.tokenIn && item.tokenOut ? (
                            <>
                              <TokenLogo symbol={item.tokenIn === 'WBNB' ? 'BNB' : item.tokenIn} size="sm" showBorder />
                              <span className="trading-history-token-sep">/</span>
                              <TokenLogo symbol={(item.tokenOut || item.token) === 'WBNB' ? 'BNB' : (item.tokenOut || item.token)} size="sm" showBorder />
                              <span>{`${toLabel(item.tokenIn)}/${toLabel(item.tokenOut)}`}</span>
                            </>
                          ) : (
                            <>
                              <TokenLogo symbol={(item.tokenOut || item.token) === 'WBNB' ? 'BNB' : (item.tokenOut || item.token)} size="sm" showBorder />
                              <span>{toLabel(item.tokenOut || item.token) || '–'}</span>
                            </>
                          )}
                        </div>
                    </td>
                    {activeTab === 'analysis' ? (
                      <>
                        <td>
                          <div className="trading-history-confidence">
                            <span>{Math.round((item.confidence || 0) * 100)}%</span>
                          </div>
                        </td>
                        <td>${formatNumber(item.entryPrice || 0, 2)}</td>
                        <td>
                          <span className="trading-history-reasoning" title={item.reasoning || ''}>
                            {item.reasoning ? (item.reasoning.length > 50 ? item.reasoning.substring(0, 50) + '...' : item.reasoning) : '-'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        {(() => {
                          const ai = item.amountIn ?? item.amount_in ?? item.from_amount ?? item.inputAmount;
                          const ao = item.amount ?? item.amount_out ?? item.amountOut ?? item.to_amount ?? item.outputAmount;
                          const hasBoth = ai != null && +ai > 0 && ao != null && +ao > 0;
                          const n1 = hasBoth ? (parseFloat(ai) || 0) : (parseFloat(ao) ?? parseFloat(ai) ?? 0);
                          const n2 = hasBoth ? (parseFloat(ao) || 0) : 0;
                          const amtStr = hasBoth ? `${formatNumber(n1, 4)} → ${formatNumber(n2, 4)}` : formatNumber(n1 || n2, 4);
                          let priceVal = +item.price || 0;
                          let totalVal = +item.value || +item.total || 0;
                          const anyAmt = n1 > 0 || n2 > 0;
                          const priceMissing = priceVal <= 0 || formatNumber(priceVal, 2) === '0.00';
                          const totalMissing = totalVal <= 0 || formatNumber(totalVal, 2) === '0.00';
                          if (anyAmt && (priceMissing || totalMissing)) {
                            const outAmt = hasBoth ? n2 : (n1 || n2);
                            const outToken = (item.tokenOut || item.token || '').toString().toUpperCase();
                            const bnbP = priceCache.BNB > 0 ? priceCache.BNB : 620;
                            const cakeP = priceCache.CAKE > 0 ? priceCache.CAKE : 1.3;
                            let displayPrice = 0;
                            if (outToken === 'USDT' || outToken === 'BUSD' || outToken === 'USDC') {
                              displayPrice = 1;
                            } else if (outToken === 'SOL' && (priceCache.SOL ?? 0) > 0) {
                              displayPrice = priceCache.SOL;
                            } else if (outToken === 'ETH' && (priceCache.ETH ?? 0) > 0) {
                              displayPrice = priceCache.ETH;
                            } else if (outToken === 'BTC' && (priceCache.BTC ?? 0) > 0) {
                              displayPrice = priceCache.BTC;
                            } else if (outToken === 'DOGE' && (priceCache.DOGE ?? 0) > 0) {
                              displayPrice = priceCache.DOGE;
                            } else if (outToken === 'MATIC' && (priceCache.MATIC ?? 0) > 0) {
                              displayPrice = priceCache.MATIC;
                            } else if (outToken === 'SHIB' && (priceCache.SHIB ?? 0) > 0) {
                              displayPrice = priceCache.SHIB;
                            } else if (outAmt > 0 && outAmt < 1) {
                              displayPrice = bnbP;
                            } else if (outAmt >= 1) {
                              displayPrice = cakeP;
                            }
                            if (displayPrice > 0) {
                              priceVal = displayPrice;
                              totalVal = outAmt * displayPrice;
                            }
                          }
                          const noAmount = (ao == null || +ao === 0) && (ai == null || +ai === 0);
                          const showPlaceholderPrice = priceVal <= 0 || formatNumber(priceVal, 2) === '0.00';
                          const showPlaceholderTotal = totalVal <= 0 || formatNumber(totalVal, 2) === '0.00';
                          return (
                            <>
                              <td title={hasBoth ? `${formatNumber(n1, 4)} ${toLabel(item.tokenIn)} → ${formatNumber(n2, 4)} ${toLabel(item.tokenOut)}` : undefined}>
                                {amtStr}
                              </td>
                              <td title={showPlaceholderPrice ? 'Price missing from API' : undefined}>
                                {showPlaceholderPrice ? '–' : `$${formatNumber(priceVal, 2)}`}
                              </td>
                              <td title={noAmount && totalVal === 0 ? 'Total missing from API' : undefined}>
                                {showPlaceholderTotal ? '–' : `$${formatNumber(totalVal, 2)}`}
                              </td>
                            </>
                          );
                        })()}
                      </>
                    )}
                    {activeTab !== 'analysis' && (
                      <td>
                        {(item.source === 'ota_auto' || item.source === 'OTA Auto') ? (
                          <Badge variant="secondary" size="sm" title="Executed by OTA AI bot">
                            <Bot size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            OTA Auto
                          </Badge>
                        ) : (
                          <span className="trading-history-source-manual">
                            {item.simulated ? 'Manual (Paper)' : 'Manual'}
                          </span>
                        )}
                      </td>
                    )}
                    {activeTab !== 'analysis' && (
                      <td title={[item.closeReason, item.timeInTrade != null ? `Time in trade: ${item.timeInTrade}` : null].filter(Boolean).join(' · ') || undefined}>
                        {item.fees != null || item.slippage != null
                          ? [item.fees != null ? `Fee: ${typeof item.fees === 'number' ? `${item.fees}%` : item.fees}` : null, item.slippage != null ? `Slip: ${typeof item.slippage === 'number' ? `${item.slippage}%` : item.slippage}` : null].filter(Boolean).join(' · ')
                          : item.type === 'swap' ? 'Fee: ~0.25%' : '–'}
                      </td>
                    )}
                    <td>
                      <Badge
                        variant={
                          item.status === 'completed' || item.status === 'executed' || item.status === 'confirmed' ? 'success' :
                          item.status === 'pending' ? 'warning' :
                          'danger'
                        }
                        size="sm"
                      >
                        {item.status || 'completed'}
                      </Badge>
                    </td>
                    {activeTab !== 'analysis' && (
                      <td>
                        {item.txHash ? (
                          <a
                            href={`https://bscscan.com/tx/${item.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="trading-history-tx-link"
                            title="View on BSCScan"
                            aria-label="View transaction on BSCScan"
                          >
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <span className="trading-history-tx-empty">–</span>
                        )}
                      </td>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="trading-history-pagination">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="trading-history-pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Info */}
        {paginatedData.length === 0 && !loading && (
          <div className="trading-history-info">
            <span>
              {!effectiveUserWallet
                ? 'Connect your wallet to view trading history.'
                : 'No trading history available. Manual swaps and OTA Auto executions will appear here.'}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TradingHistoryModal;
