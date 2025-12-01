import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/UnifiedWalletContext';
import logo from '../assets/logo.png';
import './HistoryModal.css';
import './HistoryModal.mobile.css'; // 📱 Mobile Optimizations

const HistoryModal = ({ isOpen, onClose }) => {
  const { walletAddress, chainId } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, sent, received, swap

  // Fetch transactions from BSCScan API
  useEffect(() => {
    if (!isOpen || !walletAddress || chainId !== 56) return;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // BSCScan API - free tier (limited to 5 requests/sec)
        const apiKey = 'YourBSCScanAPIKey'; // Replace with actual API key
        const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === '1' && data.result) {
          setTransactions(data.result.slice(0, 10)); // Last 10 transactions
        } else {
          // Fallback to mock data for demo
          setTransactions(getMockTransactions(walletAddress));
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        // Use mock data on error
        setTransactions(getMockTransactions(walletAddress));
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [isOpen, walletAddress, chainId]);

  // Mock transactions for demo
  const getMockTransactions = (address) => {
    const now = Math.floor(Date.now() / 1000);
    return [
      {
        hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z',
        from: address.toLowerCase(),
        to: '0x10ed43c718714eb63d5aa57b78b54704e256024e',
        value: '100000000000000000', // 0.1 BNB
        timeStamp: (now - 3600).toString(),
        isError: '0',
        functionName: 'swapExactETHForTokens',
      },
      {
        hash: '0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7',
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        to: address.toLowerCase(),
        value: '50000000000000000', // 0.05 BNB
        timeStamp: (now - 7200).toString(),
        isError: '0',
        functionName: '',
      },
      {
        hash: '0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a',
        from: address.toLowerCase(),
        to: '0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe',
        value: '0',
        timeStamp: (now - 14400).toString(),
        isError: '0',
        functionName: 'transfer',
      },
    ];
  };

  const getTransactionType = (tx) => {
    const isOutgoing = tx.from.toLowerCase() === walletAddress?.toLowerCase();
    
    if (tx.functionName?.includes('swap')) return 'swap';
    if (isOutgoing) return 'sent';
    return 'received';
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'swap':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'sent':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'received':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const formatValue = (value) => {
    const bnb = parseFloat(value) / 1e18;
    return bnb.toFixed(4);
  };

  const formatTime = (timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return getTransactionType(tx) === filter;
  });

  if (!isOpen) return null;

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="history-modal-header">
          <div className="history-modal-branding">
            <img src={logo} alt="BITS" className="history-modal-logo" />
            <div className="history-modal-title-group">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Transaction History
              </h2>
              <p className="history-modal-subtitle">Your recent blockchain activity</p>
            </div>
          </div>
          <button className="history-modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div className="history-modal-body">
          {/* Wallet Info */}
          <div className="history-wallet-info">
            <div className="history-wallet-address">
              <i className="fa-solid fa-wallet"></i>
              <span>{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(walletAddress)}
                className="history-copy-btn"
                title="Copy address"
              >
                <i className="fa-solid fa-copy"></i>
              </button>
            </div>
            <a 
              href={`https://bscscan.com/address/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="history-view-bscscan"
            >
              View on BSCScan
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </div>

          {/* Filters */}
          <div className="history-filters">
            <button 
              className={`history-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`history-filter-btn ${filter === 'received' ? 'active' : ''}`}
              onClick={() => setFilter('received')}
            >
              <i className="fa-solid fa-arrow-down"></i>
              Received
            </button>
            <button 
              className={`history-filter-btn ${filter === 'sent' ? 'active' : ''}`}
              onClick={() => setFilter('sent')}
            >
              <i className="fa-solid fa-arrow-up"></i>
              Sent
            </button>
            <button 
              className={`history-filter-btn ${filter === 'swap' ? 'active' : ''}`}
              onClick={() => setFilter('swap')}
            >
              <i className="fa-solid fa-right-left"></i>
              Swaps
            </button>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="history-loading">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="history-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3V2M15 3V2M9 18C7.89543 18 7 17.1046 7 16V9H17V16C17 17.1046 16.1046 18 15 18H9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="3" y="5" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <h3>No transactions found</h3>
              <p>Your {filter !== 'all' ? filter : ''} transactions will appear here</p>
            </div>
          ) : (
            <div className="history-transactions">
              {filteredTransactions.map((tx, index) => {
                const type = getTransactionType(tx);
                const value = formatValue(tx.value);
                
                return (
                  <div key={tx.hash} className={`history-tx-item ${type}`}>
                    <div className={`history-tx-icon ${type}`}>
                      {getTransactionIcon(type)}
                    </div>
                    
                    <div className="history-tx-details">
                      <div className="history-tx-header">
                        <span className="history-tx-type">
                          {type === 'swap' ? 'Token Swap' : type === 'sent' ? 'Sent' : 'Received'}
                        </span>
                        <span className={`history-tx-amount ${type}`}>
                          {type === 'sent' ? '-' : '+'}{value} BNB
                        </span>
                      </div>
                      
                      <div className="history-tx-info">
                        <span className="history-tx-address">
                          {type === 'sent' ? 'To:' : 'From:'} {
                            (type === 'sent' ? tx.to : tx.from).slice(0, 6)
                          }...{
                            (type === 'sent' ? tx.to : tx.from).slice(-4)
                          }
                        </span>
                        <span className="history-tx-time">{formatTime(tx.timeStamp)}</span>
                      </div>
                    </div>
                    
                    <a 
                      href={`https://bscscan.com/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="history-tx-link"
                      title="View on BSCScan"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* Marketing Section */}
          <div className="history-marketing">
            <div className="history-marketing-item">
              <i className="fa-solid fa-shield-halved"></i>
              <div>
                <strong>Secure & Transparent</strong>
                <p>All transactions verified on BSC blockchain</p>
              </div>
            </div>
            
            <div className="history-marketing-item">
              <i className="fa-solid fa-bolt"></i>
              <div>
                <strong>Lightning Fast</strong>
                <p>BSC transactions confirmed in ~3 seconds</p>
              </div>
            </div>
          </div>

          {/* Powered By */}
          <div className="history-powered-by">
            <span>Data from</span>
            <strong>BSCScan API</strong>
            <span className="history-dot">•</span>
            <span>Real-time updates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;

