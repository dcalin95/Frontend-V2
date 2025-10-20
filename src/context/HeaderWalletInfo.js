import React, { useContext, useState } from "react";
import WalletContext from "../context/WalletContext";
import { WALLET_TYPES } from "../context/wallet/walletTypes";
import "./HeaderWalletInfo.css";

import ethIcon from "../assets/icons/evm-logo.jpg";
import bitsIcon from "../assets/icons/logo.svg";
import metamaskIcon from "../assets/icons/metamask-logo.png";
import torusIcon from "../assets/icons/torus-logo.png";
import phantomIcon from "../assets/icons/phantom-logo.png";
import walletConnectIcon from "../assets/icons/wallet-connect-logo.png";
import coinbaseIcon from "../assets/icons/coinbase-logo.png";
import rainbowIcon from "../assets/icons/rainbow-logo.png";

const HeaderWalletInfo = () => {
  const {
    walletAddress,
    disconnectWallet,
    ethBalance,
    bitsBalance,
    connectWallet,
  } = useContext(WalletContext);

  const [showWalletBox, setShowWalletBox] = useState(false); // Schimbat de la true la false
  const [showDropdown, setShowDropdown] = useState(false);

  const handleConnect = (type) => {
    connectWallet(type);
    setShowDropdown(false);
  };

  return (
    <div className={`wallet-toggle-wrapper ${showWalletBox ? "open" : "closed"}`}>
      {!showWalletBox && (
        <button className="wallet-toggle-btn" onClick={() => setShowWalletBox(true)}>➡ Wallet</button>
      )}

      {showWalletBox && (
        <div className="wallet-header-info">
          <button className="wallet-close-btn" onClick={() => setShowWalletBox(false)}>✖</button>
          {walletAddress ? (
            <>
              <div className="token-balance">
                <img src={ethIcon} alt="BNB" />
                BNB: {parseFloat(ethBalance).toFixed(4)}
              </div>
              <div className="token-balance">
                <img src={bitsIcon} alt="BITS" />
                $BITS: {parseFloat(bitsBalance).toLocaleString()}
              </div>
              <button className="disconnect-button" onClick={disconnectWallet}>
                🔓 Disconnect
              </button>
            </>
          ) : (
            <div className="wallet-dropdown">
              <button
                className="connect-wallet-button"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                🔌 Connect Wallet
              </button>
              {showDropdown && (
                <div className="wallet-options">
                  <div onClick={() => handleConnect(WALLET_TYPES.EVM)}>
                    <img src={metamaskIcon} alt="MetaMask" />
                    MetaMask
                  </div>
                  <div onClick={() => handleConnect(WALLET_TYPES.COINBASE)}>
                    <img src={coinbaseIcon} alt="Coinbase Wallet" />
                    Coinbase Wallet
                  </div>
                  <div onClick={() => handleConnect(WALLET_TYPES.RAINBOW)}>
                    <img src={rainbowIcon} alt="Rainbow" />
                    Rainbow
                  </div>
                  <div onClick={() => handleConnect(WALLET_TYPES.WALLETCONNECT)}>
                    <img src={walletConnectIcon} alt="WalletConnect" />
                    WalletConnect
                  </div>
                  <div onClick={() => handleConnect(WALLET_TYPES.TORUS)}>
                    <img src={torusIcon} alt="Web3Auth" />
                    Web3Auth
                  </div>
                  <div onClick={() => handleConnect(WALLET_TYPES.SOLANA)}>
                    <img src={phantomIcon} alt="Phantom" />
                    Phantom
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderWalletInfo;
