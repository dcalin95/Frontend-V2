import React, { useState, useContext } from 'react';
import { useNFTPreOrders } from '../../hooks/useNFTPreOrders';
import WalletContext from '../../context/WalletContext';
import { toBitsInteger, formatBITS } from '../../utils/bitsUtils';
import './StakeWithNFTPreOrder.css';

const StakeWithNFTPreOrder = () => {
  const { walletAddress } = useContext(WalletContext);
  const { 
    preOrders, 
    loading, 
    stakeAndPreOrderNFT, 
    executePreOrder, 
    cancelPreOrder 
  } = useNFTPreOrders(walletAddress);

  // Form states
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState(0); // 0 = flexible
  const [nftTokenId, setNftTokenId] = useState('');
  const [nftPrice, setNftPrice] = useState('');
  const [executionDays, setExecutionDays] = useState(30); // Default 30 days
  const [nftSeller, setNftSeller] = useState('');
  
  // UI states
  const [isCreating, setIsCreating] = useState(false);
  const [showPreOrderForm, setShowPreOrderForm] = useState(false);

  // Lock period options
  const LOCK_PERIODS = [
    { days: 0, label: '🔄 Flexible (No Lock)', bonus: 0 },
    { days: 30, label: '🔒 30 Days', bonus: 5 },
    { days: 90, label: '⏰ 90 Days', bonus: 10 },
    { days: 180, label: '📅 180 Days', bonus: 15 },
    { days: 365, label: '🗓️ 365 Days', bonus: 25 }
  ];

  const handleStakeWithPreOrder = async () => {
    if (!walletAddress) {
      alert('⚠️ Please connect your wallet first!');
      return;
    }

    if (!stakeAmount || !nftTokenId || !nftPrice || !nftSeller) {
      alert('⚠️ Please fill in all required fields!');
      return;
    }

    // Validate amounts
    const stakeAmountInt = toBitsInteger(stakeAmount);
    const nftPriceInt = toBitsInteger(nftPrice);
    
    if (stakeAmountInt <= 0 || nftPriceInt <= 0) {
      alert('⚠️ Please enter valid amounts!');
      return;
    }

    // Calculate execution timestamp
    const executionTimestamp = Math.floor(Date.now() / 1000) + (executionDays * 24 * 60 * 60);

    // Confirmation dialog
    const confirmed = window.confirm(
      `🔨 Confirm Stake + NFT Pre-Order\n\n` +
      `💰 Stake Amount: ${formatBITS(stakeAmountInt)}\n` +
      `🔒 Lock Period: ${LOCK_PERIODS.find(p => p.days * 24 * 60 * 60 === lockPeriod)?.label || 'Custom'}\n\n` +
      `🎨 NFT Token ID: #${nftTokenId}\n` +
      `💸 NFT Price: ${formatBITS(nftPriceInt)}\n` +
      `📅 Execution: ${executionDays} days from now\n` +
      `👤 Seller: ${nftSeller.substring(0, 6)}...${nftSeller.substring(nftSeller.length - 4)}\n\n` +
      `⚠️ This will:\n` +
      `• Stake your BITS immediately\n` +
      `• Pre-authorize NFT purchase for future date\n` +
      `• Execute automatically if you have funds\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    setIsCreating(true);
    try {
      const result = await stakeAndPreOrderNFT(
        stakeAmountInt,
        lockPeriod,
        parseInt(nftTokenId),
        nftPriceInt,
        executionTimestamp,
        nftSeller
      );

      alert(
        `🎉 Stake + Pre-Order Created!\n\n` +
        `✅ Staking: ${formatBITS(stakeAmountInt)} active\n` +
        `⏰ NFT Pre-Order: Set for ${executionDays} days\n\n` +
        `📄 Transaction: ${result.transactionHash}\n\n` +
        `Your NFT will be purchased automatically on the scheduled date if you have sufficient balance!`
      );

      // Reset form
      setStakeAmount('');
      setNftTokenId('');
      setNftPrice('');
      setNftSeller('');
      setShowPreOrderForm(false);

    } catch (error) {
      console.error('❌ Failed to create stake + pre-order:', error);
      alert(`❌ Failed to create stake + pre-order:\n\n${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleExecutePreOrder = async (preOrderId) => {
    const confirmed = window.confirm(
      `⚡ Execute NFT Pre-Order #${preOrderId}?\n\n` +
      `This will immediately purchase the NFT if all conditions are met.\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    try {
      const result = await executePreOrder(preOrderId);
      alert(
        `🎉 NFT Pre-Order Executed!\n\n` +
        `✅ NFT purchased successfully!\n` +
        `📄 Transaction: ${result.transactionHash}`
      );
    } catch (error) {
      alert(`❌ Execution failed:\n\n${error.message}`);
    }
  };

  const handleCancelPreOrder = async (preOrderId) => {
    const confirmed = window.confirm(
      `❌ Cancel NFT Pre-Order #${preOrderId}?\n\n` +
      `This action cannot be undone.\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    try {
      const result = await cancelPreOrder(preOrderId);
      alert(
        `✅ NFT Pre-Order Cancelled!\n\n` +
        `📄 Transaction: ${result.transactionHash}`
      );
    } catch (error) {
      alert(`❌ Cancellation failed:\n\n${error.message}`);
    }
  };

  return (
    <div className="stake-preorder-container">
      <div className="stake-preorder-header">
        <h2>🚀 Smart Staking + NFT Pre-Orders</h2>
        <p>Stake your BITS and pre-authorize NFT purchases for future dates!</p>
      </div>

      {/* Toggle Pre-Order Form */}
      <div className="preorder-toggle">
        <button 
          className={`toggle-btn ${showPreOrderForm ? 'active' : ''}`}
          onClick={() => setShowPreOrderForm(!showPreOrderForm)}
        >
          {showPreOrderForm ? '📋 Hide Pre-Order Form' : '🎨 + Add NFT Pre-Order'}
        </button>
      </div>

      {/* Pre-Order Creation Form */}
      {showPreOrderForm && (
        <div className="preorder-form-section">
          <h3>🔨 Create Stake + NFT Pre-Order</h3>
          
          <div className="form-grid">
            {/* Staking Section */}
            <div className="form-section">
              <h4>💰 Staking Details</h4>
              
              <div className="form-group">
                <label>💎 Stake Amount (BITS):</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount to stake"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>🔒 Lock Period:</label>
                <select 
                  value={lockPeriod} 
                  onChange={(e) => setLockPeriod(parseInt(e.target.value))}
                >
                  {LOCK_PERIODS.map((period) => (
                    <option key={period.days} value={period.days * 24 * 60 * 60}>
                      {period.label} {period.bonus > 0 && `(+${period.bonus}% APR)`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* NFT Pre-Order Section */}
            <div className="form-section">
              <h4>🎨 NFT Pre-Order Details</h4>
              
              <div className="form-group">
                <label>🆔 NFT Token ID:</label>
                <input
                  type="number"
                  value={nftTokenId}
                  onChange={(e) => setNftTokenId(e.target.value)}
                  placeholder="Enter NFT Token ID"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>💸 NFT Price (BITS):</label>
                <input
                  type="number"
                  value={nftPrice}
                  onChange={(e) => setNftPrice(e.target.value)}
                  placeholder="Enter NFT price"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>👤 Seller Address:</label>
                <input
                  type="text"
                  value={nftSeller}
                  onChange={(e) => setNftSeller(e.target.value)}
                  placeholder="0x... (NFT seller wallet address)"
                />
              </div>

              <div className="form-group">
                <label>📅 Execute In (Days):</label>
                <input
                  type="number"
                  value={executionDays}
                  onChange={(e) => setExecutionDays(parseInt(e.target.value))}
                  placeholder="Days until execution"
                  min="1"
                  max="365"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="create-preorder-btn"
              onClick={handleStakeWithPreOrder}
              disabled={isCreating || !walletAddress}
            >
              {isCreating ? (
                <>
                  <span className="loading-spinner">🔄</span>
                  Creating Stake + Pre-Order...
                </>
              ) : (
                <>
                  <span className="icon">🚀</span>
                  Stake + Pre-Order NFT
                </>
              )}
            </button>
          </div>

          <div className="preorder-info">
            <h4>ℹ️ How It Works:</h4>
            <ul>
              <li>✅ Your BITS are staked immediately with chosen lock period</li>
              <li>⏰ NFT purchase is scheduled for future execution date</li>
              <li>🤖 Purchase executes automatically if you have sufficient balance</li>
              <li>❌ You can cancel the pre-order before execution date</li>
              <li>🔒 Seller must still own the NFT at execution time</li>
            </ul>
          </div>
        </div>
      )}

      {/* User's Pre-Orders List */}
      <div className="preorders-list-section">
        <h3>📋 Your NFT Pre-Orders</h3>
        
        {loading ? (
          <div className="loading-state">
            <span className="loading-spinner">🔄</span>
            Loading pre-orders...
          </div>
        ) : preOrders.length === 0 ? (
          <div className="empty-state">
            <p>📭 No NFT pre-orders yet</p>
            <p>Create your first smart staking + NFT pre-order above!</p>
          </div>
        ) : (
          <div className="preorders-grid">
            {preOrders.map((order, index) => (
              <div key={index} className={`preorder-card ${order.executed ? 'executed' : order.cancelled ? 'cancelled' : 'active'}`}>
                <div className="preorder-header">
                  <h4>🎨 NFT #{order.nftTokenId}</h4>
                  <div className={`status-badge ${order.executed ? 'executed' : order.cancelled ? 'cancelled' : 'pending'}`}>
                    {order.executed ? '✅ Executed' : order.cancelled ? '❌ Cancelled' : '⏰ Pending'}
                  </div>
                </div>
                
                <div className="preorder-details">
                  <p><strong>💸 Price:</strong> {formatBITS(order.price)}</p>
                  <p><strong>📅 Execute On:</strong> {order.executionDate.toLocaleDateString()} {order.executionDate.toLocaleTimeString()}</p>
                  <p><strong>👤 Seller:</strong> {order.seller.substring(0, 6)}...{order.seller.substring(order.seller.length - 4)}</p>
                </div>

                {!order.executed && !order.cancelled && (
                  <div className="preorder-actions">
                    <button 
                      className="execute-btn"
                      onClick={() => handleExecutePreOrder(index)}
                      disabled={new Date() < order.executionDate}
                    >
                      ⚡ Execute Now
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => handleCancelPreOrder(index)}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StakeWithNFTPreOrder;

