import React, { useState, useEffect, useContext } from "react";
import WalletContext from "../context/WalletContext";
import unifiedRewardsService from "../services/unifiedRewardsService";
import { ethers } from "ethers";
import { CONTRACT_MAP as CONTRACTS } from "../contract/contractMap";
import { toBitsInteger, formatBITS, logBITSConversion } from "../utils/bitsUtils";
import "./RewardsHub.css";

const RewardsHub = () => {
  const { signer, walletAddress } = useContext(WalletContext);
  const [rewards, setRewards] = useState({
    totalPending: 0,
    totalClaimed: 0,
    pendingRewards: [],
    loading: true,
    error: null
  });
  const [additionalBonus, setAdditionalBonus] = useState({
    claimable: 0,
    invested: 0,
    rate: '0%',
    loading: true,
    onChainClaimable: 0
  });
  const [claiming, setClaiming] = useState(false);
  const [claimingAdditional, setClaimingAdditional] = useState(false);
  const [stakingAdditional, setStakingAdditional] = useState(false);
  const [staking, setStaking] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [activeTab, setActiveTab] = useState('summary');
  const [showModal, setShowModal] = useState(false);
  const [modalPayload, setModalPayload] = useState(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

  const formatUSD = (v) => {
    const n = Number(v || 0);
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Inline SVGs (same neon accent as sidebar)
  const Icon = ({ name }) => {
    switch (name) {
      case 'telegram':
        return (<svg className="icon-inline" viewBox="0 0 24 24" fill="#00aaff"><path d="M2 12L22 3l-5 18-6-6-5 3 16-13-18 7z"/></svg>);
      case 'wallet':
        return (<svg className="icon-inline" viewBox="0 0 24 24" fill="#00ffc3"><path d="M3 7h16a2 2 0 012 2v6a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2zm0 2v6h16V9H3zm12 3a1 1 0 100 2 1 1 0 000-2z"/></svg>);
      case 'stake':
        return (<svg className="icon-inline" viewBox="0 0 24 24" fill="#00ffc3"><path d="M6 14v6h2v-6H6zm5-4v10h2V10h-2zm5-6v16h2V4h-2z"/></svg>);
      case 'usd':
        return (<svg className="icon-inline" viewBox="0 0 24 24" stroke="#00ffc3" fill="none" strokeWidth="2"><path d="M12 2v20M8 7c0-2 8-2 8 0s-8 2-8 4 8 2 8 4-8 2-8 0"/></svg>);
      case 'calendar':
        return (<svg className="icon-inline" viewBox="0 0 24 24" stroke="#00aaff" fill="none" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>);
      case 'tx':
        return (<svg className="icon-inline" viewBox="0 0 24 24" stroke="#00aaff" fill="none" strokeWidth="2"><path d="M10 13a5 5 0 017-7l2 2M14 11a5 5 0 01-7 7l-2-2"/></svg>);
      default:
        return null;
    }
  };

  // Load rewards data
  useEffect(() => {
    if (walletAddress) {
      loadRewards();
      loadAdditionalBonus();
    }
  }, [walletAddress]);

  const loadAdditionalBonus = async () => {
    try {
      console.log("🔄 [RewardsHub] Loading Additional Bonus data...");
      setAdditionalBonus(prev => ({ ...prev, loading: true }));

      const rpcUrl = "https://bsc-dataseed1.binance.org";
      const roProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const additionalRewardRO = new ethers.Contract(CONTRACTS.ADDITIONAL_REWARD.address, CONTRACTS.ADDITIONAL_REWARD.abi, roProvider);
      const nodeRO = new ethers.Contract(CONTRACTS.NODE.address, CONTRACTS.NODE.abi, roProvider);

      // Obțin investițiile din Node.sol (usdAmount este index 1 în struct)
      const purchases = await nodeRO.getUserPurchases(walletAddress);
      let totalUSD = 0;
      if (purchases && purchases.length > 0) {
        const sumUsdBN = purchases.reduce((acc, purchase) => {
          // struct PurchaseRecord { timestamp, usdAmount(1e18), bitsAmount, paymentToken, paymentSource }
          const usdAmountBN = ethers.BigNumber.from(purchase[1] || 0);
          return acc.add(usdAmountBN);
        }, ethers.BigNumber.from(0));
        totalUSD = parseFloat(ethers.utils.formatUnits(sumUsdBN, 18));
      }

      // Obțin claimable reward din AdditionalReward.sol
      const claimableReward = await additionalRewardRO.calculateClaimableReward(walletAddress);
      let claimableBITSFloat = parseFloat(ethers.utils.formatUnits(claimableReward, 18));
      let claimableBITS = toBitsInteger(claimableBITSFloat); // Convert to integer for node.sol

      // Dacă nu e claimable din contract, calculez estimativ
      let rate = "0%";
      if (claimableBITS === 0 && totalUSD > 0) {
        // Aliniază la pragurile din AdditionalReward.sol (100, 250, 500, 1000 USD)
        let estimatedRate = 0;
        if (totalUSD >= 1000) estimatedRate = 10;
        else if (totalUSD >= 500) estimatedRate = 7;
        else if (totalUSD >= 250) estimatedRate = 5;
        else if (totalUSD >= 100) estimatedRate = 3;
        
        if (estimatedRate > 0) {
          rate = `${estimatedRate}%`;
          const bonusUSD = (totalUSD * estimatedRate) / 100;
          claimableBITS = bonusUSD; // Presupun $1 per BITS
        }
      }

      setAdditionalBonus({
        claimable: claimableBITS,
        invested: totalUSD,
        rate: rate,
        loading: false,
        onChainClaimable: Math.max(0, claimableBITSFloat)
      });

      console.log("✅ [RewardsHub] Additional Bonus loaded:", {
        claimable: claimableBITS,
        invested: totalUSD,
        rate: rate
      });

    } catch (error) {
      console.error("❌ [RewardsHub] Error loading additional bonus:", error);
      setAdditionalBonus(prev => ({ ...prev, loading: false }));
    }
  };

  const loadRewards = async () => {
    try {
      console.log("🔄 RewardsHub: Loading rewards for wallet:", walletAddress);
      setRewards(prev => ({ ...prev, loading: true }));
      
      // Get unified rewards
      const unifiedData = await unifiedRewardsService.getRewardsSummary(walletAddress);
      console.log("📋 RewardsHub: Unified rewards data:", unifiedData);
      
      // Get Telegram rewards separately
      let telegramRewards = { pending: 0, claimed: 0 };
      try {
        const telegramResponse = await fetch(`https://backend-server-f82y.onrender.com/api/telegram-rewards/reward/${walletAddress}`);
        if (telegramResponse.ok) {
          const telegramData = await telegramResponse.json();
          console.log("💬 RewardsHub: Telegram rewards data:", telegramData);
          telegramRewards = {
            pending: telegramData.eligible && telegramData.reward > 0 ? telegramData.reward : 0,
            claimed: 0, // Telegram rewards are always pending until claimed
            timeSpent: telegramData.time_spent_hours || 0,
            messages: telegramData.messages_total || 0
          };
        }
      } catch (telegramError) {
        console.warn("⚠️ RewardsHub: Could not fetch Telegram rewards:", telegramError);
      }
      
      // Get Invite/Referral code info
      let inviteRewards = { pending: 0, claimed: 0, hasCode: false };
      try {
        const inviteResponse = await fetch(`https://backend-server-f82y.onrender.com/api/invite/check-code/${walletAddress}`);
        if (inviteResponse.ok) {
          const inviteData = await inviteResponse.json();
          console.log("👥 RewardsHub: Invite data:", inviteData);
          inviteRewards = {
            pending: 0, // Invite rewards come from purchases, not having a code
            claimed: 0,
            hasCode: inviteData.hasCode || false,
            code: inviteData.code || null
          };
        }
      } catch (inviteError) {
        console.warn("⚠️ RewardsHub: Could not fetch invite data:", inviteError);
      }
      
      // Combine all rewards
      const totalPending = (unifiedData.totalPending || 0) + telegramRewards.pending;
      const totalClaimed = (unifiedData.totalClaimed || 0) + telegramRewards.claimed;
      
      // Create combined pending rewards list
      const pendingRewards = [...(unifiedData.pendingRewards || [])];
      if (telegramRewards.pending > 0) {
        pendingRewards.push({
          id: 'telegram-activity',
          reward_type: 'telegram',
          amount: telegramRewards.pending,
          created_at: new Date().toISOString(),
          description: `Telegram Activity: ${telegramRewards.timeSpent}h, ${telegramRewards.messages} messages`
        });
      }
      
      console.log("✅ RewardsHub: Combined rewards calculated:", {
        totalPending,
        totalClaimed,
        pendingCount: pendingRewards.length
      });
      
      setRewards({
        wallet: walletAddress,
        totalPending,
        totalClaimed,
        pendingRewards,
        telegram: telegramRewards,
        invite: inviteRewards,
        unified: unifiedData,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("❌ RewardsHub: Error loading rewards:", error);
      setRewards(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Claim rewards to wallet
  const handleClaimToWallet = async () => {
    // 1) Dacă există Telegram pending, facem credit on-chain apoi claim din contract cu user signer
    try {
      const pendingTelegram = rewards.telegram?.pending || 0;
      if (pendingTelegram > 0) {
        try {
          setStatusMsg("🔄 Crediting Telegram reward on-chain...");
          console.log("[RewardsHub] credit-bits →", {
            url: `${BACKEND_URL}/api/telegram-rewards/credit-bits`,
            wallet: walletAddress,
            bits: pendingTelegram
          });
          const res = await fetch(`${BACKEND_URL}/api/telegram-rewards/credit-bits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: walletAddress, bits: pendingTelegram })
          });
          const rawText = await res.text().catch(() => "");
          let json;
          try { json = rawText ? JSON.parse(rawText) : {}; } catch (_) { json = { rawText }; }
          console.log("[RewardsHub] credit-bits ←", res.status, json);
          if (!res.ok) throw new Error(json?.error || rawText || `HTTP ${res.status}`);
        } catch (creditErr) {
          setStatusMsg(`❌ Credit failed: ${creditErr.message}`);
          console.error("[RewardsHub] Credit error", creditErr);
          return;
        }

        if (!signer) {
          setStatusMsg("❌ Connect wallet first to sign the claim");
          return;
        }

        try {
          setStatusMsg("⏳ Claiming from TelegramReward contract...");
          const telegramContract = new ethers.Contract(
            CONTRACTS.TELEGRAM_REWARD.address,
            CONTRACTS.TELEGRAM_REWARD.abi,
            signer
          );
          const signerAddr = await signer.getAddress();
          console.log("[RewardsHub] claimAll() with signer", signerAddr, "contract", CONTRACTS.TELEGRAM_REWARD.address);
          const tx = await telegramContract.claimAll();
          await tx.wait();
          setStatusMsg(`✅ Claimed Telegram rewards. Tx: ${tx.hash.slice(0, 10)}…`);
          console.log("[RewardsHub] claimAll confirmed", tx.hash);
          setModalPayload({
            title: 'Telegram Claim Successful',
            lines: [
              `Amount: ${toBitsInteger(pendingTelegram)} $BITS`,
              `USD (approx): ${formatUSD((rewards?.unified?.price||1)/1000 * pendingTelegram)}`,
              `Tx: ${tx.hash}`,
              `How it works: Your Telegram activity (time + messages) unlocks bundles of rewards. Credit happens on-chain, then you can claim or stake.`
            ],
            tx: tx.hash
          });
          setShowModal(true);

          // Notify backend to sync DB counters
          try {
            await fetch(`${BACKEND_URL}/api/telegram-rewards/mark-claimed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ wallet: walletAddress, amountBits: pendingTelegram, txHash: tx.hash })
            });
            console.log("[RewardsHub] mark-claimed sent");
          } catch (e) {
            console.warn("[RewardsHub] mark-claimed failed", e);
          }
        } catch (claimErr) {
          setStatusMsg(`❌ On-chain claim failed: ${claimErr.message}`);
          console.error("[RewardsHub] Claim error", claimErr);
          return;
        }
      }

      // 2) Refresh UI
      await loadRewards();
    } catch (error) {
      console.error("❌ Claim failed:", error);
      setStatusMsg(`❌ Claim failed: ${error.message}`);
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimAdditionalBonus = async () => {
    if (!signer || additionalBonus.claimable <= 0) return;

    setClaimingAdditional(true);
    setStatusMsg("🔄 Claiming Additional Bonus...");

    try {
      if (!additionalBonus.onChainClaimable || additionalBonus.onChainClaimable <= 0) {
        setStatusMsg("❌ No on-chain claimable bonus yet. The displayed amount is an estimate; claim will be enabled when eligible.");
        return;
      }
      const additionalRewardContract = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      const tx = await additionalRewardContract.claimReward();
      console.log("📤 [RewardsHub] Claim transaction sent:", tx.hash);
      
      setStatusMsg("⏳ Transaction submitted, waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ [RewardsHub] Claim transaction confirmed:", receipt);
      
      setStatusMsg("🎉 Additional Bonus claimed successfully!");
      
      // Refresh data
      await loadAdditionalBonus();
      
    } catch (error) {
      console.error("❌ [RewardsHub] Additional Bonus claim error:", error);
      
      if (error.code === 4001) {
        setStatusMsg("❌ Transaction cancelled by user");
      } else if (error.message.includes("insufficient funds")) {
        setStatusMsg("❌ Insufficient BNB for gas fees");
      } else if (error.message.includes("No claimable")) {
        setStatusMsg("❌ No claimable rewards available");
      } else {
        setStatusMsg("❌ Error claiming bonus: " + error.message);
      }
    } finally {
      setClaimingAdditional(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  const handleStakeAdditionalBonus = async () => {
    if (!signer || additionalBonus.claimable <= 0) return;

    setStakingAdditional(true);
    setStatusMsg("🔄 Claiming and staking Additional Bonus...");

    try {
      if (!additionalBonus.onChainClaimable || additionalBonus.onChainClaimable <= 0) {
        setStatusMsg("❌ No on-chain claimable bonus yet. The displayed amount is an estimate; staking will be enabled when eligible.");
        return;
      }
      const additionalRewardContract = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      // First claim the additional bonus
      const tx = await additionalRewardContract.claimReward();
      console.log("📤 [RewardsHub] Additional Bonus claim transaction sent:", tx.hash);
      
      setStatusMsg("⏳ Claiming Additional Bonus, waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ [RewardsHub] Additional Bonus claim confirmed:", receipt);
      
      // Then redirect to staking with the claimed amount  
      const claimedAmount = toBitsInteger(additionalBonus.claimable);
      setStatusMsg(`✅ Claimed ${claimedAmount} $BITS! Redirecting to staking...`);
      
      // Refresh data
      await loadAdditionalBonus();
      
      // Redirect to staking page with pre-filled amount
      setTimeout(() => {
        window.location.href = `/staking?amount=${claimedAmount}&source=additional-bonus`;
      }, 2000);
      
    } catch (error) {
      console.error("❌ [RewardsHub] Additional Bonus stake error:", error);
      
      if (error.code === 4001) {
        setStatusMsg("❌ Transaction cancelled by user");
      } else if (error.message.includes("insufficient funds")) {
        setStatusMsg("❌ Insufficient BNB for gas fees");
      } else if (error.message.includes("No claimable")) {
        setStatusMsg("❌ No claimable rewards available");
      } else {
        setStatusMsg("❌ Error staking bonus: " + error.message);
      }
    } finally {
      setStakingAdditional(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  // Stake rewards directly
  const handleStakeRewards = async () => {
    // Prefer Telegram on-chain stake if Telegram pending exists
    const telegramPending = rewards.telegram?.pending || 0;
    if (telegramPending > 0) {
      try {
        setStaking(true);
        setStatusMsg("🔄 Crediting Telegram reward and staking...");

        // 1) Credit on-chain based on pending amount
        console.log("[RewardsHub] credit-bits for staking →", { bits: telegramPending });
        const res = await fetch(`${BACKEND_URL}/api/telegram-rewards/credit-bits`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress, bits: telegramPending })
        });
        const rawText = await res.text().catch(() => "");
        let json;
        try { json = rawText ? JSON.parse(rawText) : {}; } catch (_) { json = { rawText }; }
        console.log("[RewardsHub] credit-bits (stake) ←", res.status, json);
        if (!res.ok) throw new Error(json?.error || rawText || `HTTP ${res.status}`);

        if (!signer) {
          setStatusMsg("❌ Connect wallet first to sign the staking");
          setStaking(false);
          return;
        }

        // 2) Transfer all to staking via contract
        const telegramContract = new ethers.Contract(
          CONTRACTS.TELEGRAM_REWARD.address,
          CONTRACTS.TELEGRAM_REWARD.abi,
          signer
        );
        setStatusMsg("⏳ Transferring Telegram rewards to staking...");
        const tx = await telegramContract.transferAllToStaking();
        await tx.wait();
        console.log("[RewardsHub] transferAllToStaking confirmed", tx.hash);
        setStatusMsg("✅ Telegram rewards staked successfully!");
        setModalPayload({
          title: 'Telegram Stake Successful',
          lines: [
            `Amount staked: ${toBitsInteger(telegramPending)} $BITS`,
            `Tx: ${tx.hash}`,
            `Your rewards were transferred directly to the staking contract.`
          ],
          tx: tx.hash
        });
        setShowModal(true);

        // 3) Notify backend to sync DB (mark claimed)
        try {
          await fetch(`${BACKEND_URL}/api/telegram-rewards/mark-claimed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: walletAddress, amountBits: telegramPending, txHash: tx.hash })
          });
        } catch (e) { console.warn("[RewardsHub] mark-claimed (stake) failed", e); }

        await loadRewards();
      } catch (error) {
        console.error("❌ Stake Telegram failed:", error);
        setStatusMsg(`❌ Stake failed: ${error.message}`);
      } finally {
        setStaking(false);
      }
      return;
    }

    if (rewards.pendingRewards.length === 0) {
      setStatusMsg("❌ No pending rewards to stake");
      return;
    }

    try {
      setStaking(true);
      setStatusMsg("🔄 Claiming and staking your rewards...");

      // First claim rewards
      const claimResult = await unifiedRewardsService.claimAllRewards(walletAddress);
      
      if (!claimResult.success) {
        throw new Error(claimResult.error || "Claim failed");
      }

      // Then redirect to staking with the claimed amount
      const claimedAmount = parseFloat(claimResult.totalAmount);
      setStatusMsg(`✅ Claimed ${claimedAmount} $BITS! Redirecting to staking...`);
      
      // Redirect to staking page with pre-filled amount
      setTimeout(() => {
        window.location.href = `/staking?amount=${claimedAmount}&source=rewards`;
      }, 2000);

    } catch (error) {
      console.error("❌ Stake rewards failed:", error);
      setStatusMsg(`❌ Stake failed: ${error.message}`);
    } finally {
      setStaking(false);
    }
  };

  const renderHistory = () => {
    const claimed = (rewards.unified?.allRewards || []).filter(r => r.status === 'claimed');
    // Try to compute USD from presale price if missing
    const priceMilli = rewards?.unified?.price ?? 1; // fallback milicents
    const usdPerBits = Number(priceMilli) / 1000;
    return (
      <div className="history-section">
        <h3>🧾 Claim History</h3>
        {claimed.length === 0 ? (
          <div className="empty">No claims yet</div>
        ) : (
          <div className="history-card">
            <div className="history-header history-row">
              <div>Type</div>
              <div>Amount</div>
              <div>USD</div>
              <div>Date</div>
              <div>Tx</div>
            </div>
            {claimed.map((r) => {
              let usd = (r.source_info && r.source_info.usd_value) ? Number(r.source_info.usd_value) : null;
              if (usd == null && r.amount != null) {
                const amt = Number(r.amount);
                if (!Number.isNaN(amt)) usd = amt * usdPerBits;
              }
              const dateStr = new Date(r.claimed_at || r.created_at).toLocaleString();
              const typeBadge = r.reward_type === 'telegram'
                ? (<span className="badge badge-telegram"><Icon name="telegram"/> Telegram</span>)
                : r.reward_type === 'referral'
                ? (<span className="badge badge-referral">👥 Referral</span>)
                : (<span className="badge badge-additional">🎁 Bonus</span>);
              return (
                <div key={r.id || r.created_at} className="history-row">
                  <div className="col-type">{typeBadge}</div>
                  <div className="col-amount">{toBitsInteger(r.amount)} $BITS</div>
                  <div className="col-usd">{usd != null ? `$${usd.toFixed(2)}` : '—'}</div>
                  <div className="col-date">{dateStr}</div>
                  <div className="col-tx">{r.tx_hash ? <a href={`https://bscscan.com/tx/${r.tx_hash}`} target="_blank" rel="noreferrer"><Icon name="tx"/> View</a> : '—'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!walletAddress) {
    return (
      <div className="rewards-hub">
        <div className="hub-container">
          <h1>🎁 Rewards Hub</h1>
          <div className="connect-wallet-prompt">
            <p>🔌 Please connect your wallet to view and manage your rewards.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rewards-hub">
      <div className="hub-container">
        <h1>🎁 Rewards Hub</h1>
        <p className="hub-subtitle">Claim your rewards directly to wallet or stake them for additional yield</p>

        <div className="tabs">
          <button onClick={()=>setActiveTab('summary')} className={`tab-btn ${activeTab==='summary' ? 'active' : ''}`}>📊 Summary</button>
          <button onClick={()=>setActiveTab('history')} className={`tab-btn ${activeTab==='history' ? 'active' : ''}`}>🧾 History</button>
        </div>

        <div style={{display: activeTab==='summary' ? 'block' : 'none'}}>

        {/* Rewards Summary */}
        <div className="rewards-summary-card">
          <h2>💰 Your Rewards Summary</h2>
          
          {rewards.loading ? (
            <div className="loading-state">
              <p>⏳ Loading your rewards...</p>
            </div>
          ) : rewards.error ? (
            <div className="error-state">
              <p>⚠️ Error: {rewards.error}</p>
              <button onClick={loadRewards} className="retry-btn">🔄 Retry</button>
            </div>
          ) : (
            <>
              <div className="summary-stats">
                <div className="stat-card">
                  <h3>💎 Total Pending</h3>
                  <p className="stat-value">{Math.round(rewards.totalPending)} $BITS</p>
                </div>
                <div className="stat-card">
                  <h3>✅ Total Claimed</h3>
                  <p className="stat-value">{Math.round(rewards.totalClaimed)} $BITS</p>
                </div>
                <div className="stat-card">
                  <h3>📋 Pending Count</h3>
                  <p className="stat-value">{rewards.pendingRewards.length} rewards</p>
                </div>
              </div>

              {/* Additional Bonus Section */}
              <div className="additional-bonus-section">
                <h3>🎁 Additional Investment Bonus</h3>
                {additionalBonus.loading ? (
                  <div className="loading-state">
                    <p>⏳ Loading bonus data...</p>
                  </div>
                ) : (
                  <div className="bonus-card">
                    <div className="bonus-stats">
                      <div className="bonus-stat">
                        <span className="bonus-label"><span className="icon icon-wallet"/>Available Bonus</span>
                        <span className="bonus-value">{formatBITS(additionalBonus.claimable)}</span>
                      </div>
                      <div className="bonus-stat">
                        <span className="bonus-label"><span className="icon icon-usd"/>Total Invested</span>
                        <span className="bonus-value">{formatUSD(additionalBonus.invested)}</span>
                      </div>
                      <div className="bonus-stat">
                        <span className="bonus-label"><span className="icon icon-stake"/>Bonus Rate</span>
                        <span className="bonus-value">{additionalBonus.rate}</span>
                      </div>
                    </div>
                    
                    {additionalBonus.claimable > 0 && (
                      <div className="bonus-actions">
                        <button
                          onClick={handleClaimAdditionalBonus}
                          disabled={claimingAdditional || stakingAdditional}
                          className="action-btn claim-btn"
                        >
                          {claimingAdditional ? "⏳ Claiming..." : "💳 Claim to Wallet"}
                          <span className="btn-subtitle">Receive {toBitsInteger(additionalBonus.claimable)} $BITS directly</span>
                        </button>
                        
                        <button
                          onClick={handleStakeAdditionalBonus}
                          disabled={claimingAdditional || stakingAdditional}
                          className="action-btn stake-btn"
                        >
                          {stakingAdditional ? "🔄 Processing..." : "🏦 Claim & Stake"}
                          <span className="btn-subtitle">Auto-stake for additional yield</span>
                        </button>
                      </div>
                    )}
                    
                    <div className="bonus-info">
                      <p>💡 How it works: Bonuses are based on your total USD invested (tracked on-chain).</p>
                      <p>📈 Milestones: $100 → 3%, $250 → 5%, $500 → 7%, $1,000 → 10% of invested USD, paid in $BITS.</p>
                      <p>🔓 A bonus becomes claimable only when you cross a new milestone. You can claim to wallet or stake directly.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Rewards List - always show Telegram info box */}
              <div className="pending-rewards-section">
                <h3><span className="icon icon-calendar"/>Pending Rewards</h3>
                <div className="rewards-list">
                  {rewards.pendingRewards.map((reward) => (
                    <div key={reward.id} className="reward-item">
                      <div className="reward-info">
                        <span className="reward-type">
                          {reward.reward_type === 'telegram' ? '💬' : 
                           reward.reward_type === 'referral' ? '👥' : '🎁'} 
                          {reward.reward_type.charAt(0).toUpperCase() + reward.reward_type.slice(1)}
                        </span>
                        <span className="reward-amount">{toBitsInteger(reward.amount)} $BITS</span>
                      </div>
                      <div className="reward-date">
                        {new Date(reward.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}

                  {/* Telegram info card */}
                  <div className="reward-item info">
                    <div className="reward-info">
                      <span className="reward-type">💬 Telegram Reward</span>
                      <span className="reward-amount">{toBitsInteger(rewards.telegram?.pending || 0)} $BITS</span>
                    </div>
                    <div className="reward-date" style={{maxWidth:'650px'}}>
                      Earn BITS by being active in our Telegram group. Time + messages unlock milestone bundles. Rewards are <strong>credited on-chain</strong> and can be <strong>claimed</strong> or <strong>staked</strong> directly.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-section">
                <h3>🚀 What would you like to do?</h3>
                <div style={{ 
                  background: "rgba(0, 170, 255, 0.1)", 
                  border: "1px solid rgba(0, 170, 255, 0.3)", 
                  borderRadius: "8px", 
                  padding: "12px", 
                  marginBottom: "15px",
                  fontSize: "0.9em",
                  textAlign: "center"
                }}>
                  💡 <strong>Pro Tip:</strong> $BITS can always be staked later! Claim now or stake directly - both options keep your staking flexibility.
                </div>
                
                {rewards.totalPending > 0 ? (
                  <div className="action-buttons">
                    <button
                      onClick={handleClaimToWallet}
                      disabled={claiming || staking}
                      className="action-btn claim-btn"
                    >
                      {claiming ? "🔄 Claiming..." : "💳 Claim to Wallet"}
                      <span className="btn-subtitle">Receive {Math.round(rewards.totalPending)} $BITS directly</span>
                    </button>
                    
                    <button
                      onClick={handleStakeRewards}
                      disabled={claiming || staking}
                      className="action-btn stake-btn"
                    >
                      {staking ? "🔄 Processing..." : "🏦 Claim & Stake"}
                      <span className="btn-subtitle">Auto-stake for additional yield</span>
                    </button>
                  </div>
                ) : (
                  <div className="no-rewards">
                    <p>🎯 No pending rewards to claim</p>
                    <p style={{ fontSize: "0.9em", opacity: 0.8 }}>
                      Keep participating in Telegram activities and referrals to earn more rewards!
                    </p>
                    <a href="/presale" className="back-link">← Back to Presale</a>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {statusMsg && (
                <div className="status-message">
                  <p>{statusMsg}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Additional Info */}
        <div className="info-section">
          <h3>ℹ️ How it works</h3>
          <div className="info-grid">
            <div className="info-card">
              <h4>💳 Claim to Wallet</h4>
              <p>Receive your $BITS directly in your connected wallet. Available immediately for trading, transfers, or <strong>you can stake them later</strong> from the <a href="/staking" style={{ color: "#00ffc3" }}>Staking page</a>.</p>
            </div>
            <div className="info-card">
              <h4>🏦 Claim & Stake</h4>
              <p>Automatically stake your claimed rewards to earn additional yield. Higher rewards but with lock-up period. This is the <strong>fastest way to start earning</strong>.</p>
            </div>
            <div className="info-card">
              <h4>🔄 Flexibility</h4>
              <p><strong>Important:</strong> $BITS can always be staked! You can claim now and stake later, or stake other $BITS you already own. <a href="/staking" style={{ color: "#00aaff" }}>Visit Staking →</a></p>
            </div>
          </div>
        </div>
        </div>
      </div>
      <div style={{display: activeTab==='history' ? 'block' : 'none'}}>
        {renderHistory()}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <h3>{modalPayload?.title || 'Info'}</h3>
            <ul>
              {(modalPayload?.lines||[]).map((l,idx)=>(<li key={idx}>{l}</li>))}
            </ul>
            {modalPayload?.tx && (
              <a className="tx-link" href={`https://bscscan.com/tx/${modalPayload.tx}`} target="_blank" rel="noreferrer"><Icon name="tx"/> View on BscScan</a>
            )}
            <button className="action-btn claim-btn" onClick={()=>setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsHub;
