import React from "react";
import "./SelectPaymentMethod.css";
import { tokenList } from "./TokenHandlers/tokenData";
import evmIcon from "../assets/icons/evm-logo.jpg";
import solanaIcon from "../assets/icons/solana-logo.png";
import cardIcon from "../assets/icons/card-logo.jpg"; // 💳 Adaugă iconița local

const SelectPaymentMethod = ({
  selectedToken,
  onSelectToken,
  selectedChain,
  onSelectChain,
}) => {
  const filteredTokens = tokenList.filter(
    (token) => token.chain === selectedChain
  );

  return (
    <div className="token-selector">
      <h2>With What Do You Want to Pay</h2>

      {/* === Tab-uri EVM / Solana / Fiat === */}
      <div className="chain-toggle">
        <button
          className={`chain-tab ${selectedChain === "evm" ? "active" : ""}`}
          onClick={() => onSelectChain("evm")}
        >
          <img src={evmIcon} alt="EVM" className="chain-icon" />
          EVM
        </button>

        <button
          className={`chain-tab ${selectedChain === "solana" ? "active" : ""}`}
          onClick={() => onSelectChain("solana")}
        >
          <img src={solanaIcon} alt="Solana" className="chain-icon" />
          Solana
        </button>

        <button
          className={`chain-tab ${selectedChain === "fiat" ? "active" : ""}`}
          onClick={() => onSelectChain("fiat")}
        >
          <img src={cardIcon} alt="Fiat" className="chain-icon" />
          Fiat
        </button>
      </div>

      {/* === Token Buttons (filtered by chain) === */}
      <div className="token-grid">
        {filteredTokens.map((token) => (
          <button
            key={token.key}
            className={`token-button ${
              selectedToken === token.key ? "active" : ""
            }`}
            onClick={() => onSelectToken(token.key)}
            style={{
              borderColor: selectedToken === token.key ? token.color : "#333",
            }}
          >
            <img
              src={token.icon}
              alt={`${token.name} icon`}
              className="token-icon"
              style={{
                filter: `drop-shadow(0 0 4px ${token.color})`,
                marginRight: "8px",
                width: "24px",
                height: "24px",
              }}
            />
            {token.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SelectPaymentMethod;
