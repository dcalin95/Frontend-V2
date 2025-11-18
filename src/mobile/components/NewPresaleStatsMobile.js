import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { CONTRACTS } from '../../contract/contracts';
import Icon from '../../assets/icons/Icon';
import '../Mobile.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

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

const NewPresaleStatsMobile = ({ sold, supply, price, roundNumber }) => {
  const [previousRoundData, setPreviousRoundData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roundWallets, setRoundWallets] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [tgTotalCount, setTgTotalCount] = useState(0);
  const [currentRoundFromHistory, setCurrentRoundFromHistory] = useState(null);

  const safeSold = Math.max(0, sold || 0);
  const safeSupply = Math.max(0, supply || 0);
  const remainingTokens = safeSupply;
  
  const priceFromProp = Number(price || 0);
  const normalizedPropPrice = priceFromProp > 1 ? (priceFromProp / 100) : priceFromProp;

  const soldInUse = Math.max(0, Number(currentRoundFromHistory?.soldBits ?? safeSold) || 0);
  const priceInUse = Number(currentRoundFromHistory?.price || 0) > 0
    ? Number(currentRoundFromHistory.price)
    : normalizedPropPrice;

  const currentRoundPercentage = (soldInUse + safeSupply) > 0 ? ((soldInUse / (soldInUse + safeSupply)) * 100) : 0;
  
  const TOTAL_PRESALE_SUPPLY = 1050000000;
  
  const safePreviousTotal = previousRoundData?.totalSoldFromAllPreviousRounds || 0;
  const totalPresaleSold = (safePreviousTotal && !isNaN(safePreviousTotal)) ? safePreviousTotal + soldInUse : soldInUse;
  const totalPresalePercentage = TOTAL_PRESALE_SUPPLY > 0 ? ((totalPresaleSold / TOTAL_PRESALE_SUPPLY) * 100) : 0;

  useEffect(() => {
    const fetchAllRoundsData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/presale/history`);
        const history = response.data || [];
        
        let totalSoldFromPreviousRounds = 0;
        history.forEach(round => {
          if (round.round < roundNumber) {
            totalSoldFromPreviousRounds += Math.round(round.sold_bits);
          }
        });
        
        const currentRound = history.find(round => round.round === roundNumber);
        if (currentRound) {
          setCurrentRoundFromHistory({
            round: currentRound.round,
            raisedUSD: Number(currentRound.raised_usd || 0),
            soldBits: Math.round(currentRound.sold_bits || 0),
            price: Number(currentRound.price || 0)
          });
        }

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

  useEffect(() => {
    const fetchSimulatedHolders = async () => {
      try {
        const resTx = await axios.get(`${API_URL}/api/transactions`);
        const txs = Array.isArray(resTx.data) ? resTx.data : [];
        const txBuyCount = txs.filter((t) => (t?.type || '').toLowerCase() === 'buy_bits').length || txs.length;
        setTxCount(txBuyCount);

        const resTg = await axios.get(`${API_URL}/api/telegram-rewards/group-members`);
        const linked = Number(resTg?.data?.linked || 0);
        let totalMembers = Number(resTg?.data?.total || 0);

        try {
          const resLive = await axios.get(`${API_URL}/api/telegram-rewards/group-live`);
          if (resLive?.data?.member_count) {
            totalMembers = Number(resLive.data.member_count);
          }
        } catch (_) {}
        
        setTgTotalCount(totalMembers);

        const BASE_WALLETS = 12001;
        const source = Math.max(linked, txBuyCount) || 0;
        setRoundWallets(BASE_WALLETS + source);
      } catch (e) {
        console.error("Error fetching holders:", e);
      }
    };
    fetchSimulatedHolders();
  }, []);

  const prevRoundPriceUSD = useMemo(() => {
    try {
      const u = Number(previousRoundData?.raisedUSD || 0);
      const b = Number(previousRoundData?.soldBits || 0);
      if (u > 0 && b > 0) return u / b;
      return null;
    } catch (_) { return null; }
  }, [previousRoundData]);

  const formatUsd = (v) => {
    const n = Number(v || 0);
    if (n === 0) return "$0.00";
    return n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="mobile-presale-stats">
        <Icon name="loading" size="large" animate="spin" />
        <p>Loading stats...</p>
      </div>
    );
  }

  return (
    <div className="mobile-presale-stats">
      <div className="mobile-stats-header">
        <Icon name="chart" size="medium" animate="pulse" />
        <h3>Round {roundNumber} Stats</h3>
      </div>

      <div className="mobile-stats-info">
        <Icon name="info" size="small" />
        <p>Live presale updates - Join Telegram & invite friends for $BITS rewards!</p>
      </div>

      <div className="mobile-stats-grid">
        <div className="mobile-stat-card">
          <div className="mobile-stat-icon">
            <Icon name="chart" size="medium" />
          </div>
          <div className="mobile-stat-label">Round {roundNumber}</div>
          <div className="mobile-stat-value">{currentRoundPercentage.toFixed(2)}%</div>
        </div>

        <div className="mobile-stat-card">
          <div className="mobile-stat-icon">
            <Icon name="crypto" size="medium" />
          </div>
          <div className="mobile-stat-label">$BITS Sold</div>
          <div className="mobile-stat-value">
            <AnimatedNumber value={soldInUse} compact suffix=" $BITS" />
          </div>
        </div>

        <div className="mobile-stat-card">
          <div className="mobile-stat-icon">
            <Icon name="target" size="medium" />
          </div>
          <div className="mobile-stat-label">Available</div>
          <div className="mobile-stat-value">
            <AnimatedNumber value={remainingTokens} compact={false} decimals={0} suffix=" $BITS" />
          </div>
        </div>

        <div className="mobile-stat-card">
          <div className="mobile-stat-icon">
            <Icon name="trophy" size="medium" />
          </div>
          <div className="mobile-stat-label">Raised</div>
          <div className="mobile-stat-value">
            <AnimatedNumber value={(() => {
              const base = Number(currentRoundFromHistory?.raisedUSD || ((Number(soldInUse)||0) * (Number(priceInUse)||0)));
              if (soldInUse >= 1000 && base < 1000) return base * 1000;
              return base;
            })()} prefix="$" compact decimals={2} />
          </div>
        </div>

        <div className="mobile-stat-card">
          <div className="mobile-stat-icon">
            <Icon name="users" size="medium" />
          </div>
          <div className="mobile-stat-label">Telegram Users</div>
          <div className="mobile-stat-value">
            <AnimatedNumber value={roundWallets || 12001} />
          </div>
        </div>

        <div className="mobile-stat-card">
          <div className="mobile-stat-icon">
            <Icon name="receipt" size="medium" />
          </div>
          <div className="mobile-stat-label">Transactions</div>
          <div className="mobile-stat-value">
            <AnimatedNumber value={txCount} decimals={0} />
          </div>
        </div>

        <div className="mobile-stat-card">
          <div className="mobile-stat-icon">
            <Icon name="group" size="medium" />
          </div>
          <div className="mobile-stat-label">TG Members</div>
          <div className="mobile-stat-value">
            <AnimatedNumber value={tgTotalCount || 0} />
          </div>
        </div>

        <div className="mobile-stat-card">
          <div className="mobile-stat-icon">
            <Icon name="price-tag" size="medium" />
          </div>
          <div className="mobile-stat-label">Prev Price</div>
          <div className="mobile-stat-value">
            {prevRoundPriceUSD != null ? formatUsd(prevRoundPriceUSD) : '—'}
          </div>
        </div>
      </div>

      <div className="mobile-global-progress">
        <div className="mobile-progress-label">Global Presale Progress</div>
        <div className="mobile-progress-bar-container">
          <div 
            className="mobile-progress-bar-fill"
            style={{ width: `${totalPresalePercentage}%` }}
          />
          <div className="mobile-progress-arrow" style={{ left: `calc(${totalPresalePercentage}% - 10px)` }} />
        </div>
        <div className="mobile-progress-text">
          <span>{totalPresalePercentage.toFixed(2)}%</span>
          <span>
            <AnimatedNumber value={totalPresaleSold} compact /> of 1,050M $BITS
          </span>
        </div>
      </div>
    </div>
  );
};

export default NewPresaleStatsMobile;

