import React, { useState } from 'react';
import { transferMindNFT } from '../../utils/nftUtils';
import { ethers } from 'ethers';
import './NFTTransferModal.css';

const NFTTransferModal = ({ nft, userAddress, onClose, onTransferComplete }) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState('');

  const handleTransfer = async () => {
    if (!recipientAddress.trim()) {
      alert('⚠️ Please enter a recipient address!');
      return;
    }

    if (!ethers.utils.isAddress(recipientAddress)) {
      alert('⚠️ Please enter a valid wallet address!');
      return;
    }

    if (recipientAddress.toLowerCase() === userAddress.toLowerCase()) {
      alert('⚠️ You cannot transfer to your own address!');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `🔄 Confirm NFT Transfer\n\n` +
      `NFT: Mind Mirror NFT #${nft.tokenId}\n` +
      `From: ${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}\n` +
      `To: ${recipientAddress.substring(0, 6)}...${recipientAddress.substring(recipientAddress.length - 4)}\n\n` +
      `⚠️ This action cannot be undone!\n\n` +
      `Do you want to continue?`
    );

    if (!confirmed) return;

    setIsTransferring(true);
    setTransferStatus('🔄 Preparing transfer...');

    try {
      setTransferStatus('📝 Executing blockchain transaction...');
      
      const result = await transferMindNFT(userAddress, recipientAddress, nft.tokenId);
      
      setTransferStatus('✅ Transfer completed successfully!');
      
      // Show success message
      alert(
        `🎉 NFT Transfer Successful!\n\n` +
        `✅ NFT #${nft.tokenId} has been transferred to:\n` +
        `${recipientAddress}\n\n` +
        `📄 Transaction Hash:\n${result.transactionHash}\n\n` +
        `🔗 View on BSCScan: https://testnet.bscscan.com/tx/${result.transactionHash}`
      );
      
      // Notify parent component
      if (onTransferComplete) {
        onTransferComplete(result);
      }
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Transfer failed:', error);
      setTransferStatus(`❌ Transfer failed: ${error.message}`);
      
      alert(`❌ Transfer Failed\n\n${error.message}\n\nPlease try again.`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="nft-transfer-modal-overlay" onClick={onClose}>
      <div className="nft-transfer-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔄 Transfer NFT</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* NFT Preview */}
          <div className="nft-preview-section">
            <div className="nft-info">
              <h4>Mind Mirror NFT #{nft.tokenId}</h4>
              <p><strong>Profile:</strong> {nft.neuroPsychProfile}</p>
              <p><strong>Word Count:</strong> {nft.wordCount}</p>
              <p><strong>Created:</strong> {new Date(nft.creationTime).toLocaleDateString()}</p>
            </div>
          </div>
          
          {/* Transfer Form */}
          <div className="transfer-form">
            <div className="form-group">
              <label htmlFor="recipient">🎯 Recipient Address:</label>
              <input
                type="text"
                id="recipient"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value.trim())}
                placeholder="0x... (Enter wallet address to transfer to)"
                className="address-input"
                disabled={isTransferring}
              />
            </div>
            
            <div className="address-info">
              <p><strong>From:</strong> {userAddress.substring(0, 6)}...{userAddress.substring(userAddress.length - 4)}</p>
              {recipientAddress && ethers.utils.isAddress(recipientAddress) && (
                <p><strong>To:</strong> {recipientAddress.substring(0, 6)}...{recipientAddress.substring(recipientAddress.length - 4)}</p>
              )}
            </div>
            
            {transferStatus && (
              <div className={`transfer-status ${transferStatus.includes('❌') ? 'error' : transferStatus.includes('✅') ? 'success' : 'loading'}`}>
                {transferStatus}
              </div>
            )}
          </div>
          
          <div className="modal-actions">
            <button 
              className="cancel-btn" 
              onClick={onClose}
              disabled={isTransferring}
            >
              Cancel
            </button>
            <button 
              className="transfer-btn" 
              onClick={handleTransfer}
              disabled={isTransferring || !recipientAddress.trim() || !ethers.utils.isAddress(recipientAddress)}
            >
              {isTransferring ? '🔄 Transferring...' : '🚀 Transfer NFT'}
            </button>
          </div>
        </div>
        
        <div className="transfer-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-text">
            <strong>Important:</strong> NFT transfers are permanent and cannot be reversed. 
            Make sure the recipient address is correct before proceeding.
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTTransferModal;

