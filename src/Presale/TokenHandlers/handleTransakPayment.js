// Frontend Transak Integration - Widget-based fiat onramp
const handleTransakPayment = async ({ 
  amount, 
  bitsToReceive, 
  walletAddress,
  usdInvested,
  bonusAmount = 0,
  bonusPercentage = 0,
  onStatusUpdate 
}) => {
  console.groupCollapsed("🏦 [handleTransakPayment] COMING SOON");
  
  // Coming Soon - waiting for Seychelles company registration
  alert(`🏦 Transak Integration - Coming Soon!
  
📋 Status: Waiting for company registration in Seychelles
🔑 Required: Business verification documents for Transak API access
⏰ Expected: Available after company setup completion

For now, please use crypto payments:
• BNB, ETH, MATIC (BSC Network)  
• SOL, USDC (Solana Network)

Thank you for your patience! 🙏`);
  
  console.log("🏦 Transak payment blocked - waiting for company docs");
  console.groupEnd();
  return null;

  try {
    if (!walletAddress) {
      throw new Error("Wallet address is required for Transak integration");
    }

    // Transak Widget Configuration
    const transakUrl = new URL('https://global-stg.transak.com');
    transakUrl.searchParams.append('apiKey', process.env.REACT_APP_TRANSAK_API_KEY || 'your_api_key');
    transakUrl.searchParams.append('environment', process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'STAGING');
    transakUrl.searchParams.append('defaultCryptoCurrency', 'ETH');
    transakUrl.searchParams.append('walletAddress', walletAddress);
    transakUrl.searchParams.append('defaultFiatAmount', (usdInvested || amount).toString());
    transakUrl.searchParams.append('fiatCurrency', 'USD');
    transakUrl.searchParams.append('defaultFiatCurrency', 'USD');
    transakUrl.searchParams.append('network', 'ethereum');
    transakUrl.searchParams.append('redirectURL', `${window.location.origin}/payment/transak/success`);
    transakUrl.searchParams.append('themeColor', '#00f0ff');
    transakUrl.searchParams.append('hideMenu', 'true');
    transakUrl.searchParams.append('hideExchangeScreen', 'true');

    console.log("🏦 Transak URL:", transakUrl.toString());

    // Create enhanced payment modal with Transak widget
    const modal = createTransakModal({
      widgetUrl: transakUrl.toString(),
      amount: usdInvested || amount,
      bitsToReceive,
      walletAddress,
      onClose: () => {
        console.log("🏦 Transak modal closed by user");
      },
      onSuccess: (transactionData) => {
        console.log("🏦 Transak payment successful:", transactionData);
        // Handle successful payment - convert ETH to BITS
        handleTransakSuccess({
          transactionData,
          walletAddress,
          bitsToReceive,
          bonusAmount,
          bonusPercentage
        });
      }
    });

    return {
      widgetUrl: transakUrl.toString(),
      modal,
      provider: 'transak'
    };

  } catch (err) {
    console.error("❌ [TRANSAK] Fatal error:", err);
    alert("Transak payment failed: " + err.message);
    throw err;
  } finally {
    console.groupEnd();
  }
};

// 🎨 Transak Modal with Embedded Widget
const createTransakModal = ({ widgetUrl, amount, bitsToReceive, walletAddress, onClose, onSuccess }) => {
  const modal = document.createElement('div');
  modal.className = 'transak-modal';
  modal.innerHTML = `
    <div class="transak-modal-overlay">
      <div class="transak-modal-content">
        <div class="transak-modal-header">
          <h3>🏦 Buy Crypto with Transak</h3>
          <button class="transak-modal-close">&times;</button>
        </div>
        <div class="transak-modal-info">
          <div class="payment-details">
            <div class="detail-item">
              <span class="label">Amount:</span>
              <span class="value">$${amount}</span>
            </div>
            <div class="detail-item">
              <span class="label">You'll Receive:</span>
              <span class="value">${bitsToReceive} $BITS</span>
            </div>
            <div class="detail-item">
              <span class="label">Wallet:</span>
              <span class="value">${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}</span>
            </div>
          </div>
          <div class="transak-status">
            <div class="status-indicator">
              <span class="status-dot"></span>
              <span class="status-text">Complete payment in Transak...</span>
            </div>
          </div>
        </div>
        <div class="transak-iframe-container">
          <iframe src="${widgetUrl}" frameborder="0" allowtransparency="true"></iframe>
        </div>
        <div class="transak-footer">
          <p>🔒 Secure payment powered by Transak</p>
          <p>⚡ ETH will be sent to your wallet, then converted to BITS automatically</p>
        </div>
      </div>
    </div>
  `;

  // Add modal styles
  const styles = document.createElement('style');
  styles.textContent = `
    .transak-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .transak-modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .transak-modal-content {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      border: 1px solid rgba(0, 240, 255, 0.2);
      box-shadow: 0 20px 60px rgba(0, 240, 255, 0.1);
      overflow: hidden;
    }
    
    .transak-modal-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .transak-modal-header h3 {
      margin: 0;
      color: #00f0ff;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .transak-modal-close {
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }
    
    .transak-modal-close:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .transak-modal-info {
      padding: 20px;
      background: rgba(0, 0, 0, 0.2);
    }
    
    .payment-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .detail-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .detail-item .label {
      color: #ccc;
      font-size: 0.9rem;
      margin-bottom: 5px;
    }
    
    .detail-item .value {
      color: #00f0ff;
      font-weight: 600;
      font-size: 1rem;
    }
    
    .transak-status {
      text-align: center;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4285f4;
      animation: pulse 2s infinite;
    }
    
    .status-text {
      color: #4285f4;
      font-weight: 500;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .transak-iframe-container {
      height: 600px;
      position: relative;
    }
    
    .transak-iframe-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    .transak-footer {
      padding: 15px 20px;
      background: rgba(0, 0, 0, 0.3);
      text-align: center;
    }
    
    .transak-footer p {
      margin: 5px 0;
      color: #ccc;
      font-size: 0.8rem;
    }
    
    @media (max-width: 768px) {
      .transak-modal-content {
        margin: 10px;
        max-height: 95vh;
      }
      
      .payment-details {
        grid-template-columns: 1fr;
        gap: 10px;
      }
      
      .transak-iframe-container {
        height: 500px;
      }
    }
  `;
  
  document.head.appendChild(styles);
  document.body.appendChild(modal);

  // Event listeners
  const closeBtn = modal.querySelector('.transak-modal-close');
  const overlay = modal.querySelector('.transak-modal-overlay');
  
  const closeModal = () => {
    document.body.removeChild(modal);
    document.head.removeChild(styles);
    if (onClose) onClose();
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Listen for Transak success messages
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://global-stg.transak.com' && event.origin !== 'https://global.transak.com') {
      return;
    }

    if (event.data.event_id === 'TRANSAK_ORDER_SUCCESSFUL') {
      console.log("🏦 Transak transaction completed:", event.data);
      if (onSuccess) onSuccess(event.data);
      closeModal();
    }
  });

  return {
    close: closeModal,
    updateStatus: (status, text) => {
      const statusDot = modal.querySelector('.status-dot');
      const statusText = modal.querySelector('.status-text');
      
      if (status === 'completed') {
        statusDot.style.background = '#00ff88';
        statusDot.style.animation = 'none';
        statusText.textContent = '✅ Payment Completed!';
        statusText.style.color = '#00ff88';
      } else if (status === 'failed') {
        statusDot.style.background = '#ff6b6b';
        statusDot.style.animation = 'none';
        statusText.textContent = '❌ Payment Failed';
        statusText.style.color = '#ff6b6b';
      } else {
        statusText.textContent = text || 'Processing...';
      }
    }
  };
};

// 🔄 Handle Transak Success - Convert ETH to BITS
const handleTransakSuccess = async ({ transactionData, walletAddress, bitsToReceive, bonusAmount, bonusPercentage }) => {
  try {
    const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
    
    // Notify backend about Transak transaction completion
    const response = await fetch(`${backendURL}/api/transak/success`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionData,
        walletAddress,
        bitsToReceive,
        bonusAmount,
        bonusPercentage,
        provider: 'transak'
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      alert(`🎉 Payment successful! ${bitsToReceive} $BITS will be sent to your wallet.`);
    } else {
      console.warn("⚠️ Backend processing failed:", result);
      alert("Payment completed but there was an issue processing BITS. Please contact support.");
    }

  } catch (error) {
    console.error("❌ Error handling Transak success:", error);
    alert("Payment completed but there was an issue processing BITS. Please contact support.");
  }
};

export default handleTransakPayment;

