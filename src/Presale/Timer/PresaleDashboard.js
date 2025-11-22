import React from "react";
import PresaleCountdownFlip from "./PresaleCountdownFlip";
import NewPresaleStats from "./NewPresaleStats";
import { useHybridPresaleState } from "./useHybridPresaleState";
import SmartTooltip from "../components/SmartTooltip"; // Import SmartTooltip

// Import CSS modules
import "./PresaleDashboard.desktop.css";
import "./PresaleDashboard.mobile.css";
import "../CrystalClear.css"; // 💎 Crystal clear text

// Import styles as object for class usage (simulated from CSS modules)
// Since we switched to standard CSS files, we use standard classes
// but keeping the 'styles' object pattern for minimal code changes
const styles = {
  dashboard: "dashboard",
  column: "column",
  error: "error",
  dualDataContainer: "dualDataContainer",
  blockchainSection: "blockchainSection",
  databaseSection: "databaseSection",
  sectionHeader: "sectionHeader",
  chainIcon: "chainIcon",
  statusDot: "statusDot",
  online: "online",
  offline: "offline",
  dataGrid: "dataGrid",
  dataCard: "dataCard",
  cardIcon: "cardIcon",
  cardContent: "cardContent",
  cardLabel: "cardLabel",
  cardValue: "cardValue",
  dbIcon: "dbIcon",
  errorMessage: "errorMessage",
  errorIcon: "errorIcon",
  errorText: "errorText",
  errorDetails: "errorDetails",
  fallbackData: "fallbackData",
  fallbackCard: "fallbackCard",
  reconnectionStatus: "reconnectionStatus",
  statusIndicator: "statusIndicator",
  pulsingDot: "pulsingDot",
  statusNote: "statusNote",
  loading: "loading",
  aiLoadingContainer: "aiLoadingContainer",
  neuralNetwork: "neuralNetwork",
  node: "node",
  connection: "connection",
  loadingText: "loadingText",
  info: "info",
  infoContainer: "infoContainer",
  hologram: "hologram",
  infoIcon: "infoIcon",
  debugInfo: "debugInfo",
  debugSection: "debugSection"
};

const PresaleDashboard = () => {
  const hybridState = useHybridPresaleState();
  const {
    endTime,
    sold,
    supply,
    progress,
    isLoaded,
    error,
    roundActive,
    price,
    roundNumber,
    cellManagerData
  } = hybridState;

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.dualDataContainer}>
          {/* 🔗 CELLMANAGER DATA (Blockchain) */}
          <div className={styles.blockchainSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.chainIcon}>⛓️</span>
              <h3>Blockchain Data</h3>
              <span className={`${styles.statusDot} ${styles.online}`}></span>
            </div>
            
            <div className={styles.dataGrid}>
              <SmartTooltip content={`Active Round\nThe current presale stage active on the smart contract.`}>
              <div className={styles.dataCard}>
                <div className={styles.cardIcon}>🎯</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardLabel}>Current Round</div>
                  <div className={styles.cardValue}>
                    {cellManagerData.loading ? "..." : (cellManagerData.roundNumber || "N/A")}
                  </div>
                </div>
              </div>
              </SmartTooltip>
              
              <SmartTooltip content={`Token Price\nReal-time price per BITS token fetched directly from the blockchain.`}>
              <div className={styles.dataCard}>
                <div className={styles.cardIcon}>💰</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardLabel}>BITS Price</div>
                  <div className={styles.cardValue}>
                    ${cellManagerData.loading ? "..." : (cellManagerData.currentPrice || 0).toFixed(6)}
                  </div>
                </div>
              </div>
              </SmartTooltip>
              
              <SmartTooltip content={`Cell ID\nUnique identifier for the current presale cell configuration.`}>
              <div className={styles.dataCard}>
                <div className={styles.cardIcon}>📦</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardLabel}>Cell ID</div>
                  <div className={styles.cardValue}>
                    {cellManagerData.loading ? "..." : (cellManagerData.cellId ?? "N/A")}
                  </div>
                </div>
              </div>
              </SmartTooltip>
            </div>
          </div>

          {/* 💾 DATA SERVICE (Off-chain analytics) */}
          <div className={styles.databaseSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.dbIcon}>💾</span>
              <h3>Presale Data Service</h3>
              <span className={`${styles.statusDot} ${styles.offline}`}></span>
            </div>
            
            <div className={styles.errorMessage}>
              <div className={styles.errorIcon}>⚠️</div>
              <div className={styles.errorText}>
                <h4>Data Service Unavailable</h4>
                <p>
                  Some presale analytics are temporarily unavailable due to a connectivity issue.
                  On-chain presale remains fully operational and secure on BSC. Token price, round
                  status, and purchases continue normally. We are actively working to restore the
                  data service. Your funds and on-chain activity are not affected.
                </p>
                <div className={styles.errorDetails}>
                  <strong>Error:</strong> {error}
                </div>
              </div>
            </div>
            
            <div className={styles.fallbackData}>
              <div className={styles.fallbackCard}>
                <div className={styles.cardIcon}>📊</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardLabel}>BITS Sold</div>
                  <div className={styles.cardValue}>---</div>
                </div>
              </div>
              
              <div className={styles.fallbackCard}>
                <div className={styles.cardIcon}>🎯</div>
                <div className={styles.cardContent}>
                  <div className={styles.cardLabel}>BITS Available</div>
                  <div className={styles.cardValue}>---</div>
                </div>
              </div>
            </div>
          </div>

          {/* 🔄 RECONNECTION STATUS */}
          <div className={styles.reconnectionStatus}>
            <div className={styles.statusIndicator}>
              <div className={styles.pulsingDot}></div>
              <span>Attempting to restore connection to data service...</span>
            </div>
            <div className={styles.statusNote}>
              <strong>Note:</strong> Blockchain data remains fully operational. Only off-chain analytics are affected.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        <div className={styles.aiLoadingContainer}>
          <div className={styles.neuralNetwork}>
            <div className={styles.node}></div>
            <div className={styles.node}></div>
            <div className={styles.node}></div>
            <div className={styles.connection}></div>
            <div className={styles.connection}></div>
          </div>
          <span className={styles.loadingText}>Neural Networks Initializing...</span>
        </div>
      </div>
    );
  }

  if (!roundActive) {
    return (
      <div className={styles.info}>
        <div className={styles.infoContainer}>
          <div className={styles.hologram}>
            <span className={styles.infoIcon}>⚡</span>
          </div>
          <h3>Next Generation Presale</h3>
          <p>The next presale round is being computed by our AI systems. Stay tuned!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Componenta verticală într-o singură coloană */}
      <div className={styles.column}>
        <PresaleCountdownFlip endTime={endTime} />
        
        {/* 🎯 MARKETING INFO: Only blockchain data for public */}
        <div className={styles.debugInfo}>
          <div className={styles.debugSection}>
            <h5>🔗 Round {roundNumber} • Live on Blockchain • Secure & Transparent</h5>
          </div>
          <div className={styles.debugSection}>
            <h5>💎 Early Bird Pricing • Limited Time Offer • Join Now!</h5>
          </div>
        </div>

        <NewPresaleStats 
          sold={sold} 
          supply={supply} 
          price={price} 
          roundNumber={roundNumber}
        />
      </div>
    </div>
  );
};

export default PresaleDashboard;