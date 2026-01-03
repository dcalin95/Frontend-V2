import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import BrandLogo from '../components/BrandLogo';
import './WhaleTransactions.css';
import './WhaleTransactions.mobile.css';

const WhaleTransactions = ({ minAmount = 10000000 }) => {
  // Load cached transactions from localStorage
  const [transactions, setTransactions] = useState(() => {
    const cached = localStorage.getItem('whale_transactions_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('normal'); // 'normal', 'threequarter', 'fullscreen'
  const [selectedTx, setSelectedTx] = useState(null);
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const [selectedNetworks, setSelectedNetworks] = useState([]); // Network filter: [] = all, ['binance', 'bitcoin', ...] = specific
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '1h', '24h'
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const wrapperRef = useRef(null);

  // Motivational slogans that rotate
  const motivationalSlogans = [
    "Every whale was once a small fish. Your time is coming. 🐋",
    "These trades could be yours tomorrow. Start with $BITS today. 💎",
    "Dream big. Trade smart. Become the whale you're watching. 🚀",
    "Why not you? Every fortune starts with a single trade. 💰",
    "The next $100M transaction could have your name on it. 🌟"
  ];

  // Fetch large trades from MULTIPLE BLOCKCHAINS (7 Active Sources: Binance + Bitcoin + Ethereum + BSC + Stacks + Polygon + Avalanche)
  const fetchWhaleTransactions = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      setLoading(true);
      setError(null);

      const allLargeTrades = [];

      // Parallel fetch promises for better performance
      const fetchPromises = [];

      // ===== 1. BINANCE TRADES (BTC, ETH, BNB, SOL, XRP) - THRESHOLD $10K (REALISTIC) =====
      const binancePairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];
      const binanceThreshold = 10000; // $10K - realistic whale threshold for retail market
      
      fetchPromises.push(
        (async () => {
          const binanceTrades = [];
          for (const pair of binancePairs) {
            try {
              const [priceRes, tradesRes] = await Promise.all([
                fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`, { signal: controller.signal }),
                fetch(`https://api.binance.com/api/v3/trades?symbol=${pair}&limit=500`, { signal: controller.signal })
              ]);

              const priceData = await priceRes.json();
              const trades = await tradesRes.json();
              const currentPrice = parseFloat(priceData.price);

              const largeTrades = trades
                .map(trade => ({
                  id: `binance-${pair}-${trade.id}`,
                  symbol: pair.replace('USDT', ''),
                  blockchain: 'binance-dex',
                  amount: parseFloat(trade.qty),
                  amount_usd: parseFloat(trade.qty) * currentPrice,
                  from: {
                    owner_type: trade.isBuyerMaker ? 'seller' : 'buyer',
                    owner: 'Binance Trader',
                  },
                  to: {
                    owner_type: trade.isBuyerMaker ? 'buyer' : 'seller',
                    owner: 'Binance Trader',
                  },
                  timestamp: Math.floor(trade.time / 1000),
                  transaction_type: trade.isBuyerMaker ? 'sell' : 'buy',
                  source: 'Binance',
                }))
                .filter(trade => trade.amount_usd >= binanceThreshold);

              binanceTrades.push(...largeTrades);
            } catch (err) {
              console.warn(`Binance ${pair} failed:`, err.message);
            }
          }
          return binanceTrades;
        })()
      );

      // ===== 2. ETHEREUM BLOCKCHAIN (Etherscan API - Public, NO KEY) =====
      fetchPromises.push(
        (async () => {
          try {
            const ethPriceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', { signal: controller.signal });
            const ethPrice = parseFloat((await ethPriceRes.json()).price);

            const etherscanRes = await fetch('https://api.etherscan.io/api?module=proxy&action=eth_blockNumber', { signal: controller.signal });
            const etherscanData = await etherscanRes.json();
            const latestBlock = parseInt(etherscanData.result, 16);

            const ethereumLargeTx = [];
            const blockPromises = [];

            for (let i = 0; i < 3; i++) {
              const blockNumber = `0x${(latestBlock - i).toString(16)}`;
              blockPromises.push(
                fetch(`https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${blockNumber}&boolean=true`, { signal: controller.signal })
                  .then(res => res.json())
              );
            }

            const blockResults = await Promise.all(blockPromises);

            blockResults.forEach(blockData => {
              if (blockData.result?.transactions) {
                blockData.result.transactions.forEach(tx => {
                  const ethValue = parseInt(tx.value, 16) / 1e18;
                  const usdValue = ethValue * ethPrice;

                  if (usdValue >= 10000) {
                    ethereumLargeTx.push({
                      id: `ethereum-${tx.hash}`,
                      symbol: 'ETH',
                      blockchain: 'ethereum',
                      amount: ethValue,
                      amount_usd: usdValue,
                      from: {
                        owner_type: 'wallet',
                        owner: `${tx.from?.substring(0, 6)}...${tx.from?.substring(38)}`,
                      },
                      to: {
                        owner_type: tx.to ? 'wallet' : 'contract',
                        owner: tx.to ? `${tx.to.substring(0, 6)}...${tx.to.substring(38)}` : 'Contract Creation',
                      },
                      timestamp: Math.floor(Date.now() / 1000),
                      transaction_type: 'transfer',
                      source: 'Ethereum Blockchain',
                    });
                  }
                });
              }
            });

            return ethereumLargeTx;
          } catch (err) {
            console.warn('Ethereum blockchain fetch failed:', err.message);
            return [];
          }
        })()
      );

      // ===== 3. BSC BLOCKCHAIN (BscScan API - Public, NO KEY) =====
      fetchPromises.push(
        (async () => {
          try {
            const bnbPriceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT', { signal: controller.signal });
            const bnbPrice = parseFloat((await bnbPriceRes.json()).price);

            const bscScanRes = await fetch('https://api.bscscan.com/api?module=proxy&action=eth_blockNumber', { signal: controller.signal });
            const bscScanData = await bscScanRes.json();
            const latestBscBlock = parseInt(bscScanData.result, 16);

            const bscLargeTx = [];
            const blockPromises = [];

            for (let i = 0; i < 3; i++) {
              const blockNumber = `0x${(latestBscBlock - i).toString(16)}`;
              blockPromises.push(
                fetch(`https://api.bscscan.com/api?module=proxy&action=eth_getBlockByNumber&tag=${blockNumber}&boolean=true`, { signal: controller.signal })
                  .then(res => res.json())
              );
            }

            const blockResults = await Promise.all(blockPromises);

            blockResults.forEach(blockData => {
              if (blockData.result?.transactions) {
                blockData.result.transactions.forEach(tx => {
                  const bnbValue = parseInt(tx.value, 16) / 1e18;
                  const usdValue = bnbValue * bnbPrice;

                  if (usdValue >= 10000) {
                    bscLargeTx.push({
                      id: `bsc-${tx.hash}`,
                      symbol: 'BNB',
                      blockchain: 'binance-smart-chain',
                      amount: bnbValue,
                      amount_usd: usdValue,
                      from: {
                        owner_type: 'wallet',
                        owner: `${tx.from?.substring(0, 6)}...${tx.from?.substring(38)}`,
                      },
                      to: {
                        owner_type: tx.to ? 'wallet' : 'contract',
                        owner: tx.to ? `${tx.to.substring(0, 6)}...${tx.to.substring(38)}` : 'Contract Creation',
                      },
                      timestamp: Math.floor(Date.now() / 1000),
                      transaction_type: 'transfer',
                      source: 'BSC Blockchain',
                    });
                  }
                });
              }
            });

            return bscLargeTx;
          } catch (err) {
            console.warn('BSC blockchain fetch failed:', err.message);
            return [];
          }
        })()
      );

      // ===== 4. BITCOIN BLOCKCHAIN (On-chain transactions via Mempool.space) - IMPROVED =====
      fetchPromises.push(
        (async () => {
          try {
            const [mempoolRes, btcPriceRes] = await Promise.all([
              fetch('https://mempool.space/api/mempool/recent', { signal: controller.signal }),
              fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { signal: controller.signal })
            ]);

            const mempoolTxs = await mempoolRes.json();
            const btcPrice = parseFloat((await btcPriceRes.json()).price);

            const bitcoinLargeTx = mempoolTxs
              .slice(0, 100)
              .map(tx => {
                const totalBTC = (tx.vout?.reduce((sum, out) => sum + (out.value || 0), 0) || 0) / 100000000;
                const totalUSD = totalBTC * btcPrice;
                
                return {
                  id: `bitcoin-${tx.txid}`,
                  symbol: 'BTC',
                  blockchain: 'bitcoin',
                  amount: totalBTC,
                  amount_usd: totalUSD,
                  from: {
                    owner_type: 'wallet',
                    owner: 'Bitcoin Wallet',
                  },
                  to: {
                    owner_type: 'wallet',
                    owner: 'Bitcoin Wallet',
                  },
                  timestamp: Math.floor(Date.now() / 1000),
                  transaction_type: 'transfer',
                  source: 'Bitcoin Blockchain',
                };
              })
              .filter(tx => tx.amount_usd >= 10000);

            return bitcoinLargeTx;
          } catch (err) {
            console.warn('Bitcoin blockchain fetch failed:', err.message);
            return [];
          }
        })()
      );

      // ===== 5. STACKS BLOCKCHAIN (STX transactions linked to Bitcoin) =====
      fetchPromises.push(
        (async () => {
          try {
            const [stacksRes, stxPriceRes] = await Promise.all([
              fetch('https://api.mainnet.hiro.so/extended/v1/tx?limit=50', { signal: controller.signal }),
              fetch('https://api.binance.com/api/v3/ticker/price?symbol=STXUSDT', { signal: controller.signal })
            ]);

            const stacksData = await stacksRes.json();
            const stxPrice = parseFloat((await stxPriceRes.json()).price);

            const stacksLargeTx = stacksData.results
              .filter(tx => tx.tx_type === 'token_transfer' || tx.tx_type === 'contract_call')
              .map(tx => {
                const stxAmount = (tx.fee_rate || 0) / 1000000;
                const totalUSD = stxAmount * stxPrice;
                
                return {
                  id: `stacks-${tx.tx_id}`,
                  symbol: 'STX',
                  blockchain: 'stacks',
                  amount: stxAmount,
                  amount_usd: totalUSD,
                  from: {
                    owner_type: 'wallet',
                    owner: tx.sender_address?.substring(0, 8) + '...' || 'STX Wallet',
                  },
                  to: {
                    owner_type: tx.tx_type === 'contract_call' ? 'contract' : 'wallet',
                    owner: tx.tx_type === 'contract_call' ? 'Smart Contract' : 'STX Wallet',
                  },
                  timestamp: tx.burn_block_time || Math.floor(Date.now() / 1000),
                  transaction_type: tx.tx_type === 'contract_call' ? 'contract' : 'transfer',
                  source: 'Stacks (Bitcoin L2)',
                };
              })
              .filter(tx => tx.amount_usd >= minAmount / 100);

            return stacksLargeTx;
          } catch (err) {
            console.warn('Stacks API fetch failed:', err.message);
            return [];
          }
        })()
      );

      // ===== 6. SOLANA BLOCKCHAIN (SOL transactions - Real-time) =====
      // TEMPORARILY DISABLED - Solscan API requires authentication
      // Will be re-enabled with proper API integration
      /*
      fetchPromises.push(
        (async () => {
          try {
            const solPriceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT', { signal: controller.signal });
            const solPrice = parseFloat((await solPriceRes.json()).price);

            const solanaLargeTx = [];
            return solanaLargeTx;
          } catch (err) {
            console.warn('Solana blockchain fetch failed:', err.message);
            return [];
          }
        })()
      );
      */

      // ===== 7. POLYGON (MATIC) BLOCKCHAIN =====
      fetchPromises.push(
        (async () => {
          try {
            const maticPriceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=MATICUSDT', { signal: controller.signal });
            const maticPrice = parseFloat((await maticPriceRes.json()).price);

            const polygonRes = await fetch('https://api.polygonscan.com/api?module=proxy&action=eth_blockNumber', { signal: controller.signal });
            const polygonData = await polygonRes.json();
            const latestBlock = parseInt(polygonData.result, 16);

            const polygonLargeTx = [];
            const blockPromises = [];

            for (let i = 0; i < 3; i++) {
              const blockNumber = `0x${(latestBlock - i).toString(16)}`;
              blockPromises.push(
                fetch(`https://api.polygonscan.com/api?module=proxy&action=eth_getBlockByNumber&tag=${blockNumber}&boolean=true`, { signal: controller.signal })
                  .then(res => res.json())
              );
            }

            const blockResults = await Promise.all(blockPromises);

            blockResults.forEach(blockData => {
              if (blockData.result?.transactions) {
                blockData.result.transactions.forEach(tx => {
                  const maticValue = parseInt(tx.value, 16) / 1e18;
                  const usdValue = maticValue * maticPrice;

                  if (usdValue >= 10000) {
                    polygonLargeTx.push({
                      id: `polygon-${tx.hash}`,
                      symbol: 'MATIC',
                      blockchain: 'polygon',
                      amount: maticValue,
                      amount_usd: usdValue,
                      from: {
                        owner_type: 'wallet',
                        owner: `${tx.from?.substring(0, 6)}...${tx.from?.substring(38)}`,
                      },
                      to: {
                        owner_type: tx.to ? 'wallet' : 'contract',
                        owner: tx.to ? `${tx.to.substring(0, 6)}...${tx.to.substring(38)}` : 'Contract Creation',
                      },
                      timestamp: Math.floor(Date.now() / 1000),
                      transaction_type: 'transfer',
                      source: 'Polygon Blockchain',
                    });
                  }
                });
              }
            });

            return polygonLargeTx;
          } catch (err) {
            console.warn('Polygon blockchain fetch failed:', err.message);
            return [];
          }
        })()
      );

      // ===== 8. AVALANCHE (AVAX) BLOCKCHAIN =====
      fetchPromises.push(
        (async () => {
          try {
            const avaxPriceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=AVAXUSDT', { signal: controller.signal });
            const avaxPrice = parseFloat((await avaxPriceRes.json()).price);

            const snowtraceRes = await fetch('https://api.snowtrace.io/api?module=proxy&action=eth_blockNumber', { signal: controller.signal });
            const snowtraceData = await snowtraceRes.json();
            const latestBlock = parseInt(snowtraceData.result, 16);

            const avaxLargeTx = [];
            const blockPromises = [];

            for (let i = 0; i < 3; i++) {
              const blockNumber = `0x${(latestBlock - i).toString(16)}`;
              blockPromises.push(
                fetch(`https://api.snowtrace.io/api?module=proxy&action=eth_getBlockByNumber&tag=${blockNumber}&boolean=true`, { signal: controller.signal })
                  .then(res => res.json())
              );
            }

            const blockResults = await Promise.all(blockPromises);

            blockResults.forEach(blockData => {
              if (blockData.result?.transactions) {
                blockData.result.transactions.forEach(tx => {
                  const avaxValue = parseInt(tx.value, 16) / 1e18;
                  const usdValue = avaxValue * avaxPrice;

                  if (usdValue >= 10000) {
                    avaxLargeTx.push({
                      id: `avalanche-${tx.hash}`,
                      symbol: 'AVAX',
                      blockchain: 'avalanche',
                      amount: avaxValue,
                      amount_usd: usdValue,
                      from: {
                        owner_type: 'wallet',
                        owner: `${tx.from?.substring(0, 6)}...${tx.from?.substring(38)}`,
                      },
                      to: {
                        owner_type: tx.to ? 'wallet' : 'contract',
                        owner: tx.to ? `${tx.to.substring(0, 6)}...${tx.to.substring(38)}` : 'Contract Creation',
                      },
                      timestamp: Math.floor(Date.now() / 1000),
                      transaction_type: 'transfer',
                      source: 'Avalanche Blockchain',
                    });
                  }
                });
              }
            });

            return avaxLargeTx;
          } catch (err) {
            console.warn('Avalanche blockchain fetch failed:', err.message);
            return [];
          }
        })()
      );

      // ===== WAIT FOR ALL PROMISES (PARALLEL EXECUTION) =====
      const results = await Promise.allSettled(fetchPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allLargeTrades.push(...result.value);
        } else if (result.status === 'rejected') {
          console.warn(`Fetch promise ${index + 1} rejected:`, result.reason);
        }
      });

      // ===== FINAL: Sort and take top 20 (for symmetric grid: 4×5 or 5×4) =====
      const sortedTrades = allLargeTrades
        .sort((a, b) => b.amount_usd - a.amount_usd)
        .slice(0, 20);

      clearTimeout(timeout);

      // MERGE with cached transactions to always keep at least 3
      const cached = localStorage.getItem('whale_transactions_cache');
      const cachedTx = cached ? JSON.parse(cached) : [];
      
      // Combine new + cached, remove duplicates by id, then sort
      const mergedTx = [...sortedTrades, ...cachedTx]
        .filter((tx, index, self) => index === self.findIndex(t => t.id === tx.id))
        .sort((a, b) => b.amount_usd - a.amount_usd)
        .slice(0, Math.max(sortedTrades.length, 3)); // At least 3 transactions
      
      // Save to localStorage
      localStorage.setItem('whale_transactions_cache', JSON.stringify(mergedTx));
      
      setTransactions(mergedTx);
      setLastUpdateTime(Date.now()); // Update timestamp for live timer
      setLoading(false);
    } catch (err) {
      clearTimeout(timeout);
      
      if (err.name === 'AbortError') {
        console.error('Multi-blockchain fetch timeout (15s exceeded)');
        setError('Request timeout - data sources are slow. Please try again.');
      } else {
        console.error('Multi-blockchain fetch error:', err.message);
        setError(err.message);
      }
      
      // NO FALLBACK DEMO DATA - Show empty state instead
      setTransactions([]);
      setLoading(false);
    }
  }, [minAmount, selectedNetworks, timeFilter]);

  // DEMO DATA FUNCTION - DISABLED (Now using only real data from APIs)
  /*
  const generateFallbackData = () => {
    const cryptos = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP'];
    const types = ['transfer', 'exchange'];
    const blockchains = ['bitcoin', 'ethereum', 'binance-smart-chain'];
    
    return Array.from({ length: 15 }, (_, i) => ({
      id: `demo-${i}`,
      blockchain: blockchains[Math.floor(Math.random() * blockchains.length)],
      symbol: cryptos[Math.floor(Math.random() * cryptos.length)],
      amount: Math.floor(Math.random() * 5000) + 100,
      amount_usd: Math.floor(Math.random() * 400000000) + 10000000,
      from: {
        owner_type: Math.random() > 0.5 ? 'exchange' : 'wallet',
        owner: Math.random() > 0.5 ? 'Binance' : 'Unknown Wallet',
      },
      to: {
        owner_type: Math.random() > 0.5 ? 'exchange' : 'wallet',
        owner: Math.random() > 0.5 ? 'Coinbase' : 'Unknown Wallet',
      },
      timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600),
      transaction_type: types[Math.floor(Math.random() * types.length)],
    }));
  };
  */

  useEffect(() => {
    fetchWhaleTransactions();

    // Refresh every 2 minutes
    const interval = setInterval(fetchWhaleTransactions, 120000);

    return () => clearInterval(interval);
  }, [fetchWhaleTransactions]);

  // Toggle network filter
  const toggleNetworkFilter = (network) => {
    setSelectedNetworks(prev => {
      if (prev.includes(network)) {
        // Remove filter
        return prev.filter(n => n !== network);
      } else {
        // Add filter
        return [...prev, network];
      }
    });
  };

  // Cycle through view modes: normal → 3/4 screen → fullscreen → normal
  const cycleViewMode = () => {
    if (viewMode === 'normal') {
      setViewMode('threequarter');
    } else if (viewMode === 'threequarter') {
      setViewMode('fullscreen');
      // Request browser fullscreen for true fullscreen mode
      if (wrapperRef.current && !document.fullscreenElement) {
        wrapperRef.current.requestFullscreen().catch(err => {
          console.error('Fullscreen error:', err);
        });
      }
    } else {
      setViewMode('normal');
      // Exit browser fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error('Exit fullscreen error:', err);
        });
      }
    }
  };

  // Listen for fullscreen changes (when user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && viewMode === 'fullscreen') {
        setViewMode('normal');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [viewMode]);

  // Rotate slogans every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSloganIndex(prev => (prev + 1) % motivationalSlogans.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [motivationalSlogans.length]);

  // Live timer - update every second to show elapsed time since last update
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - lastUpdateTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [lastUpdateTime]);

  // Click handler for transaction details
  const handleTxClick = (tx) => {
    setSelectedTx(tx);
  };

  const closeModal = () => {
    setSelectedTx(null);
  };

  // Copy Transaction ID to clipboard
  const copyTransactionId = () => {
    if (selectedTx?.id) {
      navigator.clipboard.writeText(selectedTx.id).then(() => {
        // Visual feedback - could add toast notification here
        const button = document.querySelector('.copy-tx-btn');
        if (button) {
          const originalText = button.textContent || button.innerHTML;
          const icon = document.createElement('i');
          icon.className = 'fas fa-check';
          button.textContent = '';
          button.appendChild(icon);
          button.appendChild(document.createTextNode(' Copied!'));
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }
      });
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // Format USD amount
  const formatUSD = (amount) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    return `$${amount.toLocaleString()}`;
  };

  // Render main component
  const renderMainContent = () => (
    <>
      {/* Overlay for 3/4 screen mode - INDEPENDENT from page layout */}
      {viewMode === 'threequarter' && (
        <div className="whale-overlay-backdrop" onClick={() => setViewMode('normal')}></div>
      )}
      
      <div ref={wrapperRef} className={`whale-transactions ${viewMode === 'fullscreen' ? 'fullscreen' : ''} ${viewMode === 'threequarter' ? 'threequarter' : ''}`}>
        <div className="whale-header">
        {/* Logo BITS + Slogan */}
        <div className="whale-branding">
          <BrandLogo size="sm" />
          <div className="whale-slogan">
            <span className="slogan-whale">🐋 Whale Alert System</span>
            <span className="slogan-whale-sub">7 Blockchains • Real-Time Intelligence</span>
          </div>
          <span className="whale-badge">&gt;${minAmount >= 1000000 ? (minAmount / 1000000).toFixed(0) + 'M' : (minAmount / 1000).toFixed(0) + 'K'}</span>
        </div>
        
        <div className="whale-sources">
          <button 
            className={`source-badge binance ${selectedNetworks.includes('binance') ? 'active' : ''}`}
            onClick={() => toggleNetworkFilter('binance')}
            title="Binance Exchange - Click to filter"
          >
            <i className="fas fa-exchange-alt"></i>
            Binance
          </button>
          <button 
            className={`source-badge bitcoin ${selectedNetworks.includes('bitcoin') ? 'active' : ''}`}
            onClick={() => toggleNetworkFilter('bitcoin')}
            title="Bitcoin Blockchain - Click to filter"
          >
            <i className="fab fa-bitcoin"></i>
            BTC
          </button>
          <button 
            className={`source-badge ethereum ${selectedNetworks.includes('ethereum') ? 'active' : ''}`}
            onClick={() => toggleNetworkFilter('ethereum')}
            title="Ethereum Blockchain - Click to filter"
          >
            <i className="fab fa-ethereum"></i>
            ETH
          </button>
          <button 
            className={`source-badge bsc ${selectedNetworks.includes('bsc') ? 'active' : ''}`}
            onClick={() => toggleNetworkFilter('bsc')}
            title="Binance Smart Chain - Click to filter"
          >
            <i className="fas fa-link"></i>
            BSC
          </button>
          <button 
            className={`source-badge polygon ${selectedNetworks.includes('polygon') ? 'active' : ''}`}
            onClick={() => toggleNetworkFilter('polygon')}
            title="Polygon Network - Click to filter"
          >
            <i className="fas fa-pentagon"></i>
            MATIC
          </button>
          <button 
            className={`source-badge avalanche ${selectedNetworks.includes('avalanche') ? 'active' : ''}`}
            onClick={() => toggleNetworkFilter('avalanche')}
            title="Avalanche Network - Click to filter"
          >
            <i className="fas fa-mountain"></i>
            AVAX
          </button>
          <button 
            className={`source-badge stacks ${selectedNetworks.includes('stacks') ? 'active' : ''}`}
            onClick={() => toggleNetworkFilter('stacks')}
            title="Stacks (Bitcoin L2) - Click to filter"
          >
            <i className="fas fa-layer-group"></i>
            STX
          </button>
        </div>
        
        <div className="whale-count">
          <i className="fas fa-chart-bar"></i>
          <span>{transactions.length} Whale Transactions Detected</span>
        </div>

        {/* Time Filter & Live Timer */}
        <div className="whale-time-controls">
          <div className="time-filter-buttons">
            <button 
              className={`time-filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTimeFilter('all')}
              title="Show all transactions"
            >
              <i className="fas fa-infinity"></i>
              All Time
            </button>
            <button 
              className={`time-filter-btn ${timeFilter === '1h' ? 'active' : ''}`}
              onClick={() => setTimeFilter('1h')}
              title="Last 1 hour"
            >
              <i className="fas fa-clock"></i>
              1 Hour
            </button>
            <button 
              className={`time-filter-btn ${timeFilter === '24h' ? 'active' : ''}`}
              onClick={() => setTimeFilter('24h')}
              title="Last 24 hours"
            >
              <i className="fas fa-history"></i>
              24 Hours
            </button>
          </div>
          
          <div className="live-timer">
            <i className="fas fa-sync-alt fa-spin" style={{ fontSize: '0.7rem' }}></i>
            <span>Updated {timeElapsed}s ago</span>
          </div>
        </div>
        
        <div className="whale-actions">
          <button className="refresh-btn" onClick={fetchWhaleTransactions} disabled={loading} title="Refresh Data">
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
          </button>
          
          {(viewMode === 'threequarter' || viewMode === 'fullscreen') && (
            <button 
              className="close-whale-btn" 
              onClick={() => setViewMode('normal')} 
              title="Close & Return to Normal View"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
          
          <div className="view-mode-wrapper">
            <button 
              className={`fullscreen-btn-whale ${viewMode}`}
              onClick={cycleViewMode} 
              title={
                viewMode === 'normal' ? 'Click: 3/4 Screen Mode' : 
                viewMode === 'threequarter' ? 'Click: Full Screen Mode' : 
                'Click: Normal View'
              }
            >
              <i className={`fas ${
                viewMode === 'normal' ? 'fa-expand-arrows-alt' : 
                viewMode === 'threequarter' ? 'fa-compress-arrows-alt' : 
                'fa-compress'
              }`}></i>
            </button>
            <span className="view-mode-badge">
              {viewMode === 'normal' ? 'Normal' : viewMode === 'threequarter' ? '3/4' : 'Full'}
            </span>
          </div>
        </div>
      </div>

      <div className="whale-list">
        {(() => {
          // Filter 1: By selected networks
          let filteredTx = selectedNetworks.length === 0 
            ? transactions 
            : transactions.filter(tx => {
                const networkMap = {
                  'binance': 'binance',
                  'bitcoin': 'bitcoin',
                  'ethereum': 'ethereum',
                  'binance-smart-chain': 'bsc',
                  'polygon': 'polygon',
                  'avalanche': 'avalanche',
                  'stacks': 'stacks'
                };
                const txNetwork = networkMap[tx.blockchain] || tx.source?.toLowerCase();
                return selectedNetworks.includes(txNetwork);
              });

          // Filter 2: By time (chronos filter)
          const now = Math.floor(Date.now() / 1000);
          if (timeFilter === '1h') {
            filteredTx = filteredTx.filter(tx => (now - tx.timestamp) <= 3600); // 1 hour = 3600s
          } else if (timeFilter === '24h') {
            filteredTx = filteredTx.filter(tx => (now - tx.timestamp) <= 86400); // 24 hours = 86400s
          }

          return filteredTx.length === 0 ? (
            <div className="whale-empty">
              <i className="fas fa-satellite-dish"></i>
              <p>🔍 {selectedNetworks.length > 0 ? `No transactions found for selected networks` : 'Scanning 7 Blockchains for Whale Transactions...'}</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-tertiary)' }}>
                Real-time data only • No transactions &gt;${minAmount >= 1000000 ? (minAmount / 1000000).toFixed(0) + 'M' : (minAmount / 1000).toFixed(0) + 'K'} found yet
              </p>
            </div>
          ) : (
            <>
              {filteredTx.map((tx, index) => (
              <div 
                key={tx.id || index} 
                className="whale-item"
                onClick={() => handleTxClick(tx)}
                title="Click for full details"
              >
                <div className="whale-info">
                  <div className="whale-crypto">
                    <span className="crypto-symbol">{tx.symbol}</span>
                    <span className="crypto-amount">{tx.amount?.toLocaleString()} {tx.symbol}</span>
                  </div>
                  <div className="whale-value">
                    <span className="usd-amount">{formatUSD(tx.amount_usd)}</span>
                    <span className={`whale-type ${tx.transaction_type}`}>{tx.transaction_type}</span>
                  </div>
                </div>
                
                <div className="whale-route">
                  <div className="whale-from">
                    <span className="route-label">From:</span>
                    <span className="route-owner">{tx.from?.owner || 'Unknown'}</span>
                    <span className="owner-type">{tx.from?.owner_type}</span>
                  </div>
                  <i className="fas fa-arrow-right transfer-arrow"></i>
                  <div className="whale-to">
                    <span className="route-label">To:</span>
                    <span className="route-owner">{tx.to?.owner || 'Unknown'}</span>
                    <span className="owner-type">{tx.to?.owner_type}</span>
                  </div>
                </div>
                
                <div className="whale-meta">
                  <span className="blockchain-badge">{tx.blockchain}</span>
                  <span className="timestamp">{formatTime(tx.timestamp)}</span>
                </div>
              </div>
            ))}
            
            {/* Show "Searching..." message if less than 20 transactions */}
            {filteredTx.length < 20 && (
              <div className="whale-searching-more">
                <i className="fas fa-search-dollar fa-spin"></i>
                <p>🔍 Scanning {selectedNetworks.length > 0 ? `${selectedNetworks.length} selected` : '7'} blockchains for more whale transactions...</p>
                <span>Currently tracking {filteredTx.length} large transactions</span>
              </div>
            )}
          </>
        );
        })()}
      </div>

      {/* Motivational Footer - Rotating Slogans */}
      <div className="whale-footer">
        <div className="motivational-slogan" key={currentSloganIndex}>
          <i className="fas fa-lightbulb"></i>
          <span>{motivationalSlogans[currentSloganIndex]}</span>
        </div>
      </div>
      </div>
    </>
  );

  // Render Details Modal separately via Portal (always on top)
  const renderDetailsModal = () => {
    if (!selectedTx) return null;

    return ReactDOM.createPortal(
      <div className="whale-modal-overlay" onClick={closeModal}>
        <div className="whale-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <i className="fas fa-info-circle"></i>
              Transaction Details
            </h3>
            <button className="modal-close" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="modal-content">
            {/* Main Transaction Info - Hero Section */}
            <div className="tx-hero">
              <div className="tx-hero-amount">
                <span className="tx-hero-label">Transaction Value</span>
                <span className="tx-hero-usd">{formatUSD(selectedTx.amount_usd)}</span>
                <span className="tx-hero-crypto">{selectedTx.amount?.toLocaleString()} {selectedTx.symbol}</span>
              </div>
              <div className="tx-hero-meta">
                <span className="tx-meta-item">
                  <i className="fas fa-exchange-alt"></i>
                  {selectedTx.transaction_type?.toUpperCase()}
                </span>
                <span className="tx-meta-item">
                  <i className="fas fa-clock"></i>
                  {formatTime(selectedTx.timestamp)}
                </span>
                <span className="tx-meta-item">
                  <i className="fas fa-layer-group"></i>
                  {selectedTx.blockchain}
                </span>
              </div>
            </div>

            {/* Transaction Flow - Redesigned */}
            <div className="tx-flow">
              <div className="tx-flow-node from-node">
                <div className="flow-node-header">
                  <i className="fas fa-arrow-up"></i>
                  <span>FROM</span>
                </div>
                <div className="flow-node-content">
                  <div className="flow-node-address">{selectedTx.from?.owner}</div>
                  <div className="flow-node-badges">
                    <span className="flow-badge type">
                      <i className="fas fa-tag"></i>
                      {selectedTx.from?.owner_type}
                    </span>
                    <span className="flow-badge blockchain">
                      <i className="fas fa-cube"></i>
                      {selectedTx.blockchain}
                    </span>
                  </div>
                </div>
              </div>

              <div className="tx-flow-arrow">
                <i className="fas fa-long-arrow-alt-right"></i>
                <span className="flow-amount">{formatUSD(selectedTx.amount_usd)}</span>
              </div>

              <div className="tx-flow-node to-node">
                <div className="flow-node-header">
                  <i className="fas fa-arrow-down"></i>
                  <span>TO</span>
                </div>
                <div className="flow-node-content">
                  <div className="flow-node-address">{selectedTx.to?.owner}</div>
                  <div className="flow-node-badges">
                    <span className="flow-badge type">
                      <i className="fas fa-tag"></i>
                      {selectedTx.to?.owner_type}
                    </span>
                    <span className="flow-badge blockchain">
                      <i className="fas fa-cube"></i>
                      {selectedTx.blockchain}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction ID - Compact */}
            <div className="tx-id-section">
              <div className="tx-id-label">
                <i className="fas fa-fingerprint"></i>
                Transaction ID
              </div>
              <div className="tx-id-value">
                <span className="tx-id-text">{selectedTx.id}</span>
                <button 
                  className="tx-id-copy" 
                  onClick={copyTransactionId}
                  title="Copy Transaction ID"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
              <div className="tx-id-source">
                <i className="fas fa-database"></i>
                {selectedTx.source}
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Use Portal for 3/4 and fullscreen modes to render outside of page layout
  if (viewMode === 'threequarter' || viewMode === 'fullscreen') {
    return (
      <>
        {ReactDOM.createPortal(renderMainContent(), document.body)}
        {renderDetailsModal()}
      </>
    );
  }

  // Normal mode: render in place + modal via portal
  return (
    <>
      {renderMainContent()}
      {renderDetailsModal()}
    </>
  );
};

export default WhaleTransactions;

