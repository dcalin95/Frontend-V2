// Frontend MoonPay Integration - Widget-based fiat onramp
const handleMoonPayPayment = async ({ 
  amount, 
  bitsToReceive, 
  walletAddress,
  usdInvested,
  bonusAmount = 0,
  bonusPercentage = 0,
  onStatusUpdate 
}) => {
  console.groupCollapsed("🌙 [handleMoonPayPayment] COMING SOON");
  
  // Coming Soon - waiting for Seychelles company registration
  alert(`🌙 MoonPay Integration - Coming Soon!
  
📋 Status: Waiting for company registration in Seychelles
🔑 Required: Business documents for MoonPay API access
⏰ Expected: Available after company setup completion

For now, please use crypto payments:
• BNB, ETH, MATIC (BSC Network)  
• SOL, USDC (Solana Network)

Thank you for your patience! 🙏`);
  
  console.log("🌙 MoonPay payment blocked - waiting for company docs");
  console.groupEnd();
  return null;

  try {
    if (!walletAddress) {
      throw new Error("Wallet address is required for MoonPay integration");
    }

    // MoonPay Widget Configuration
    const moonPayUrl = new URL('https://buy-sandbox.moonpay.com');
    moonPayUrl.searchParams.append('apiKey', process.env.REACT_APP_MOONPAY_API_KEY || 'pk_test_123');
    moonPayUrl.searchParams.append('currencyCode', 'eth'); // Buy ETH then convert to BITS
    moonPayUrl.searchParams.append('walletAddress', walletAddress);
    moonPayUrl.searchParams.append('baseCurrencyAmount', (usdInvested || amount).toString());
    moonPayUrl.searchParams.append('baseCurrencyCode', 'usd');
    moonPayUrl.searchParams.append('redirectURL', `${window.location.origin}/payment/moonpay/success`);
    moonPayUrl.searchParams.append('colorCode', '#00f0ff');
    moonPayUrl.searchParams.append('theme', 'dark');
    moonPayUrl.searchParams.append('showWalletAddressForm', 'true');

    console.log("🌙 MoonPay URL:", moonPayUrl.toString());

    // Create enhanced payment modal with MoonPay widget
    const modal = createMoonPayModal({
      widgetUrl: moonPayUrl.toString(),
      amount: usdInvested || amount,
      bitsToReceive,
      walletAddress,
      onClose: () => {
        console.log("🌙 MoonPay modal closed by user");
      },
      onSuccess: (transactionData) => {
        console.log("🌙 MoonPay payment successful:", transactionData);
        // Handle successful payment - convert ETH to BITS
        handleMoonPaySuccess({
          transactionData,
          walletAddress,
          bitsToReceive,
          bonusAmount,
          bonusPercentage
        });
      }
    });

    return {
      widgetUrl: moonPayUrl.toString(),
      modal,
      provider: 'moonpay'
    };

  } catch (err) {
    console.error("❌ [MOONPAY] Fatal error:", err);
    alert("MoonPay payment failed: " + err.message);
    throw err;
  } finally {
    console.groupEnd();
  }
};

// 🎨 MoonPay Modal with Embedded Widget
const createMoonPayModal = ({ widgetUrl, amount, bitsToReceive, walletAddress, onClose, onSuccess }) => {
  const modal = document.createElement('div');
  modal.className = 'moonpay-modal';
  modal.innerHTML = `
    <div class="moonpay-modal-overlay">
      <div class="moonpay-modal-content">
        <div class="moonpay-modal-header">
          <h3>🌙 Buy Crypto with MoonPay</h3>
          <button class="moonpay-modal-close">&times;</button>
        </div>
        <div class="moonpay-modal-info">
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
          <div class="moonpay-status">
            <div class="status-indicator">
              <span class="status-dot"></span>
              <span class="status-text">Complete payment in MoonPay...</span>
            </div>
          </div>
        </div>
        <div class="moonpay-iframe-container">
          <iframe src="${widgetUrl}" frameborder="0" allowtransparency="true"></iframe>
        </div>
        <div class="moonpay-footer">
          <p>🔒 Secure payment powered by MoonPay</p>
          <p>⚡ ETH will be sent to your wallet, then converted to BITS automatically</p>
        </div>
      </div>
    </div>
  `;

  // Add modal styles
  const styles = document.createElement('style');
  styles.textContent = `
    .moonpay-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .moonpay-modal-overlay {
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
    
    .moonpay-modal-content {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 60px rgba(255, 255, 255, 0.1);
      overflow: hidden;
    }
    
    .moonpay-modal-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .moonpay-modal-header h3 {
      margin: 0;
      color: #ffffff;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .moonpay-modal-close {
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
    
    .moonpay-modal-close:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .moonpay-modal-info {
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
      color: #ffffff;
      font-weight: 600;
      font-size: 1rem;
    }
    
    .moonpay-status {
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
      background: #ffc107;
      animation: pulse 2s infinite;
    }
    
    .status-text {
      color: #ffc107;
      font-weight: 500;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .moonpay-iframe-container {
      height: 600px;
      position: relative;
    }
    
    .moonpay-iframe-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    .moonpay-footer {
      padding: 15px 20px;
      background: rgba(0, 0, 0, 0.3);
      text-align: center;
    }
    
    .moonpay-footer p {
      margin: 5px 0;
      color: #ccc;
      font-size: 0.8rem;
    }
    
    @media (max-width: 768px) {
      .moonpay-modal-content {
        margin: 10px;
        max-height: 95vh;
      }
      
      .payment-details {
        grid-template-columns: 1fr;
        gap: 10px;
      }
      
      .moonpay-iframe-container {
        height: 500px;
      }
    }
  `;
  
  document.head.appendChild(styles);
  document.body.appendChild(modal);

  // Event listeners
  const closeBtn = modal.querySelector('.moonpay-modal-close');
  const overlay = modal.querySelector('.moonpay-modal-overlay');
  
  const closeModal = () => {
    document.body.removeChild(modal);
    document.head.removeChild(styles);
    if (onClose) onClose();
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Listen for MoonPay success messages
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://buy-sandbox.moonpay.com' && event.origin !== 'https://buy.moonpay.com') {
      return;
    }

    if (event.data.type === 'moonpay_transaction_completed') {
      console.log("🌙 MoonPay transaction completed:", event.data);
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

// 🔄 Handle MoonPay Success - Convert ETH to BITS
const handleMoonPaySuccess = async ({ transactionData, walletAddress, bitsToReceive, bonusAmount, bonusPercentage }) => {
  try {
    const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
    
    // Notify backend about MoonPay transaction completion
    const response = await fetch(`${backendURL}/api/moonpay/success`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionData,
        walletAddress,
        bitsToReceive,
        bonusAmount,
        bonusPercentage,
        provider: 'moonpay'
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
    console.error("❌ Error handling MoonPay success:", error);
    alert("Payment completed but there was an issue processing BITS. Please contact support.");
  }
};

export default handleMoonPayPayment;

