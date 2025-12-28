import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useGeoLocation } from "../context/GeoLocationContext"; 
import SwapModal from "../components/SwapModal";
import HistoryModal from "../components/HistoryModal";
import axios from "axios"; 
import "./HeaderWalletInfo.css";
import "./HeaderWalletInfo.mobile.css"; 

import ethIcon from "../assets/icons/evm-logo.jpg";
import binanceLogo from "../assets/exchanges/binance.png"; // Import Binance/BSC logo
import bitsIcon from "../assets/logo.png"; 
import phantomLogo from "../assets/icons/phantom-logo.png"; 
import walletLogo from "../assets/icons/wallet.png"; 

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
const CURRENT_STAGE_PRICE = 0.00065; 

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

const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode === 'GL') return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

const HeaderWalletInfo = () => {
  const location = useLocation();
  const {
    walletAddress,
    disconnectWallet,
    ethBalance,
    nativeSymbol,
    bitsBalance,
    walletName,
    walletType,
    setShowWalletModal,
    chainId, // 🔍 Get chainId to detect network
    rememberWallet,
    setRememberWalletEnabled,
  } = useWallet();

  const { countryCode, country, city, ip } = useGeoLocation();
  
  const [prices, setPrices] = useState({
    BNB: 0,
    ETH: 0,
    SOL: 0,
    BITS: CURRENT_STAGE_PRICE 
  });

  // 🖱️ DRAG & DROP STATE
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('wallet_widget_pos');
    if (saved) return JSON.parse(saved);
    return { top: 250, left: window.innerWidth - 300 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [showWalletBox, setShowWalletBox] = useState(false); // ✅ Define showWalletBox early

  // 🎯 NAVIGATION AUTO-MINIMIZE
  useEffect(() => {
    console.log("🚶 [HeaderWalletInfo] Navigation detected, auto-minimizing wallet...");
    setShowWalletBox(false);
  }, [location.pathname]);

  const dragOffset = useRef({ x: 0, y: 0 });
  const wrapperRef = useRef(null);

  // 🛠️ HANDLER DE DRAG IMBUNATATIT
  const handleMouseDown = (e) => {
    if (window.innerWidth <= 768) return;
    
    // Ignorăm click-urile pe butoane, link-uri sau input-uri
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
        // Dacă e butonul principal (iconița), vrem să îl putem trage totuși
        if (!e.target.closest('.wallet-toggle-btn-minimal')) {
            return;
        }
    }

    setIsDragging(true);
    
    // Calculăm offset-ul față de colțul stânga-sus al elementului
    const rect = wrapperRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Prevenim selecția textului în timpul drag-ului
    e.preventDefault();
  };

  // 🎯 AUTO-OPEN WALLET BOX AFTER CONNECTION
  useEffect(() => {
    const handleOpenWalletBox = () => {
      console.log('📦 [HeaderWalletInfo] Received openWalletBox event, opening wallet box...');
      // Small delay to ensure wallet data is loaded
      setTimeout(() => {
        setShowWalletBox(true);
        console.log('✅ [HeaderWalletInfo] Wallet box opened');
      }, 300);
    };
    
    window.addEventListener('openWalletBox', handleOpenWalletBox);
    return () => {
      window.removeEventListener('openWalletBox', handleOpenWalletBox);
    };
  }, []);

  // 🎯 ALSO AUTO-OPEN WHEN WALLET ADDRESS BECOMES AVAILABLE (fallback)
  useEffect(() => {
    if (walletAddress && !showWalletBox) {
      // Only auto-open if we just connected (not if wallet was already connected)
      const justConnected = sessionStorage.getItem('wallet_just_connected');
      if (justConnected === 'true') {
        console.log('📦 [HeaderWalletInfo] Wallet address available, auto-opening wallet box...');
        setTimeout(() => {
          setShowWalletBox(true);
          sessionStorage.removeItem('wallet_just_connected');
        }, 500);
      }
    }
  }, [walletAddress, showWalletBox]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newLeft = e.clientX - dragOffset.current.x;
      const newTop = e.clientY - dragOffset.current.y;

      // Limităm mișcarea în interiorul ferestrei
      const maxLeft = window.innerWidth - (wrapperRef.current?.offsetWidth || 50);
      const maxTop = window.innerHeight - (wrapperRef.current?.offsetHeight || 50);

      setPosition({
        left: Math.max(0, Math.min(newLeft, maxLeft)),
        top: Math.max(0, Math.min(newTop, maxTop))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem('wallet_widget_pos', JSON.stringify(position));
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]); // Dependența 'position' e importantă pentru closure


  // Fetch Live Prices (Dynamic)
  useEffect(() => {
    const fetchPrices = async () => {
      const cached = sessionStorage.getItem('bits_crypto_prices');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 15 * 60 * 1000) {
             setPrices(prev => ({ ...prev, ...parsed.data }));
             return;
          }
        } catch (e) {}
      }

      try {
        const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin,ethereum,solana&vs_currencies=usd');
        const newPrices = {
          BNB: res.data.binancecoin?.usd || 0,
          ETH: res.data.ethereum?.usd || 0,
          SOL: res.data.solana?.usd || 0,
        };
        setPrices(prev => ({ ...prev, ...newPrices }));
        sessionStorage.setItem('bits_crypto_prices', JSON.stringify({ data: newPrices, timestamp: Date.now() }));
      } catch (e) {}
    };
    
    fetchPrices();
    const interval = setInterval(fetchPrices, 120000);
    return () => clearInterval(interval);
  }, []);

  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Geo Location
  useEffect(() => {
    if (walletAddress && countryCode) {
      const registerLocation = async () => {
        try {
          await axios.post(`${API_URL}/api/auth/update-location`, {
            walletAddress, country, city, countryCode, ip
          });
        } catch (error) {}
      };
      registerLocation();
    }
  }, [walletAddress, countryCode, country, city, ip]);

  // Wallet Icons
  const getWalletIcon = (name) => {
    if (!name) return null;
    const walletLower = name.toLowerCase();
    const icons = {
      metamask: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
      walletconnect: "https://docs.walletconnect.com/img/walletconnect-logo.png",
      coinbase: "https://avatars.githubusercontent.com/u/18060234?s=200&v=4",
      rainbow: "https://avatars.githubusercontent.com/u/48327834?s=200&v=4",
      trust: "https://trustwallet.com/assets/images/media/assets/TWT.png",
      phantom: phantomLogo,
      safe: "https://avatars.githubusercontent.com/u/24954812?s=200&v=4",
    };
    for (const [key, icon] of Object.entries(icons)) {
      if (walletLower.includes(key)) return icon;
    }
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect x='3' y='6' width='18' height='13' rx='2' stroke='%2314f195' stroke-width='2'/%3E%3Ccircle cx='15' cy='12' r='1.5' fill='%239945ff'/%3E%3C/svg%3E";
  };

  const getUsdValue = (amount, symbol) => {
    let price = 0;
    if (symbol === 'BNB') price = prices.BNB;
    else if (symbol === 'ETH') price = prices.ETH;
    else if (symbol === 'SOL') price = prices.SOL;
    else if (symbol === 'BITS') price = prices.BITS;

    if (!price || price === 0) return null;
    const value = parseFloat(amount) * price;
    if (isNaN(value) || value === 0) return null;
    return value < 0.01 ? "< $0.01" : `≈ $${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <div 
        ref={wrapperRef}
        className={`wallet-toggle-wrapper ${showWalletBox ? "open" : "closed"} ${isDragging ? "dragging" : ""}`}
        // 🛑 MUTAT HANDLERUL AICI PE WRAPPER
        onMouseDown={handleMouseDown}
        style={
          typeof window !== 'undefined' && window.innerWidth > 768 
            ? { 
                position: 'fixed', 
                top: `${position.top}px`, 
                left: `${position.left}px`,
                right: 'auto', 
                zIndex: 2147483647,
                cursor: isDragging ? 'grabbing' : 'grab',
                // Important pentru drag:
                touchAction: 'none' 
              } 
            : {}
        }
      >
      {!showWalletBox && (
        <button className="wallet-toggle-btn-minimal" onClick={() => setShowWalletBox(true)} aria-label="Open Wallet">
          <img src={bitsIcon} alt="BITS" className="wallet-bits-bg" />
          <img src={walletLogo} alt="Wallet" className="wallet-logo-img" />
        </button>
      )}

      {showWalletBox && !walletAddress && (
        <button
          className="connect-wallet-button-floating"
          onClick={() => { setShowWalletModal(true); setShowWalletBox(false); }}
        >
          <i className="fa-solid fa-link"></i>
          <span>CONNECT</span>
        </button>
      )}

      {showWalletBox && walletAddress && (
        <div className="wallet-header-info">
          {/* 🖐️ ZONA DE DRAG EXPLICITA */}
          <div className="drag-handle-bar" style={{
            width: '100%', 
            height: '20px', 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '10px 10px 0 0', 
            marginBottom: '10px',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{width: '40px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px'}}></div>
          </div>

          {/* 🎯 SLOGAN LINK - $BITS Presale */}
          <Link 
            to="/presale" 
            className="wallet-presale-slogan"
            onClick={() => setShowWalletBox(false)}
            title="Go to Presale"
          >
            <span className="slogan-text">$BITS Presale</span>
          </Link>

          {/* ➖ Buton Minimize - Poziție originală (sus dreapta ferestrei) */}
          <button 
            className="wallet-minimize-btn" 
            onClick={() => setShowWalletBox(false)}
            aria-label="Minimize wallet window"
            title="Minimize"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="minimize-text">Minimize</span>
          </button>

          <label
            className="wallet-remember-toggle"
            title="Keep your wallet connected on this device until you disconnect manually."
          >
            <input
              type="checkbox"
              checked={!!rememberWallet}
              onChange={(e) => setRememberWalletEnabled?.(e.target.checked)}
            />
            <span>Remember wallet</span>
          </label>

            <>
              <div className="wallet-identifier">
                <div className="wallet-name-row">
                  {getWalletIcon(walletName) && (
                    <img src={getWalletIcon(walletName)} alt={walletName} className="wallet-provider-icon" />
                  )}
                  <span className="wallet-name">{walletName || "Wallet"}</span>
                </div>
                <span className="wallet-address">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                
                {countryCode && (
                  <div className="geo-location-row">
                    <span className="geo-flag">{getFlagEmoji(countryCode)}</span>
                    <span className="geo-country-name">{country}</span>
                    <span className="geo-status-dot">●</span>
                  </div>
                )}
              </div>
              
              <div className="token-balance">
                <div className="balance-left">
                  {walletType === "SOLANA" ? (
                    <SolanaIcon />
                  ) : chainId === 56 ? (
                    <img src={binanceLogo} alt="BSC" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                  ) : (
                    <img src={ethIcon} alt={nativeSymbol} />
                  )}
                  <span>{nativeSymbol}</span>
                </div>
                <span className="balance-amount">
                  {/* DEBUG INFO: Fallback daca e undefined */}
                  {ethBalance !== undefined && ethBalance !== null ? parseFloat(ethBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "0.0000"}
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
                  {walletType === "SOLANA" ? (
                    <span style={{ fontSize: "0.75rem", opacity: 0.8, fontWeight: 500 }}>(BSC Only)</span>
                  ) : (
                    <>
                      {bitsBalance !== undefined && bitsBalance !== null ? parseFloat(bitsBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : "0"}
                      <div className="usd-estimate" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                        {getUsdValue(bitsBalance, 'BITS')}
                      </div>
                    </>
                  )}
                </span>
              </div>
              
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
        </div>
      )}
    </div>
    
    <SwapModal isOpen={swapModalOpen} onClose={() => setSwapModalOpen(false)} />
    <HistoryModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} />
    </>
  );
};

export default HeaderWalletInfo;
