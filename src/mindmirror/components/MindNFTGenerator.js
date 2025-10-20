import React, { useState, useContext } from 'react';
import WalletContext from '../../context/WalletContext';
import emailService from '../../services/emailService';
import { mintMindNFT, getUserMindNFTs } from '../../utils/nftUtils';
import { MIND_MIRROR_NFT_CONFIG } from '../../contract/MindMirrorNFT';
import NFTTransferModal from '../../components/NFT/NFTTransferModal';

const MindNFTGenerator = ({ results }) => {
  const { walletAddress, walletName } = useContext(WalletContext);
  const [nftGenerated, setNftGenerated] = useState(false);
  const [nftImage, setNftImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailOption, setShowEmailOption] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [nftType, setNftType] = useState('basic'); // 'basic' or 'personalized'
  const [wordAnalysisData, setWordAnalysisData] = useState(null);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  
  // NFT Minting & Transfer States
  const [isMinting, setIsMinting] = useState(false);
  const [isMinted, setIsMinted] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [userNFTs, setUserNFTs] = useState([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);

    // Post-process DALL-E image with guaranteed branding overlay
  const addBrandingOverlay = async (imageUrl, userInfo) => {
    try {
      console.log('🎨 Adding branding overlay to NFT...');
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Load the DALL-E image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            console.log('🖼️ Image loaded successfully, size:', img.width, 'x', img.height);
            
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            console.log('📐 Canvas size set to:', canvas.width, 'x', canvas.height);
            
            // Draw the original DALL-E image
            ctx.drawImage(img, 0, 0);
            console.log('🎨 Original image drawn to canvas');
            
            // Add branding overlays
            console.log('🔄 Starting text overlays...');
            await addTextOverlays(ctx, canvas, userInfo);
            console.log('🔄 Starting logo overlay...');
            await addBitsLogo(ctx, canvas);
            
            // Convert to data URL
            const processedImageUrl = canvas.toDataURL('image/png', 1.0);
            console.log('✅ Branding overlay added successfully!');
            console.log('📊 Final image type:', processedImageUrl.startsWith('data:') ? 'Canvas Data URL' : 'External URL');
            resolve(processedImageUrl);
            
          } catch (error) {
            console.error('❌ Error adding overlay:', error);
            resolve(imageUrl); // Fallback to original image
          }
        };
        
        img.onerror = (error) => {
          console.error('❌ Failed to load DALL-E image:', error);
          console.error('🔗 Image URL:', imageUrl);
          console.error('🌐 CORS Origin:', img.crossOrigin);
          resolve(imageUrl); // Fallback to original image
        };
        
        // Use backend proxy to fix CORS issues
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
        const proxyUrl = `${BACKEND_URL}/api/dalle-nft/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        
        console.log('🔗 Using proxy URL for CORS fix:', proxyUrl.substring(0, 100) + '...');
        img.src = proxyUrl;
      });
      
    } catch (error) {
      console.error('❌ Post-processing failed:', error);
      return imageUrl; // Fallback to original image
    }
  };

  // Add text overlays (username, wallet, BitSwapDEX AI)
  const addTextOverlays = async (ctx, canvas, userInfo) => {
    const { username, walletAddress } = userInfo;
    
    console.log('📝 Adding text overlays...');
    console.log('👤 Username:', username);
    console.log('💳 Wallet:', walletAddress ? `${walletAddress.substring(0, 6)}...` : 'None');
    
    // Bottom right - User info
    if (username || walletAddress) {
      ctx.save();
      
      // Semi-transparent background for readability
      const padding = 15;
      const bgHeight = 80; // Increased height for date/time
      const bgWidth = 220; // Increased width for longer text
      const bgX = canvas.width - bgWidth - 20;
      const bgY = canvas.height - bgHeight - 20;
      
      // Semi-transparent background (no green border)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
      
      // Username (top line) with AI gradient effect
      if (username) {
        // Create gradient effect by drawing text multiple times with different colors
        ctx.font = 'bold 20px "Arial", sans-serif';
        ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        
        // Gradient simulation: cyan to blue
        const gradient = ctx.createLinearGradient(canvas.width - 200, canvas.height - 55, canvas.width - 30, canvas.height - 55);
        gradient.addColorStop(0, '#00ffff'); // Cyan
        gradient.addColorStop(0.5, '#00a3ff'); // Blue
        gradient.addColorStop(1, '#ff3366'); // Pink accent
        
        ctx.fillStyle = gradient;
        ctx.fillText(username, canvas.width - 30, canvas.height - 55);
        ctx.shadowBlur = 0;
      }
      
      // Wallet address (middle line)
      if (walletAddress) {
        const shortWallet = walletAddress.length > 10 ? 
          `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 
          walletAddress;
        // Wallet gradient: blue to white
        const walletGradient = ctx.createLinearGradient(canvas.width - 180, canvas.height - 35, canvas.width - 30, canvas.height - 35);
        walletGradient.addColorStop(0, '#00a3ff'); // Blue
        walletGradient.addColorStop(1, '#ffffff'); // White
        
        ctx.fillStyle = walletGradient;
        ctx.font = 'bold 14px "Arial", sans-serif';
        ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;
        ctx.fillText(shortWallet, canvas.width - 30, canvas.height - 35);
        ctx.shadowBlur = 0;
      }
      
      // Date and time (bottom line)
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      const dateTimeStr = `${dateStr} ${timeStr}`;
      
      console.log('📅 Adding date/time:', dateTimeStr);
      
      // Date/time gradient: gray to cyan
      const dateGradient = ctx.createLinearGradient(canvas.width - 160, canvas.height - 15, canvas.width - 30, canvas.height - 15);
      dateGradient.addColorStop(0, '#888888'); // Gray
      dateGradient.addColorStop(1, '#00ffff'); // Cyan
      
      ctx.fillStyle = dateGradient;
      ctx.font = 'bold 12px "Arial", sans-serif';
      ctx.textAlign = 'right';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 2;
      ctx.fillText(dateTimeStr, canvas.width - 30, canvas.height - 15);
      ctx.shadowBlur = 0;
      
      ctx.restore();
    }
    
    // Bottom left - BitSwapDEX AI watermark with gradient
    ctx.save();
    
    const watermarkText = 'BitSwapDEX AI';
    
    // Watermark gradient: blue to cyan to pink
    const watermarkGradient = ctx.createLinearGradient(30, canvas.height - 30, 200, canvas.height - 30);
    watermarkGradient.addColorStop(0, '#00a3ff'); // Blue
    watermarkGradient.addColorStop(0.5, '#00ffff'); // Cyan
    watermarkGradient.addColorStop(1, '#ff3366'); // Pink
    
    ctx.fillStyle = watermarkGradient;
    ctx.font = 'bold 18px "Arial", sans-serif';
    ctx.textAlign = 'left';
    
    // Add glow effect
    ctx.shadowColor = '#00a3ff';
    ctx.shadowBlur = 10;
    ctx.fillText(watermarkText, 30, canvas.height - 30);
    
    ctx.restore();
  };

  // Get word analysis for personalized NFT generation
  const getWordAnalysis = async (userInfo) => {
    try {
      const { walletAddress } = userInfo;
      
      if (!walletAddress) {
        throw new Error('Wallet address required for word analysis');
      }

      console.log('📡 Fetching word analysis from backend...');
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://backend-server-f82y.onrender.com'}/api/word-analysis/analyze-user-words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No words found for user - using basic NFT style');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Word analysis failed');
      }

      console.log(`📊 Word analysis successful: ${data.wordCount} words analyzed`);
      console.log('🎨 Visual style:', data.visualStyle.primaryStyle);
      
      return data;

    } catch (error) {
      console.log('⚠️ Word analysis error:', error.message);
      throw error;
    }
  };

  // Add BITS logo from favicon
  const addBitsLogo = async (ctx, canvas) => {
    try {
      console.log('🪙 Adding BITS logo...');
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        logo.onload = () => {
          try {
            // Position logo in top right corner
            const logoSize = 40;
            const logoX = canvas.width - logoSize - 20;
            const logoY = 20;
            
            // Add semi-transparent background
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
            
            // Draw logo
            ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            ctx.restore();
            
            console.log('✅ BITS logo added successfully!');
          } catch (error) {
            console.error('❌ Error adding BITS logo:', error);
          }
          resolve();
        };
        
        logo.onerror = () => {
          console.error('❌ Failed to load BITS logo');
          resolve();
        };
        
        // Try to load favicon
        logo.src = '/favicon.ico';
      });
      
    } catch (error) {
      console.error('❌ BITS logo loading failed:', error);
    }
  };

  const generateNFT = async () => {
    setIsGenerating(true);
    
    try {
      console.log('🎨 Starting REAL OpenAI DALL-E NFT generation...');
      
      // Prepare user info for branding
      const connectedWallet = window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet');
      const telegramUsername = window.telegramUsername || 'BitSwapDEX';
      const userInfo = {
        username: telegramUsername, // Use Telegram username instead of wallet name
        walletAddress: walletAddress || connectedWallet
      };
      
      console.log('🔍 DEBUG - User info:', userInfo);
      console.log('🔍 DEBUG - Context wallet:', walletAddress);
      console.log('🔍 DEBUG - Connected wallet:', connectedWallet);

      console.log('👤 Generating NFT for user:', userInfo.username, userInfo.walletAddress ? `(${userInfo.walletAddress.substring(0, 6)}...)` : '');

      // Try to get word analysis for personalized NFT
      let wordAnalysis = null;
      try {
        console.log('🔍 Attempting to get word analysis for personalized NFT...');
        wordAnalysis = await getWordAnalysis(userInfo);
        if (wordAnalysis) {
          console.log('✅ Word analysis obtained:', wordAnalysis.visualStyle?.primaryStyle);
          setNftType('personalized');
          setWordAnalysisData(wordAnalysis);
        }
      } catch (error) {
        console.log('⚠️ Word analysis not available, using basic style:', error.message);
        setNftType('basic');
        setWordAnalysisData(null);
      }

      // Call backend DALL-E API with word analysis
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://backend-server-f82y.onrender.com'}/api/dalle-nft/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisResults: results,
          userInfo: userInfo,
          wordAnalysis: wordAnalysis
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.nft || !data.nft.imageUrl) {
        throw new Error('Invalid NFT generation response');
      }

      console.log('✅ DALL-E NFT generated successfully!', data.nft.imageUrl);
      
      // Post-process the image with guaranteed branding overlay
      console.log('🔄 Starting branding overlay process...');
      console.log('👤 User info for branding:', userInfo);
      
      const processedImageUrl = await addBrandingOverlay(data.nft.imageUrl, userInfo);
      
      console.log('🎨 Branding process completed');
      console.log('📸 Original URL:', data.nft.imageUrl);
      console.log('🖼️ Processed URL type:', processedImageUrl.startsWith('data:') ? 'Canvas Data URL' : 'External URL');
      
      // Set the processed image
      setNftImage(processedImageUrl);
      setNftGenerated(true);
      
    } catch (error) {
      console.error('❌ NFT Generation failed:', error);
      alert(`❌ Failed to generate NFT: ${error.message}\n\nPlease try again or contact support.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      alert('⚠️ Please enter a valid email address!');
      return;
    }

    if (!emailService.validateEmail(email)) {
      alert('⚠️ Please enter a valid email address!');
      return;
    }

    setIsSending(true);
    try {
      console.log('📧 Sending NFT via email...');
      
      // Prepare email data
      const emailData = emailService.formatNFTEmailData(
        email,
        nftImage,
        {
          username: walletName || 'Anonymous',
          walletAddress: walletAddress
        },
        {
          wordCount: wordAnalysisData?.wordCount || 0,
          visualStyle: wordAnalysisData?.visualStyle?.primaryStyle || 'basic',
          timestamp: new Date().toISOString()
        }
      );

      // Send email
      await emailService.sendNFT(emailData);
      
      alert(`🎉 Your neuropsychological NFT has been sent successfully to ${email}!\n\n✨ Check your inbox for your unique and irreproducible NFT.`);
      setEmail('');
      setShowEmailOption(false);
      
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      alert(`❌ Failed to send email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Telegram sending
  const handleSendToTelegram = async () => {
    setIsSendingTelegram(true);
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      
      // Get telegram info from stored data
      const telegramUsername = window.telegramUsername || 'BitSwapDEX';
      const connectedWallet = window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet');
      
      // Get telegram ID from the stored data or make API call
      let telegramId = window.telegramId;
      
      if (!telegramId) {
        // Get telegram ID from backend
        const telegramResponse = await fetch(`${BACKEND_URL}/api/word-analysis/get-telegram-id`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress: walletAddress || connectedWallet })
        });
        
        if (!telegramResponse.ok) {
          throw new Error('Could not find your Telegram account. Please make sure your wallet is linked.');
        }
        
        const telegramData = await telegramResponse.json();
        telegramId = telegramData.telegramId;
      }
      
      console.log('📱 Sending NFT to Telegram for user:', telegramUsername, telegramId);
      
      const response = await fetch(`${BACKEND_URL}/api/dalle-nft/send-to-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftImageUrl: nftImage,
          telegramId: telegramId,
          username: telegramUsername,
          walletAddress: walletAddress || connectedWallet
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to send to Telegram');
      }
      
      const result = await response.json();
      console.log('✅ NFT sent to Telegram successfully!');
      alert('🎉 NFT sent to your Telegram successfully! Check your private messages.');
      
    } catch (error) {
      console.error('❌ Telegram send error:', error);
      alert(`❌ Failed to send to Telegram: ${error.message}`);
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const downloadNFT = async () => {
    try {
      console.log('💾 Starting NFT download...');
      
      // Check if it's a data URL (processed image) or external URL
      if (nftImage.startsWith('data:')) {
        // Data URL - direct download
        const link = document.createElement('a');
        link.href = nftImage;
        link.download = `BitSwapDEX_AI_NFT_${Date.now()}.png`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ NFT downloaded successfully (data URL)');
      } else {
        // External URL - fetch and convert to blob
        const response = await fetch(nftImage, { mode: 'cors' });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `BitSwapDEX_AI_NFT_${Date.now()}.png`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log('✅ NFT downloaded successfully (external URL)');
      }
      
      alert('💾 NFT has been saved locally!\n\n⚠️ ATTENTION: This NFT is unique and irreproducible. Keep it safe!');
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      alert('❌ Failed to download NFT automatically.\n\nPlease try right-clicking on the image and select "Save Image As..."');
    }
  };

  // NFT Blockchain Functions
  const handleMintNFT = async () => {
    if (!walletAddress) {
      alert('⚠️ Please connect your wallet to mint NFT!');
      return;
    }

    const confirmed = window.confirm(
      '🔨 Mint NFT on Blockchain?\n\n' +
      '✨ This will create a real NFT on BSC Testnet that you can:\n' +
      '• Transfer to other wallets\n' +
      '• Trade on NFT marketplaces\n' +
      '• Use in DeFi applications\n\n' +
      '💰 Minting requires a small gas fee.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setIsMinting(true);

    try {
      console.log('🔨 Starting NFT minting process...');
      
      // Prepare NFT metadata
      const nftMetadata = {
        name: `Mind Mirror NFT ${Date.now()}`,
        description: `Neuropsychological profile NFT generated by BitSwapDEX Mind Mirror AI for ${walletAddress}`,
        neuroPsychProfile: wordAnalysisData?.visualStyle?.primaryStyle || 'basic',
        wordCount: wordAnalysisData?.wordCount || 0,
        generationType: nftType === 'personalized' ? 'Personalized AI Generated' : 'Basic AI Generated',
        creator: walletName || 'BitSwapDEX User'
      };

      console.log('📊 Minting with metadata:', nftMetadata);

      // Mint the NFT
      const result = await mintMindNFT(walletAddress, nftImage, nftMetadata);
      
      console.log('✅ NFT minted successfully:', result);
      
      setIsMinted(true);
      setMintedTokenId(result.tokenId);
      
      // Show success message
      alert(
        `🎉 NFT Minted Successfully!\n\n` +
        `🆔 Token ID: ${result.tokenId}\n` +
        `📄 Transaction: ${result.transactionHash}\n\n` +
        `✅ Your NFT is now a real blockchain asset!\n` +
        `🔗 View on BSCScan: https://testnet.bscscan.com/tx/${result.transactionHash}`
      );
      
      // Refresh user's NFT list
      loadUserNFTs();
      
    } catch (error) {
      console.error('❌ NFT minting failed:', error);
      alert(`❌ Minting Failed\n\n${error.message}\n\nPlease try again or check your wallet connection.`);
    } finally {
      setIsMinting(false);
    }
  };

  const loadUserNFTs = async () => {
    if (!walletAddress) return;

    setLoadingNFTs(true);
    try {
      console.log('🔍 Loading user NFTs...');
      const nfts = await getUserMindNFTs(walletAddress);
      setUserNFTs(nfts);
      console.log(`✅ Loaded ${nfts.length} NFTs`);
    } catch (error) {
      console.error('❌ Failed to load NFTs:', error);
      // Don't show error for this - contract might not be deployed yet
    } finally {
      setLoadingNFTs(false);
    }
  };

  const handleTransferComplete = (result) => {
    console.log('✅ Transfer completed:', result);
    // Refresh NFT list
    loadUserNFTs();
  };

  // Load user NFTs when component mounts or wallet changes
  React.useEffect(() => {
    if (walletAddress) {
      loadUserNFTs();
    }
  }, [walletAddress]);

  if (!results) return null;

  return (
    <div className="nft-generator-container">
      {!nftGenerated ? (
        <div className="nft-generation-prompt">
          <div className="nft-prompt-header">
            <h3>✨ Your Neuropsychological NFT</h3>
            <p className="nft-prompt-description">
              Your cognitive profile and trading psychology captured as a <strong>unique digital asset</strong> 
              generated with advanced AI technology.
            </p>
          </div>
          
          <div className="nft-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>IMPORTANT:</strong> The NFT is generated only once and is completely unique. 
              It cannot be reproduced or regenerated. Save it immediately after generation!
            </div>
          </div>
          
          <button 
            className="generate-nft-btn"
            onClick={generateNFT}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="loading-spinner">🔄</span>
                Generating NFT with OpenAI...
              </>
            ) : (
              <>
                <span className="ai-icon">🎨</span>
                Generate My Unique NFT
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="nft-display">
          <div className="nft-header">
            <h3>✨ Your Neuropsychological NFT</h3>
            <p className="nft-subtitle">
              Your cognitive profile and trading psychology captured as a unique digital asset
            </p>
            
            {/* NFT Type Indicator */}
            <div className={`nft-type-indicator ${nftType}`}>
              {nftType === 'personalized' ? (
                <>
                  <span className="type-icon">🧬</span>
                  <div className="type-info">
                    <strong>Personalized NFT</strong>
                    <small>Based on {wordAnalysisData?.wordCount || 0} words analysis</small>
                    <small>Style: {wordAnalysisData?.visualStyle?.primaryStyle?.replace('_', ' ') || 'Custom'}</small>
                  </div>
                </>
              ) : (
                <>
                  <span className="type-icon">⚡</span>
                  <div className="type-info">
                    <strong>Basic NFT</strong>
                    <small>Standard neuropsychological visualization</small>
                    <small>Collect 1000 words for personalized NFTs</small>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="nft-preview-container">
            <img src={nftImage} alt="Neuropsychological NFT" className="nft-image" />
          </div>
          
          {/* Image Actions - Always Available */}
          <div className="nft-actions">
            <button className="download-btn" onClick={downloadNFT}>
              💾 Download Image
            </button>
            
            <button 
              className="email-btn" 
              onClick={() => setShowEmailOption(!showEmailOption)}
            >
              📧 Send to Email
            </button>
            
            <button 
              className="telegram-btn" 
              onClick={handleSendToTelegram}
              disabled={isSendingTelegram}
            >
              {isSendingTelegram ? '📱 Sending...' : '📱 Send to Telegram'}
            </button>
          </div>

          {/* Blockchain NFT Section */}
          <div className="blockchain-nft-section">
            <div className="blockchain-divider">
              <div className="divider-line"></div>
              <span className="divider-text">🔗 Blockchain NFT Options</span>
              <div className="divider-line"></div>
            </div>
            
            {!isMinted ? (
              <div className="mint-nft-section">
                <div className="mint-info">
                  <h4>🔨 Mint as Blockchain NFT</h4>
                  <p>Convert your unique image to a real NFT on BSC Testnet that you can transfer, trade, and use in DeFi!</p>
                  <ul>
                    <li>✅ Real blockchain asset</li>
                    <li>🔄 Transferable to other wallets</li>
                    <li>💰 Tradeable on NFT marketplaces</li>
                    <li>📊 Stored permanently on blockchain</li>
                  </ul>
                </div>
                
                <button 
                  className="mint-nft-btn"
                  onClick={handleMintNFT}
                  disabled={isMinting || !walletAddress}
                >
                  {isMinting ? (
                    <>
                      <span className="loading-spinner">🔄</span>
                      Minting NFT...
                    </>
                  ) : (
                    <>
                      <span className="blockchain-icon">🔨</span>
                      Mint as NFT (Small Gas Fee)
                    </>
                  )}
                </button>
                
                {!walletAddress && (
                  <p className="wallet-warning">⚠️ Connect your wallet to mint NFT</p>
                )}
              </div>
            ) : (
              <div className="minted-nft-section">
                <div className="minted-success">
                  <h4>✅ NFT Minted Successfully!</h4>
                  <p><strong>Token ID:</strong> #{mintedTokenId}</p>
                  <p>Your NFT is now a real blockchain asset!</p>
                </div>
                
                <div className="nft-management-actions">
                  <button 
                    className="transfer-nft-btn"
                    onClick={() => setShowTransferModal(true)}
                  >
                    🔄 Transfer NFT
                  </button>
                  
                  <button 
                    className="view-nft-btn"
                    onClick={() => window.open(`https://testnet.bscscan.com/token/${MIND_MIRROR_NFT_CONFIG.testnet.address}?a=${mintedTokenId}`, '_blank')}
                  >
                    👁️ View on BSCScan
                  </button>
                </div>
              </div>
            )}
          </div>

          {showEmailOption && (
            <div className="email-section">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
                disabled={isSending}
              />
              <button 
                className="send-email-btn"
                onClick={handleSendEmail}
                disabled={isSending || !email.trim()}
              >
                {isSending ? '📤 Sending...' : '🚀 Send NFT'}
              </button>
            </div>
          )}
          
          <div className="nft-uniqueness-warning">
            <div className="uniqueness-icon">🔒</div>
            <p>
              <strong>Unique & Irreproducible NFT:</strong> This digital asset was generated only once 
              based on your specific neuropsychological analysis. It cannot be reproduced or regenerated.
            </p>
          </div>
        </div>
      )}
      
      {/* NFT Transfer Modal */}
      {showTransferModal && isMinted && (
        <NFTTransferModal
          nft={{
            tokenId: mintedTokenId,
            neuroPsychProfile: wordAnalysisData?.visualStyle?.primaryStyle || 'basic',
            wordCount: wordAnalysisData?.wordCount || 0,
            creationTime: new Date().toISOString()
          }}
          userAddress={walletAddress}
          onClose={() => setShowTransferModal(false)}
          onTransferComplete={handleTransferComplete}
        />
      )}
    </div>
  );
};

export default MindNFTGenerator;
