import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_MAP } from "../contract/contractMap";
import stakingABI from "../abi/stakingABI";

export const useStakingData = (signer, userAddress) => {
  const [stakes, setStakes] = useState([]);
  const [totalStaked, setTotalStaked] = useState(ethers.BigNumber.from(0));
  const [totalReward, setTotalReward] = useState(ethers.BigNumber.from(0));

  useEffect(() => {
    console.log("🔍 useStakingData useEffect:");
    console.log("- signer:", !!signer);
    console.log("- userAddress:", userAddress);
    
    if (!userAddress) {
      console.log("❌ useStakingData: Missing userAddress, returning early");
      return;
    }

    console.log("✅ useStakingData: Starting fetchStakes");
    const fetchStakes = async () => {
      try {
        // Use robust public RPC provider
        const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
        const contract = new ethers.Contract(
          CONTRACT_MAP.STAKING.address,
          stakingABI,
          provider
        );
        
        console.log("📍 Staking Contract Address:", CONTRACT_MAP.STAKING.address);
        
        const rawStakes = await contract.getStakeByUser(userAddress);
        const PRECISION = await contract.PRECISION();
        const SECONDS_IN_YEAR = await contract.SECONDS_IN_YEAR();

        let totalSt = ethers.BigNumber.from(0);
        let totalRw = ethers.BigNumber.from(0);

        const now = Math.floor(Date.now() / 1000);

        const formattedStakes = rawStakes.map((s) => {
          const duration = now - s.updatedAt.toNumber();
          const reward = s.locked
            .mul(s.apr)
            .mul(duration)
            .div(SECONDS_IN_YEAR)
            .div(PRECISION);

          if (!s.withdrawn) {
            totalSt = totalSt.add(s.locked);
            totalRw = totalRw.add(reward);
          }

          return {
            locked: s.locked,
            apr: s.apr,
            updatedAt: s.updatedAt,
            startTime: s.startTime,
            withdrawn: s.withdrawn,
            reward,
          };
        });

        console.log("🔍 useStakingData Debug:");
        console.log("- rawStakes:", rawStakes);
        console.log("- formattedStakes:", formattedStakes);
        console.log("- formattedStakes.length:", formattedStakes.length);
        console.log("- totalStaked:", totalSt.toString());
        console.log("- totalReward:", totalRw.toString());
        
        setStakes(formattedStakes);
        setTotalStaked(totalSt);
        setTotalReward(totalRw);
      } catch (err) {
        console.error("❌ Error fetching staking data:", err);
        console.error("❌ Error details:", err.message);
      }
    };

    fetchStakes();
  }, [signer, userAddress]);

  return { stakes, totalStaked, totalReward };
};
