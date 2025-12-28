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
      toast.error("❌ No crypto wallet found. Please install MetaMask.");
      console.error('❌ No Ethereum provider found');
      return;
    }

    try {
      console.log('🔄 ===== ATTEMPTING TO ADD BITS TOKEN =====');
      console.log('📋 Token Details:', {
        address: tokenAddress,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        image: tokenImage
      });

      // 🔍 DETECT WALLET TYPE & CAPABILITIES
      const walletType = ethereum.isCoinbaseWallet ? 'Coinbase Wallet' :
                         ethereum.isTrust ? 'Trust Wallet' :
                         ethereum.isMetaMask ? 'MetaMask' :
                         ethereum.isBraveWallet ? 'Brave Wallet' :
                         'Unknown Wallet';
      
      console.log('🔍 Detected Wallet:', walletType);
      console.log('🔍 Wallet Capabilities:', {
        isMetaMask: ethereum.isMetaMask,
        isCoinbaseWallet: ethereum.isCoinbaseWallet,
        isTrust: ethereum.isTrust,
        isBraveWallet: ethereum.isBraveWallet,
        hasRequest: typeof ethereum.request === 'function'
      });

      // 🔍 CHECK IF wallet_watchAsset IS SUPPORTED
      const supportsRequest = typeof ethereum.request === 'function';
      
      if (!supportsRequest) {
        console.warn('⚠️ Wallet does not support ethereum.request()');
        toast.warning(`⚠️ ${walletType} doesn't support automatic token adding.`);
        
        // 📋 COPY CONTRACT ADDRESS AS FALLBACK
        try {
          await navigator.clipboard.writeText(tokenAddress);
          toast.success(`📋 Contract address copied!\n\nPlease add manually:\nAddress: ${tokenAddress}\nSymbol: ${tokenSymbol}\nDecimals: ${tokenDecimals}`);
          console.log('📋 Contract address copied:', tokenAddress);
        } catch (clipError) {
          console.error('Failed to copy to clipboard:', clipError);
          toast.info(`Please add manually:\nAddress: ${tokenAddress}`);
        }
        return;
      }

      // 🚀 TRY TO ADD TOKEN VIA wallet_watchAsset
      console.log('🚀 Calling wallet_watchAsset...');
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

      console.log('✅ Token addition result:', wasAdded);

      if (wasAdded) {
        toast.success("✅ BITS Token added to wallet successfully!");
        console.log('✅ User confirmed token addition');
        // Play success sound
        const audio = new Audio('/sounds/success.mp3');
        audio.play().catch(e => console.log('Sound play failed:', e));
      } else {
        toast.info("ℹ️ Token addition cancelled by user.");
        console.log('ℹ️ User cancelled token addition');
      }
    } catch (error) {
      console.error('❌ ===== ERROR ADDING BITS TOKEN =====');
      console.error('❌ Error Object:', error);
      console.error('❌ Error Code:', error.code);
      console.error('❌ Error Message:', error.message);
      console.error('❌ Error Stack:', error.stack);
      
      // 🔍 DETAILED ERROR HANDLING
      if (error.code === 4001) {
        toast.warning("⚠️ You rejected the request to add BITS token.");
        console.log('⚠️ User rejected the request (code 4001)');
        
      } else if (error.code === -32002) {
        toast.warning("⚠️ Request already pending. Please check your wallet.");
        console.log('⚠️ Request already pending (code -32002)');
        
      } else if (error.message && (
        error.message.includes('wallet_watchAsset') || 
        error.message.includes("isn't implemented") ||
        error.message.includes('not supported')
      )) {
        // ⚠️ WALLET DOESN'T SUPPORT wallet_watchAsset
        console.warn('⚠️ Wallet does not support wallet_watchAsset method');
        toast.warning(`⚠️ Your wallet doesn't support automatic token adding.`);
        
        // 📋 FALLBACK: COPY CONTRACT ADDRESS TO CLIPBOARD
        try {
          await navigator.clipboard.writeText(tokenAddress);
          toast.success(`📋 Contract address copied to clipboard!\n\nPlease add manually in your wallet:\n\nAddress: ${tokenAddress}\nSymbol: ${tokenSymbol}\nDecimals: ${tokenDecimals}\nNetwork: BSC (BEP-20)`);
          console.log('📋 Contract address copied as fallback:', tokenAddress);
        } catch (clipError) {
          console.error('Failed to copy to clipboard:', clipError);
          toast.info(`Please add BITS token manually:\n\nAddress: ${tokenAddress}\nSymbol: ${tokenSymbol}\nDecimals: ${tokenDecimals}\nNetwork: BSC (BEP-20)`);
        }
        
      } else if (error.message && error.message.includes('network')) {
        toast.error("❌ Please switch to BSC Network (Binance Smart Chain) in your wallet.");
        console.log('⚠️ Wrong network detected');
        
      } else {
        // GENERIC ERROR
        toast.error(`❌ Failed to add BITS token: ${error.message || 'Unknown error'}`);
        console.log('❌ Generic error occurred');
        
        // 📋 FALLBACK: COPY CONTRACT ADDRESS
        try {
          await navigator.clipboard.writeText(tokenAddress);
          toast.info(`📋 Contract address copied. Please add manually:\n\nAddress: ${tokenAddress}\nSymbol: ${tokenSymbol}\nDecimals: ${tokenDecimals}`);
          console.log('📋 Fallback: Contract address copied:', tokenAddress);
        } catch (clipError) {
          console.error('Failed to copy to clipboard:', clipError);
        }
      }
      
      console.log('🔄 ===== END ERROR HANDLING =====');
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

