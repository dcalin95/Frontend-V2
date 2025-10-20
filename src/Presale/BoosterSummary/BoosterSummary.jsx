import React, { useContext, useState, useEffect } from "react";
import { useBoosterSummary } from "./useBoosterSummary";
import WalletContext from "../../context/WalletContext";
import styles from "./BoosterSummary.module.css";
import { useAdditionalBonus } from "../hooks/useAdditionalBonus";
import AdditionalBonusBox from "./AdditionalBonusBox";
import ReferralBonusClaim from "./ReferralBonusClaim";
import TelegramBonusClaim from "./TelegramBonusClaim";


const BoosterSummary = () => {
  const { walletAddress, connectWallet } = useContext(WalletContext);
  const { loading, data } = useBoosterSummary();
  const [isVisible, setIsVisible] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);

  // AI-Style animations and effects
  useEffect(() => {
    setIsVisible(true);
    const pulseTimer = setInterval(() => {
      setPulseEffect(prev => !prev);
    }, 3000);
    return () => clearInterval(pulseTimer);
  }, []);

  const shorten = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "N/A";

  const formatUSD = (value) => {
    if (value === null || isNaN(value)) return "N/A";
    return `$${Number(value).toFixed(2)}`;
  };

  const formatBITS = (value) => {
    if (value === null || isNaN(value)) return "0.00 $BITS";
    return `${Number(value).toFixed(2)} $BITS`;
  };

  // AI-Style data formatting with animations
  const formatBITSWithAnimation = (value) => {
    if (value === null || isNaN(value)) return "0.00 $BITS";
    const formatted = `${Number(value).toFixed(2)} $BITS`;
    return (
      <span className={`${styles.animatedValue} ${pulseEffect ? styles.pulse : ''}`}>
        {formatted}
      </span>
    );
  };

  if (!walletAddress) {
    return (
      <div className={`${styles.container} ${styles.aiContainer} ${styles.fadeIn}`}>
        <div className={styles.aiHeader}>
          <div className={styles.aiIcon}>🤖</div>
          <h3 className={styles.aiTitle}>AI-Powered Wallet Connection</h3>
        </div>
        <div className={styles.aiDescription}>
          Connect your wallet to unlock advanced AI analytics and personalized insights
        </div>
        <button className={styles.aiConnectButton} onClick={connectWallet}>
          <span className={styles.buttonIcon}>🔗</span>
          Connect Wallet
          <span className={styles.buttonGlow}></span>
        </button>
      </div>
    );
  }
  

  if (loading) {
    return (
      <div className={`${styles.container} ${styles.aiContainer}`}>
        <div className={styles.aiLoader}>
          <div className={styles.aiLoaderIcon}>🤖</div>
          <div className={styles.aiLoaderText}>AI Analyzing Your Portfolio...</div>
          <div className={styles.aiLoaderDots}>
            <div className={styles.aiLoaderDot}></div>
            <div className={styles.aiLoaderDot}></div>
            <div className={styles.aiLoaderDot}></div>
          </div>
          <div className={styles.aiProgressContainer}>
            <div className={styles.aiProgressBar}></div>
          </div>
        </div>
      </div>
    );
  }

  const totalBitsIncludingBonuses =
    (data.totalBits || 0) +
    (data.referralBonus || 0) +
    (data.telegramBonus || 0) +
    (data.bonusCalculatedLocally || 0);

  const totalInvestmentValueUSD =
    totalBitsIncludingBonuses * (data.currentPrice || 0);

  const totalInvestedUSDCalculated =
    data.realInvestedUSD !== undefined
      ? data.realInvestedUSD
      : data.totalBits && data.currentPrice
      ? data.totalBits * data.currentPrice
      : 0;

  return (
    <div className={`${styles.container} ${styles.aiContainer} ${styles.fadeIn} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.aiHeader}>
        <div className={styles.aiIcon}>🤖</div>
        <h3 className={styles.aiTitle}>AI-Powered Portfolio Analytics</h3>
        <div className={styles.aiSubtitle}>Advanced insights powered by artificial intelligence</div>
      </div>
      

      <div className={styles.aiGrid}>
        <div className={`${styles.aiRow} ${styles.aiRowWallet}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>👛</span>
            Wallet Address
          </div>
          <div className={styles.aiValue}>
            <a
              href={`https://bscscan.com/address/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.aiWalletLink}
            >
              {shorten(walletAddress)}
              <span className={styles.aiLinkArrow}>→</span>
            </a>
          </div>
        </div>


        <div className={`${styles.aiRow} ${styles.aiRowInvestment}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>💵</span>
            Total Invested (USD)
          </div>
          <div className={`${styles.aiValue} ${styles.aiValueHighlight}`}>
            {formatUSD(totalInvestedUSDCalculated)}
          </div>
        </div>

        <div className={`${styles.aiRow} ${styles.aiRowSolana}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>💵</span>
            Total Invested (SOL)
          </div>
          <div className={styles.aiValue}>
            {formatUSD(data.investedUSDOnSolana)}
          </div>
        </div>

        <div className={`${styles.aiRow} ${styles.aiRowBits}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>💠</span>
            Total BITS Bought
          </div>
          <div className={`${styles.aiValue} ${styles.aiValueBits}`}>
            {formatBITSWithAnimation(data.totalBits)}
          </div>
        </div>

        <div className={`${styles.aiRow} ${styles.aiRowReferral}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>🎯</span>
            Referral Bonus
          </div>
          <div className={`${styles.aiValue} ${styles.aiValueBonus}`}>
            {formatBITSWithAnimation(data.referralBonus)}
            <ReferralBonusClaim onClaimed={() => window.location.reload()} />
          </div>
        </div>

        <div className={`${styles.aiRow} ${styles.aiRowTelegram}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>📢</span>
            Telegram Bonus
          </div>
          <div className={`${styles.aiValue} ${styles.aiValueBonus}`}>
            {formatBITSWithAnimation(data.telegramBonus)}
            <TelegramBonusClaim onClaimed={() => window.location.reload()} />
          </div>
        </div>

        {/* 🎁 AI-Enhanced Additional Bonus Box */}
        {data.totalBits > 0 && (
          <div className={styles.aiAdditionalBonusWrapper}>
            <AdditionalBonusBox
              walletAddress={walletAddress}
              bitsOwned={data.totalBits}
            />
          </div>
        )}

        <div className={`${styles.aiRow} ${styles.aiRowTotal}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>💎</span>
            Total BITS (with Bonuses)
          </div>
          <div className={`${styles.aiValue} ${styles.aiValueTotal}`}>
            {formatBITSWithAnimation(totalBitsIncludingBonuses)}
          </div>
        </div>

        <div className={`${styles.aiRow} ${styles.aiRowValue}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>💵</span>
            Total Investment Value Now
          </div>
          <div className={`${styles.aiValue} ${styles.aiValueHighlight}`}>
            {formatUSD(totalInvestmentValueUSD)}
          </div>
        </div>

        <div className={`${styles.aiRow} ${styles.aiRowTransactions}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>🔁</span>
            Transactions Count
          </div>
          <div className={styles.aiValue}>
            {data.txCount ?? "N/A"}
          </div>
        </div>

        <div className={`${styles.aiRow} ${styles.aiRowLastInvestment}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>🕒</span>
            Last Investment
          </div>
          <div className={styles.aiValue}>
            {data.lastInvestmentDate ? (
              <>
                <div className={styles.aiLastInvestmentDate}>
                  {new Date(data.lastInvestmentDate).toLocaleDateString()} •{" "}
                  {formatUSD(data.lastInvestmentUSD)}
                </div>
                <a
                  href={`https://bscscan.com/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.aiBscScanLink}
                >
                  View on BscScan
                  <span className={styles.aiLinkArrow}>→</span>
                </a>
                <div className={styles.aiLastInvestmentTime}>
                  at{" "}
                  {new Date(data.lastInvestmentDate).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
              </>
            ) : (
              "N/A"
            )}
          </div>
        </div>

        <div className={`${styles.aiRow} ${styles.aiRowPrice}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>📊</span>
            $BITS Average Price
          </div>
          <div className={styles.aiValue}>
            ${data.lastPrice?.toFixed(3) || "0.000"}
          </div>
        </div>

        <div className={`${styles.aiRow} ${styles.aiRowCurrentPrice}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>📈</span>
            $BITS Price Now
          </div>
          <div className={styles.aiValue}>
            ${data.currentPrice?.toFixed(3) || "0.000"}
          </div>
        </div>

        <div className={`${styles.aiRow} ${styles.aiRowROI}`}>
          <div className={styles.aiLabel}>
            <span className={styles.aiLabelIcon}>🚀</span>
            ROI Analysis
          </div>
          <div
            className={`${styles.aiValue} ${styles.aiValueROI} ${
              data.roiPercent >= 0 ? styles.aiPositive : styles.aiNegative
            }`}
          >
            <span
              className={`${styles.aiROIArrow} ${
                data.roiPercent >= 0 ? styles.aiArrowPositive : styles.aiArrowNegative
              }`}
            >
              {data.roiPercent >= 0 ? "↑ +" : "↓ "}
            </span>
            {data.roiPercent?.toFixed(2) ?? "0.00"}%
          </div>
        </div>
      </div>

      {/* AI-Powered Insights Footer */}
      <div className={styles.aiInsightsFooter}>
        <div className={styles.aiInsightIcon}>🧠</div>
        <div className={styles.aiInsightText}>
          AI Analysis: Your portfolio shows {data.roiPercent >= 0 ? 'positive' : 'negative'} performance with {data.txCount || 0} transactions
        </div>
      </div>
    </div>
  );
};

export default BoosterSummary;
