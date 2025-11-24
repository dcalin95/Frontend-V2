/**
 * Live News & Information Feed Data
 * Dynamic ticker with crypto market updates, AI insights, and platform news
 */

export const newsCategories = {
  MARKET: 'market',
  AI: 'ai',
  PLATFORM: 'platform',
  DEFI: 'defi',
  TRENDING: 'trending',
  TIPS: 'tips'
};

export const liveNewsFeed = [
  // MARKET UPDATES
  { 
    category: newsCategories.MARKET, 
    text: '📈 Bitcoin volatility increases - AI suggests defensive positions',
    icon: '📊'
  },
  { 
    category: newsCategories.MARKET, 
    text: '💹 DeFi TVL reaches new all-time high - $180B locked',
    icon: '🔒'
  },
  { 
    category: newsCategories.MARKET, 
    text: '⚡ Layer-2 transaction volume surges 340% this month',
    icon: '📈'
  },
  { 
    category: newsCategories.MARKET, 
    text: '🌐 Cross-chain bridges handle $2.3B daily volume',
    icon: '🌉'
  },
  { 
    category: newsCategories.MARKET, 
    text: '💰 Stablecoin market cap exceeds $150B globally',
    icon: '💵'
  },
  { 
    category: newsCategories.MARKET, 
    text: '📉 Market consolidation phase detected - AI adjusting strategies',
    icon: '🎯'
  },
  { 
    category: newsCategories.MARKET, 
    text: '🔥 Top 10 altcoins show 15% average gain this week',
    icon: '🚀'
  },
  { 
    category: newsCategories.MARKET, 
    text: '⚠️ High volatility window detected - Risk protocols activated',
    icon: '🛡️'
  },

  // AI INTELLIGENCE
  { 
    category: newsCategories.AI, 
    text: '🤖 Neural Intelligence processing 1.2M data points per second',
    icon: '🧠'
  },
  { 
    category: newsCategories.AI, 
    text: '🎯 AI detected 47 trading opportunities in the last hour',
    icon: '🎲'
  },
  { 
    category: newsCategories.AI, 
    text: '⚡ Machine learning models updated with latest market patterns',
    icon: '🔄'
  },
  { 
    category: newsCategories.AI, 
    text: '🧬 Advanced sentiment analysis shows bullish momentum building',
    icon: '📡'
  },
  { 
    category: newsCategories.AI, 
    text: '🔮 Predictive models suggest 78% probability of upward trend',
    icon: '📊'
  },
  { 
    category: newsCategories.AI, 
    text: '🌟 AI Portfolio Optimizer rebalanced 234 positions today',
    icon: '⚖️'
  },
  { 
    category: newsCategories.AI, 
    text: '💡 Neural network confidence level: 91% - Strong signals detected',
    icon: '✨'
  },
  { 
    category: newsCategories.AI, 
    text: '🎪 AI risk engine prevented 12 high-risk trades automatically',
    icon: '🛡️'
  },

  // PLATFORM NEWS
  { 
    category: newsCategories.PLATFORM, 
    text: '🎉 BITS ecosystem now supports 8 blockchain networks',
    icon: '🌐'
  },
  { 
    category: newsCategories.PLATFORM, 
    text: '⚡ New staking pools launched with up to 45% APY',
    icon: '💎'
  },
  { 
    category: newsCategories.PLATFORM, 
    text: '🚀 Platform processed $18M in trading volume today',
    icon: '📊'
  },
  { 
    category: newsCategories.PLATFORM, 
    text: '🔐 Enhanced security protocols now active - Your funds are safer',
    icon: '🛡️'
  },
  { 
    category: newsCategories.PLATFORM, 
    text: '👥 Active users milestone: 125,000+ traders worldwide',
    icon: '🌍'
  },
  { 
    category: newsCategories.PLATFORM, 
    text: '⚡ Lightning-fast swaps: Average execution time 1.2 seconds',
    icon: '⏱️'
  },
  { 
    category: newsCategories.PLATFORM, 
    text: '🎁 New reward program: Earn BITS tokens for every trade',
    icon: '🎯'
  },
  { 
    category: newsCategories.PLATFORM, 
    text: '🌟 Mobile app downloads surpass 50,000 - Thank you!',
    icon: '📱'
  },

  // DEFI INSIGHTS
  { 
    category: newsCategories.DEFI, 
    text: '💧 Liquidity pools depth increased 25% this week',
    icon: '🌊'
  },
  { 
    category: newsCategories.DEFI, 
    text: '🔄 Smart contract audits completed - 100% security rating',
    icon: '✅'
  },
  { 
    category: newsCategories.DEFI, 
    text: '⚡ Gas optimization reduces transaction costs by 40%',
    icon: '⛽'
  },
  { 
    category: newsCategories.DEFI, 
    text: '🌈 Multi-chain routing finds best prices across 15 DEXs',
    icon: '🔍'
  },
  { 
    category: newsCategories.DEFI, 
    text: '💰 Yield farming strategies optimized - Higher returns detected',
    icon: '🌾'
  },
  { 
    category: newsCategories.DEFI, 
    text: '🏦 Decentralized lending rates: 8-12% APY on stablecoins',
    icon: '💵'
  },
  { 
    category: newsCategories.DEFI, 
    text: '🎲 Impermanent loss protection activated for LP providers',
    icon: '🛡️'
  },

  // TRENDING
  { 
    category: newsCategories.TRENDING, 
    text: '🔥 Trending pair: BITS/USDT volume up 180% today',
    icon: '📈'
  },
  { 
    category: newsCategories.TRENDING, 
    text: '⚡ Flash news: Major protocol announces integration',
    icon: '📰'
  },
  { 
    category: newsCategories.TRENDING, 
    text: '🌟 Community vote results: New features approved!',
    icon: '🗳️'
  },
  { 
    category: newsCategories.TRENDING, 
    text: '🎯 Whale alert: Large transaction detected on BSC',
    icon: '🐋'
  },
  { 
    category: newsCategories.TRENDING, 
    text: '💎 NFT marketplace integration coming soon',
    icon: '🖼️'
  },
  { 
    category: newsCategories.TRENDING, 
    text: '🚀 Token burn event scheduled - Deflationary pressure incoming',
    icon: '🔥'
  },

  // TIPS & EDUCATION
  { 
    category: newsCategories.TIPS, 
    text: '💡 Pro tip: Use limit orders to avoid slippage on large trades',
    icon: '🎓'
  },
  { 
    category: newsCategories.TIPS, 
    text: '📚 Did you know? AI can help you set optimal stop-loss levels',
    icon: '🤓'
  },
  { 
    category: newsCategories.TIPS, 
    text: '⚡ Quick tip: Enable 2FA for enhanced account security',
    icon: '🔐'
  },
  { 
    category: newsCategories.TIPS, 
    text: '🎯 Strategy insight: Dollar-cost averaging reduces risk by 30%',
    icon: '📊'
  },
  { 
    category: newsCategories.TIPS, 
    text: '🌟 Remember: Never invest more than you can afford to lose',
    icon: '⚠️'
  },
  { 
    category: newsCategories.TIPS, 
    text: '💰 Smart move: Diversify across multiple assets and chains',
    icon: '🌐'
  },
  { 
    category: newsCategories.TIPS, 
    text: '🔍 Research tip: Always verify contract addresses before trading',
    icon: '✅'
  },
  { 
    category: newsCategories.TIPS, 
    text: '🎪 Pro strategy: Set price alerts to catch market opportunities',
    icon: '🔔'
  },
];

/**
 * Get random news items without immediate repeats
 * @param {number} count - Number of items to get
 * @param {Array} excludeRecent - Recently shown items to exclude
 * @returns {Array} Random news items
 */
export const getRandomNews = (count = 5, excludeRecent = []) => {
  const available = liveNewsFeed.filter(item => !excludeRecent.includes(item));
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Get news by category
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered news items
 */
export const getNewsByCategory = (category) => {
  return liveNewsFeed.filter(item => item.category === category);
};

export default liveNewsFeed;

