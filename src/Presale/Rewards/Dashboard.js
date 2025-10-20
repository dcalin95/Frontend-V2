import React, { useContext } from "react";
import WalletContext from "../../context/WalletContext";
import RewardsMain from "./RewardsMain";
import "./rewards.css";

const Dashboard = () => {
  const { provider, walletAddress, connectViaMetamask } = useContext(WalletContext);

  return (
    <div className="rewards-dashboard">
      <RewardsMain provider={provider} userAddress={walletAddress} />
      {!walletAddress && (
        <div className="connect-warning" style={{ marginTop: 16 }}>
          <p>🔒 Wallet not connected. You can browse the rewards. Connect your wallet to claim or stake.</p>
          <button onClick={connectViaMetamask}>🔗 Connect Wallet</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
