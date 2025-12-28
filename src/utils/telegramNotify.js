/**
 * Universal Telegram Notification Helper
 * Sends transaction notifications to backend webhook
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend-server-f82y.onrender.com';
const WEBHOOK_ENDPOINT = `${BACKEND_URL}/bits/webhook`;
const TG_WEBHOOK_SECRET = process.env.REACT_APP_TG_WEBHOOK_SECRET || '';

/**
 * Send transaction notification to Telegram
 * @param {Object} data - Transaction data
 * @param {string} data.type - Transaction type: 'presale_buy', 'certificate', 'staking_deposit', 'staking_withdraw', 'dex_swap'
 * @param {string} data.status - 'success' or 'error'
 * @param {string} data.network - Network name (BNB, ETH, Polygon, Solana, etc.)
 * @param {string} data.wallet - User wallet address
 * @param {string} data.amount - Amount (BITS, USD, etc.)
 * @param {string} data.currency - Currency (BITS, BNB, USDT, USD, etc.)
 * @param {string} data.txHash - Transaction hash
 * @param {string} data.details - Additional details
 */
export async function sendTelegramNotification(data) {
  try {
    const {
      type = 'transaction',
      status = 'success',
      network = 'Unknown',
      wallet = 'N/A',
      amount = '0',
      currency = 'UNKNOWN',
      txHash = null,
      details = ''
    } = data;

    // Build explorer link
    const explorers = {
      BNB: 'https://bscscan.com/tx/',
      BSC: 'https://bscscan.com/tx/',
      ETH: 'https://etherscan.io/tx/',
      Polygon: 'https://polygonscan.com/tx/',
      Solana: 'https://solscan.io/tx/'
    };

    const explorerBase = explorers[network] || explorers['BNB'];
    const explorer = txHash ? `${explorerBase}${txHash}` : null;

    // Prepare payload for backend webhook
    const payload = {
      event: type,
      status,
      network,
      wallet,
      amount,
      currency,
      txHash,
      explorer,
      details,
      timestamp: Date.now()
    };

    const headers = {
      'Content-Type': 'application/json'
    };

    if (TG_WEBHOOK_SECRET) {
      headers['x-webhook-secret'] = TG_WEBHOOK_SECRET;
    }

    console.log('📤 [Telegram] Sending notification:', payload);

    const response = await fetch(WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      timeout: 8000
    });

    if (!response.ok) {
      console.warn(`⚠️ [Telegram] Webhook returned ${response.status}`);
    } else {
      console.log('✅ [Telegram] Notification sent successfully');
    }
  } catch (error) {
    // Silent fail - never block user flow
    console.warn('⚠️ [Telegram] Notification failed:', error.message);
  }
}

/**
 * Notify Presale BUY transaction
 */
export function notifyPresaleBuy({ wallet, bits, usd, network, txHash }) {
  return sendTelegramNotification({
    type: 'presale_buy',
    status: 'success',
    network,
    wallet,
    amount: `${bits} BITS ($${usd})`,
    currency: 'BITS',
    txHash,
    details: `Purchased ${bits} BITS for $${usd}`
  });
}

/**
 * Notify Certificate payment
 */
export function notifyCertificatePurchase({ wallet, bits, txHash }) {
  return sendTelegramNotification({
    type: 'certificate',
    status: 'success',
    network: 'BSC',
    wallet,
    amount: `${bits} BITS`,
    currency: 'BITS',
    txHash,
    details: `Stress Test Certificate Payment: ${bits} BITS`
  });
}

/**
 * Notify Staking deposit
 */
export function notifyStakingDeposit({ wallet, amount, txHash }) {
  return sendTelegramNotification({
    type: 'staking_deposit',
    status: 'success',
    network: 'BSC',
    wallet,
    amount: `${amount} BITS`,
    currency: 'BITS',
    txHash,
    details: `Staked ${amount} BITS`
  });
}

/**
 * Notify Staking withdraw
 */
export function notifyStakingWithdraw({ wallet, amount, txHash }) {
  return sendTelegramNotification({
    type: 'staking_withdraw',
    status: 'success',
    network: 'BSC',
    wallet,
    amount: `${amount} BITS`,
    currency: 'BITS',
    txHash,
    details: `Withdrawn ${amount} BITS from staking`
  });
}

