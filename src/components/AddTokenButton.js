import React from 'react';
import { toast } from 'react-toastify';
import SmartTooltip from '../Presale/components/SmartTooltip';
import metamaskLogo from '../assets/icons/metamask-logo.png'; // Asigură-te că există sau folosim un fallback
import bitsLogo from '../assets/logo.png';
import './AddTokenButton.css';
import './AddTokenButton.mobile.css';

const AddTokenButton = ({ className = '', style = {}, compact = false }) => {
  
  const tokenAddress = '0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe';
  const tokenSymbol = 'BITS';
  const tokenDecimals = 18;
  // MetaMask necesită un URL HTTPS public pentru imagine. 
  // Localhost nu va funcționa pentru iconiță în wallet-ul utilizatorului.
  // Folosim un URL public temporar sau cel de producție.
  const tokenImage = 'https://bits-ai.io/logo.png'; 

  const addTokenToWallet = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      toast.error("No crypto wallet found. Please install MetaMask.");
      return;
    }

    try {
      console.log('🦊 Adding BITS token to wallet...');
      console.log('Token Address:', tokenAddress);
      console.log('Token Symbol:', tokenSymbol);
      console.log('Token Decimals:', tokenDecimals);
      console.log('Token Image:', tokenImage);
      
      // Request to add the asset
      const wasAdded = await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', 
          options: {
            address: tokenAddress, 
            symbol: tokenSymbol, 
            decimals: tokenDecimals, 
            image: tokenImage, 
          },
        },
      });

      if (wasAdded) {
        toast.success("✅ BITS Token added to wallet successfully!");
        console.log('✅ BITS token added successfully');
        // Play success sound
        const audio = new Audio('/sounds/success.mp3');
        audio.play().catch(e => console.log('Sound play failed:', e));
      } else {
        toast.info("ℹ️ Token addition cancelled by user.");
        console.log('ℹ️ User cancelled token addition');
      }
    } catch (error) {
      console.error('❌ Error adding BITS token to wallet:', error);
      
      // Detailed error messages
      if (error.code === 4001) {
        toast.warning("⚠️ You rejected the request to add BITS token.");
      } else if (error.code === -32002) {
        toast.warning("⚠️ Request already pending. Please check your wallet.");
      } else if (error.message && error.message.includes('network')) {
        toast.error("❌ Please switch to BSC Network (Binance Smart Chain) in your wallet.");
      } else {
        toast.error(`❌ Failed to add BITS token. ${error.message || 'Please try again.'}`);
      }
    }
  };

  return (
    <SmartTooltip content={`Add to Wallet\nClick to instantly add $BITS token and logo to your MetaMask/Web3 wallet.`}>
      <button 
        className={`add-token-btn ${compact ? 'compact' : ''} ${className}`} 
        style={style}
        onClick={addTokenToWallet}
      >
        <div className="add-token-icon-wrapper">
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="metamask-fox" />
        </div>
        {!compact && <span className="add-token-text">Add BITS to Wallet</span>}
        {compact && <span className="add-token-text">Add BITS</span>}
        <div className="add-token-plus">+</div>
      </button>
    </SmartTooltip>
  );
};

export default AddTokenButton;

