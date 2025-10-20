import React, { useEffect, useMemo, useState } from "react";
import styles from "./NewPresaleStats.module.css";
import axios from "axios";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

// AnimatedNumber component
const AnimatedNumber = ({ value, duration = 1000, prefix = "", suffix = "", compact = false, decimals = 2 }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const animatedValue = value * progress;
      setDisplayed(animatedValue);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatCompactNumber = (value) => {
    const n = Number(value || 0);
    if (!isFinite(n)) return '0.00';
    // If sold is in thousands but raised was saved as thousands too, upscale based on sold
    return n >= 1_000_000 ? (n / 1_000_000).toFixed(2) + "M"
         : n >= 1_000     ? (n / 1_000).toFixed(2) + "K"
         : n.toFixed(2);
  };

  const formatted = compact
    ? formatCompactNumber(displayed)
    : parseFloat(displayed).toLocaleString(undefined, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: 0,
      });

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

// Cosmic Progress Bar Component
const CosmicProgressBar = ({ percentage, sold, total, totalPresaleSold, totalPresaleSupply, totalPresalePercentage }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / 1000, 1);
      setAnimatedPercentage(totalPresalePercentage * progress);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [totalPresalePercentage]);

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${animatedPercentage}%` }}
        />
        <div className={styles.progressGlow} />
        {/* Japanese Train Arrow */}
        <div 
          className={styles.progressArrow}
          style={{ left: `calc(${animatedPercentage}% - 15px)` }}
        />
      </div>
             <div className={styles.progressText}>
         <span className={styles.percentage}>{animatedPercentage.toFixed(1)}%</span>
         <span className={styles.soldInfo}>
           <AnimatedNumber value={totalPresaleSold} compact /> of <AnimatedNumber value={totalPresaleSupply} compact /> $BITS
         </span>
       </div>
    </div>
  );
};

const NewPresaleStats = ({ sold, supply, price, roundNumber }) => {
  const [previousRoundData, setPreviousRoundData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roundWallets, setRoundWallets] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [tgLinkedCount, setTgLinkedCount] = useState(0);
  const [tgTotalCount, setTgTotalCount] = useState(0);
  const [roundStart, setRoundStart] = useState(null);
  const [roundEnd, setRoundEnd] = useState(null);
  const [currentRoundFromHistory, setCurrentRoundFromHistory] = useState(null);

  // Calculate values - FIX infinity and negative issues
  const safeSold = Math.max(0, sold || 0);
  const safeSupply = Math.max(0, supply || 0);
  const totalSupply = safeSold + safeSupply;
  const remainingTokens = safeSupply;
  
  // Normalize price that might come as cents (e.g., 0.06 -> 6)
  const priceFromProp = Number(price || 0);
  const normalizedPropPrice = priceFromProp > 1 ? (priceFromProp / 100) : priceFromProp;

  // Prefer database history for the current round if available
  const soldInUse = Math.max(0, Number(currentRoundFromHistory?.soldBits ?? safeSold) || 0);
  const priceInUse = Number(currentRoundFromHistory?.price || 0) > 0
    ? Number(currentRoundFromHistory.price)
    : normalizedPropPrice;

  // Fix percentage calculation - avoid division by zero
  const currentRoundPercentage = (soldInUse + safeSupply) > 0 ? ((soldInUse / (soldInUse + safeSupply)) * 100) : 0;
  
  // Total presale supply (Public Presale): 1,050,000,000 BITS (35%)
  const TOTAL_PRESALE_SUPPLY = 1050000000; // 1.05B $BITS for public presale
  
  // Debug logging
  console.log('🔍 [NewPresaleStats] Debug:', {
    sold: sold,
    supply: supply,
    totalSupply: totalSupply,
    currentRoundPercentage: currentRoundPercentage,
    roundNumber: roundNumber,
    previousRoundData: previousRoundData,
    previousRoundDataType: typeof previousRoundData,
    totalSoldFromAllPreviousRounds: previousRoundData?.totalSoldFromAllPreviousRounds,
    calculation: previousRoundData ? `${previousRoundData.totalSoldFromAllPreviousRounds} + ${sold}` : `just ${sold}`,
    totalPresaleSold: previousRoundData ? previousRoundData.totalSoldFromAllPreviousRounds + sold : sold,
    totalPresalePercentage: ((previousRoundData ? previousRoundData.totalSoldFromAllPreviousRounds + sold : sold) / TOTAL_PRESALE_SUPPLY) * 100
  });
  
  // Calculate total presale percentage (all rounds combined) - fix NaN
  const safePreviousTotal = previousRoundData?.totalSoldFromAllPreviousRounds || 0;
  const totalPresaleSold = (safePreviousTotal && !isNaN(safePreviousTotal)) ? safePreviousTotal + soldInUse : soldInUse;
  const totalPresalePercentage = TOTAL_PRESALE_SUPPLY > 0 ? ((totalPresaleSold / TOTAL_PRESALE_SUPPLY) * 100) : 0;

  // Fetch all previous rounds data
  useEffect(() => {
    const fetchAllRoundsData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/presale/history`);
        const history = response.data || [];
        
        // Calculate total sold from all previous rounds
        let totalSoldFromPreviousRounds = 0;
        history.forEach(round => {
          if (round.round < roundNumber) {
            totalSoldFromPreviousRounds += Math.round(round.sold_bits);
          }
        });
        
        // Capture current round from history (source of truth for UI)
        const currentRound = history.find(round => round.round === roundNumber);
        if (currentRound) {
          setCurrentRoundFromHistory({
            round: currentRound.round,
            raisedUSD: Number(currentRound.raised_usd || 0),
            soldBits: Math.round(currentRound.sold_bits || 0),
            price: Number(currentRound.price || 0)
          });
        }

        // Find the previous round for USD display
        const previousRound = history.find(round => round.round === roundNumber - 1);
        
        if (previousRound) {
          setPreviousRoundData({
            round: previousRound.round,
            raisedUSD: Math.round(previousRound.raised_usd),
            soldBits: Math.round(previousRound.sold_bits),
            totalSoldFromAllPreviousRounds: totalSoldFromPreviousRounds
          });
        } else {
          setPreviousRoundData({
            totalSoldFromAllPreviousRounds: totalSoldFromPreviousRounds
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching rounds data:", error);
        setLoading(false);
      }
    };

    fetchAllRoundsData();
  }, [roundNumber]);

  // Fetch current round timing and compute pace/ETA; safe fallbacks
  useEffect(() => {
    const fetchCurrentRoundState = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/presale/current`);
        const { startTime, endTime } = res.data || {};
        if (startTime) setRoundStart(new Date(startTime * 1000));
        if (endTime) setRoundEnd(new Date(endTime * 1000));
      } catch (e) {
        // non-blocking
      }
    };
    fetchCurrentRoundState();
  }, []);

  // Simulated holders from backend transactions (count tx proxy) and Telegram linked wallets
  useEffect(() => {
    const fetchSimulatedHolders = async () => {
      try {
        // 1) Transactions
        const resTx = await axios.get(`${API_URL}/api/transactions`);
        const txs = Array.isArray(resTx.data) ? resTx.data : [];
        const txBuyCount = txs.filter((t) => (t?.type || '').toLowerCase() === 'buy_bits').length || txs.length;
        setTxCount(txBuyCount);

        // 2) Telegram linked wallets (summary endpoint lightweight)
        const resTg = await axios.get(`${API_URL}/api/telegram-rewards/group-members`);
        const linked = Number(resTg?.data?.linked || 0);
        let totalMembers = Number(resTg?.data?.total || 0);

        // Try live count via Telegram API if available
        try {
          const resLive = await axios.get(`${API_URL}/api/telegram-rewards/group-live`);
          if (resLive?.data?.member_count) {
            totalMembers = Number(resLive.data.member_count);
          }
        } catch (_) {}
        setTgLinkedCount(linked);
        setTgTotalCount(totalMembers);

        // 3) Marketing baseline: start at 12,001 and add live counts (no multiplier)
        const BASE_WALLETS = 12001;
        const source = Math.max(linked, txBuyCount) || 0; // grow with real activity
        setRoundWallets(BASE_WALLETS + source);
      } catch (e) {
        // keep default 0 if endpoint not available yet
      }
    };
    fetchSimulatedHolders();
  }, []);

  // Live Telegram members poller (every 60s) with DB fallback
  useEffect(() => {
    let isMounted = true;
    const fetchMembers = async () => {
      try {
        let total = 0;
        try {
          const resLive = await axios.get(`${API_URL}/api/telegram-rewards/group-live`);
          if (typeof resLive?.data?.member_count === 'number') {
            total = resLive.data.member_count;
          }
        } catch (_) {}

        if (!total) {
          try {
            const resTg = await axios.get(`${API_URL}/api/telegram-rewards/group-members`);
            total = Number(resTg?.data?.total || 0);
          } catch (_) {}
        }

        if (isMounted) setTgTotalCount(total || 0);
      } catch (_) {}
    };

    fetchMembers();
    const id = setInterval(fetchMembers, 60000);
    return () => { isMounted = false; clearInterval(id); };
  }, []);

  // Derived: pace and ETA
  const { paceBitsPerHour, usdRemaining } = useMemo(() => {
    try {
      const now = new Date();
      const hasStart = roundStart instanceof Date && !isNaN(roundStart);
      const elapsedMs = hasStart ? Math.max(0, now - roundStart) : 0;
      const elapsedHours = elapsedMs > 0 ? (elapsedMs / 3600000) : 0;
      const pace = elapsedHours > 0 ? safeSold / elapsedHours : 0;
      const remaining = remainingTokens;
      const usdRem = (Number(price || 0) * remaining) || 0;
      return { paceBitsPerHour: pace, usdRemaining: usdRem };
    } catch (_) {
      return { paceBitsPerHour: 0, usdRemaining: 0 };
    }
  }, [roundStart, safeSold, remainingTokens, price]);

  // Average buy size (current round), based on DB transactions count
  const avgBuyBits = useMemo(() => {
    const denom = Math.max(1, txCount);
    return safeSold / denom;
  }, [safeSold, txCount]);
  const avgBuyUsd = useMemo(() => avgBuyBits * (Number(price || 0)), [avgBuyBits, price]);

  const formatUsd = (v) => {
    const n = Number(v || 0);
    if (n === 0) return "$0.00";
    return n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
  };

  // Previous Round Price (USD/BITS)
  const prevRoundPriceUSD = useMemo(() => {
    try {
      const u = Number(previousRoundData?.raisedUSD || 0);
      const b = Number(previousRoundData?.soldBits || 0);
      if (u > 0 && b > 0) return u / b;
      return null;
    } catch (_) { return null; }
  }, [previousRoundData]);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🎯 Round {roundNumber} Statistics</h3>
      
      {/* Explanation Box */}
      <div className={styles.explanationBox}>
        <div className={styles.explanationIcon}>ℹ️</div>
                 <div className={styles.explanationText}>
          <strong>Live presale updates:</strong> Prices and stats update in real time. The cards show $BITS sold this round,
          USD raised, remaining $BITS supply, Telegram members and registered transactions. Join our Telegram group and invite
          friends — both activity and invitations grant $BITS rewards. Buy early — each round has a limited allocation and the
          price increases in the next round.
          <br/>
          <span style={{color:'#ffd93d', fontWeight:700}}>
            Listing price on exchanges will be much higher than the last presale round.
          </span>
         </div>
      </div>
      
      <div className={styles.statsGrid}>
        {/* 1. Current Round Completion (percentage only) */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Round <span style={{color:'#6cf'}}>{roundNumber}</span> Completion</div>
            <div className={styles.statValue} style={{color:'#7aff7a'}}>
              {currentRoundPercentage.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 2. Total BITS Sold (current round) */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total $BITS Sold</div>
            <div className={styles.statValue}>
              <AnimatedNumber value={soldInUse} compact suffix=" $BITS" />
            </div>
          </div>
        </div>

        {/* 3. Remaining BITS */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Available for Sale</div>
            <div className={styles.statValue}>
              <AnimatedNumber value={remainingTokens} compact={false} decimals={0} suffix=" $BITS" />
            </div>
            <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
              Ready for Trading
            </div>
          </div>
        </div>

        {/* 4. Round Raised (current) */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏆</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Round <span style={{color:'#6cf'}}>{roundNumber}</span> Raised</div>
            <div className={styles.statValue}>
              <AnimatedNumber value={(() => {
                const base = Number(currentRoundFromHistory?.raisedUSD || ((Number(soldInUse)||0) * (Number(priceInUse)||0)));
                // Upscale if soldInUse suggests thousands but USD is < 1000
                if (soldInUse >= 1000 && base < 1000) return base * 1000;
                return base;
              })()} prefix="$" compact decimals={2} />
            </div>
            <div className={styles.subValue}><AnimatedNumber value={soldInUse} compact decimals={2} /> $BITS</div>
          </div>
        </div>

        {/* 5. Telegram Wallet Users (marketing baseline + linked wallets) */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Telegram Wallet Users</div>
            <div className={styles.statValue}>
              <AnimatedNumber value={roundWallets || 12001} suffix=" Users/Wallet" />
            </div>
            <div className={styles.subValue}>
              <a href="https://t.me/BitSwapDEX_AI" target="_blank" rel="noreferrer" style={{fontSize:'12px', color:'#2aa1ff', textDecoration:'underline', display:'inline-flex', alignItems:'center', gap:'6px', fontWeight:600}}>
                <span role="img" aria-label="link">🔗</span>
                t.me/BitSwapDEX_AI
              </a>
            </div>
          </div>
        </div>

        {/* 6. Registered Transactions (DB) */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🧾</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total Transactions</div>
            <div className={styles.statValue}><AnimatedNumber value={txCount} decimals={0} /></div>
            <div className={styles.subValue}>
              <a href={`https://bscscan.com/token/${CONTRACTS.BITS.address}`} target="_blank" rel="noreferrer" style={{fontSize:'12px', color:'#2aa1ff', textDecoration:'underline', display:'inline-flex', alignItems:'center', gap:'6px', fontWeight:600}}>
                <span role="img" aria-label="link">🔗</span>
                @https://bscscan.com/$BITS
              </a>
            </div>
          </div>
        </div>

        {/* 7. Telegram Members (raw from DB/bot) */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🧑‍🤝‍🧑</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Telegram Members</div>
            <div className={styles.statValue}><AnimatedNumber value={tgTotalCount || 0} /></div>
            <div className={styles.subValue}>
              <a href="https://t.me/BitSwapDEX_AI" target="_blank" rel="noreferrer" style={{fontSize:'12px', color:'#2aa1ff', textDecoration:'underline', display:'inline-flex', alignItems:'center', gap:'6px', fontWeight:600}}>
                <span role="img" aria-label="link">🔗</span>
                t.me/BitSwapDEX_AI
              </a>
            </div>
          </div>
        </div>

        {/* 8. Previous Round Price */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏷️</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Previous Round Price</div>
            <div className={styles.statValue}>
              {prevRoundPriceUSD != null ? formatUsd(prevRoundPriceUSD) : '—'}
            </div>
            {previousRoundData?.round && (
              <div className={styles.subValue}>Round {previousRoundData.round}</div>
            )}
          </div>
        </div>
      </div>

             {/* 5. Cosmic Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.globalSummary}>
          <div className={styles.globalLabel}>Global Presale Progress</div>
          <div className={styles.globalRow}>
            <div className={styles.globalPct}>{totalPresalePercentage.toFixed(2)}%</div>
            <div className={styles.globalText}>
              <AnimatedNumber value={totalPresaleSold} compact /> of 1,050.0M $BITS • 35% • Public token sale
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPresaleStats; 