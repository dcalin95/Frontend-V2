import React, { useState } from "react";
import { useWallet } from "../context/UnifiedWalletContext";
import UnifiedWalletModal from "../components/UnifiedWalletModal";
import "./HeaderWalletInfo.css";

import ethIcon from "../assets/icons/evm-logo.jpg";
import solIcon from "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 397.7 311.7'%3E%3ClinearGradient id='a'%3E%3Cstop offset='0' stop-color='%2300FFA3'/%3E%3Cstop offset='1' stop-color='%23DC1FFF'/%3E%3C/linearGradient%3E%3Cpath fill='url(%23a)' d='M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z'/%3E%3Cpath fill='url(%23a)' d='M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z'/%3E%3Cpath fill='url(%23a)' d='M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z'/%3E%3C/svg%3E";
import bitsIcon from "../assets/icons/logo.svg";

const HeaderWalletInfo = () => {
  const {
    walletAddress,
    disconnectWallet,
    nativeBalance,
    nativeSymbol,
    bitsBalance,
    connectWallet,
    walletName,
    walletType,
  } = useWallet();

  const [showWalletBox, setShowWalletBox] = useState(false);

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
      phantom: "https://pbs.twimg.com/profile_images/1598653277809528832/zqWi1qfT_400x400.jpg",
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

  return (
    <>
      <UnifiedWalletModal />
      <div className={`wallet-toggle-wrapper ${showWalletBox ? "open" : "closed"}`}>
      {!showWalletBox && (
        <button className="wallet-toggle-btn" onClick={() => setShowWalletBox(true)}>
          {/* ANIMATED MONEY SVG - SOLANA GRADIENT */}
          <svg className="money-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="solanaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14f195" />
                <stop offset="100%" stopColor="#9945ff" />
              </linearGradient>
            </defs>
            <rect x="2" y="6" width="20" height="12" rx="2" stroke="url(#solanaGradient)" strokeWidth="2"/>
            <circle className="coin-pulse" cx="12" cy="12" r="3" stroke="url(#solanaGradient)" strokeWidth="2" fill="none"/>
            <text x="12" y="14.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="url(#solanaGradient)">$</text>
            <path className="spark spark-1" d="M6 4L7 2" stroke="#14f195" strokeWidth="1.5" strokeLinecap="round"/>
            <path className="spark spark-2" d="M18 4L17 2" stroke="#9945ff" strokeWidth="1.5" strokeLinecap="round"/>
            <path className="spark spark-3" d="M6 20L7 22" stroke="#14f195" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Wallet
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
              </div>
              
              {/* Balances */}
              <div className="token-balance">
                <div className="balance-left">
                  <img src={walletType === "SOLANA" ? solIcon : ethIcon} alt={nativeSymbol} />
                  <span>{nativeSymbol}</span>
                </div>
                <span className="balance-amount">{nativeBalance || "0.0000"}</span>
              </div>
              <div className="token-balance">
                <div className="balance-left">
                  <img src={bitsIcon} alt="BITS" />
                  <span>BITS</span>
                </div>
                <span className="balance-amount">{parseFloat(bitsBalance).toLocaleString()}</span>
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
    </>
  );
};

export default HeaderWalletInfo;
