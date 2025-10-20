import React from "react";
import { 
  formatUSD, 
  formatBITS, 
  formatPrice, 
  formatROI, 
  formatTransactions,
  formatTimestamp 
} from "../utils/dataFormatters";

const PerformanceAnalysis = ({ safeData, walletAddress, pulseEffect }) => {
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

  const totalBitsIncludingBonuses = 
    (safeData.totalBits || 0) +
    (safeData.referralBonus || 0) +
    (safeData.telegramBonus || 0) +
    (safeData.bonusCalculatedLocally || 0);

  const totalInvestmentValueUSD = 
    totalBitsIncludingBonuses * (safeData.currentPrice || 0);

  const PerformanceCard = ({ icon, label, value, type = "default", hasData = false, trend = "neutral" }) => (
    <div className={`portfolio-performance-card ${type} ${trend}`}>
      {/* Content */}
      <div className="portfolio-performance-content">
        <div className="portfolio-performance-info">
          <div className={`portfolio-performance-icon ${hasData ? 'has-data' : ''} ${trend}`}>
            {icon}
          </div>
          <div className="portfolio-performance-label">
            {label}
          </div>
        </div>
        
        <div className={`portfolio-performance-value ${type === 'highlight' ? 'highlight' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  );

  // Show error state if blockchain connection failed
  if (safeData.hasError) {
    return (
      <div style={{
        padding: "20px",
        textAlign: "center",
        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.15) 100%)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "12px",
        margin: "8px 0",
        backdropFilter: "blur(10px)",
        minHeight: "120px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔗❌</div>
        <h3 style={{ 
          color: "#ef4444", 
          margin: "0 0 12px 0",
          fontWeight: "600",
          fontSize: "1.2rem",
          textAlign: "center"
        }}>
          Blockchain Connection Failed
        </h3>
        <p style={{ 
          color: "#94a3b8", 
          fontSize: "0.9rem", 
          margin: "0 0 16px 0",
          lineHeight: "1.4",
          textAlign: "center"
        }}>
          Unable to load real portfolio data from the blockchain.
        </p>
        <div style={{
          background: "rgba(59, 130, 246, 0.1)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "8px",
          padding: "12px",
          fontSize: "0.85rem",
          color: "#60a5fa",
          textAlign: "center"
        }}>
          <strong>💡 Troubleshooting:</strong><br/>
          • Make sure your wallet is connected<br/>
          • Switch to BSC Testnet or BSC Mainnet<br/>
          • Refresh the page and reconnect wallet
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-performance-grid">
      
      {/* TOTAL HOLDINGS - Main card */}
      <PerformanceCard 
        icon="💎"
        label="Total Holdings"
        type="premium"
        hasData={totalBitsIncludingBonuses > 0}
        value={
          <div style={{
            fontSize: "1rem",
            fontWeight: "700",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))",
            lineHeight: "1.2",
            textAlign: "center"
          }}>
            {formatBITS(totalBitsIncludingBonuses, false)}
          </div>
        }
      />

      {/* PORTFOLIO VALUE */}
      <PerformanceCard 
        icon="💰"
        label="Portfolio Value"
        type="highlight"
        trend="positive"
        hasData={totalInvestmentValueUSD > 0}
        value={
          <div style={{
            fontSize: "1rem",
            fontWeight: "700",
            background: "linear-gradient(135deg, #10b981 0%, #06d6a0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 12px rgba(16, 185, 129, 0.4))",
            lineHeight: "1.2",
            textAlign: "center"
          }}>
            {formatUSD(totalInvestmentValueUSD, false)}
          </div>
        }
      />

      {/* BITS PRICE */}
      <PerformanceCard 
        icon="📈"
        label="BITS Price"
        hasData={safeData.currentPrice > 0}
        value={
          safeData.currentPrice > 0 ? 
            <span style={{ 
              fontSize: "1rem",
              fontWeight: "700",
              background: "linear-gradient(135deg, #06b6d4, #0891b2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 12px rgba(6, 182, 212, 0.4))",
              textAlign: "center"
            }}>
              {formatPrice(safeData.currentPrice)}
            </span> :
            <span style={{ 
              color: "#64748b", 
              fontSize: "0.9rem",
              textAlign: "center"
            }}>
              Loading...
            </span>
        }
      />

      {/* SOLANA INVESTMENT */}
      <PerformanceCard 
        icon="☀️"
        label="Solana Investment"
        hasData={safeData.investedUSDOnSolana > 0}
        trend={safeData.investedUSDOnSolana > 0 ? "positive" : "neutral"}
        value={
          safeData.investedUSDOnSolana > 0 ? (
            <div style={{
              fontSize: "1rem",
              fontWeight: "700",
              background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 12px rgba(153, 69, 255, 0.4))",
              lineHeight: "1.2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              textAlign: "center"
            }}>
              <span>{formatUSD(safeData.investedUSDOnSolana, false)}</span>
            </div>
          ) : (
            <span style={{ 
              fontSize: "0.9rem",
              color: "#64748b", 
              fontStyle: "italic",
              textAlign: "center"
            }}>
              None
            </span>
          )
        }
      />

      {/* TRANSACTIONS */}
      <PerformanceCard 
        icon="📊"
        label="Transactions"
        hasData={safeData.txCount > 0}
        value={
          <div style={{
            fontSize: "1rem",
            fontWeight: "700",
            color: "#e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            textAlign: "center"
          }}>
            <span>{formatTransactions(safeData.txCount)}</span>
            {safeData.txCount > 0 && (
              <span style={{ 
                fontSize: "0.7rem", 
                color: "#10b981",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                ✓
              </span>
            )}
          </div>
        }
      />

      {/* PERFORMANCE */}
      <PerformanceCard 
        icon="📈"
        label="Performance"
        trend={(() => {
          const roiData = formatROI(safeData.roiPercent);
          return roiData.isPositive ? "positive" : "negative";
        })()}
        hasData={safeData.roiPercent !== 0}
        value={(() => {
          const roiData = formatROI(safeData.roiPercent);
          return (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "1rem",
              fontWeight: "700",
              textAlign: "center"
            }}>
              <span style={{
                background: roiData.isPositive 
                  ? "linear-gradient(135deg, #10b981, #06d6a0)"
                  : "linear-gradient(135deg, #ef4444, #f87171)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: `drop-shadow(0 0 8px ${roiData.isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'})`
              }}>
                {roiData.arrow} {roiData.raw.toFixed(1)}%
              </span>
            </div>
          );
        })()}
      />

    </div>
  );
};

export default PerformanceAnalysis;