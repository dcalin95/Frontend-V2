/**
 * 💱 Trade Page - Main Trading Page
 * 
 * Main trading page for DEX with real data:
 * - TradingView Chart (real-time)
 * - Orderbook (real data from API)
 * - Market Stats (real data from /api/ai-trading/market)
 * - Trading Pairs List (real data from API)
 * - Market Overview (real data from API)
 * 
 * @module Trade
 */

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import TradingViewChart from '../components/common/TradingViewChart';
import MarketStatsCompact from '../components/trade/MarketStatsCompact';
import MarketOverview from '../components/trade/MarketOverview';
import LimitOrderPanel from '../components/trade/LimitOrderPanel';
import Orderbook from '../components/trade/Orderbook';
import RecentTrades from '../components/trade/RecentTrades';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Skeleton from '../components/common/Skeleton';
import Modal from '../components/common/Modal/Modal';
import HeaderTokenSelector from '../components/common/HeaderTokenSelector';
import { Button } from '../components/ui';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import { History, Bell, Keyboard, Star, BarChart3, Check } from 'lucide-react';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { useDEXSettings } from '../../hooks/DEX/useDEXSettings';
import useTradingPairsFavorites from '../hooks/useTradingPairsFavorites';
import { useDexAuth } from '../context/DexAuthContext';
import { useHeaderToken } from '../context/HeaderTokenContext';
import { getOrders, getTrades, cancelOrder } from '../services/dexApiService';
import swapExecutionService from '../services/swapExecutionService';
import { logWithPrefix, warnWithPrefix } from '../utils/logger';
import '../styles/pages.css';
import '../styles/components/trade-page.css';
import '../styles/components/header-token-selector.css';

// Lazy load heavy components
const TradingHistoryModal = lazy(() => import('../components/trade/TradingHistoryModal'));
const PriceAlerts = lazy(() => import('../components/trade/PriceAlerts'));
const KeyboardShortcutsHelp = lazy(() => import('../components/common/KeyboardShortcutsHelp'));

const TRADE_MIN_RIGHT_PANE = 320;
const TRADE_CLOSED_BOTTOM_ROW_PX = 72;

const Trade = () => {
  const { settings } = useDEXSettings();
  const { isAuthenticated } = useDexAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const workspaceRef = useRef(null);
  const [selectedToken, setSelectedToken] = useHeaderToken();
  const [selectedPair, setSelectedPair] = useState(`BINANCE:${selectedToken}USDT`);
  const [initialFromSignal, setInitialFromSignal] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const historyModalOpenedFromNavigation = useRef(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showMarketOverview, setShowMarketOverview] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showMarketDrawer, setShowMarketDrawer] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState(settings.defaultChartTimeframe || 'D');
  const { favorites, isFavorite, toggleFavorite } = useTradingPairsFavorites();
  const [headerSlotEl, setHeaderSlotEl] = useState(null);
  const [activePairsCount, setActivePairsCount] = useState(null);
  const [isLiveMarketData, setIsLiveMarketData] = useState(false);
  const [favMenuOpen, setFavMenuOpen] = useState(false);
  const favBtnRef = useRef(null);
  const favMenuRef = useRef(null);
  const [favMenuPos, setFavMenuPos] = useState(null);
  const [openOrders, setOpenOrders] = useState([]);
  const [watchingOrder, setWatchingOrder] = useState(null); // { isWatching, side, price, amount, token } from LimitOrderPanel
  const [marketPrices, setMarketPrices] = useState({});
  const bscEnsureDoneRef = useRef(false);

  // Ensure BSC is added with our RPC as soon as user lands on Trade with wallet connected (MetaMask works without manual RPC setup)
  useEffect(() => {
    if (!isAuthenticated || bscEnsureDoneRef.current) return;
    bscEnsureDoneRef.current = true;
    swapExecutionService.ensureBscForDex().catch(() => {});
  }, [isAuthenticated]);

  // Fetch market prices for P&L calculation (poll every 10 seconds)
  useEffect(() => {
    let cancelled = false;
    
    const fetchMarketPrices = async () => {
      try {
        // Get unique tokens from open orders
        const tokens = Array.from(new Set(openOrders.map(o => o.base_token).filter(Boolean)));
        if (tokens.length === 0) return;
        
        // Fetch prices from Binance for all tokens
        const symbols = JSON.stringify(tokens.map(t => `${t}USDT`));
        const url = `https://api.binance.com/api/v3/ticker/price?symbols=${symbols}`;
        const res = await fetch(url);
        if (!res.ok) return;
        
        const data = await res.json();
        if (cancelled || !Array.isArray(data)) return;
        
        // Map prices
        const prices = {};
        data.forEach(item => {
          const token = item.symbol.replace('USDT', '');
          prices[token] = parseFloat(item.price);
        });
        
        setMarketPrices(prices);
      } catch (err) {
        // Silent fail - P&L will show "—" if prices unavailable
      }
    };
    
    fetchMarketPrices();
    const interval = setInterval(fetchMarketPrices, 10000); // Every 10 seconds
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [openOrders]);
  
  // Sync selectedPair with header token (SSOT)
  useEffect(() => {
    setSelectedPair(`BINANCE:${selectedToken}USDT`);
  }, [selectedToken]);

  useEffect(() => {
    setChartTimeframe(settings.defaultChartTimeframe || 'D');
  }, [settings.defaultChartTimeframe]);

  // Handle token change from selector
  const handleTokenChange = useCallback((token) => {
    setSelectedToken(token);
    setSelectedPair(`BINANCE:${token}USDT`);
  }, [setSelectedToken]);

  // Pre-fill from Signal: read location.state.fromSignal and apply token + pass to LimitOrderPanel
  useEffect(() => {
    const signal = location.state?.fromSignal;
    if (!signal || !signal.token) return;
    const token = String(signal.token).trim().toUpperCase();
    if (!token) return;
    setSelectedToken(token);
    setSelectedPair(`BINANCE:${token}USDT`);
    setInitialFromSignal({
      token,
      side: (signal.signal || '').toLowerCase() === 'sell' ? 'sell' : 'buy',
      entryPrice: signal.entryPrice != null ? Number(signal.entryPrice) : undefined,
      amount: signal.amount != null ? Number(signal.amount) : undefined
    });
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  // Open bottom panel from Swap header (Open Orders / Order History buttons): opens the exact panel.
  useEffect(() => {
    const state = location.state;
    if (!state?.openBottomPanel || !state?.bottomTab) return;
    setBottomPanelOpen(true);
    try {
      localStorage.setItem('bits_trade_bottom_open_v1', '1');
    } catch (_) {}
    setBottomTab(state.bottomTab === 'orderHistory' ? 'orderHistory' : 'openOrders');
    // Replace state after the panel opens, so pages open exactly as requested.
    const id = setTimeout(() => {
      navigate(location.pathname, { replace: true, state: {} });
    }, 0);
    return () => clearTimeout(id);
  }, [location.state?.openBottomPanel, location.state?.bottomTab, location.pathname, navigate]);

  // Open Trading History modal from Order History / other pages (navigate with state: { openHistory: true })
  useEffect(() => {
    if (!location.state?.openHistory) return;
    historyModalOpenedFromNavigation.current = true;
    setShowHistoryModal(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state?.openHistory, location.pathname, navigate]);

  // Order book / Trades drawer (Oxium-like)
  const [drawerTab, setDrawerTab] = useState('orderbook'); // 'orderbook' | 'trades'
  const [bottomTab, setBottomTab] = useState('openOrders'); // 'openOrders' | 'orderHistory' (positions removed - not relevant for spot DEX)
  const [refreshOrdersTrigger, setRefreshOrdersTrigger] = useState(0); // Increment to refetch open orders (e.g. after place order from LimitOrderPanel)
  const [bottomHeight, setBottomHeight] = useState(() => {
    try {
      const raw = localStorage.getItem('bits_trade_bottom_h_v1');
      const parsed = raw ? Number(raw) : NaN;
      if (!Number.isNaN(parsed) && parsed >= 120 && parsed <= 520) return parsed;
    } catch (_) {}
    if (typeof window !== 'undefined') {
      const h = window.innerHeight;
      return Math.min(340, Math.max(200, Math.round(h * 0.28)));
    }
    return 260;
  });
  const [bottomPanelOpen, setBottomPanelOpen] = useState(() => {
    try {
      const v = localStorage.getItem('bits_trade_bottom_open_v1');
      if (v === '0') return false;
      if (v === '1') return true;
    } catch (_) {}
    return true;
  });
  const [paneSizes, setPaneSizes] = useState(() => {
    try {
      const raw = localStorage.getItem('bits_trade_panes_v1');
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed.right === 'number') {
        return { right: parsed.right };
      }
    } catch (_) {}
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      const pct = Math.round(w * 0.4);
      return { right: Math.min(520, Math.max(TRADE_MIN_RIGHT_PANE, pct)) };
    }
    return { right: 400 };
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [ordersDebug, setOrdersDebug] = useState(null);
  const [historyDebug, setHistoryDebug] = useState(null);
  const [layoutTipDismissed, setLayoutTipDismissed] = useState(() => {
    try { return localStorage.getItem('bits_trade_layout_tip_dismissed') === '1'; } catch (_) { return false; }
  });

  // Auto-resize panels on window resize to prevent them from eating the chart
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // Limit right pane to ~32-46% width, proportional to the chart.
      setPaneSizes(prev => {
        const maxRight = Math.floor(w * 0.46);
        const clamped = Math.max(TRADE_MIN_RIGHT_PANE, Math.min(prev.right, maxRight));
        if (prev.right !== clamped) return { right: clamped };
        if (prev.right < TRADE_MIN_RIGHT_PANE) return { right: TRADE_MIN_RIGHT_PANE };
        return prev;
      });

      // Limit Bottom Panel to max 40% of screen height
      setBottomHeight(prev => {
        const maxBottom = Math.floor(h * 0.4);
        if (prev > maxBottom) {
          return Math.max(120, maxBottom); // Min 120px
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Extrage simbolul perechii din selectedPair (ex: BINANCE:BTCUSDT -> BTC/USDT)
  const getPairSymbol = () => {
    if (!selectedPair) return 'BTC/USDT';
    const symbol = selectedPair.replace('BINANCE:', '').replace('USDT', '');
    return `${symbol}/USDT`;
  };

  const { baseToken, quoteToken } = useMemo(() => {
    const raw = String(selectedPair || '').replace('BINANCE:', '');
    // Current app assumes USDT quote; keep safe defaults
    const quote = 'USDT';
    const base = raw.endsWith('USDT') ? raw.replace('USDT', '') : (raw || 'BTC');
    return { baseToken: base || 'BTC', quoteToken: quote };
  }, [selectedPair]);
  
  const currentPairSymbol = getPairSymbol();
  const isCurrentPairFavorite = isFavorite(currentPairSymbol);

  const handleSelectPairSymbol = useCallback((pairSymbol) => {
    // pairSymbol is like "BTC/USDT" -> BINANCE:BTCUSDT
    const binanceSymbol = `BINANCE:${String(pairSymbol || '').replace('/', '')}`;
    setSelectedPair(binanceSymbol);
    setFavMenuOpen(false);
  }, []);

  const updateFavMenuPosition = useCallback(() => {
    if (!favBtnRef.current) return;
    const rect = favBtnRef.current.getBoundingClientRect();
    const viewportPadding = 8;
    const width = 260;
    let left = rect.left;
    let top = rect.bottom + 6;
    left = Math.min(Math.max(left, viewportPadding), window.innerWidth - width - viewportPadding);
    const estimatedHeight = 320;
    if (top + estimatedHeight > window.innerHeight && rect.top - estimatedHeight > viewportPadding) {
      top = rect.top - 6 - estimatedHeight;
    }
    setFavMenuPos({ top, left, width });
  }, []);

  // Header slot for toolbar (token selector etc.): lookup after Layout/Header have rendered; retry so selector is functional
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const run = () => {
      const el = document.getElementById('dex-header-center-slot');
      if (el) setHeaderSlotEl(el);
    };
    run();
    const t = setTimeout(run, 50);
    return () => clearTimeout(t);
  }, [location.pathname]);

  // Measure header height so Trade can fill viewport without page scroll
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const update = () => {
      const headerEl = document.querySelector('.ai-trading-header');
      const headerH = headerEl?.offsetHeight || 0;
      if (pageRef.current) pageRef.current.style.setProperty('--dex-header-height', `${headerH}px`);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Favorites menu: outside click + positioning (portal-safe)
  useEffect(() => {
    if (!favMenuOpen) return;
    updateFavMenuPosition();
    const onResize = () => updateFavMenuPosition();
    const onScroll = () => updateFavMenuPosition();
    const onMouseDown = (event) => {
      const inBtn = favBtnRef.current && favBtnRef.current.contains(event.target);
      const inMenu = favMenuRef.current && favMenuRef.current.contains(event.target);
      if (!inBtn && !inMenu) setFavMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [favMenuOpen, updateFavMenuPosition]);

  // Lightweight market meta for header badges (Active Pairs / Live Market Data)
  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        const popularTokens = ['BTC', 'ETH', 'BNB', 'CAKE', 'SOL', 'STX', 'MATIC', 'LINK'];
        const symbols = JSON.stringify(popularTokens.map(t => `${t}USDT`));
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setActivePairsCount(Array.isArray(data) ? data.length : null);
        setIsLiveMarketData(true);
      } catch (_) {
        if (cancelled) return;
        setActivePairsCount(null);
        setIsLiveMarketData(false);
      }
    };

    loadMeta();
    const interval = setInterval(loadMeta, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'mod+h': () => setShowHistoryModal(true),
    'mod+a': () => setShowAlerts(true),
    'mod+k': () => setShowShortcutsHelp(true),
    'escape': () => {
      setShowHistoryModal(false);
      setShowAlerts(false);
      setShowShortcutsHelp(false);
      setShowMarketDrawer(false);
    }
  }, true, []);

  // Bottom panel data: Open Orders + Order History for the currently authenticated DEX user (wallet).
  // Any user who has connected wallet and signed in sees their own orders and history here.
  useEffect(() => {
    if (!isAuthenticated) {
      setOpenOrders([]);
      setOrderHistory([]);
      setOrdersError(null);
      setHistoryError(null);
      setOrdersLoading(false);
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        const requestParams = { status: 'pending,partially_filled', limit: 50, offset: 0 };
        logWithPrefix('Trade', 'loadOrders:start', {
          isAuthenticated,
          baseToken,
          quoteToken,
          requestParams
        });
        const res = await getOrders(requestParams);
        if (cancelled) return;
        const nextOrders = Array.isArray(res?.orders) ? res.orders : Array.isArray(res?.data?.orders) ? res.data.orders : [];
        logWithPrefix('Trade', 'loadOrders:ok', { count: nextOrders.length });
        setOpenOrders(nextOrders);
        setOrdersDebug({
          success: true,
          request: requestParams,
          response: res,
          count: nextOrders.length,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        if (cancelled) return;
        setOpenOrders([]);
        setOrdersError(e?.message || String(e) || 'Failed to load open orders');
        setOrdersDebug({
          success: false,
          request: { status: 'pending,partially_filled', base_token: baseToken, quote_token: quoteToken, limit: 50, offset: 0 },
          error: e?.message || String(e),
          timestamp: new Date().toISOString()
        });
        warnWithPrefix('Trade', 'loadOrders:error', { message: e?.message || String(e) });
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };

    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        setHistoryError(null);
        const requestParams = { limit: 50, offset: 0 };
        logWithPrefix('Trade', 'loadHistory:start', {
          isAuthenticated,
          baseToken,
          quoteToken,
          requestParams
        });
        const [tradesRes, ordersRes] = await Promise.all([
          getTrades(requestParams),
          getOrders({ status: 'filled,cancelled', limit: 50, offset: 0 })
        ]);
        if (cancelled) return;
        const trades = Array.isArray(tradesRes?.trades) ? tradesRes.trades : [];
        const filledCancelled = Array.isArray(ordersRes?.orders) ? ordersRes.orders : [];
        const tradeOrderIds = new Set((trades.map(t => t.order_id)).filter(Boolean));
        const ordersAsRows = filledCancelled
          .filter(o => !tradeOrderIds.has(o.id))
          .map(o => ({
            id: `order-${o.id}`,
            order_id: o.id,
            base_token: o.base_token,
            quote_token: o.quote_token,
            amount: o.amount,
            price: o.price,
            created_at: o.created_at,
            role: o.side,
            status: o.status,
            _type: 'order'
          }));
        const nextHistory = [...trades.map(t => ({ ...t, _type: 'trade' })), ...ordersAsRows]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        logWithPrefix('Trade', 'loadHistory:ok', { count: nextHistory.length, trades: trades.length, orders: ordersAsRows.length });
        setOrderHistory(nextHistory);
        setHistoryDebug({
          success: true,
          request: requestParams,
          response: { trades: tradesRes, orders: ordersRes },
          count: nextHistory.length,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        if (cancelled) return;
        setOrderHistory([]);
        setHistoryError(e?.message || String(e) || 'Failed to load order history');
        setHistoryDebug({
          success: false,
          request: { limit: 50, offset: 0 },
          error: e?.message || String(e),
          timestamp: new Date().toISOString()
        });
        warnWithPrefix('Trade', 'loadHistory:error', { message: e?.message || String(e) });
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadOrders();
    loadHistory();

    const interval = setInterval(() => {
      loadOrders();
      loadHistory();
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, baseToken, quoteToken, refreshOrdersTrigger]);

  const persistPaneSizes = useCallback((next) => {
    setPaneSizes(next);
    try { localStorage.setItem('bits_trade_panes_v1', JSON.stringify(next)); } catch (_) {}
  }, []);

  const startResize = useCallback((side, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!workspaceRef.current) return;
    const startX = e.clientX;
    const rect = workspaceRef.current.getBoundingClientRect();
    const startRight = paneSizes.right;

    const SPLITTERS = 2; // thin splitter, minimal gap

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const totalW = rect.width;
      const maxRight = Math.max(TRADE_MIN_RIGHT_PANE, Math.floor(totalW * 0.48) - SPLITTERS); // Chart remains dominant; right pane max ~48%.
      const nextRight = Math.min(Math.max(startRight - dx, TRADE_MIN_RIGHT_PANE), maxRight);
      persistPaneSizes({ right: nextRight });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
    };

    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
  }, [paneSizes.right, persistPaneSizes]);

  const startResizeBottom = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = bottomHeight;
    const MIN_H = 120;
    const MAX_H = 520;

    const onMove = (ev) => {
      const dy = ev.clientY - startY;
      const next = Math.min(Math.max(startH - dy, MIN_H), MAX_H);
      setBottomHeight(next);
      try { localStorage.setItem('bits_trade_bottom_h_v1', String(next)); } catch (_) {}
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
    };
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
  }, [bottomHeight]);

  return (
    <div ref={pageRef} className="trade-page trade-page-oxium" role="main" aria-label="Trading page">
      {(() => {
        const toolbar = (
          <div className="trade-header-toolbar" aria-label="Trade controls">
            <div className="trade-header-toolbar-left">
              {/* Token Selector (from registry) - WITH LOGO */}
              <HeaderTokenSelector 
                selectedToken={selectedToken}
                onTokenChange={handleTokenChange}
                ariaLabel="Select token for trading"
              />
              
              <div className="trade-fav-menu">
                <button
                  ref={favBtnRef}
                  className={`trade-page-favorite-btn ${isCurrentPairFavorite ? 'active' : ''}`}
                  onClick={() => setFavMenuOpen((v) => !v)}
                  title="Favorites"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={favMenuOpen ? 'true' : 'false'}
                >
                  <Star size={16} fill={isCurrentPairFavorite ? 'currentColor' : 'none'} />
                  <span className="trade-fav-label">FAV</span>
                </button>

                {favMenuOpen && typeof document !== 'undefined' && createPortal(
                  <>
                    <div className="trade-fav-backdrop" onClick={() => setFavMenuOpen(false)} />
                    <div
                      ref={favMenuRef}
                      className="trade-fav-dropdown"
                      style={{
                        position: 'fixed',
                        top: favMenuPos?.top ?? 0,
                        left: favMenuPos?.left ?? 0,
                        width: favMenuPos?.width ?? 260,
                        zIndex: 9999
                      }}
                      role="menu"
                      aria-label="Favorites"
                    >
                      <div className="trade-fav-dropdown-header">
                        <span>Favorites</span>
                        <button
                          className="trade-fav-close"
                          type="button"
                          onClick={() => setFavMenuOpen(false)}
                          aria-label="Close"
                          title="Close"
                        >
                          ×
                        </button>
                      </div>

                      <div className="trade-fav-dropdown-list" role="none">
                        {Array.isArray(favorites) && favorites.length > 0 ? (
                          favorites.map((sym) => {
                            const isSelected = selectedPair && selectedPair.includes(String(sym).replace('/', ''));
                            return (
                              <button
                                key={sym}
                                type="button"
                                role="menuitem"
                                className={`trade-fav-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelectPairSymbol(sym)}
                                title={sym}
                              >
                                <span className="trade-fav-item-symbol">{sym}</span>
                                <span className="trade-fav-item-actions">
                                  {isSelected && <Check size={14} aria-hidden="true" />}
                                  <button
                                    type="button"
                                    className={`trade-fav-star ${isFavorite(sym) ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(sym);
                                    }}
                                    title={isFavorite(sym) ? 'Remove from favorites' : 'Add to favorites'}
                                    aria-label={isFavorite(sym) ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <Star size={14} fill={isFavorite(sym) ? 'currentColor' : 'none'} />
                                  </button>
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="trade-fav-empty">No favorites yet</div>
                        )}
                      </div>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>

            <div className="trade-header-toolbar-right">
              <MarketStatsCompact
                selectedToken={selectedPair.replace('BINANCE:', '').replace('USDT', '') || 'BNB'}
              />
              <Button
                variant="ghost"
                size="md"
                icon={<BarChart3 size={18} />}
                onClick={() => setShowMarketOverview(true)}
                title="Market Overview"
                aria-label="Market Overview"
              />
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setDrawerTab('orderbook');
                  setShowMarketDrawer(true);
                }}
                title="Order Book / Trades"
                aria-label="Open Order Book / Trades"
              >
                Order Book
              </Button>
              <div className="trade-market-meta" aria-label="Market meta">
                <span
                  className={`trade-market-chip trade-market-chip-live ${isLiveMarketData ? 'live' : 'offline'}`}
                  title={isLiveMarketData ? 'Live Market Data' : 'Market Data Unavailable'}
                >
                  <span className="trade-market-chip-icon" aria-hidden="true">✓</span>
                  <span>Live Market Data</span>
                </span>
                <span className="trade-market-chip trade-market-chip-pairs" title="Active Pairs">
                  <span>Active Pairs:</span>
                  <span className="trade-market-chip-value">{typeof activePairsCount === 'number' ? activePairsCount : '—'}</span>
                </span>
              </div>
              <Button
                variant="ghost"
                size="md"
                icon={<Bell size={18} />}
                onClick={() => setShowAlerts(true)}
                title="Price Alerts (Ctrl+A)"
                aria-label="Price Alerts"
              />
              <Button
                variant="ghost"
                size="md"
                icon={<History size={18} />}
                onClick={() => setShowHistoryModal(true)}
                title="Trading History (Ctrl+H)"
                aria-label="Trading History"
              />
              <Button
                variant="ghost"
                size="md"
                icon={<Keyboard size={18} />}
                onClick={() => setShowShortcutsHelp(true)}
                title="Keyboard Shortcuts (Ctrl+K)"
                aria-label="Keyboard Shortcuts"
              />
            </div>
          </div>
        );

        // Prefer header slot; fallback to inline (if slot not mounted for some reason)
        if (headerSlotEl) return createPortal(toolbar, headerSlotEl);
        return (
          <div className="trade-page-header">
            <div className="trade-page-header-actions">{toolbar}</div>
          </div>
        );
      })()}

      <div ref={workspaceRef} className="trade-workspace" aria-label="Trade workspace">
        <div
          className="trade-workspace-grid trade-workspace-grid-tight"
          style={{
            gridTemplateRows: bottomPanelOpen
              ? `minmax(0, 1fr) 2px minmax(160px, ${bottomHeight}px)`
              : `minmax(0, 1fr) 2px ${TRADE_CLOSED_BOTTOM_ROW_PX}px`,
          }}
        >
          {/* Main row: chart + orders, minimal gap */}
          <div className="trade-workspace-main">
            <div
              className="trade-grid trade-grid-tight"
              style={{
                gridTemplateColumns: `1fr 2px ${Math.max(TRADE_MIN_RIGHT_PANE, paneSizes.right)}px`
              }}
            >
              {/* Chart: timeframe selector stays in the TradingView toolbar inside the chart. */}
              <section className="trade-pane trade-pane-chart chart-wrapper-single-frame" aria-label="Chart">
            {!layoutTipDismissed && (
              <div className="trade-tip" role="status" aria-label="Layout tip">
                <span className="trade-tip-text">
                  Hint: drag the splitter (|) to resize panels. Order Book / Trades is now in the header.
                </span>
                <button
                  type="button"
                  className="trade-tip-close"
                  onClick={() => {
                    setLayoutTipDismissed(true);
                    try { localStorage.setItem('bits_trade_layout_tip_dismissed', '1'); } catch (_) {}
                  }}
                  aria-label="Hide tip"
                  title="Hide"
                >
                  ×
                </button>
              </div>
            )}
            <div className="trade-pane-body trade-pane-chart-area">
              <ErrorBoundary>
                <Suspense fallback={<Skeleton variant="rectangle" height={360} />}>
                  <TradingViewChart
                    symbol={selectedPair}
                    interval={chartTimeframe}
                    theme={settings.theme || 'dark'}
                    height={280}
                    autosize={true}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
              </section>

          {/* Splitter */}
          <div
            className="trade-splitter trade-splitter-vert"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize order panel"
            onPointerDown={(e) => startResize('right', e)}
          />

          {/* Right: Orders */}
          <section className="trade-pane trade-pane-orders" aria-label="Order panel">
            <div className="trade-pane-body">
              <ErrorBoundary>
                <LimitOrderPanel
                  selectedPair={selectedPair}
                  initialFromSignal={initialFromSignal}
                  onOrderPlaced={() => setRefreshOrdersTrigger((t) => t + 1)}
                  onWatchingOrderChange={setWatchingOrder}
                />
              </ErrorBoundary>
            </div>
          </section>
            </div>
          </div>

          {/* Horizontal splitter (thin, minimal line) */}
          <div
            className="trade-splitter trade-splitter-horz"
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize bottom panel"
            onPointerDown={startResizeBottom}
          />

          {/* Bottom: when closed = one button bar; when open = Open Orders / Order History at 50vh */}
          <section className={`trade-bottom ${bottomPanelOpen ? 'trade-bottom-open' : 'trade-bottom-closed'}`} aria-label="Bottom panels">
            {bottomPanelOpen ? (
              <>
                <div className="trade-bottom-tabs" role="tablist" aria-label="Bottom tabs">
                  <button
                    type="button"
                    className={`trade-bottom-tab ${bottomTab === 'openOrders' ? 'active' : ''}`}
                    onClick={() => setBottomTab('openOrders')}
                    role="tab"
                    aria-selected={bottomTab === 'openOrders'}
                  >
                    Open Orders
                  </button>
                  <button
                    type="button"
                    className={`trade-bottom-tab ${bottomTab === 'orderHistory' ? 'active' : ''}`}
                    onClick={() => setBottomTab('orderHistory')}
                    role="tab"
                    aria-selected={bottomTab === 'orderHistory'}
                  >
                    Order History
                  </button>
                  <div className="trade-bottom-spacer" />
                  <button
                    type="button"
                    className="trade-bottom-tab trade-bottom-close-btn"
                    onClick={() => {
                      setBottomPanelOpen(false);
                      try {
                        localStorage.setItem('bits_trade_bottom_open_v1', '0');
                      } catch (_) {}
                    }}
                    aria-label="Minimize orders panel"
                    title="Minimize"
                  >
                    Minimize
                  </button>
                </div>

                <div className="trade-bottom-body">
              {!isAuthenticated ? (
                <div className="trade-bottom-empty">
                  <div className="trade-bottom-empty-title">Connect and sign in to view your orders and history.</div>
                  <div className="trade-bottom-empty-subtitle">Use the wallet / auth controls in the header.</div>
                </div>
              ) : bottomTab === 'openOrders' ? (
                <div className="trade-bottom-table">
                  {ordersLoading ? (
                    <div className="trade-bottom-loading">Loading open orders…</div>
                  ) : ordersError ? (
                    <div className="trade-bottom-error">
                      <div className="trade-bottom-error-title">Error loading orders:</div>
                      <div>{ordersError}</div>
                      {ordersDebug && (
                        <details className="trade-bottom-debug-details">
                          <summary className="trade-bottom-debug-summary">Debug Info</summary>
                          <pre className="trade-bottom-debug-pre">{JSON.stringify(ordersDebug, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  ) : openOrders.length === 0 ? (
                    <div className="trade-bottom-empty">
                      <div className="trade-bottom-debug-label">No open orders</div>
                      {ordersDebug && (
                        <details className="trade-bottom-debug-details">
                          <summary className="trade-bottom-debug-summary">Debug Info (expand)</summary>
                          <div className="trade-bottom-debug-panel">
                            <button
                              type="button"
                              className="trade-bottom-debug-copy-btn"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(ordersDebug, null, 2));
                                alert('Debug info copied to clipboard!');
                              }}
                            >
                              Copy debug JSON
                            </button>
                            <div className="trade-bottom-debug-label">
                              <strong>Request:</strong>
                              <pre className="trade-bottom-debug-pre trade-bottom-debug-pre--req">{JSON.stringify(ordersDebug.request, null, 2)}</pre>
                            </div>
                            <div className="trade-bottom-debug-label">
                              <strong>Response:</strong>
                              <pre className="trade-bottom-debug-pre trade-bottom-debug-pre--res">{JSON.stringify(ordersDebug.response, null, 2)}</pre>
                            </div>
                            <div>
                              <strong>Count:</strong> {ordersDebug.count}
                            </div>
                            <div className="trade-bottom-debug-meta">
                              Last updated: {new Date(ordersDebug.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </details>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Market</Table.Head>
                          <Table.Head align="right">Side</Table.Head>
                          <Table.Head align="right">Entry Price</Table.Head>
                          <Table.Head align="right">Current Price</Table.Head>
                          <Table.Head align="right">Amount</Table.Head>
                          <Table.Head align="right" title="Estimate vs Binance spot USDT (not on-chain fill P&L)">
                            Est. vs spot
                          </Table.Head>
                          <Table.Head align="right">Status</Table.Head>
                          <Table.Head align="right">Actions</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {watchingOrder && (
                          <Table.Row key="watching" className="trade-open-orders-watching-row">
                            <Table.Cell colSpan={8} className="trade-open-orders-watching-cell">
                              <strong>Watching price</strong> — Will execute swap when {watchingOrder.side === 'buy' ? `price ≤ ${watchingOrder.price} USDT` : `price ≥ ${watchingOrder.price} USDT`} ({watchingOrder.side} {parseFloat(watchingOrder.amount).toFixed(8)} {watchingOrder.token}). Keep this tab open.
                            </Table.Cell>
                          </Table.Row>
                        )}
                        {openOrders.map((o) => (
                          <Table.Row key={o.id || o.order_id || `${o.created_at}-${o.price}`}>
                            <Table.Cell>{o.base_token || baseToken}/{o.quote_token || quoteToken}</Table.Cell>
                            <Table.Cell align="right">
                              <span className={o.side === 'buy' ? 'trade-side-buy' : 'trade-side-sell'}>
                                {String(o.side || '').toUpperCase()}
                              </span>
                            </Table.Cell>
                            <Table.Cell align="right">
                              <span className={`trade-side-entry ${o.side === 'buy' ? 'trade-side-buy' : 'trade-side-sell'}`}>
                                {o.price ? parseFloat(o.price).toFixed(2) : '—'}
                              </span>
                            </Table.Cell>
                            <Table.Cell align="right">
                              <span className="trade-muted">
                                {marketPrices[o.base_token] ? `$${parseFloat(marketPrices[o.base_token]).toFixed(2)}` : '—'}
                              </span>
                            </Table.Cell>
                            <Table.Cell align="right">
                              <span className="trade-muted">{o.amount ? parseFloat(o.amount).toFixed(8) : '—'}</span>
                            </Table.Cell>
                            <Table.Cell align="right">
                              {(() => {
                                const marketPrice = marketPrices[o.base_token];
                                const orderPrice = parseFloat(o.price);
                                const amount = parseFloat(o.amount);

                                if (!marketPrice || !orderPrice || !amount) {
                                  return <span className="trade-muted">—</span>;
                                }

                                const pnlUsd = (marketPrice - orderPrice) * amount;
                                const pnlPercent = ((marketPrice - orderPrice) / orderPrice) * 100;
                                const isProfit = pnlUsd >= 0;

                                return (
                                  <div className="trade-open-order-pnl">
                                    <span className={`trade-open-order-pnl-value ${isProfit ? 'trade-open-order-pnl-profit' : 'trade-open-order-pnl-loss'}`}>
                                      {isProfit ? '+' : ''}{pnlUsd.toFixed(2)} USDT
                                    </span>
                                    <span className={`trade-open-order-pnl-pct ${isProfit ? 'trade-open-order-pnl-profit' : 'trade-open-order-pnl-loss'}`}>
                                      ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                    </span>
                                  </div>
                                );
                              })()}
                            </Table.Cell>
                            <Table.Cell align="right">
                              <Badge 
                                variant={o.status === 'pending' ? 'warning' : o.status === 'partially_filled' ? 'info' : 'default'} 
                                size="sm"
                              >
                                {o.status ?? 'open'}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell align="right">
                              {(['pending', 'partially_filled'].includes(o.status)) && (
                                <Button
                                  variant="danger"
                                  size="xs"
                                  onClick={async () => {
                                    const orderId = o.id ?? o.order_id;
                                    if (!orderId) return;
                                    try {
                                      const response = await cancelOrder(orderId);
                                      if (response.success) {
                                        const idOrOrderId = (ord) => ord.id ?? ord.order_id;
                                        const newOrders = openOrders.filter((order) => idOrOrderId(order) !== orderId);
                                        setOpenOrders(newOrders);
                                      }
                                    } catch (err) {
                                      console.error('Cancel error:', err);
                                      alert('Failed to cancel order: ' + err.message);
                                    }
                                  }}
                                  title="Cancel order"
                                >
                                  Cancel
                                </Button>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  )}
                </div>
              ) : (
                <div className="trade-bottom-table">
                  {historyLoading ? (
                    <div className="trade-bottom-loading">Loading order history…</div>
                  ) : historyError ? (
                    <div className="trade-bottom-error">
                      <div className="trade-bottom-error-title">Error loading history:</div>
                      <div>{historyError}</div>
                      {historyDebug && (
                        <details className="trade-bottom-debug-details">
                          <summary className="trade-bottom-debug-summary">Debug Info</summary>
                          <div className="trade-bottom-debug-panel">
                            <button
                              type="button"
                              className="trade-bottom-debug-copy-btn"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(historyDebug, null, 2));
                                alert('Debug info copied to clipboard!');
                              }}
                            >
                              Copy debug JSON
                            </button>
                            <pre className="trade-bottom-debug-pre">{JSON.stringify(historyDebug, null, 2)}</pre>
                          </div>
                        </details>
                      )}
                    </div>
                  ) : orderHistory.length === 0 ? (
                    <div className="trade-bottom-empty">
                      <div className="trade-bottom-debug-label">No order history</div>
                      {historyDebug && (
                        <details className="trade-bottom-debug-details">
                          <summary className="trade-bottom-debug-summary">Debug Info (expand)</summary>
                          <div className="trade-bottom-debug-panel">
                            <button
                              type="button"
                              className="trade-bottom-debug-copy-btn"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(historyDebug, null, 2));
                                alert('Debug info copied to clipboard!');
                              }}
                            >
                              Copy debug JSON
                            </button>
                            <div className="trade-bottom-debug-label">
                              <strong>Request:</strong>
                              <pre className="trade-bottom-debug-pre trade-bottom-debug-pre--req">{JSON.stringify(historyDebug.request, null, 2)}</pre>
                            </div>
                            <div className="trade-bottom-debug-label">
                              <strong>Response:</strong>
                              <pre className="trade-bottom-debug-pre trade-bottom-debug-pre--res">{JSON.stringify(historyDebug.response, null, 2)}</pre>
                            </div>
                            <div>
                              <strong>Count:</strong> {historyDebug.count}
                            </div>
                            <div className="trade-bottom-debug-meta">
                              Last updated: {new Date(historyDebug.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </details>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Market</Table.Head>
                          <Table.Head align="right">Role</Table.Head>
                          <Table.Head align="right">Price</Table.Head>
                          <Table.Head align="right">Amount</Table.Head>
                          <Table.Head align="right">Status</Table.Head>
                          <Table.Head align="right">Time</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {orderHistory.map((t) => (
                          <Table.Row key={t.id || t.trade_id || `${t.created_at}-${t.price}`}>
                            <Table.Cell>{t.base_token || baseToken}/{t.quote_token || quoteToken}</Table.Cell>
                            <Table.Cell align="right">
                              <span className={(t.role === 'buyer' || t.role === 'buy') ? 'trade-side-buy' : 'trade-side-sell'}>
                                {t.role || '—'}
                              </span>
                            </Table.Cell>
                            <Table.Cell align="right">
                              <span className={`trade-side-entry ${(t.role === 'buyer' || t.role === 'buy') ? 'trade-side-buy' : 'trade-side-sell'}`}>
                                {t.price ? parseFloat(t.price).toFixed(2) : '—'}
                              </span>
                            </Table.Cell>
                            <Table.Cell align="right">
                              <span className="trade-muted">{t.amount ? parseFloat(t.amount).toFixed(8) : '—'}</span>
                            </Table.Cell>
                            <Table.Cell align="right">
                              {t._type === 'order' && t.status ? (
                                <span className={t.status === 'filled' ? 'trade-history-status-filled' : 'trade-history-status-other'}>{t.status}</span>
                              ) : (
                                '—'
                              )}
                            </Table.Cell>
                            <Table.Cell align="right">{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  )}
                </div>
              )}
                </div>
              </>
            ) : (
              <div className="trade-bottom-bar-closed" role="tablist" aria-label="Preview: Open Orders / History">
                <button
                  type="button"
                  className={`trade-bottom-preview-btn ${bottomTab === 'openOrders' ? 'active' : ''}`}
                  onClick={() => {
                    setBottomTab('openOrders');
                    setBottomPanelOpen(true);
                    try {
                      localStorage.setItem('bits_trade_bottom_open_v1', '1');
                    } catch (_) {}
                  }}
                  aria-label="Open Orders"
                  title="Open Orders (expand panel)"
                >
                  <span>Open Orders{openOrders.length > 0 ? ` (${openOrders.length})` : ''}</span>
                </button>
                <button
                  type="button"
                  className={`trade-bottom-preview-btn ${bottomTab === 'orderHistory' ? 'active' : ''}`}
                  onClick={() => {
                    setBottomTab('orderHistory');
                    setBottomPanelOpen(true);
                    try {
                      localStorage.setItem('bits_trade_bottom_open_v1', '1');
                    } catch (_) {}
                  }}
                  aria-label="Order History"
                  title="Order History (expand panel)"
                >
                  <History size={16} />
                  <span>Order History</span>
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Trading History Modal */}
      {showHistoryModal && (
        <Suspense fallback={null}>
          <TradingHistoryModal
            isOpen={showHistoryModal}
            onClose={() => {
              historyModalOpenedFromNavigation.current = false;
              setShowHistoryModal(false);
            }}
            onBack={() => {
              setShowHistoryModal(false);
              if (historyModalOpenedFromNavigation.current) {
                historyModalOpenedFromNavigation.current = false;
                navigate(-1);
              }
            }}
          />
        </Suspense>
      )}

      {/* Price Alerts Modal */}
      {showAlerts && (
        <Suspense fallback={null}>
          <Modal
            isOpen={showAlerts}
            onClose={() => setShowAlerts(false)}
            title="Price Alerts"
            size="large"
            className="price-alerts-modal-wrapper"
          >
            <ErrorBoundary>
              <PriceAlerts />
            </ErrorBoundary>
          </Modal>
        </Suspense>
      )}

      {/* Market Overview Modal */}
      {showMarketOverview && (
        <Modal
          isOpen={showMarketOverview}
          onClose={() => setShowMarketOverview(false)}
          title="Market Overview"
          size="large"
          className="market-overview-modal-wrapper"
        >
          <ErrorBoundary>
            <MarketOverview />
          </ErrorBoundary>
        </Modal>
      )}

      {/* Order Book / Trades Drawer */}
      {showMarketDrawer && (
        <>
          <div className="trade-drawer-backdrop" onClick={() => setShowMarketDrawer(false)} />
          <aside className="trade-drawer" role="dialog" aria-modal="true" aria-label="Order Book / Trades">
            <div className="trade-drawer-header">
              <div className="trade-drawer-title">Market</div>
              <button
                type="button"
                className="trade-drawer-close"
                onClick={() => setShowMarketDrawer(false)}
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            <div className="trade-drawer-tabs" role="tablist" aria-label="Market tabs">
              <button
                type="button"
                className={`trade-tab ${drawerTab === 'orderbook' ? 'active' : ''}`}
                onClick={() => setDrawerTab('orderbook')}
                role="tab"
                aria-selected={drawerTab === 'orderbook'}
              >
                Order Book
              </button>
              <button
                type="button"
                className={`trade-tab ${drawerTab === 'trades' ? 'active' : ''}`}
                onClick={() => setDrawerTab('trades')}
                role="tab"
                aria-selected={drawerTab === 'trades'}
              >
                Trades
              </button>
            </div>

            <div className="trade-drawer-body">
              <ErrorBoundary>
                {drawerTab === 'orderbook' ? <Orderbook /> : <RecentTrades />}
              </ErrorBoundary>
            </div>
          </aside>
        </>
      )}

      {/* Keyboard Shortcuts Help */}
      {showShortcutsHelp && (
        <Suspense fallback={null}>
          <KeyboardShortcutsHelp
            isOpen={showShortcutsHelp}
            onClose={() => setShowShortcutsHelp(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Trade;
