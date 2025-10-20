import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../../abi/nodeABI.js";
import nodeRewardsService, { formatBitsAmount, validateWalletConnection } from "../../services/nodeRewardsService.js";

const contractAddress = "0xe447db49E8e031d38c291E7e499c71a00aB80347";

const InvestmentRewardsWithClaim = () => {
  const [currentInvestment, setCurrentInvestment] = useState(0);
  const [totalTokensBought, setTotalTokensBought] = useState(0);
  const [nowWorth, setNowWorth] = useState(0);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  
  // 🎯 HYBRID: Node.sol reward data
  const [nodeRewardBalance, setNodeRewardBalance] = useState("0");
  const [rewardTiers, setRewardTiers] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [rewardError, setRewardError] = useState("");

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            fetchInvestmentData(accounts[0]);
            // 🎯 HYBRID: Fetch Node.sol rewards
            await fetchNodeRewards(accounts[0]);
          }
        } catch (error) {
          console.error("Error connecting to wallet:", error);
        }
      } else {
        alert("MetaMask not detected. Please install it!");
      }
    };

    checkWalletConnection();
  }, []);

  // 🎯 HYBRID: Fetch rewards from Node.sol
  const fetchNodeRewards = async (wallet) => {
    setLoadingRewards(true);
    setRewardError("");
    
    try {
      await nodeRewardsService.initialize();
      
      // Get user reward balance from Node.sol
      const balance = await nodeRewardsService.getUserRewardBalance(wallet);
      setNodeRewardBalance(balance);
      
      // Get reward tiers
      const tiers = await nodeRewardsService.getAdditionalRewardTiers();
      setRewardTiers(tiers);
      
      console.log("✅ Node.sol rewards loaded:", { balance, tiers });
    } catch (error) {
      console.error("❌ Error fetching Node.sol rewards:", error);
      setRewardError("Failed to load rewards from blockchain");
    } finally {
      setLoadingRewards(false);
    }
  };

  const fetchInvestmentData = async (wallet) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const cellsCount = await contract.getCellsCount();
      let totalTokensWei = ethers.BigNumber.from(0);
      for (let i = 0; i < cellsCount; i++) {
        const funds = await contract.userFundsByCell(i, wallet);
        totalTokensWei = totalTokensWei.add(funds);
      }

      const totalTokensInBits = parseFloat(ethers.utils.formatUnits(totalTokensWei, 18));
      setTotalTokensBought(totalTokensInBits);

      const currentPriceInWei = await contract.getPrice(1);
      const currentPriceInUSD = parseFloat(ethers.utils.formatUnits(currentPriceInWei, 18));

      const worthInUSD = totalTokensInBits * currentPriceInUSD;
      setNowWorth(worthInUSD);

      const totalInvestmentInUSD = totalTokensInBits * currentPriceInUSD;
      setCurrentInvestment(totalInvestmentInUSD);
    } catch (error) {
      console.error("Error fetching investment data:", error);
    }
  };

  const claimReward = async () => {
    if (!isConnected || currentInvestment === 0) {
      alert("Connect your wallet and ensure you have investments to claim rewards.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.claimRefCode(
        [],
        "",
        Date.now() + 3600,
        0,
        ethers.constants.HashZero,
        ethers.constants.HashZero
      );
      await tx.wait();
      alert("Reward claimed successfully!");
    } catch (error) {
      console.error("Error claiming reward:", error);
      alert("Failed to claim reward. Check the contract or your wallet.");
    }
  };

  return (
    <div className="investment-rewards-container">
      <h4>🎯 Investment Rewards (HYBRID)</h4>
      
      {/* 👛 Wallet Info */}
      <div className="wallet-section">
        <p><strong>Wallet Address:</strong> {walletAddress}</p>
        <p><strong>Total Investment:</strong> ${currentInvestment.toFixed(2)}</p>
        <p><strong>Total Tokens Bought:</strong> {totalTokensBought.toFixed(2)} $BITS</p>
        <p><strong>Now worth:</strong> ${nowWorth.toFixed(2)} USD</p>
      </div>

      {/* 🎁 Node.sol Rewards */}
      <div className="node-rewards-section">
        <h5>🔗 Blockchain Rewards (Node.sol)</h5>
        
        {loadingRewards ? (
          <p>⏳ Loading rewards from blockchain...</p>
        ) : rewardError ? (
          <p className="error">❌ {rewardError}</p>
        ) : (
          <div>
            <p><strong>Available Reward Balance:</strong> {formatBitsAmount(nodeRewardBalance)} $BITS</p>
            
            {rewardTiers.length > 0 && (
              <div className="reward-tiers">
                <p><strong>Reward Tiers:</strong></p>
                <ul>
                  {rewardTiers.map((tier, index) => (
                    <li key={index}>
                      {tier.percent}% bonus up to {formatBitsAmount(tier.limit)} $BITS
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🎯 Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={claimReward}
          disabled={!isConnected || parseFloat(nodeRewardBalance) === 0}
          className="claim-button"
        >
          {parseFloat(nodeRewardBalance) > 0 
            ? `Claim ${formatBitsAmount(nodeRewardBalance)} $BITS` 
            : "No Rewards Available"
          }
        </button>
        
        <button
          onClick={() => fetchNodeRewards(walletAddress)}
          disabled={!isConnected || loadingRewards}
          className="refresh-button"
        >
          🔄 Refresh Rewards
        </button>
      </div>

      {/* 📊 Debug Info */}
      <details className="debug-info">
        <summary>🔧 Debug Info</summary>
        <pre>{JSON.stringify(nodeRewardsService.getContractInfo(), null, 2)}</pre>
      </details>
    </div>
  );
};

export const setAdditionalInfo = async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    const pricePerBITSInWei = await contract.getPrice(1);
    const pricePerBITSInUSD = parseFloat(ethers.utils.formatUnits(pricePerBITSInWei, 18));

    const limitFor5Percent = ethers.utils.parseUnits((250 / pricePerBITSInUSD).toString(), 18);
    const limitFor10Percent = ethers.utils.parseUnits((500 / pricePerBITSInUSD).toString(), 18);

    const percents = [500, 1000];
    const limits = [limitFor5Percent, limitFor10Percent];

    const tx = await contract.setAdditionalInfo(percents, limits);
    await tx.wait();

    alert("Additional rewards updated successfully!");
  } catch (error) {
    console.error("Error setting additional rewards:", error);
    alert("Failed to update rewards. Check console for details.");
  }
};

export const getAdditionalRewards = async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    const additionalRewards = await contract.getAdditionalRewardInfo();
    console.log("Additional rewards:", additionalRewards);
  } catch (error) {
    console.error("Error fetching additional rewards:", error);
  }
};

export default InvestmentRewardsWithClaim;


