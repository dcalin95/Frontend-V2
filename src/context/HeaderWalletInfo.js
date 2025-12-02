import React, { useState, useEffect } from "react";
import { useWallet } from "../context/UnifiedWalletContext";
import { useGeoLocation } from "../context/GeoLocationContext"; // 🌍 Import Geo
import UnifiedWalletModal from "../components/UnifiedWalletModal";
import SwapModal from "../components/SwapModal";
import HistoryModal from "../components/HistoryModal";
import axios from "axios"; // For API calls
import "./HeaderWalletInfo.css";
import "./HeaderWalletInfo.mobile.css"; // 📱 Mobile Compact Styles

import ethIcon from "../assets/icons/evm-logo.jpg";
import bitsIcon from "../assets/logo.png"; // Updated to use the correct project logo
import phantomLogo from "../assets/icons/phantom-logo.png"; // Import local Phantom logo

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
const CURRENT_STAGE_PRICE = 0.00065; // Defined presale price constant

// Solana icon as inline SVG component
const SolanaIcon = () => (
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 397.7 311.7' width="20" height="20">
    <defs>
      <linearGradient id='solGrad'>
        <stop offset='0' stopColor='#00FFA3'/>
        <stop offset='1' stopColor='#DC1FFF'/>
      </linearGradient>
    </defs>
    <path fill='url(#solGrad)' d='M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z'/>
    <path fill='url(#solGrad)' d='M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z'/>
    <path fill='url(#solGrad)' d='M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z'/>
  </svg>
);

// Helper to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode === 'GL') return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

const HeaderWalletInfo = () => {
  const {
    walletAddress,
    disconnectWallet,
    ethBalance,
    nativeSymbol,
    bitsBalance,
    connectWallet,
    walletName,
    walletType,
  } = useWallet();

  const { countryCode, country, city, ip } = useGeoLocation(); // 🌍 Get Geo Data
  
  // 💲 USD Price State - No hardcoded fallbacks
  const [prices, setPrices] = useState({
    BNB: 0,
    ETH: 0,
    SOL: 0,
    BITS: CURRENT_STAGE_PRICE 
  });

  // Fetch Live Prices (Dynamic)
  useEffect(() => {
    const fetchPrices = async () => {
      // 1. Try to load from cache first to avoid flicker/API limits
      const cached = sessionStorage.getItem('bits_crypto_prices');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Check if cache is fresh (less than 15 mins)
          if (Date.now() - parsed.timestamp < 15 * 60 * 1000) {
             setPrices(prev => ({ ...prev, ...parsed.data }));
             console.log("💲 [WalletInfo] Loaded prices from cache");
             return;
          }
        } catch (e) {
          // invalid cache, ignore
        }
      }

      try {
        console.log("💲 [WalletInfo] Fetching live prices from CoinGecko...");
        // Simple CoinGecko API call (free tier)
        const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,ethereum,solana&vs_currencies=usd');
        
        const newPrices = {
          BNB: res.data.binancecoin?.usd || 0,
          ETH: res.data.ethereum?.usd || 0,
          SOL: res.data.solana?.usd || 0,
        };

        setPrices(prev => ({
          ...prev,
          ...newPrices
        }));

        // Update cache
        sessionStorage.setItem('bits_crypto_prices', JSON.stringify({
            data: newPrices,
            timestamp: Date.now()
        }));

      } catch (e) {
        console.warn("💲 [WalletInfo] Failed to fetch live prices:", e.message);
        // In case of error, we stick to 0 (no fake data)
      }
    };
    
    fetchPrices();
    // Optional: Refresh every 2 minutes
    const interval = setInterval(fetchPrices, 120000);
    return () => clearInterval(interval);
  }, []);

  const [showWalletBox, setShowWalletBox] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // 🌍 Auto-Register User Location on Connect
  useEffect(() => {
    if (walletAddress && countryCode) {
      const registerLocation = async () => {
        try {
          // Trimitem datele la backend pentru a le salva
          await axios.post(`${API_URL}/api/auth/update-location`, {
            walletAddress,
            country,
            city,
            countryCode,
            ip
          });
          console.log("🌍 [GeoSystem] Location registered for user:", walletAddress);
        } catch (error) {
          // Fail silently (nu deranjăm userul dacă serverul e jos)
          console.warn("🌍 [GeoSystem] Failed to register location:", error.message);
        }
      };
      registerLocation();
    }
  }, [walletAddress, countryCode, country, city, ip]);

  // 🎨 Wallet Icon Mapping System
  const getWalletIcon = (name) => {
    if (!name) return null;
    
    const walletLower = name.toLowerCase();
    
    // SVG Icons as data URIs for instant loading
    const icons = {
      metamask: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
      walletconnect: "https://docs.walletconnect.com/img/walletconnect-logo.png",
      coinbase: "https://avatars.githubusercontent.com/u/18060234?s=200&v=4",
      rainbow: "https://avatars.githubusercontent.com/u/48327834?s=200&v=4",
      trust: "https://trustwallet.com/assets/images/media/assets/TWT.png",
      phantom: phantomLogo, // Use local import
      safe: "https://avatars.githubusercontent.com/u/24954812?s=200&v=4",
    };

    // Match wallet name to icon
    for (const [key, icon] of Object.entries(icons)) {
      if (walletLower.includes(key)) {
        return icon;
      }
    }

    // Default wallet icon (generic)
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect x='3' y='6' width='18' height='13' rx='2' stroke='%2314f195' stroke-width='2'/%3E%3Ccircle cx='15' cy='12' r='1.5' fill='%239945ff'/%3E%3C/svg%3E";
  };

  // Helper to calculate USD value
  const getUsdValue = (amount, symbol) => {
    // Determine which price to use based on symbol mapping
    let price = 0;
    if (symbol === 'BNB') price = prices.BNB;
    else if (symbol === 'ETH') price = prices.ETH;
    else if (symbol === 'SOL') price = prices.SOL;
    else if (symbol === 'BITS') price = prices.BITS;
    // Handle other EVM natives (MATIC, AVAX) if needed in future by fetching them

    if (!price || price === 0) return null; // Don't show if price not loaded

    const value = parseFloat(amount) * price;
    if (isNaN(value) || value === 0) return null;
    
    return value < 0.01 ? "< $0.01" : `≈ $${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <UnifiedWalletModal />
      <div className={`wallet-toggle-wrapper ${showWalletBox ? "open" : "closed"}`}>
      {!showWalletBox && (
        <button className="wallet-toggle-btn-minimal" onClick={() => setShowWalletBox(true)} aria-label="Open Wallet">
          {/* 100% SHARP WALLET SVG - NO BLUR */}
          <svg className="wallet-svg-animated" width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14F195"/>
                <stop offset="50%" stopColor="#00D4FF"/>
                <stop offset="100%" stopColor="#9945FF"/>
              </linearGradient>
              <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700"/>
                <stop offset="100%" stopColor="#FFA500"/>
              </linearGradient>
            </defs>
            
            {/* Wallet Body */}
            <rect x="6" y="12" width="40" height="28" rx="4" fill="none" stroke="url(#walletGrad)" strokeWidth="2.5"/>
            
            {/* Wallet Top Flap */}
            <path d="M6 16C6 13.79 7.79 12 10 12H42C44.21 12 46 13.79 46 16V18H6V16Z" fill="url(#walletGrad)"/>
            
            {/* Card Lines */}
            <rect x="10" y="22" width="16" height="2" rx="1" fill="#00D4FF"/>
            <rect x="10" y="27" width="12" height="2" rx="1" fill="#9945FF"/>
            <rect x="10" y="32" width="8" height="2" rx="1" fill="#14F195"/>
            
            {/* Bitcoin Coin */}
            <circle cx="38" cy="28" r="8" fill="none" stroke="url(#coinGrad)" strokeWidth="2"/>
            <text x="38" y="32" fontSize="10" fontWeight="bold" fill="#FFD700" textAnchor="middle" fontFamily="Arial">₿</text>
          </svg>
        </button>
      )}

      {showWalletBox && (
        <div className="wallet-header-info">
          <button className="wallet-close-btn" onClick={() => setShowWalletBox(false)}>✖</button>
          {walletAddress ? (
            <>
              {/* Wallet Name & Address with Icon */}
              <div className="wallet-identifier">
                <div className="wallet-name-row">
                  {getWalletIcon(walletName) && (
                    <img src={getWalletIcon(walletName)} alt={walletName} className="wallet-provider-icon" />
                  )}
                  <span className="wallet-name">{walletName || "Wallet"}</span>
                </div>
                <span className="wallet-address">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                
                {/* 🌍 Country Flag Indicator - NEW ROW */}
                {countryCode && (
                  <div className="geo-location-row">
                    <span className="geo-flag">{getFlagEmoji(countryCode)}</span>
                    <span className="geo-country-name">{country}</span>
                    <span className="geo-status-dot">●</span>
                  </div>
                )}
              </div>
              
              {/* Balances */}
              <div className="token-balance">
                <div className="balance-left">
                  {walletType === "SOLANA" ? <SolanaIcon /> : <img src={ethIcon} alt={nativeSymbol} />}
                  <span>{nativeSymbol}</span>
                </div>
                <span className="balance-amount">
                  {/* Display BNB with up to 4 decimals */}
                  {ethBalance ? parseFloat(ethBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "0.0000"}
                  <div className="usd-estimate" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                    {getUsdValue(ethBalance, nativeSymbol)}
                  </div>
                </span>
              </div>
              <div className="token-balance">
                <div className="balance-left">
                  <img src={bitsIcon} alt="BITS" />
                  <span>BITS</span>
                </div>
                <span className="balance-amount">
                  {/* Display BITS with up to 5 decimals */}
                  {walletType === "SOLANA" ? (
                    <span style={{ fontSize: "0.75rem", opacity: 0.8, fontWeight: 500 }}>(BSC Only)</span>
                  ) : (
                    <>
                      {bitsBalance ? parseFloat(bitsBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : "0"}
                      <div className="usd-estimate" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                        {getUsdValue(bitsBalance, 'BITS')}
                      </div>
                    </>
                  )}
                </span>
              </div>
              
              {/* Quick Actions Buttons - NEW */}
              <div className="wallet-quick-actions">
                <button 
                  className="wallet-action-btn history-btn" 
                  onClick={() => { setHistoryModalOpen(true); setShowWalletBox(false); }}
                >
                  <i className="fas fa-history"></i>
                  <span>View History</span>
                </button>
                <button 
                  className="wallet-action-btn swap-btn" 
                  onClick={() => { setSwapModalOpen(true); setShowWalletBox(false); }}
                >
                  <i className="fas fa-right-left"></i>
                  <span>Swap Tokens</span>
                </button>
              </div>
              
              <button className="disconnect-button" onClick={disconnectWallet}>
                🔓 Disconnect
              </button>
            </>
          ) : (
            <div className="wallet-dropdown">
              <button
                className="connect-wallet-button"
                onClick={() => connectWallet()}
              >
                🔌 Connect Wallet
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    
    {/* Modals */}
    <SwapModal isOpen={swapModalOpen} onClose={() => setSwapModalOpen(false)} />
    <HistoryModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} />
    </>
  );
};

export default HeaderWalletInfo;
