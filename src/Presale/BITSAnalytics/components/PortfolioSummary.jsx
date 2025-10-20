import React from "react";
import { formatROI, formatTransactions } from "../utils/dataFormatters";

const PortfolioSummary = ({ safeData }) => {
  const roiData = formatROI(safeData.roiPercent);
  const txFormatted = formatTransactions(safeData.txCount);
  
  const portfolioLevel = safeData.totalBits > 1000 ? "Large" : safeData.totalBits > 100 ? "Medium" : "Small";
  
  // Real portfolio insights based on actual data
  const getPortfolioInsight = () => {
    if (safeData.totalBits === 0) {
      return {
        icon: "📊",
        title: "Portfolio Analysis",
        message: "Connect your wallet to view detailed portfolio analytics and performance metrics.",
        status: "No Data Available",
        action: "Connect Wallet"
      };
    }
    
    const isHighValue = (safeData.totalBits || 0) > 500;
    const isPositiveROI = roiData.isPositive;
    const totalInvestmentUSD = safeData.realInvestedUSD || 0;
    
    if (isHighValue && isPositiveROI) {
      return {
        icon: "🚀",
        title: "Strong Portfolio Performance",
        message: `Your portfolio of ${txFormatted} shows positive performance with ${roiData.analysis.toLowerCase()}. Current holdings demonstrate good market positioning.`,
        status: "Performing Well",
        action: "Consider Holdings Strategy"
      };
    } else if (isHighValue && !isPositiveROI) {
      return {
        icon: "📈",
        title: "Portfolio Under Review",
        message: `Despite ${roiData.analysis.toLowerCase()}, your substantial holdings position you for potential recovery when market conditions improve.`,
        status: "Market Correction Impact",
        action: "Monitor Market Trends"
      };
    } else if (!isHighValue && isPositiveROI) {
      return {
        icon: "🌱",
        title: "Growing Portfolio",
        message: `Your portfolio shows ${roiData.analysis.toLowerCase()} with room for growth. Consider strategic accumulation based on your investment goals.`,
        status: "Growth Opportunity",
        action: "Evaluate Investment Strategy"
      };
    } else {
      return {
        icon: "🎯",
        title: "Portfolio Development",
        message: `Your ${txFormatted} show engagement with the platform. Market positioning allows for strategic investment decisions.`,
        status: "Building Phase",
        action: "Assess Risk Tolerance"
      };
    }
  };
  
  const portfolioInsight = getPortfolioInsight();
  
  return (
    <div className="portfolio-summary">
      {/* Header Section */}
      <div className="portfolio-summary-header">
        <div className="portfolio-summary-icon">
          {portfolioInsight.icon}
        </div>
        <div>
          <h3 className="portfolio-summary-title">
            Portfolio Insights
          </h3>
          <div className="portfolio-summary-subtitle">
            {portfolioInsight.title}
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="portfolio-summary-content">
        <p className="portfolio-summary-message">
          {portfolioInsight.message}
        </p>
      </div>

      {/* Portfolio Status */}
      <div className="portfolio-summary-stats">
        <div className="portfolio-summary-stat">
          <div className="portfolio-summary-stat-label">
            Portfolio Size
          </div>
          <div className="portfolio-summary-stat-value">
            {portfolioLevel}
          </div>
        </div>
        
        <div className="portfolio-summary-stat status">
          <div className="portfolio-summary-stat-label">
            Status
          </div>
          <div className="portfolio-summary-stat-value">
            {portfolioInsight.action}
          </div>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="portfolio-summary-footer">
        <div className="portfolio-summary-status">
          <div className="portfolio-summary-dot"></div>
          <span className="portfolio-summary-text">
            {portfolioInsight.status}
          </span>
        </div>
        
        <div className="portfolio-summary-note">
          Portfolio analysis based on blockchain data
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;