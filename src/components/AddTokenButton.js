import React from 'react';
import { toast } from 'react-toastify';
import SmartTooltip from '../Presale/components/SmartTooltip';
import metamaskLogo from '../assets/icons/metamask-logo.png'; // Asigură-te că există sau folosim un fallback
import bitsLogo from '../assets/logo.png';
import './AddTokenButton.css';

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
        toast.success("BITS Token added to wallet!");
        // Play success sound
        const audio = new Audio('/sounds/success.wav');
        audio.play().catch(e => console.log(e));
      } else {
        toast.info("Action cancelled.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add token. Make sure you are on BSC Network.");
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

