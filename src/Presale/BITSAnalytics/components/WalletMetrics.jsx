import React from "react";
import { formatUSD, formatBITS, shortenAddress } from "../utils/dataFormatters";

const WalletMetrics = ({ safeData, walletAddress, pulseEffect }) => {
  const shorten = (addr) => shortenAddress(addr, 6, 4);
  
  const formatUSDWithAnimation = (value, isHighlight = false) => {
    const formattedValue = formatUSD(value, isHighlight);
    return (
      <span style={{ 
        background: isHighlight 
          ? "linear-gradient(135deg, #10b981 0%, #06d6a0 100%)"
          : "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        fontWeight: isHighlight ? "700" : "600",
        fontSize: isHighlight ? "1.05em" : "1em",
        filter: isHighlight ? "drop-shadow(0 0 10px rgba(16, 185, 129, 0.3))" : "none",
        textAlign: "center"
      }}>
        {formattedValue}
      </span>
    );
  };

  const formatBITSWithAnimation = (value) => {
    const formattedValue = formatBITS(value, true);
    return (
      <span style={{ 
        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        fontWeight: "700",
        filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))",
        textAlign: "center"
      }}>
        {formattedValue}
      </span>
    );
  };

  const totalInvestedUSDCalculated = safeData.realInvestedUSD !== undefined
    ? safeData.realInvestedUSD
    : safeData.totalBits && safeData.currentPrice
    ? safeData.totalBits * safeData.currentPrice
    : 0;

  const WalletMetricCard = ({ icon, label, value, type = "default", hasData = false }) => (
    <div className={`portfolio-wallet-metric-card ${type}`}>
      {/* Content */}
      <div className="portfolio-metric-content">
        <div className="portfolio-metric-info">
          <div className={`portfolio-metric-icon ${hasData ? 'has-data' : ''}`}>
            {icon}
          </div>
          <div>
            <div className="portfolio-metric-label">
              {label}
            </div>
          </div>
        </div>
        
        <div className={`portfolio-metric-value ${type === 'highlight' ? 'highlight' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <WalletMetricCard 
        icon="🌐"
        label="Wallet Address"
        type="default"
        hasData={!!walletAddress}
        value={
          <a
            href={`https://bscscan.com/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              textAlign: "center"
            }}
          >
            {shorten(walletAddress)} 
            <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>↗</span>
          </a>
        }
      />

      <WalletMetricCard 
        icon="💰"
        label="Total Portfolio Value"
        type="highlight"
        hasData={totalInvestedUSDCalculated > 0}
        value={formatUSDWithAnimation(totalInvestedUSDCalculated, true)}
      />

      <WalletMetricCard 
        icon="☀️"
        label="Solana Investment"
        type="default"
        hasData={safeData.investedUSDOnSolana > 0}
        value={
          safeData.investedUSDOnSolana > 0 ? 
            formatUSDWithAnimation(safeData.investedUSDOnSolana) : 
            <span style={{ 
              color: "#64748b", 
              fontSize: "0.8rem", 
              fontStyle: "italic",
              opacity: 0.7,
              textAlign: "center"
            }}>
              No Solana Investment
            </span>
        }
      />

      <WalletMetricCard 
        icon="💎"
        label="BITS Holdings"
        type="premium"
        hasData={safeData.totalBits > 0}
        value={
          safeData.totalBits > 0 ? 
            formatBITSWithAnimation(safeData.totalBits) :
            <span style={{ 
              color: "#64748b", 
              fontSize: "0.85rem",
              textAlign: "center"
            }}>
              Loading...
            </span>
        }
      />
    </>
  );
};

export default WalletMetrics;