import React, { useState, useEffect } from 'react';
import './WordCollectionProgress.css';

const WordCollectionProgress = ({
  wordCount = 0,
  walletAddress,
  onRefresh,
  isLoading = false,
  onDebugTest
}) => {
  const progress = Math.min((wordCount / 1000) * 100, 100);
  const wordsRemaining = Math.max(0, 1000 - wordCount);
  const isComplete = wordCount >= 1000;
  
  const [userWords, setUserWords] = useState([]);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [showWords, setShowWords] = useState(false);

  // Fetch user words when wallet is connected and component mounts
  useEffect(() => {
    if (walletAddress && wordCount > 0) {
      fetchUserWords();
    }
  }, [walletAddress, wordCount]);

  const fetchUserWords = async () => {
    setIsLoadingWords(true);
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      const response = await fetch(`${BACKEND_URL}/api/word-analysis/get-user-words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });

      if (response.ok) {
        const data = await response.json();
        setUserWords(data.words || []);
        console.log('✅ Loaded words:', data.words?.length);
      }
    } catch (error) {
      console.error('❌ Error fetching words:', error);
    } finally {
      setIsLoadingWords(false);
    }
  };

  return (
    <div className="word-collection-container">
      {/* Header Section */}
      <div className="word-collection-header">
        <div className="header-icon">
          <span className="brain-icon">🧠</span>
          <div className="icon-glow"></div>
        </div>
        <div className="header-content">
          <h2 className="collection-title">
            Mind Mirror <span className="gradient-text">Word Collection</span>
          </h2>
          <p className="collection-subtitle">
            Your linguistic footprint for AI Neuropsychological Analysis
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="word-collection-progress-section">
        <div className="progress-display">
          {/* Circular Progress */}
          <div 
            className="progress-circle" 
            style={{ 
              background: `conic-gradient(#14F195 ${progress}%, rgba(255,255,255,0.05) ${progress}%)` 
            }}
          >
            <div className="progress-inner-circle">
              <span className="progress-percent-value">{progress.toFixed(1)}%</span>
            </div>
          </div>
          
          {/* Word Count */}
          <div className="progress-text">
            <span className="current-words">{wordCount}</span> / 1000 words
          </div>
        </div>

        {/* Progress Details - Messages */}
        <div className="progress-details">
          {!walletAddress ? (
            <p className="connect-wallet-message">
              🔌 Connect your wallet to see your word count from Telegram
            </p>
          ) : isComplete ? (
            <p className="completion-message">
              ✨ Congratulations! You've collected 1000+ words. Ready for advanced analysis!
            </p>
          ) : wordCount === 0 ? (
            <>
              <p className="participation-message">
                🧠 Participate in Telegram group to collect <span className="highlight-words">1000 words</span> for analysis
              </p>
              <p className="warning-message">
                ⚠️ Make sure your wallet is linked to your Telegram account in the BitSwapDEX group
              </p>
            </>
          ) : (
            <p className="participation-message">
              🧠 Participate in Telegram group to collect <span className="highlight-words">{wordsRemaining}</span> more words for analysis
            </p>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            {walletAddress && (
              <button
                onClick={onRefresh}
                className="refresh-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="button-spinner"></span>
                    Loading...
                  </>
                ) : (
                  '🔄 Refresh Word Count'
                )}
              </button>
            )}
            {walletAddress && onDebugTest && (
              <button
                onClick={onDebugTest}
                className="debug-button"
              >
                🧪 DEBUG: Test All APIs
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collected Words Section */}
      {walletAddress && wordCount > 0 && (
        <div className="collected-words-section">
          <button 
            className="words-toggle-button"
            onClick={() => setShowWords(!showWords)}
          >
            <span className="toggle-icon">{showWords ? '▼' : '▶'}</span>
            <span className="toggle-text">
              {showWords ? 'Hide' : 'Show'} Your Collected Words ({userWords.length})
            </span>
          </button>

          {showWords && (
            <div className="words-display-container">
              {isLoadingWords ? (
                <div className="words-loading">
                  <span className="button-spinner"></span>
                  <span>Loading words...</span>
                </div>
              ) : userWords.length > 0 ? (
                <>
                  <div className="words-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Unique Words:</span>
                      <span className="stat-value">{userWords.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Progress:</span>
                      <span className="stat-value">{progress.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="words-grid">
                    {userWords.map((word, index) => (
                      <div key={index} className="word-chip">
                        {word}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="no-words-message">No words collected yet</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions/Info Section */}
      <div className="word-collection-info-section">
        <h3>How to Collect Words:</h3>
        <ul>
          <li>Join the official BitSwapDEX Telegram group</li>
          <li>Link your wallet using the /linkwallet command</li>
          <li>Engage in meaningful conversations</li>
          <li>The AI bot automatically collects unique words from your messages</li>
          <li>Reach 1000 words to unlock your Mind Mirror analysis</li>
        </ul>
      </div>
    </div>
  );
};

export default WordCollectionProgress;
