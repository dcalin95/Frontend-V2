import React from "react";
import "./TokenSelector.css";

// poți importa imagini dacă vrei: import BNBLogo from "../assets/icons/bnb.logo.png";

const supportedTokens = ["BNB", "ETH", "USDT", "USDC", "SOL", "MATIC", "LINK", "BTCB", "USDC-Solana"];

const TokenSelector = ({ selectedToken, setSelectedToken }) => {
  return (
    <div className="token-selector">
      <h3>Choose a Token</h3>
      <div className="token-options">
        {supportedTokens.map((token) => (
          <button
            key={token}
            className={`token-button ${selectedToken === token ? "active" : ""}`}
            onClick={() => setSelectedToken(token)}
          >
            {token}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TokenSelector;

