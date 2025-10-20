import React, { useState, useEffect } from "react";
import { getStakingContract } from "../../contract/getStakingContract";
import StakingCard from "./StakingCard";
import "../styles/StakingBox.css";

const StakingBox = ({ stakes, signer }) => {
  const [tgeDate, setTgeDate] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const loadParams = async () => {
      if (!signer) return;
      try {
        const contract = getStakingContract(signer);
        const cd = await contract.cooldown();
        const tge = await contract.tgeDate();
        setCooldown(cd.toNumber());
        setTgeDate(tge.toNumber());
      } catch (err) {
        console.error("❌ Error fetching cooldown/TGE:", err.message);
      }
    };
    loadParams();
  }, [signer]);

  return (
    <div className="staking-box">
      {stakes.map((stake, index) => (
        <StakingCard
          key={index}
          stake={stake}
          index={index}
          signer={signer}
          tgeDate={tgeDate}
          cooldown={cooldown}
        />
      ))}
    </div>
  );
};

export default StakingBox;
