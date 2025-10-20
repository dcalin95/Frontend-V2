import React, { useContext } from "react";
import WalletContext from "../WalletContext"; // ✅ CORECT

const WalletTestComponent = () => {
  const {
    connectViaMetamask,
    connectViaWeb3Auth,
    disconnectWallet,
    walletAddress,
    walletName,
    walletIcon,
    network,
    ethBalance,
    bitsBalance,
  } = useContext(WalletContext);

  return (
    <div style={{ padding: 20 }}>
      {walletAddress ? (
        <>
          <h3>Connected Wallet</h3>
          <img src={walletIcon} alt={walletName} width="40" />
          <p><strong>Name:</strong> {walletName}</p>
          <p><strong>Address:</strong> {walletAddress}</p>
          <p><strong>Network:</strong> {network}</p>
          <p><strong>ETH:</strong> {ethBalance}</p>
          <p><strong>BITS:</strong> {bitsBalance}</p>
          <button onClick={disconnectWallet}>Disconnect</button>
        </>
      ) : (
        <>
          <h3>Connect Wallet</h3>
          <button onClick={connectViaMetamask}>Connect MetaMask</button>
          <button onClick={connectViaWeb3Auth}>Connect Web3Auth</button>
        </>
      )}
    </div>
  );
};

export default WalletTestComponent;

