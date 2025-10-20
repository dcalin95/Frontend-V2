import React from 'react';
import styles from './RoundEndDisplay.module.css';

const RoundEndDisplay = ({ roundData, onStartNewRound }) => {
  const {
    roundNumber,
    totalSold,
    totalRaised,
    duration,
    startTime,
    endTime,
    averagePrice,
    participantCount,
    topSale
  } = roundData;

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    return `${days} days, ${hours} hours`;
  };

  return (
    <div className={styles.roundEndContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎉 Round {roundNumber} Complete!</h1>
        <p className={styles.subtitle}>
          Congratulations! Round {roundNumber} has successfully concluded after {formatDuration(duration)}.
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statValue}>${totalRaised.toLocaleString()}</div>
          <div className={styles.statLabel}>Total Raised</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🪙</div>
          <div className={styles.statValue}>{totalSold.toLocaleString()}</div>
          <div className={styles.statLabel}>BITS Sold</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statValue}>{participantCount}</div>
          <div className={styles.statLabel}>Participants</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statValue}>${averagePrice.toFixed(6)}</div>
          <div className={styles.statLabel}>Average Price</div>
        </div>
      </div>

      <div className={styles.timeline}>
        <h3 className={styles.timelineTitle}>📅 Round Timeline</h3>
        <div className={styles.timelineItem}>
          <span className={styles.timelineLabel}>Started:</span>
          <span className={styles.timelineValue}>{formatDate(startTime)}</span>
        </div>
        <div className={styles.timelineItem}>
          <span className={styles.timelineLabel}>Ended:</span>
          <span className={styles.timelineValue}>{formatDate(endTime)}</span>
        </div>
        <div className={styles.timelineItem}>
          <span className={styles.timelineLabel}>Duration:</span>
          <span className={styles.timelineValue}>{formatDuration(duration)}</span>
        </div>
      </div>

      {topSale && (
        <div className={styles.highlight}>
          <h3 className={styles.highlightTitle}>🏆 Largest Single Purchase</h3>
          <p className={styles.highlightText}>
            {topSale.amount.toLocaleString()} BITS for ${topSale.value.toLocaleString()}
          </p>
        </div>
      )}

      <div className={styles.message}>
        <h3 className={styles.messageTitle}>🚀 What's Next?</h3>
        <p className={styles.messageText}>
          Round {roundNumber} has concluded successfully! To continue the presale:
        </p>
        <ol className={styles.instructions}>
          <li>Configure a new cell in the CellManager smart contract</li>
          <li>Set the new round parameters (price, supply)</li>
          <li>Use the AdminPanel to start Round {roundNumber + 1}</li>
        </ol>
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.newRoundButton}
          onClick={onStartNewRound}
        >
          🎯 Start Round {roundNumber + 1}
        </button>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          Thank you to all {participantCount} participants who made Round {roundNumber} a success! 
          The next round will begin once the new parameters are configured.
        </p>
      </div>
    </div>
  );
};

export default RoundEndDisplay;



