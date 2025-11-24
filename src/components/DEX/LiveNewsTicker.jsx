import React, { useState, useEffect, useRef } from 'react';
import { Info, Radio } from 'lucide-react';
import { liveNewsFeed, getRandomNews } from '../../data/liveNewsData';
import './LiveNewsTicker.css';

/**
 * Live News Ticker Component
 * Displays scrolling crypto/AI news and platform updates
 * Smart rotation prevents immediate repeats
 */
const LiveNewsTicker = () => {
  const [currentNews, setCurrentNews] = useState([]);
  const [recentlyShown, setRecentlyShown] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const tickerRef = useRef(null);

  // Initialize and rotate news
  useEffect(() => {
    const rotateNews = () => {
      // Get 8 random items, excluding recently shown
      const newItems = getRandomNews(8, recentlyShown);
      setCurrentNews(newItems);

      // Update recently shown (keep last 30 items to avoid repeats)
      setRecentlyShown(prev => {
        const updated = [...prev, ...newItems];
        return updated.slice(-30);
      });
    };

    // Initial load
    rotateNews();

    // Rotate every 45 seconds
    const interval = setInterval(rotateNews, 45000);

    return () => clearInterval(interval);
  }, [recentlyShown]);

  // Create continuous loop by duplicating content
  const newsLoop = [...currentNews, ...currentNews, ...currentNews];

  return (
    <div className="live-news-ticker-container">
      {/* Live Indicator */}
      <div className="live-news-badge">
        <Radio size={14} className="live-icon-pulse" />
        <span>LIVE</span>
      </div>

      {/* Info Button */}
      <button 
        className="live-news-info-btn"
        onClick={() => setShowInfo(!showInfo)}
        title="About Live News"
      >
        <Info size={16} />
      </button>

      {/* Scrolling News */}
      <div 
        className={`live-news-ticker ${isPaused ? 'paused' : ''}`}
        ref={tickerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="live-news-track">
          {newsLoop.map((item, idx) => (
            <div key={`news-${idx}`} className="live-news-item">
              <span className="live-news-icon">{item.icon}</span>
              <span className="live-news-text">{item.text}</span>
              <span className="live-news-separator">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info Tooltip */}
      {showInfo && (
        <div className="live-news-tooltip">
          <div className="live-news-tooltip-header">
            <Radio size={14} />
            <span>Live Intelligence Feed</span>
          </div>
          <p>
            Real-time updates from AI analysis, market trends, platform news, and DeFi insights.
            Hover to pause • Updates every 45 seconds
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveNewsTicker;

