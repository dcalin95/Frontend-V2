/**
 * 📊 TradePage Component
 * 
 * Main Trade Page - Similar cu Oxium DEX
 * https://app.oxium.xyz/trade
 */

import React, { useState, useContext, useEffect } from 'react';
import WalletContext from '../../../context/WalletContext';
import TradeHeader from './components/TradeHeader';
import TradingViewChart from './components/TradingViewChart';
import OrderBook from './components/OrderBook';
import SwapLimitPanel from './components/SwapLimitPanel';
import TradeTabs from './components/TradeTabs';
import WalletModal from './components/WalletModal';
import useOrderBook from './hooks/useOrderBook';
import useMarketData from './hooks/useMarketData';
import useTradingPair from './hooks/useTradingPair';
import useRecentTrades from './hooks/useRecentTrades';
import devTokenListService from '../services/devTokenListService';
import './styles/TradePage.css';

// DEV MODE – Fallback tokens (will be replaced by fetched tokens)
const FALLBACK_TOKENS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    price: 0
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    price: 0
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    price: 0
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    price: 0
  }
];

const TradePage = () => {
  const {
    walletAddress,
    connectWallet,
    disconnectWallet
  } = useContext(WalletContext);

  const [tokens, setTokens] = useState(FALLBACK_TOKENS);

  const { tokenIn, tokenOut, handlePairChange } = useTradingPair(
    tokens[0] || FALLBACK_TOKENS[0],
    tokens[1] || FALLBACK_TOKENS[1],
    tokens
  );

  const { bids, asks, loading: orderBookLoading } = useOrderBook(tokenIn, tokenOut);
  const { marketData, loading: marketDataLoading } = useMarketData(tokenIn, tokenOut);
  const { recentTrades, loading: recentTradesLoading } = useRecentTrades(tokenIn, tokenOut);

  const [openOrders, setOpenOrders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const [balances, setBalances] = useState({});
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [recentWallets, setRecentWallets] = useState(() => {
    const saved = localStorage.getItem('trade_recent_wallets');
    return saved ? JSON.parse(saved) : [];
  });

  // DEV MODE – Fetch popular tokens from CoinGecko
  // Will be replaced by backend API when deployed
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const fetchedTokens = await devTokenListService.getPopularTokens();
        if (fetchedTokens && fetchedTokens.length > 0) {
          setTokens(fetchedTokens);
        }
      } catch (error) {
        console.error('DEV MODE – Token list fetch error:', error);
        // Keep fallback tokens on error
      }
    };
    
    fetchTokens();
  }, []);

  const handleSwap = async (swapData) => {
    try {
      // TODO: Implement swap execution
      console.log('Swap:', swapData);
      // await tradeService.executeSwap(swapData);
    } catch (error) {
      console.error('Swap error:', error);
    }
  };

  const handleLimitOrder = async (orderData) => {
    try {
      // TODO: Implement limit order
      console.log('Limit Order:', orderData);
      // await tradeService.placeLimitOrder(orderData);
    } catch (error) {
      console.error('Limit order error:', error);
    }
  };

  const handleCancelOrder = (orderId) => {
    setOpenOrders(prev => prev.filter(order => order.id !== orderId));
  };

  const handleClosePosition = (positionId) => {
    setPositions(prev => prev.filter(pos => pos.id !== positionId));
  };

  return (
    <div className="trade-page">
      <TradeHeader
        tokenIn={tokenIn}
        tokenOut={tokenOut}
        tokens={tokens}
        onPairChange={handlePairChange}
        onConnectWallet={() => setShowWalletModal(true)}
        walletAddress={walletAddress}
        marketData={marketData}
      />

      <div className="trade-page-content">
        <div className="trade-page-main">
          <div className="trade-page-left">
            <div className="trade-chart-section">
              <TradingViewChart
                tokenIn={tokenIn?.symbol}
                tokenOut={tokenOut?.symbol}
              />
            </div>

            <div className="trade-orders-section">
              <TradeTabs
                openOrders={openOrders}
                positions={positions}
                orderHistory={orderHistory}
                onCancelOrder={handleCancelOrder}
                onClosePosition={handleClosePosition}
                showAllMarkets={showAllMarkets}
                onToggleShowAll={() => setShowAllMarkets(!showAllMarkets)}
              />
            </div>
          </div>

          <div className="trade-page-right">
            <div className="trade-orderbook-section">
              <OrderBook
                bids={bids}
                asks={asks}
                recentTrades={recentTrades}
                onPriceClick={(price) => {
                  // TODO: Fill price in swap panel
                  console.log('Price clicked:', price);
                }}
              />
            </div>

            <div className="trade-swap-section">
              <SwapLimitPanel
                tokenIn={tokenIn}
                tokenOut={tokenOut}
                tokens={tokens}
                balances={balances}
                marketData={marketData}
                onTokenChange={handlePairChange}
                onSwap={handleSwap}
                onLimitOrder={handleLimitOrder}
                walletAddress={walletAddress}
                onConnectWallet={() => setShowWalletModal(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={(provider) => {
          // Save to recent wallets
          const newRecent = [
            {
              id: Date.now(),
              providerId: provider.id,
              address: walletAddress || '0x...',
              timestamp: Date.now()
            },
            ...recentWallets.filter(w => w.providerId !== provider.id)
          ].slice(0, 3);
          
          setRecentWallets(newRecent);
          localStorage.setItem('trade_recent_wallets', JSON.stringify(newRecent));
          
          // Connect wallet
          if (connectWallet) {
            connectWallet();
          }
        }}
        recentWallets={recentWallets}
      />
    </div>
  );
};

export default TradePage;

