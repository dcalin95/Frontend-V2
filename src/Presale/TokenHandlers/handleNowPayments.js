const handleNowPayments = async ({ 
  amount, 
  bitsToReceive, 
  walletAddress,
  usdInvested,
  bonusAmount = 0,
  bonusPercentage = 0,
  onStatusUpdate 
}) => {
  console.groupCollapsed("💳 [handleNowPayments] COMING SOON");
  
  // Coming Soon - waiting for Seychelles company registration
  alert(`💰 NOWPayments Integration - Coming Soon!
  
📋 Status: Waiting for company registration in Seychelles
🔑 Required: Business verification for NOWPayments API access
⏰ Expected: Available after company setup completion

For now, please use crypto payments:
• BNB, ETH, MATIC (BSC Network)  
• SOL, USDC (Solana Network)

Thank you for your patience! 🙏`);
  
  console.log("💰 NOWPayments payment blocked - waiting for company docs");
  console.groupEnd();
  return null;

  // Original code kept for future use
  try {
    const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
    console.log("🌐 Backend URL:", backendURL);

    const payload = {
      amount: usdInvested || amount,
      currency: "usd",
      payeeWallet: walletAddress,
      bitsToReceive,
      returnUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
      metadata: {
        bonusAmount,
        bonusPercentage,
        usdInvested: usdInvested || amount
      }
    };

    console.log("📤 Payload sent to backend:", payload);

    // Create payment
    const response = await fetch(`${backendURL}/api/nowpayments/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("📊 Backend Response Status:", response.status, response.statusText);
    console.log("📊 Backend Response Headers:", Object.fromEntries(response.headers.entries()));

    let data;
    try {
      data = await response.json();
      console.log("📨 Response from backend:", data);
    } catch (jsonErr) {
      console.error("❌ Failed to parse JSON response:", jsonErr);
      console.error("❌ Raw response text:", await response.text().catch(() => 'Could not read text'));
      throw new Error("Invalid JSON response from backend.");
    }

    console.log("🔍 Backend Response Analysis:");
    console.log("- response.ok:", response.ok);
    console.log("- data structure:", data);
    console.log("- data.payment:", data?.payment);
    console.log("- data.payment.invoice_url:", data?.payment?.invoice_url);
    console.log("- data.message:", data?.message);

    if (!response.ok || !data?.payment?.invoice_url) {
      console.error("❌ Backend response failed:");
      console.error("- HTTP Status:", response.status);
      console.error("- Response OK:", response.ok);
      console.error("- Has payment object:", !!data?.payment);
      console.error("- Has invoice_url:", !!data?.payment?.invoice_url);
      console.error("- Backend message:", data?.message);
      throw new Error(data?.message || `Backend error: ${response.status} ${response.statusText}`);
    }

    // 🎨 Create enhanced payment modal with embedded iframe
    const modal = createEnhancedPaymentModal({
      invoiceUrl: data.payment.invoice_url,
      paymentId: data.payment.payment_id,
      amount: payload.amount,
      bitsToReceive,
      onClose: () => {
        console.log("💳 Payment modal closed by user");
      }
    });

    // 🔄 Start payment status polling
    const statusPoller = startPaymentStatusPolling({
      paymentId: data.payment.payment_id,
      backendURL,
      onStatusUpdate: (status) => {
        console.log("📊 Payment status:", status);
        if (onStatusUpdate) onStatusUpdate(status);
        
        if (status === 'confirmed' || status === 'finished') {
          clearInterval(statusPoller);
          modal.close();
          showPaymentSuccess(bitsToReceive);
        } else if (status === 'failed' || status === 'refunded') {
          clearInterval(statusPoller);
          modal.close();
          showPaymentError(status);
        }
      },
      onError: (error) => {
        console.error("❌ Status polling error:", error);
        clearInterval(statusPoller);
      }
    });

    return {
      invoiceUrl: data.payment.invoice_url,
      paymentId: data.payment.payment_id,
      modal,
      statusPoller
    };

  } catch (err) {
    console.error("❌ [NOWPAYMENTS] Fatal error:", err);
    alert("Card payment failed: " + err.message);
    throw err;
  } finally {
    console.groupEnd();
  }
};

// 🎨 Enhanced Payment Modal with Embedded Iframe
const createEnhancedPaymentModal = ({ invoiceUrl, paymentId, amount, bitsToReceive, onClose }) => {
  const modal = document.createElement('div');
  modal.className = 'nowpayments-modal';
  modal.innerHTML = `
    <div class="nowpayments-modal-overlay">
      <div class="nowpayments-modal-content">
        <div class="nowpayments-modal-header">
          <h3>💳 Complete Your Payment</h3>
          <button class="nowpayments-modal-close">&times;</button>
        </div>
        <div class="nowpayments-modal-info">
          <div class="payment-details">
            <div class="detail-item">
              <span class="label">Amount:</span>
              <span class="value">$${amount}</span>
            </div>
            <div class="detail-item">
              <span class="label">You'll Receive:</span>
              <span class="value">${bitsToReceive} $BITS</span>
            </div>
          </div>
          <div class="payment-status">
            <div class="status-indicator">
              <span class="status-dot"></span>
              <span class="status-text">Awaiting Payment...</span>
            </div>
          </div>
        </div>
        <div class="nowpayments-iframe-container">
          <iframe src="${invoiceUrl}" frameborder="0" allowtransparency="true"></iframe>
        </div>
      </div>
    </div>
  `;

  // Add modal styles
  const styles = document.createElement('style');
  styles.textContent = `
    .nowpayments-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .nowpayments-modal-overlay {
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
    
    .nowpayments-modal-content {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border-radius: 16px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      border: 1px solid rgba(0, 255, 255, 0.2);
      box-shadow: 0 20px 60px rgba(0, 255, 255, 0.1);
      overflow: hidden;
    }
    
    .nowpayments-modal-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .nowpayments-modal-header h3 {
      margin: 0;
      color: #00f0ff;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .nowpayments-modal-close {
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
    
    .nowpayments-modal-close:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .nowpayments-modal-info {
      padding: 20px;
      background: rgba(0, 0, 0, 0.2);
    }
    
    .payment-details {
      display: flex;
      justify-content: space-between;
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
      font-size: 1.1rem;
    }
    
    .payment-status {
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
    
    .nowpayments-iframe-container {
      height: 500px;
      position: relative;
    }
    
    .nowpayments-iframe-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    @media (max-width: 768px) {
      .nowpayments-modal-content {
        margin: 10px;
        max-height: 95vh;
      }
      
      .payment-details {
        flex-direction: column;
        gap: 10px;
      }
      
      .nowpayments-iframe-container {
        height: 400px;
      }
    }
  `;
  
  document.head.appendChild(styles);
  document.body.appendChild(modal);

  // Event listeners
  const closeBtn = modal.querySelector('.nowpayments-modal-close');
  const overlay = modal.querySelector('.nowpayments-modal-overlay');
  
  const closeModal = () => {
    document.body.removeChild(modal);
    document.head.removeChild(styles);
    if (onClose) onClose();
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  return {
    close: closeModal,
    updateStatus: (status, text) => {
      const statusDot = modal.querySelector('.status-dot');
      const statusText = modal.querySelector('.status-text');
      
      if (status === 'confirmed') {
        statusDot.style.background = '#00ff88';
        statusDot.style.animation = 'none';
        statusText.textContent = '✅ Payment Confirmed!';
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

// 🔄 Payment Status Polling
const startPaymentStatusPolling = ({ paymentId, backendURL, onStatusUpdate, onError }) => {
  let pollCount = 0;
  const maxPolls = 120; // 10 minutes max
  
  const poller = setInterval(async () => {
    try {
      pollCount++;
      
      if (pollCount > maxPolls) {
        clearInterval(poller);
        onError(new Error('Payment timeout'));
        return;
      }

      const response = await fetch(`${backendURL}/api/nowpayments/status/${paymentId}`);
      const data = await response.json();
      
      if (data.status) {
        onStatusUpdate(data.status);
      }
      
    } catch (error) {
      console.warn('❌ Status poll failed:', error);
      onError(error);
    }
  }, 10000); // 🔧 Poll every 10 seconds (reduced from 5s to prevent rate limiting)

  return poller;
};

// 🎉 Success/Error Handlers
const showPaymentSuccess = (bitsToReceive) => {
  // This should integrate with your existing success notification system
  alert(`🎉 Payment successful! You will receive ${bitsToReceive} $BITS tokens.`);
};

const showPaymentError = (status) => {
  alert(`❌ Payment ${status}. Please try again or contact support.`);
};

export default handleNowPayments;
